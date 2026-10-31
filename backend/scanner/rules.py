import os
import re
import ast
import json
import uuid
import hashlib
from typing import List, Tuple, Callable, Dict, Optional
from .models import Issue, CategoryType, SeverityLevel

# In-memory cache based on content hash
_scan_cache: Dict[str, List[Issue]] = {}

def get_content_hash(file_path: str, content: str) -> str:
    return hashlib.sha256(f"{file_path}:{content}".encode('utf-8')).hexdigest()

def detect_language(file_path: str) -> str:
    lower = file_path.lower()
    if lower.endswith(('.js', '.jsx', '.mjs', '.cjs')):
        return 'javascript'
    elif lower.endswith(('.ts', '.tsx')):
        return 'typescript'
    elif lower.endswith('.py'):
        return 'python'
    elif lower.endswith('.java'):
        return 'java'
    elif lower.endswith(('.html', '.htm')):
        return 'html'
    elif lower.endswith(('.css', '.scss', '.less')):
        return 'css'
    elif lower.endswith('.json'):
        return 'json'
    elif lower.endswith('.sql'):
        return 'sql'
    elif lower.endswith(('.env', '.env.local', '.env.production', '.env.example')):
        return 'env'
    elif lower.endswith(('.md', '.markdown')):
        return 'markdown'
    return 'unknown'

class CompiledRule:
    def __init__(
        self,
        regex_str: str,
        category: CategoryType,
        severity: SeverityLevel,
        title: str,
        explanation: str,
        fix_fn: Callable[[str, str], str],
        valid_langs: List[str]
    ):
        self.pattern = re.compile(regex_str)
        self.category = category
        self.severity = severity
        self.title = title
        self.explanation = explanation
        self.fix_fn = fix_fn
        self.valid_langs = set(valid_langs)

