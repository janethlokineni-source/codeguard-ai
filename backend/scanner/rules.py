import re
import ast
import json
import uuid
from typing import List, Tuple
from .models import Issue, CategoryType, SeverityLevel

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

def check_python_ast(file_path: str, content: str) -> List[Issue]:
    issues: List[Issue] = []
    lines = content.splitlines()

    # Syntax check
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
            # Check mutable default argument
            for default in node.args.defaults:
                if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                    lineno = default.lineno
                    snippet = lines[lineno - 1] if lineno <= len(lines) else ""
                    # Create clean replacement
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

            # Function length > 60 lines
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
                if handler.type is None:
                    indent = len(snippet) - len(snippet.lstrip())
                    ind_str = " " * indent
                    issues.append(Issue(
                        id=str(uuid.uuid4()),
                        filePath=file_path,
                        lineNumber=lineno,
                        snippet=snippet.strip(),
                        originalCode=snippet,
                        category="error",
                        severity="Medium",
                        title="Bare Exception Handler",
                        explanation="Bare 'except:' intercepts system signals and KeyboardInterrupt, concealing fatal failures and masking logic errors.",
                        suggestedFix=f"{ind_str}except Exception as err:",
                        ruleId="py-bare-except"
                    ))
                elif len(handler.body) == 1 and isinstance(handler.body[0], ast.Pass):
                    indent = len(snippet) - len(snippet.lstrip())
                    ind_str = " " * indent
                    issues.append(Issue(
                        id=str(uuid.uuid4()),
                        filePath=file_path,
                        lineNumber=lineno,
                        snippet=snippet.strip(),
                        originalCode=snippet,
                        category="error",
                        severity="Medium",
                        title="Silent Exception Suppression",
                        explanation="Silently ignoring exceptions with 'pass' hides critical runtime failures and leaves state unpredictable.",
                        suggestedFix=f"{ind_str}except Exception as err:\n{ind_str}    logger.warning(f'Encountered error: {{err}}')",
                        ruleId="py-silent-except"
                    ))
            self.generic_visit(node)

    visitor = PythonASTVisitor()
    visitor.visit(tree)
    return issues

def check_json_file(file_path: str, content: str) -> List[Issue]:
    issues: List[Issue] = []
    try:
        json.loads(content)
    except json.JSONDecodeError as e:
        lines = content.splitlines()
        lineno = e.lineno
        snippet = lines[lineno - 1] if lineno <= len(lines) else ""
        issues.append(Issue(
            id=str(uuid.uuid4()),
            filePath=file_path,
            lineNumber=lineno,
            snippet=snippet.strip() or "JSON Error",
            originalCode=snippet,
            category="error",
            severity="Critical",
            title="Malformed JSON Syntax",
            explanation=f"JSON Decode Error at line {lineno}: {e.msg}.",
            suggestedFix=snippet.strip(),
            ruleId="json-syntax-error"
        ))
    return issues