# PRE-COMPILE ALL REGEX RULES AT STARTUP FOR MAXIMUM THROUGHPUT
COMPILED_RULES: List[CompiledRule] = [
    # 1. Hardcoded Secrets & Credentials
    CompiledRule(
        r"""(?i)(?:api[_-]?key|secret[_-]?key|jwt[_-]?secret|auth[_-]?token|access[_-]?token|client[_-]?secret|private[_-]?key|password|db_pass)\s*(?:[:=]|\|\|)\s*['"][A-Za-z0-9_\-\.@!#%^&*]{8,}['"]""",
        "security", "Critical",
        "Hardcoded Secret / API Key",
        "Embedding plain-text credentials or API tokens directly in source code risks immediate exposure and unauthorized API abuse if committed.",
        lambda line, l: re.sub(
            r"""(['"][A-Za-z0-9_\-\.@!#%^&*]{8,}['"])""",
            "os.getenv('API_KEY', '')" if l == "python" else "process.env.API_KEY || ''",
            line
        ),
        ["javascript", "typescript", "python", "java", "sql"]
    ),
    CompiledRule(
        r"""['"]postgres(?:ql)?:\/\/[^:]+:[^@]+@[^'"]+['"]|['"]mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^'"]+['"]|['"]mysql:\/\/[^:]+:[^@]+@[^'"]+['"]""",
        "security", "Critical",
        "Hardcoded Database Connection String with Credentials",
        "Exposing database passwords and connection URIs inside source code allows direct database compromise.",
        lambda line, l: re.sub(
            r"""['"](postgres(?:ql)?|mongodb(?:\+srv)?|mysql):\/\/[^'"]+['"]""",
            "process.env.DATABASE_URL || ''" if l != "python" else "os.getenv('DATABASE_URL', '')",
            line
        ),
        ["javascript", "typescript", "python", "json", "env"]
    ),
    CompiledRule(
        r"""-----BEGIN (?:RSA |EC )?PRIVATE KEY-----""",
        "security", "Critical",
        "Exposed Private Encryption Key",
        "An unencrypted private cryptographic key was found inside source code. Private keys must be read from secured key vaults or environment files.",
        lambda line, l: "# Load cryptographic key from secure vault or secret manager",
        ["javascript", "typescript", "python", "java"]
    ),

    # 2. SQL Injection
    CompiledRule(
        r"""(?i)(execute|query|raw|cursor\.execute)\s*\(\s*(f['"]|\$['"]|['"].*SELECT.*(WHERE|FROM).*['"]\s*[\+\%])""",
        "security", "Critical",
        "SQL Injection via Dynamic Query Construction",
        "Direct string interpolation or concatenation into SQL queries allows attackers to execute arbitrary SQL commands.",
        lambda line, l: "cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))" if l == "python" else "db.query('SELECT * FROM users WHERE id = $1', [userId])",
        ["javascript", "typescript", "python", "java"]
    ),

    # 3. Dangerous eval() & Code Execution
    CompiledRule(
        r"""\beval\s*\(""",
        "security", "Critical",
        "Dangerous eval() Call",
        "eval() executes dynamic strings with full interpreter privileges, opening the system to Remote Code Execution.",
        lambda line, l: re.sub(r"""\beval\((.*?)\)""", r"JSON.parse(\1)", line),
        ["javascript", "typescript", "python"]
    ),
    CompiledRule(
        r"""(subprocess\.(call|Popen|run)\(.*shell\s*=\s*True|child_process\.exec\()""",
        "security", "High",
        "Command Injection Risk (shell=True / exec)",
        "Invoking system shells with unvalidated inputs allows command chaining (e.g. `; rm -rf`).",
        lambda line, l: "subprocess.run(['ls', '-la'], check=True)" if l == "python" else "child_process.execFile('cmd', [arg1])",
        ["javascript", "typescript", "python"]
    ),

    # 4. Cross-Site Scripting (XSS)
    CompiledRule(
        r"""dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*(?!\s*(?:DOMPurify\.sanitize|sanitize)\b)[^}]+\}""",
        "security", "High",
        "Cross-Site Scripting (XSS) via dangerouslySetInnerHTML",
        "Injecting raw HTML without sanitization bypasses React's built-in escaping, enabling malicious script injection.",
        lambda line, l: re.sub(
            r"""dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*(.*?)\s*\}\s*\}""",
            r"dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(\1) }}",
            line
        ),
        ["javascript", "typescript"]
    ),
    CompiledRule(
        r"""\.innerHTML\s*=\s*""",
        "security", "High",
        "Cross-Site Scripting (XSS) via innerHTML",
        "Directly assigning unsanitized strings to innerHTML enables client-side script execution.",
        lambda line, l: line.replace(".innerHTML =", ".textContent ="),
        ["javascript", "typescript"]
    ),

    # 5. Insecure CORS & Crypto
    CompiledRule(
        r"""(Access-Control-Allow-Origin['"]?\s*[:=]\s*['"]\*['"]|cors\(\s*\{\s*origin\s*:\s*['"]\*['"]\s*\})""",
        "security", "Medium",
        "Insecure CORS Wildcard (*)",
        "Using wildcard '*' origins allows any external website to make cross-origin requests to your server.",
        lambda line, l: "cors({ origin: ['https://yourdomain.com'], credentials: true })",
        ["javascript", "typescript", "python"]
    ),
    CompiledRule(
        r"""(?i)(hashlib\.md5\(|crypto\.createHash\(['"]md5['"]\)|hashlib\.sha1\()""",
        "security", "Medium",
        "Weak Cryptographic Hash (MD5 / SHA-1)",
        "MD5 and SHA-1 suffer from collision attacks. Use SHA-256 or bcrypt for hashing.",
        lambda line, l: "hashlib.sha256(data).hexdigest()" if l == "python" else "crypto.createHash('sha256').update(data).digest('hex')",
        ["javascript", "typescript", "python"]
    ),

    # 6. Loose Equality (== vs ===)
    CompiledRule(
        r"""(?<=[^\!\=\>\<])==(?=[^\=])""",
        "bug", "Low",
        "Loose Equality Comparison (== vs ===)",
        "Loose equality performs unintended type coercion (e.g. '' == 0 is true). Always use strict equality '==='.",
        lambda line, l: line.replace("==", "==="),
        ["javascript", "typescript"]
    ),
    CompiledRule(
        r"""(?<=[^\!])\=(?=[^\=])\s*!=(?=[^\=])""",
        "bug", "Low",
        "Loose Inequality Comparison (!= vs !==)",
        "Loose inequality performs unintended type coercion. Use strict '!=='.",
        lambda line, l: line.replace("!=", "!=="),
        ["javascript", "typescript"]
    ),

    # 7. Off-by-one array index
    CompiledRule(
        r"""for\s*\(\s*(?:var|let|const)?\s*\w+\s*=\s*0\s*;\s*\w+\s*<=\s*\w+\.length\s*;""",
        "bug", "High",
        "Off-By-One Array Index (<= length)",
        "Iterating with '<= array.length' reads an out-of-bounds index returning undefined or crashing.",
        lambda line, l: line.replace("<=", "<"),
        ["javascript", "typescript", "java"]
    ),

    # 8. Unhandled Promise / Async Call Missing Try/Catch
    CompiledRule(
        r"""^\s*(?:const\s+\w+\s*=\s*)?await\s+(?:fetch|axios\.\w+|db\.\w+)\(""",
        "error", "High",
        "Unhandled Async Call (Missing try/catch)",
        "Awaiting asynchronous network or DB operations without try/catch causes unhandled promise rejections.",
        lambda line, l: f"try {{\n  {line.strip()}\n}} catch (err) {{\n  console.error('Operation failed:', err);\n}}",
        ["javascript", "typescript"]
    ),

    # 9. TypeScript 'any' type
    CompiledRule(
        r""":\s*any\b|\bas\s+any\b""",
        "quality", "Low",
        "Untyped 'any' in TypeScript",
        "Using 'any' disables TypeScript compiler type-checking and allows undetectable runtime type errors.",
        lambda line, l: re.sub(r""":\s*any\b""", ": unknown", line),
        ["typescript"]
    ),

    # 10. Missing React Key prop in .map()
    CompiledRule(
        r"""\.map\s*\(\s*(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>\s*<[A-Za-z0-9_]+(?![^>]*\bkey\b)[^>]*>""",
        "bug", "Medium",
        "Missing 'key' Prop in React Iteration",
        "Rendering list elements with .map() without a distinct 'key' prop causes React DOM reconciliation bugs and state corruptions.",
        lambda line, l: re.sub(r"""<([A-Za-z0-9_]+)""", r"<\1 key={item.id || index}", line),
        ["javascript", "typescript"]
    ),

    # 11. Missing alt text on img
    CompiledRule(
        r"""<img(?![^>]*\balt\b)[^>]*>""",
        "quality", "Low",
        "Missing 'alt' Attribute on <img>",
        "Images without an 'alt' attribute degrade accessibility for screen-readers and fail WCAG compliance.",
        lambda line, l: line.replace("<img", '<img alt="Descriptive image label"'),
        ["javascript", "typescript", "html"]
    ),

    # 12. Empty Catch Block
    CompiledRule(
        r"""catch\s*\(\s*\w*\s*\)\s*\{\s*\}""",
        "error", "Medium",
        "Empty catch Block",
        "Swallowing exceptions with an empty catch block obscures runtime exceptions and breaks debugging.",
        lambda line, l: "catch (err) { console.error('Caught unexpected error:', err); }",
        ["javascript", "typescript", "java"]
    ),

    # 13. Console.log / Debugger Left in Production
    CompiledRule(
        r"""^\s*console\.(log|debug|info)\s*\(.*?\);?""",
        "quality", "Low",
        "Console Log Left in Code",
        "Development console logs clutter the browser console, degrade performance, and may leak internal state.",
        lambda line, l: "",  # Clean removal
        ["javascript", "typescript"]
    ),
    CompiledRule(
        r"""^\s*debugger;?""",
        "error", "High",
        "debugger Statement in Code",
        "A 'debugger;' statement halts execution when developer tools are active, freezing production UI for users.",
        lambda line, l: "",  # Clean removal
        ["javascript", "typescript"]
    ),

    # 14. Blocking Synchronous I/O
    CompiledRule(
        r"""\bfs\.(readFileSync|writeFileSync|appendFileSync)\(""",
        "performance", "Medium",
        "Blocking Synchronous File I/O",
        "Calling synchronous file operations blocks the Node.js single-threaded event loop for all concurrent users.",
        lambda line, l: line.replace("fs.readFileSync", "await fs.promises.readFile").replace("fs.writeFileSync", "await fs.promises.writeFile"),
        ["javascript", "typescript"]
    ),

    # 15. Unoptimized Bundle Import
    CompiledRule(
        r"""import\s+[*_]\s+as\s+\w+\s+from\s+['"]lodash['"];?""",
        "performance", "Medium",
        "Unoptimized Heavy Library Import",
        "Importing the entire lodash bundle increases bundle size. Import only required helper functions.",
        lambda line, l: "import debounce from 'lodash/debounce';",
        ["javascript", "typescript"]
    ),

    # 16. TODO / FIXME Left in Code
    CompiledRule(
        r"""(?i)(//|#)\s*(TODO|FIXME|XXX):?\s*(.+)""",
        "quality", "Low",
        "Unresolved TODO/FIXME Comment",
        "Unresolved TODO or FIXME comment detected. Ensure outstanding edge cases or tech debt are resolved before merging.",
        lambda line, l: re.sub(r"""(?i)(//|#)\s*(TODO|FIXME|XXX):?\s*""", r"\1 Note: ", line),
        ["javascript", "typescript", "python", "java", "sql"]
    ),

    # 17. Deep Nesting Check (> 3 indentation levels in control blocks)
    CompiledRule(
        r"""^(?: {12,}|\t{3,})(if|for|while|switch)\s*\(?""",
        "quality", "Low",
        "Deeply Nested Control Flow (>3 Levels)",
        "Excessive nesting hampers code readability, introduces cognitive load, and increases cyclomatic complexity. Consider early returns or extracting functions.",
        lambda line, l: line.strip(),
        ["javascript", "typescript", "python", "java"]
    ),

    # 18. Insecure target="_blank" without rel="noopener noreferrer"
    CompiledRule(
        r"""<a\b[^>]*\btarget\s*=\s*['"]_blank['"](?![^>]*\brel\s*=\s*['"][^'"]*noopener)""",
        "security", "Medium",
        "Reverse Tabnabbing Security Risk (target='_blank')",
        "Opening external links with target='_blank' without rel='noopener noreferrer' allows the opened page to hijack window.opener and redirect users to phishing sites.",
        lambda line, l: line.replace('target="_blank"', 'target="_blank" rel="noopener noreferrer"').replace("target='_blank'", "target='_blank' rel='noopener noreferrer'"),
        ["javascript", "typescript", "html"]
    ),

    # 19. Array Index as React Key
    CompiledRule(
        r"""\bkey\s*=\s*\{\s*(?:index|idx|i)\s*\}""",
        "bug", "Medium",
        "Array Index Used as React Key",
        "Using array indices (index, idx, i) as React keys corrupts component state during list re-ordering, filtering, or deletions. Use a stable unique identifier like item.id.",
        lambda line, l: re.sub(r"""\bkey\s*=\s*\{\s*(?:index|idx|i)\s*\}""", "key={item.id || index}", line),
        ["javascript", "typescript"]
    ),

    # 20. Cleartext Insecure HTTP URL
    CompiledRule(
        r"""['"]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[a-zA-Z0-9\.\-_]+""",
        "security", "High",
        "Insecure Cleartext HTTP Protocol",
        "Transmitting data over cleartext HTTP exposes credentials and sensitive payloads to network sniffing and Man-In-The-Middle (MITM) tampering. Always use HTTPS.",
        lambda line, l: line.replace("http://", "https://"),
        ["javascript", "typescript", "python", "java"]
    ),

    # 21. Hardcoded Localhost Endpoint in Code
    CompiledRule(
        r"""['"]https?:\/\/(?:localhost|127\.0\.0\.1):\d+[^'"]*['"]""",
        "quality", "Medium",
        "Hardcoded Localhost Endpoint",
        "Hardcoded localhost URLs fail in staging and production environments. Extract the API base URL to an environment variable.",
        lambda line, l: re.sub(r"""['"]https?:\/\/(?:localhost|127\.0\.0\.1):\d+[^'"]*['"]""", "process.env.NEXT_PUBLIC_API_URL || '/api'", line) if l in ['javascript', 'typescript'] else re.sub(r"""['"]https?:\/\/(?:localhost|127\.0\.0\.1):\d+[^'"]*['"]""", "os.getenv('API_BASE_URL', '')", line),
        ["javascript", "typescript", "python"]
    ),

    # 22. Inline Style Object in JSX
    CompiledRule(
        r"""\bstyle\s*=\s*\{\{\s*(?!display:\s*['"]none['"])[^}]+\s*\}\}""",
        "performance", "Low",
        "Inline Style Object Re-creation",
        "Inline style objects in JSX force the JavaScript engine to allocate a new object on every render cycle, triggering unnecessary DOM reconciliation and sub-tree re-renders.",
        lambda line, l: re.sub(r"""\s*\bstyle\s*=\s*\{\{\s*(?!display:\s*['"]none['"])[^}]+\s*\}\}""", '', line) if 'className=' in line else re.sub(r"""\bstyle\s*=\s*\{\{\s*(?!display:\s*['"]none['"])[^}]+\s*\}\}""", 'className="/* extracted-styles */"', line),
        ["javascript", "typescript"]
    ),

    # 23. Direct React State Mutation
    CompiledRule(
        r"""(?:\bthis\.state\.\w+\s*=|^\s*(?:const\s+)?state\.\w+\s*=\s*[^=])""",
        "bug", "High",
        "Direct React State Mutation",
        "Directly mutating component state bypasses React's reconciliation cycle, resulting in missed UI updates and race conditions. Always use setState or state updater functions.",
        lambda line, l: re.sub(r"""state\.(\w+)\s*=\s*(.+);?""", r"setState(prev => ({ ...prev, \1: \2 }));", line),
        ["javascript", "typescript"]
    ),

    # 24. Potential Memory Leak in Component
    CompiledRule(
        r"""^(?!.*//\s*Ensure cleanup).*(?:window\.addEventListener|document\.addEventListener|setInterval)\(""",
        "performance", "Medium",
        "Potential Memory Leak (Uncleaned Listener/Timer)",
        "Attaching global event listeners or intervals without returning an explicit cleanup function in useEffect causes memory leaks and duplicate handler firings on unmount.",
        lambda line, l: f"{line.rstrip()} // Ensure cleanup return is defined in useEffect",
        ["javascript", "typescript"]
    ),

    # 25. Floating Promise (Unawaited API Call)
    CompiledRule(
        r"""^\s*(?:fetch|axios\.(?:get|post|put|delete))\([^)]*\);""",
        "bug", "High",
        "Floating Promise (Unawaited Network Call)",
        "Executing an asynchronous network request without 'await' or a '.catch()' error handler leaves unhandled rejections and causes race conditions.",
        lambda line, l: f"await {line.strip()}",
        ["javascript", "typescript"]
    ),

    # 26. Insecure Deserialization in Python
    CompiledRule(
        r"""\b(?:pickle\.loads|yaml\.load\([^,)]*\))\(""",
        "security", "Critical",
        "Insecure Deserialization Risk",
        "Deserializing untrusted data with pickle or raw yaml.load allows arbitrary code execution. Use yaml.safe_load or JSON serialization instead.",
        lambda line, l: line.replace("yaml.load(", "yaml.safe_load(").replace("pickle.loads(", "json.loads("),
        ["python"]
    ),

    # 27. Debug Mode Enabled in Code
    CompiledRule(
        r"""\b(?:app\.run\(.*debug\s*=\s*True|DEBUG\s*=\s*True)""",
        "security", "High",
        "Debug Mode Enabled in Code",
        "Running in debug mode exposes internal stack traces, interactive debug consoles, and environment secrets to visitors.",
        lambda line, l: line.replace("debug=True", "debug=False").replace("DEBUG = True", "DEBUG = False"),
        ["python", "javascript", "typescript"]
    )
]

def check_python_ast(file_path: str, content: str) -> List[Issue]:
    issues: List[Issue] = []
    lines = content.splitlines()

    try:
        tree = ast.parse(content, filename=file_path)
    except SyntaxError as e:
        lineno = e.lineno or 1
        snippet = lines[lineno - 1] if lineno <= len(lines) else ""
        issues.append(Issue(
            id=str(uuid.uuid4()),
            filePath=file_path,
            lineNumber=lineno,
            snippet=snippet.strip() or "Syntax Error",
            originalCode=snippet,
            category="error",
            severity="Critical",
            title="Python Syntax Error",
            explanation=f"SyntaxError on line {lineno}: {e.msg}. This file will fail to compile or execute in production.",
            suggestedFix=snippet.strip(),
            ruleId="py-syntax-error"
        ))
        return issues

    class PythonASTVisitor(ast.NodeVisitor):
        def visit_FunctionDef(self, node: ast.FunctionDef):
            for default in node.args.defaults:
                if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                    lineno = default.lineno
                    snippet = lines[lineno - 1] if lineno <= len(lines) else ""
                    fix_line = re.sub(r'=\s*(\[\]|\{\}|set\(\))', '=None', snippet)
                    issues.append(Issue(
                        id=str(uuid.uuid4()),
                        filePath=file_path,
                        lineNumber=lineno,
                        snippet=snippet.strip(),
                        originalCode=snippet,
                        category="bug",
                        severity="High",
                        title="Mutable Default Argument",
                        explanation="Using mutable default arguments (like list or dict) shares state across all invocations, creating hard-to-detect state leak bugs.",
                        suggestedFix=fix_line.strip() if fix_line != snippet else f"def {node.name}(..., param=None):",
                        ruleId="py-mutable-default"
                    ))

            func_len = (node.end_lineno or node.lineno) - node.lineno
            if func_len > 60:
                snippet = lines[node.lineno - 1] if node.lineno <= len(lines) else ""
                issues.append(Issue(
                    id=str(uuid.uuid4()),
                    filePath=file_path,
                    lineNumber=node.lineno,
                    snippet=snippet.strip(),
                    originalCode=snippet,
                    category="quality",
                    severity="Low",
                    title="Oversized Function (>60 lines)",
                    explanation=f"Function '{node.name}' spans {func_len} lines. Decompose this function into smaller, single-responsibility helper routines.",
                    suggestedFix=snippet.strip(),
                    ruleId="py-func-length"
                ))

            self.generic_visit(node)

        def visit_Try(self, node: ast.Try):
            for handler in node.handlers:
                lineno = handler.lineno
                snippet = lines[lineno - 1] if lineno <= len(lines) else ""
                indent = len(snippet) - len(snippet.lstrip())
                ind_str = " " * indent
                has_pass = len(handler.body) == 1 and isinstance(handler.body[0], ast.Pass)
                end_lineno = handler.body[0].lineno if (has_pass and hasattr(handler.body[0], 'lineno')) else lineno

                if handler.type is None:
                    # Bare except handler
                    fix_code = f"{ind_str}except Exception as err:\n{ind_str}    return None" if has_pass else f"{ind_str}except Exception as err:"
                    issues.append(Issue(
                        id=str(uuid.uuid4()),
                        filePath=file_path,
                        lineNumber=lineno,
                        endLineNumber=end_lineno,
                        snippet=snippet.strip() if not has_pass else f"{snippet.strip()}\n{lines[end_lineno - 1].strip() if end_lineno <= len(lines) else 'pass'}",
                        originalCode=snippet,
                        category="error",
                        severity="Medium",
                        title="Bare Exception Handler",
                        explanation="Bare 'except:' intercepts system signals and KeyboardInterrupt, concealing fatal failures and masking logic errors.",
                        suggestedFix=fix_code,
                        ruleId="py-bare-except"
                    ))
                elif has_pass:
                    # Explicit exception type but silenced with pass
                    issues.append(Issue(
                        id=str(uuid.uuid4()),
                        filePath=file_path,
                        lineNumber=lineno,
                        endLineNumber=end_lineno,
                        snippet=f"{snippet.strip()}\n{lines[end_lineno - 1].strip() if end_lineno <= len(lines) else 'pass'}",
                        originalCode=snippet,
                        category="error",
                        severity="Medium",
                        title="Silent Exception Suppression",
                        explanation="Silently ignoring exceptions with 'pass' hides critical runtime failures and leaves state unpredictable.",
                        suggestedFix=f"{ind_str}{snippet.strip()}\n{ind_str}    return None",
                        ruleId="py-silent-except"
                    ))
            self.generic_visit(node)

    visitor = PythonASTVisitor()
    visitor.visit(tree)
    return issues