def check_regex_rules(file_path: str, content: str, lang: str) -> List[Issue]:
    issues: List[Issue] = []
    lines = content.splitlines()

    # Rule Definition:
    # (pattern, category, severity, title, explanation, fix_fn, valid_langs)
    rules = [
        # 1. Hardcoded Secrets & Credentials
        (
            r"""(?i)(api[_-]?key|secret[_-]?key|auth[_-]?token|access[_-]?token|client[_-]?secret|private[_-]?key|password|db_pass)\s*[:=]\s*['"][A-Za-z0-9_\-\.@!#%^&*]{8,}['"]""",
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
        (
            r"""-----BEGIN (?:RSA |EC )?PRIVATE KEY-----""",
            "security", "Critical",
            "Exposed Private Encryption Key",
            "An unencrypted private cryptographic key was found inside source code. Private keys must be read from secured key vaults or environment files.",
            lambda line, l: "# Load cryptographic key from secure vault or secret manager",
            ["javascript", "typescript", "python", "java"]
        ),

        # 2. SQL Injection
        (
            r"""(?i)(execute|query|raw|cursor\.execute)\s*\(\s*(f['"]|\$['"]|['"].*SELECT.*(WHERE|FROM).*['"]\s*[\+\%])""",
            "security", "Critical",
            "SQL Injection via Dynamic Query Construction",
            "Direct string interpolation or concatenation into SQL queries allows attackers to execute arbitrary SQL commands.",
            lambda line, l: "cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))" if l == "python" else "db.query('SELECT * FROM users WHERE id = $1', [userId])",
            ["javascript", "typescript", "python", "java"]
        ),

        # 3. Dangerous eval() & Code Execution
        (
            r"""\beval\s*\(""",
            "security", "Critical",
            "Dangerous eval() Call",
            "eval() executes dynamic strings with full interpreter privileges, opening the system to Remote Code Execution.",
            lambda line, l: re.sub(r"""\beval\((.*?)\)""", r"JSON.parse(\1)", line),
            ["javascript", "typescript", "python"]
        ),
        (
            r"""(subprocess\.(call|Popen|run)\(.*shell\s*=\s*True|child_process\.exec\()""",
            "security", "High",
            "Command Injection Risk (shell=True / exec)",
            "Invoking system shells with unvalidated inputs allows command chaining (e.g. `; rm -rf`).",
            lambda line, l: "subprocess.run(['ls', '-la'], check=True)" if l == "python" else "child_process.execFile('cmd', [arg1])",
            ["javascript", "typescript", "python"]
        ),

        # 4. Cross-Site Scripting (XSS)
        (
            r"""dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*([^}]+)\}""",
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
        (
            r"""\.innerHTML\s*=\s*""",
            "security", "High",
            "Cross-Site Scripting (XSS) via innerHTML",
            "Directly assigning unsanitized strings to innerHTML enables client-side script execution.",
            lambda line, l: line.replace(".innerHTML =", ".textContent ="),
            ["javascript", "typescript"]
        ),

        # 5. Insecure CORS & Crypto
        (
            r"""(Access-Control-Allow-Origin['"]?\s*[:=]\s*['"]\*['"]|cors\(\s*\{\s*origin\s*:\s*['"]\*['"]\s*\})""",
            "security", "Medium",
            "Insecure CORS Wildcard (*)",
            "Using wildcard '*' origins allows any external website to make cross-origin requests to your server.",
            lambda line, l: "cors({ origin: ['https://yourdomain.com'], credentials: true })",
            ["javascript", "typescript", "python"]
        ),
        (
            r"""(?i)(hashlib\.md5\(|crypto\.createHash\(['"]md5['"]\)|hashlib\.sha1\()""",
            "security", "Medium",
            "Weak Cryptographic Hash (MD5 / SHA-1)",
            "MD5 and SHA-1 suffer from collision attacks. Use SHA-256 or bcrypt for hashing.",
            lambda line, l: "hashlib.sha256(data).hexdigest()" if l == "python" else "crypto.createHash('sha256').update(data).digest('hex')",
            ["javascript", "typescript", "python"]
        ),

        # 6. Loose Equality (== vs ===)
        (
            r"""(?<=[^\!\=\>\<])==(?=[^\=])""",
            "bug", "Low",
            "Loose Equality Comparison (== vs ===)",
            "Loose equality performs unintended type coercion (e.g. '' == 0 is true). Always use strict equality '==='.",
            lambda line, l: line.replace("==", "==="),
            ["javascript", "typescript"]
        ),
        (
            r"""(?<=[^\!])\=(?=[^\=])\s*!=(?=[^\=])""",
            "bug", "Low",
            "Loose Inequality Comparison (!= vs !==)",
            "Loose inequality performs unintended type coercion. Use strict '!=='.",
            lambda line, l: line.replace("!=", "!=="),
            ["javascript", "typescript"]
        ),

        # 7. Off-by-one array index
        (
            r"""for\s*\(\s*(?:var|let|const)?\s*\w+\s*=\s*0\s*;\s*\w+\s*<=\s*\w+\.length\s*;""",
            "bug", "High",
            "Off-By-One Array Index (<= length)",
            "Iterating with '<= array.length' reads an out-of-bounds index returning undefined or crashing.",
            lambda line, l: line.replace("<=", "<"),
            ["javascript", "typescript", "java"]
        ),

        # 8. Unhandled Promise / Async Call Missing Try/Catch
        (
            r"""^\s*(?:const\s+\w+\s*=\s*)?await\s+(?:fetch|axios\.\w+|db\.\w+)\(""",
            "error", "High",
            "Unhandled Async Call (Missing try/catch)",
            "Awaiting asynchronous network or DB operations at top-level or inside functions without try/catch causes unhandled promise rejections.",
            lambda line, l: f"try {{\n  {line.strip()}\n}} catch (err) {{\n  console.error('Operation failed:', err);\n}}",
            ["javascript", "typescript"]
        ),

        # 9. TypeScript 'any' type
        (
            r""":\s*any\b|\bas\s+any\b""",
            "quality", "Low",
            "Untyped 'any' in TypeScript",
            "Using 'any' disables TypeScript compiler type-checking and allows undetectable runtime type errors.",
            lambda line, l: re.sub(r""":\s*any\b""", ": unknown", line),
            ["typescript"]
        ),

        # 10. Missing React Key prop in .map()
        (
            r"""\.map\s*\(\s*(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>\s*<[A-Za-z0-9_]+(?![^>]*\bkey\b)[^>]*>""",
            "bug", "Medium",
            "Missing 'key' Prop in React Iteration",
            "Rendering list elements with .map() without a distinct 'key' prop causes React DOM reconciliation bugs and state corruptions.",
            lambda line, l: re.sub(r"""<([A-Za-z0-9_]+)""", r"<\1 key={item.id || index}", line),
            ["javascript", "typescript"]
        ),

        # 11. Missing alt text on img
        (
            r"""<img(?![^>]*\balt\b)[^>]*>""",
            "quality", "Low",
            "Missing 'alt' Attribute on <img>",
            "Images without an 'alt' attribute degrade accessibility for screen-readers and fail WCAG compliance.",
            lambda line, l: line.replace("<img", '<img alt="Descriptive image label"'),
            ["javascript", "typescript", "html"]
        ),

        # 12. Empty Catch Block
        (
            r"""catch\s*\(\s*\w*\s*\)\s*\{\s*\}""",
            "error", "Medium",
            "Empty catch Block",
            "Swallowing exceptions with an empty catch block obscures runtime exceptions and breaks debugging.",
            lambda line, l: "catch (err) { console.error('Caught unexpected error:', err); }",
            ["javascript", "typescript", "java"]
        ),

        # 13. Console.log / Debugger Left in Production
        (
            r"""^\s*console\.(log|debug|info)\s*\(.*?\);?""",
            "quality", "Low",
            "Console Log Left in Code",
            "Development console logs clutter the browser console, degrade performance, and may leak internal state.",
            lambda line, l: "",  # Clean removal!
            ["javascript", "typescript"]
        ),
        (
            r"""^\s*debugger;?""",
            "error", "High",
            "debugger Statement in Code",
            "A 'debugger;' statement halts execution when developer tools are active, freezing production UI for users.",
            lambda line, l: "",  # Clean removal!
            ["javascript", "typescript"]
        ),

        # 14. Blocking Synchronous I/O
        (
            r"""\bfs\.(readFileSync|writeFileSync|appendFileSync)\(""",
            "performance", "Medium",
            "Blocking Synchronous File I/O",
            "Calling synchronous file operations blocks the Node.js single-threaded event loop for all concurrent users.",
            lambda line, l: line.replace("fs.readFileSync", "await fs.promises.readFile").replace("fs.writeFileSync", "await fs.promises.writeFile"),
            ["javascript", "typescript"]
        ),

        # 15. Unoptimized Bundle Import
        (
            r"""import\s+[*_]\s+as\s+\w+\s+from\s+['"]lodash['"];?""",
            "performance", "Medium",
            "Unoptimized Heavy Library Import",
            "Importing the entire lodash bundle increases bundle size. Import only required helper functions.",
            lambda line, l: "import debounce from 'lodash/debounce';",
            ["javascript", "typescript"]
        ),

        # 16. TODO / FIXME Left in Code
        (
            r"""(?i)(//|#)\s*(TODO|FIXME|XXX):?\s*(.+)""",
            "quality", "Low",
            "Unresolved TODO/FIXME Comment",
            "Unresolved TODO or FIXME comment detected. Ensure outstanding edge cases or tech debt are resolved before merging.",
            lambda line, l: line,
            ["javascript", "typescript", "python", "java", "sql"]
        ),

        # 17. Deep Nesting Check (> 3 indentation levels in control blocks)
        (
            r"""^(?: {12,}|\t{3,})(if|for|while|switch)\s*\(?""",
            "quality", "Low",
            "Deeply Nested Control Flow (>3 Levels)",
            "Excessive nesting hampers code readability, introduces cognitive load, and increases cyclomatic complexity. Consider early returns or extracting functions.",
            lambda line, l: line.strip(),
            ["javascript", "typescript", "python", "java"]
        )
    ]

    for line_idx, line in enumerate(lines, start=1):
        clean_line = line.strip()
        # Skip pure comments for code rules, except TODO rule
        is_comment = clean_line.startswith(('#', '//', '/*', '*'))
        
        for pattern, cat, sev, title, explanation, fix_fn, valid_langs in rules:
            if lang in valid_langs or "all" in valid_langs:
                if is_comment and "TODO" not in title and "Private Key" not in title:
                    continue
                if re.search(pattern, line):
                    try:
                        suggested = fix_fn(line, lang)
                    except Exception:
                        suggested = clean_line

                    issues.append(Issue(
                        id=str(uuid.uuid4()),
                        filePath=file_path,
                        lineNumber=line_idx,
                        endLineNumber=line_idx,
                        snippet=clean_line or line,
                        originalCode=line,
                        category=cat,
                        severity=sev,
                        title=title,
                        explanation=explanation,
                        suggestedFix=suggested,
                        ruleId=f"rule-{cat}-{abs(hash(title)) % 10000}"
                    ))

    return issues

def scan_file_content(file_path: str, content: str) -> List[Issue]:
    lang = detect_language(file_path)
    issues: List[Issue] = []

    if lang == 'python':
        issues.extend(check_python_ast(file_path, content))
    elif lang == 'json':
        issues.extend(check_json_file(file_path, content))

    issues.extend(check_regex_rules(file_path, content, lang))

    # Deduplicate issues by line number and title
    seen = set()
    deduped = []
    for issue in issues:
        key = (issue.lineNumber, issue.title)
        if key not in seen:
            seen.add(key)
            deduped.append(issue)

    # Sort by line number
    deduped.sort(key=lambda x: x.lineNumber)
    return deduped