def check_json_file(file_path: str, content: str) -> List[Issue]:
    issues: List[Issue] = []
    base_name = os.path.basename(file_path).lower()

    # Fast path: standard json
    try:
        json.loads(content)
        return issues
    except Exception:
        pass

    # JSON with Comments (JSONC) is standard for TypeScript, VSCode, and tool configs
    is_jsonc = (
        base_name.startswith(('tsconfig', 'jsconfig', '.eslintrc', '.vscode', '.prettierrc', 'turbo', 'settings'))
        or file_path.endswith(('.jsonc', '.code-workspace'))
    )

    # Strip comments to verify underlying structure
    stripped = re.sub(r'/\*[\s\S]*?\*/', '', content)
    stripped = re.sub(r'//.*', '', stripped)
    # Strip trailing commas before } or ]
    stripped = re.sub(r',(\s*[}\]])', r'\1', stripped)

    try:
        json.loads(stripped)
        # If comments are expected in this file type, this is valid JSONC
        if is_jsonc:
            return issues
    except Exception:
        pass

    lines = content.splitlines()
    for line_idx, line in enumerate(lines, start=1):
        clean = line.strip()
        if clean.startswith(('/*', '//', '*')) or clean.endswith('*/'):
            if not is_jsonc:
                issues.append(Issue(
                    id=str(uuid.uuid4()),
                    filePath=file_path,
                    lineNumber=line_idx,
                    endLineNumber=line_idx,
                    snippet=clean,
                    originalCode=line,
                    category="error",
                    severity="Medium",
                    title="Comment in Standard JSON",
                    explanation="Strict JSON specification disallows comments. Remove comments or use JSONC.",
                    suggestedFix="",  # Clean line removal
                    ruleId="json-no-comments"
                ))

    if not issues:
        try:
            target_to_parse = stripped if is_jsonc else content
            json.loads(target_to_parse)
        except json.JSONDecodeError as e:
            lineno = min(e.lineno, len(lines)) if lines else 1
            snippet = lines[lineno - 1] if lineno <= len(lines) else ""
            issues.append(Issue(
                id=str(uuid.uuid4()),
                filePath=file_path,
                lineNumber=lineno,
                endLineNumber=lineno,
                snippet=snippet.strip() or "JSON Error",
                originalCode=snippet,
                category="error",
                severity="Critical",
                title="Malformed JSON Syntax",
                explanation=f"JSON Decode Error at line {lineno}: {e.msg}.",
                suggestedFix="",
                ruleId="json-syntax-error"
            ))

    return issues

def is_inside_try_block(lines: List[str], current_line_idx: int) -> bool:
    brace_balance = 0
    for i in range(current_line_idx - 1, -1, -1):
        prev = lines[i]
        brace_balance += prev.count('}') - prev.count('{')
        if re.search(r'\btry\s*\{', prev):
            if brace_balance <= 0:
                return True
    return False

def scan_file_content(file_path: str, content: str) -> List[Issue]:
    # Check cache first for 0ms re-scan on unchanged content
    c_hash = get_content_hash(file_path, content)
    if c_hash in _scan_cache:
        return _scan_cache[c_hash]

    lang = detect_language(file_path)
    issues: List[Issue] = []

    if lang == 'python':
        issues.extend(check_python_ast(file_path, content))
    elif lang == 'json':
        issues.extend(check_json_file(file_path, content))

    lines = content.splitlines()

    # Detect multi-line empty catch blocks in JS/TS
    if lang in ['javascript', 'typescript']:
        for idx, l_text in enumerate(lines, start=1):
            if re.search(r'\bcatch\s*(\([^)]*\))?\s*\{', l_text):
                end_idx = None
                for j in range(idx, min(len(lines), idx + 8)):
                    l_j = lines[j].strip()
                    if l_j == '}' or l_j.startswith('}'):
                        end_idx = j + 1
                        break
                    if l_j and not l_j.startswith(('//', '/*', '*')):
                        break
                if end_idx is not None and end_idx > idx:
                    indent = len(l_text) - len(l_text.lstrip())
                    ind_str = " " * indent
                    issues.append(Issue(
                        id=str(uuid.uuid4()),
                        filePath=file_path,
                        lineNumber=idx,
                        endLineNumber=end_idx,
                        snippet="\n".join(lines[idx-1:end_idx]).strip(),
                        originalCode="\n".join(lines[idx-1:end_idx]),
                        category="error",
                        severity="Medium",
                        title="Empty catch Block",
                        explanation="Swallowing exceptions with an empty catch block obscures runtime exceptions and breaks debugging.",
                        suggestedFix=f"{ind_str}catch (err) {{\n{ind_str}  console.error('Operation failed:', err);\n{ind_str}}}",
                        ruleId="rule-empty-catch"
                    ))

    for line_idx, line in enumerate(lines, start=1):
        clean_line = line.strip()
        if not clean_line:
            continue
        is_comment = clean_line.startswith(('#', '//', '/*', '*'))

        for rule in COMPILED_RULES:
            if lang in rule.valid_langs or "all" in rule.valid_langs:
                if is_comment and "TODO" not in rule.title and "Private Key" not in rule.title:
                    continue
                if rule.title == "Unhandled Async Call (Missing try/catch)" and is_inside_try_block(lines, line_idx - 1):
                    continue
                if rule.pattern.search(line):
                    try:
                        suggested = rule.fix_fn(line, lang)
                    except Exception:
                        suggested = clean_line

                    issues.append(Issue(
                        id=str(uuid.uuid4()),
                        filePath=file_path,
                        lineNumber=line_idx,
                        endLineNumber=line_idx,
                        snippet=clean_line,
                        originalCode=line,
                        category=rule.category,
                        severity=rule.severity,
                        title=rule.title,
                        explanation=rule.explanation,
                        suggestedFix=suggested,
                        ruleId=f"rule-{rule.category}-{abs(hash(rule.title)) % 10000}"
                    ))

    # Deduplicate issues by line number and title
    seen = set()
    deduped = []
    for issue in issues:
        key = (issue.lineNumber, issue.title)
        if key not in seen:
            seen.add(key)
            deduped.append(issue)

    deduped.sort(key=lambda x: x.lineNumber)
    
    # Store in cache
    _scan_cache[c_hash] = deduped
    return deduped
