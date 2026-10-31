// CLYRO Client-Side Offline Static Scan Engine
// Provides 100% offline rule analysis and instant line remediation directly in the browser
// Zero network requests, zero backend dependency required

import { Issue, DependencyItem, ScanResult, CategoryType, SeverityLevel } from '@/types/scanner';

export interface InMemoryScanFile {
  path: string;
  content: string;
  size?: number;
}

export function detectLanguage(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.js') || lower.endsWith('.jsx') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'javascript';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.java')) return 'java';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  if (lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.less')) return 'css';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.env') || lower.includes('.env.')) return 'env';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  return 'unknown';
}

interface ClientRule {
  regex: RegExp;
  category: CategoryType;
  severity: SeverityLevel;
  title: string;
  explanation: string;
  validLangs: string[];
  fixFn: (line: string, lang: string) => string;
}

const CLIENT_RULES: ClientRule[] = [
  // 1. Hardcoded Secret / API Key
  {
    regex: /(?:api[_-]?key|secret[_-]?key|jwt[_-]?secret|auth[_-]?token|access[_-]?token|client[_-]?secret|private[_-]?key|password|db_pass)\s*(?:[:=]|\|\|)\s*['"][A-Za-z0-9_\-\.@!#%^&*]{8,}['"]/i,
    category: 'security',
    severity: 'Critical',
    title: 'Hardcoded Secret / API Key',
    explanation: 'Embedding plain-text credentials or API tokens directly in source code risks immediate exposure and unauthorized API abuse if committed.',
    validLangs: ['javascript', 'typescript', 'python', 'java', 'sql'],
    fixFn: (line, lang) => line.replace(/(['"][A-Za-z0-9_\-\.@!#%^&*]{8,}['"])/, lang === 'python' ? "os.getenv('API_KEY', '')" : "process.env.API_KEY || ''"),
  },
  // 2. Database connection strings
  {
    regex: /['"]postgres(?:ql)?:\/\/[^:]+:[^@]+@[^'"]+['"]|['"]mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^'"]+['"]|['"]mysql:\/\/[^:]+:[^@]+@[^'"]+['"]/,
    category: 'security',
    severity: 'Critical',
    title: 'Hardcoded Database Connection String with Credentials',
    explanation: 'Exposing database passwords and connection URIs inside source code allows direct database compromise.',
    validLangs: ['javascript', 'typescript', 'python', 'json', 'env'],
    fixFn: (line, lang) => line.replace(/['"](postgres(?:ql)?|mongodb(?:\+srv)?|mysql):\/\/[^'"]+['"]/, lang === 'python' ? "os.getenv('DATABASE_URL', '')" : "process.env.DATABASE_URL || ''"),
  },
  // 3. Exposed Private Key
  {
    regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
    category: 'security',
    severity: 'Critical',
    title: 'Exposed Private Encryption Key',
    explanation: 'An unencrypted private cryptographic key was found inside source code. Private keys must be read from secured key vaults or environment files.',
    validLangs: ['javascript', 'typescript', 'python', 'java'],
    fixFn: () => '# Load cryptographic key from secure vault or secret manager',
  },
  // 4. SQL Injection
  {
    regex: /(?:execute|query|raw|cursor\.execute)\s*\(\s*(?:f['"]|\$['"]|['"].*SELECT.*(?:WHERE|FROM).*['"]\s*[\+\%])/i,
    category: 'security',
    severity: 'Critical',
    title: 'SQL Injection via Dynamic Query Construction',
    explanation: 'Direct string interpolation or concatenation into SQL queries allows attackers to execute arbitrary SQL commands.',
    validLangs: ['javascript', 'typescript', 'python', 'java'],
    fixFn: (line, lang) => lang === 'python' ? "cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))" : "db.query('SELECT * FROM users WHERE id = $1', [userId])",
  },
  // 5. eval()
  {
    regex: /\beval\s*\(/,
    category: 'security',
    severity: 'Critical',
    title: 'Dangerous eval() Call',
    explanation: 'eval() executes dynamic strings with full interpreter privileges, opening the system to Remote Code Execution.',
    validLangs: ['javascript', 'typescript', 'python'],
    fixFn: (line) => line.replace(/\beval\((.*?)\)/, 'JSON.parse($1)'),
  },
  // 6. Command injection
  {
    regex: /(?:subprocess\.(?:call|Popen|run)\(.*shell\s*=\s*True|child_process\.exec\()/,
    category: 'security',
    severity: 'High',
    title: 'Command Injection Risk (shell=True / exec)',
    explanation: 'Invoking system shells with unvalidated inputs allows command chaining (e.g. ; rm -rf).',
    validLangs: ['javascript', 'typescript', 'python'],
    fixFn: (line, lang) => lang === 'python' ? "subprocess.run(['ls', '-la'], check=True)" : "child_process.execFile('cmd', [arg1])",
  },
  // 7. dangerouslySetInnerHTML
  {
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*(?!\s*(?:DOMPurify\.sanitize|sanitize)\b)[^}]+\}/,
    category: 'security',
    severity: 'High',
    title: 'Cross-Site Scripting (XSS) via dangerouslySetInnerHTML',
    explanation: "Injecting raw HTML without sanitization bypasses React's built-in escaping, enabling malicious script injection.",
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*(.*?)\s*\}\s*\}/, 'dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize($1) }}'),
  },
  // 8. innerHTML
  {
    regex: /\.innerHTML\s*=\s*/,
    category: 'security',
    severity: 'High',
    title: 'Cross-Site Scripting (XSS) via innerHTML',
    explanation: 'Directly assigning unsanitized strings to innerHTML enables client-side script execution.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace('.innerHTML =', '.textContent ='),
  },
  // 9. CORS wildcard
  {
    regex: /(?:Access-Control-Allow-Origin['"]?\s*[:=]\s*['"]\*['"]|cors\(\s*\{\s*origin\s*:\s*['"]\*['"]\s*\})/,
    category: 'security',
    severity: 'Medium',
    title: 'Insecure CORS Wildcard (*)',
    explanation: "Using wildcard '*' origins allows any external website to make cross-origin requests to your server.",
    validLangs: ['javascript', 'typescript', 'python'],
    fixFn: (line) => line.replace(/['"]\*['"]/, "process.env.ALLOWED_ORIGIN || 'https://app.domain.com'"),
  },
  // 10. MD5 / SHA-1
  {
    regex: /(?:crypto\.createHash\(['"](?:md5|sha1)['"]\)|hashlib\.(?:md5|sha1)\()/,
    category: 'security',
    severity: 'Medium',
    title: 'Weak Cryptographic Hash (MD5 / SHA-1)',
    explanation: 'MD5 and SHA-1 are cryptographically broken and vulnerable to collision attacks. Use SHA-256 or bcrypt.',
    validLangs: ['javascript', 'typescript', 'python'],
    fixFn: (line, lang) => lang === 'python' ? line.replace(/hashlib\.(md5|sha1)/, 'hashlib.sha256') : line.replace(/['"](md5|sha1)['"]/, "'sha256'"),
  },
  // 11. Loose Equality
  {
    regex: /(?:\s|\()([a-zA-Z0-9_$.]+)\s*==\s*([a-zA-Z0-9_$.'"]+)/,
    category: 'bug',
    severity: 'Low',
    title: 'Loose Equality Comparison (== vs ===)',
    explanation: 'Using loose equality (==) performs implicit type coercion, often leading to subtle bugs with 0, empty strings, and null/undefined.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/==/g, '==='),
  },
  // 12. Loose Inequality
  {
    regex: /(?:\s|\()([a-zA-Z0-9_$.]+)\s*!=\s*([a-zA-Z0-9_$.'"]+)/,
    category: 'bug',
    severity: 'Low',
    title: 'Loose Inequality Comparison (!= vs !==)',
    explanation: 'Loose inequality (!=) performs implicit type conversion.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/!=/g, '!=='),
  },
  // 13. Off-by-one array index
  {
    regex: /(?:for|while)\s*\(.*?[a-zA-Z0-9_]+\s*<=\s*[a-zA-Z0-9_.]+\.length/,
    category: 'bug',
    severity: 'Medium',
    title: 'Off-By-One Array Index (<= length)',
    explanation: 'Iterating up to `<= array.length` accesses an index out-of-bounds (`undefined`), causing runtime crashes or unexpected iterations.',
    validLangs: ['javascript', 'typescript', 'java'],
    fixFn: (line) => line.replace('<=', '<'),
  },
  // 14. Unhandled async
  {
    regex: /(?:^|\s)(?:const|let|var)?\s*[a-zA-Z0-9_\s,=]*=\s*await\s+[a-zA-Z0-9_.]+\(/,
    category: 'error',
    severity: 'Medium',
    title: 'Unhandled Async Call (Missing try/catch)',
    explanation: 'Awaiting asynchronous promises outside of a try/catch block risks unhandled promise rejections crashing the process.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => {
      const indent = line.match(/^\s*/)?.[0] || '';
      return `${indent}try {\n  ${line.trim()}\n${indent}} catch (err) {\n${indent}  console.error('Async operation failed:', err);\n${indent}}`;
    },
  },
  // 15. Untyped any in TS
  {
    regex: /:\s*any\b/,
    category: 'quality',
    severity: 'Low',
    title: "Untyped 'any' in TypeScript",
    explanation: "Disabling type-safety with 'any' circumvents the TypeScript compiler, permitting silent runtime type mismatches.",
    validLangs: ['typescript'],
    fixFn: (line) => line.replace(/:\s*any\b/, ': unknown'),
  },
  // 16. Missing key in React iteration
  {
    regex: /\.map\s*\(\s*\([^)]*\)\s*=>\s*\(?\s*<[a-zA-Z0-9_]+(?![^>]*\bkey=)/,
    category: 'bug',
    severity: 'Medium',
    title: "Missing 'key' Prop in React Iteration",
    explanation: "Rendering dynamic lists without a unique 'key' prop disrupts React's reconciliation diff algorithm.",
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/<([a-zA-Z0-9_]+)/, '<$1 key={item.id || index}'),
  },
  // 17. Missing alt attribute on img
  {
    regex: /<img(?![^>]*\balt=)[^>]*>/,
    category: 'quality',
    severity: 'Low',
    title: "Missing 'alt' Attribute on <img>",
    explanation: "Image elements require an alt attribute for accessibility and screen readers (WCAG 2.1).",
    validLangs: ['html', 'javascript', 'typescript'],
    fixFn: (line) => line.replace(/<img/, '<img alt="Descriptive visual content"'),
  },
  // 18. Console log in production
  {
    regex: /console\.log\s*\(/,
    category: 'quality',
    severity: 'Low',
    title: 'Console Log Left in Code',
    explanation: 'Leaving debug console logs in production builds clutters browser developer tools and may unintentionally leak private user data.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => '// ' + line.trim(),
  },
  // 19. debugger statement
  {
    regex: /\bdebugger\s*;?/,
    category: 'error',
    severity: 'High',
    title: 'debugger Statement in Code',
    explanation: 'A debugger statement pauses JavaScript execution when developer tools are active, interrupting user workflows.',
    validLangs: ['javascript', 'typescript'],
    fixFn: () => '',
  },
  // 20. Blocking Sync I/O
  {
    regex: /fs\.(?:readFileSync|writeFileSync|appendFileSync|existsSync)\s*\(/,
    category: 'performance',
    severity: 'Medium',
    title: 'Blocking Synchronous File I/O',
    explanation: 'Synchronous file system operations freeze the Node.js single-threaded event loop, starving all incoming HTTP requests.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/fs\.(read|write|append)FileSync/, 'await fs.promises.$1File'),
  },
  // 21. Unoptimized heavy library
  {
    regex: /import\s+(?:\*\s+as\s+[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)\s+from\s+['"](?:lodash|moment|date-fns|ramda)['"]/,
    category: 'performance',
    severity: 'Low',
    title: 'Unoptimized Heavy Library Import',
    explanation: 'Importing the entirety of large utility libraries bloats client JavaScript bundles.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/from\s+['"]lodash['"]/, "from 'lodash-es'"),
  },
  // 22. TODO/FIXME comments
  {
    regex: /(?:\/\/|#|\/\*)\s*(?:TODO|FIXME|HACK|XXX):?\s*(.*)/i,
    category: 'quality',
    severity: 'Low',
    title: 'Unresolved TODO/FIXME Comment',
    explanation: 'Unaddressed TODO comments indicate incomplete implementations or known edge-case failures.',
    validLangs: ['javascript', 'typescript', 'python', 'java', 'sql'],
    fixFn: (line) => line,
  },
  // 23. Target blank vulnerability
  {
    regex: /target=['"]_blank['"](?![^>]*rel=['"][^'"]*noopener[^'"]*['"])/,
    category: 'security',
    severity: 'Medium',
    title: "Reverse Tabnabbing Security Risk (target='_blank')",
    explanation: "Opening hyperlinks with target='_blank' without rel='noopener noreferrer' grants the target page access to window.opener.",
    validLangs: ['html', 'javascript', 'typescript'],
    fixFn: (line) => line.replace(/target=['"]_blank['"]/, 'target="_blank" rel="noopener noreferrer"'),
  },
  // 24. Array index as React key
  {
    regex: /key=\{index\}|key=\{i\}|key=\{idx\}/,
    category: 'bug',
    severity: 'Medium',
    title: 'Array Index Used as React Key',
    explanation: 'Using array index as a React key causes incorrect component state retention and rendering glitches when items are reordered or filtered.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/key=\{(index|i|idx)\}/, 'key={item.id}'),
  },
  // 25. Insecure HTTP
  {
    regex: /['"]http:\/\/(?!localhost|127\.0\.0\.1)[^'"]+['"]/,
    category: 'security',
    severity: 'Medium',
    title: 'Insecure Cleartext HTTP Protocol',
    explanation: 'Communicating over unencrypted HTTP exposes data to eavesdropping, packet sniffing, and Man-in-the-Middle (MitM) attacks.',
    validLangs: ['javascript', 'typescript', 'python', 'json', 'env'],
    fixFn: (line) => line.replace('http://', 'https://'),
  },
  // 26. Hardcoded localhost
  {
    regex: /['"]https?:\/\/(?:localhost|127\.0\.0\.1)(?::[0-9]+)?(?:\/[^'"]*)?['"]/,
    category: 'quality',
    severity: 'Low',
    title: 'Hardcoded Localhost Endpoint',
    explanation: 'Hardcoding localhost URLs in source code causes requests to fail when deployed to staging or production environments.',
    validLangs: ['javascript', 'typescript', 'python'],
    fixFn: (line) => line.replace(/['"]https?:\/\/(?:localhost|127\.0\.0\.1)(?::[0-9]+)?['"]/, 'process.env.API_BASE_URL || ""'),
  },
  // 27. Inline style object
  {
    regex: /style=\{\{[^}]+\}\}/,
    category: 'performance',
    severity: 'Low',
    title: 'Inline Style Object Re-creation',
    explanation: 'Inline style objects in JSX force the JavaScript engine to allocate a new object on every render cycle, triggering unnecessary DOM reconciliation.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/style=\{\{[^}]+\}\}/, 'className="/* extracted-styles */"'),
  },
  // 28. Direct React state mutation
  {
    regex: /state\.[a-zA-Z0-9_]+\s*=\s*|this\.state\.[a-zA-Z0-9_]+\s*=\s*/,
    category: 'bug',
    severity: 'High',
    title: 'Direct React State Mutation',
    explanation: 'Directly modifying component state bypasses React lifecycle methods and prevents component re-rendering.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/this\.state\.([a-zA-Z0-9_]+)\s*=\s*([^;]+);?/, 'this.setState({ $1: $2 })'),
  },
  // 29. Potential memory leak
  {
    regex: /useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]*(?:addEventListener|setInterval|subscribe)[^}]*\}\s*,\s*\[\]\)/,
    category: 'performance',
    severity: 'Medium',
    title: 'Potential Memory Leak (Uncleaned Listener/Timer)',
    explanation: 'Attaching global event listeners or intervals without returning an explicit cleanup function in useEffect causes memory leaks and duplicate handler firings.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/window\.addEventListener\(([^)]+)\);?/, 'window.addEventListener($1); return () => window.removeEventListener($1);'),
  },
  // 30. Floating promise
  {
    regex: /(?:^|\s)(?!await\b)(?!return\b)(?:fetch\(|axios\.[a-z]+\()[^;]+\b(?!\.catch|\.then)/,
    category: 'bug',
    severity: 'Medium',
    title: 'Floating Promise (Unawaited Network Call)',
    explanation: 'Executing asynchronous network operations without awaiting or catching potential rejections leads to silent network dropouts.',
    validLangs: ['javascript', 'typescript'],
    fixFn: (line) => line.replace(/(fetch\(|axios\.[a-z]+\()/, 'await $1'),
  },
  // 31. Insecure deserialization
  {
    regex: /(?:pickle\.loads?\(|yaml\.load\([^,)]*\)|unserialize\()/,
    category: 'security',
    severity: 'Critical',
    title: 'Insecure Deserialization Risk',
    explanation: 'Deserializing untrusted user input using pickle or unsafe yaml parsers permits arbitrary code execution.',
    validLangs: ['python', 'javascript', 'typescript'],
    fixFn: (line) => line.replace('yaml.load(', 'yaml.safe_load('),
  },
  // 32. Debug mode
  {
    regex: /(?:DEBUG\s*=\s*True|app\.run\(.*debug\s*=\s*True)/,
    category: 'security',
    severity: 'High',
    title: 'Debug Mode Enabled in Code',
    explanation: 'Leaving debug mode active in production displays detailed stack traces, environment variables, and interactive consoles to external visitors.',
    validLangs: ['python'],
    fixFn: (line) => line.replace('debug=True', 'debug=False').replace('DEBUG = True', 'DEBUG = False'),
  },
];

export function scanSingleFileClient(filePath: string, content: string): Issue[] {
  const lang = detectLanguage(filePath);
  const issues: Issue[] = [];
  const lines = content.split(/\r?\n/);

  // Check JSON
  if (lang === 'json') {
    try {
      JSON.parse(content);
    } catch (e: any) {
      issues.push({
        id: 'client-json-' + Math.random().toString(36).substring(2, 9),
        filePath,
        lineNumber: 1,
        endLineNumber: 1,
        snippet: lines[0]?.trim() || content.substring(0, 60),
        originalCode: lines[0] || '',
        category: 'error',
        severity: 'Critical',
        title: 'Malformed JSON Syntax',
        explanation: 'JSON parse error: ' + (e?.message || 'Invalid JSON syntax'),
        suggestedFix: '',
        ruleId: 'json-syntax-error',
      });
    }
  }

  // Check rules line-by-line
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const clean = line.trim();
    if (!clean) return;

    for (const rule of CLIENT_RULES) {
      if (rule.validLangs.includes(lang) || rule.validLangs.includes('all')) {
        if (rule.regex.test(line)) {
          let fix = clean;
          try {
            fix = rule.fixFn(line, lang);
          } catch {
            fix = clean;
          }
          issues.push({
            id: 'client-' + Math.random().toString(36).substring(2, 11),
            filePath,
            lineNumber: lineNum,
            endLineNumber: lineNum,
            snippet: clean,
            originalCode: line,
            category: rule.category,
            severity: rule.severity,
            title: rule.title,
            explanation: rule.explanation,
            suggestedFix: fix,
            ruleId: 'rule-' + rule.category + '-' + lineNum,
          });
        }
      }
    }
  });

  // Deduplicate
  const seen = new Set<string>();
  return issues.filter((i) => {
    const key = `${i.lineNumber}-${i.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const KNOWN_PACKAGES: Record<string, { latest: string; vuln_below?: string; vuln_info?: string; deprecated?: boolean }> = {
  lodash: { latest: '4.17.21', vuln_below: '4.17.21', vuln_info: 'Prototype Pollution (CVE-2021-23337)' },
  axios: { latest: '1.7.9', vuln_below: '1.6.0', vuln_info: 'SSRF & ReDoS (CVE-2023-45857)' },
  express: { latest: '4.21.1', vuln_below: '4.19.2', vuln_info: 'Open Redirect (CVE-2024-29041)' },
  jsonwebtoken: { latest: '9.0.2', vuln_below: '9.0.0', vuln_info: 'Insecure key verification (CVE-2022-23529)' },
  moment: { latest: '2.30.1', deprecated: true, vuln_info: 'Package is deprecated, use date-fns or Day.js.' },
  request: { latest: '2.88.2', deprecated: true, vuln_info: 'Package is deprecated and vulnerable to SSRF.' },
  react: { latest: '19.0.0', vuln_below: '16.14.0' },
  next: { latest: '15.0.3', vuln_below: '14.1.1', vuln_info: 'Server Actions SSRF (CVE-2024-34351)' },
  fastapi: { latest: '0.115.5' },
  uvicorn: { latest: '0.32.0' },
  sqlalchemy: { latest: '2.0.36' },
  pydantic: { latest: '2.9.2' },
  requests: { latest: '2.32.3', vuln_below: '2.31.0' },
  flask: { latest: '3.1.0' },
};

export function runClientScan(files: InMemoryScanFile[]): ScanResult {
  const allIssues: Issue[] = [];
  const dependencies: DependencyItem[] = [];

  for (const f of files) {
    const issues = scanSingleFileClient(f.path, f.content);
    allIssues.push(...issues);

    // Dependency check for package.json
    if (f.path.toLowerCase().endsWith('package.json')) {
      try {
        const pkg = JSON.parse(f.content);
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        for (const [name, verStr] of Object.entries(deps)) {
          const cleanVer = (verStr as string).replace(/[^0-9.]/g, '');
          const info = KNOWN_PACKAGES[name];
          if (info) {
            let status: DependencyItem['status'] = 'Safe';
            if (info.deprecated) status = 'Deprecated';
            else if (info.vuln_below && cleanVer && cleanVer < info.vuln_below) status = 'Known-vulnerable';
            else if (info.latest && cleanVer && cleanVer < info.latest) status = 'Outdated';

            dependencies.push({
              package: name,
              currentVersion: verStr as string,
              latestVersion: info.latest,
              status,
              ecosystem: 'npm',
              upgradeCommand: `npm install ${name}@${info.latest}`,
              vulnerabilityDetails: info.vuln_info || null,
            });
          } else {
            dependencies.push({
              package: name,
              currentVersion: verStr as string,
              latestVersion: 'Snapshot unknown',
              status: 'Unknown (offline)',
              ecosystem: 'npm',
              upgradeCommand: `npm update ${name}`,
            });
          }
        }
      } catch {}
    }
  }

  // Calculate Health Score
  let score = 100;
  const severityCounts: Record<SeverityLevel, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  const categoryCounts: Record<CategoryType, number> = {
    error: 0,
    bug: 0,
    security: 0,
    performance: 0,
    dependency: dependencies.length,
    quality: 0,
  };

  for (const issue of allIssues) {
    if (issue.severity === 'Critical') score -= 15;
    else if (issue.severity === 'High') score -= 8;
    else if (issue.severity === 'Medium') score -= 4;
    else if (issue.severity === 'Low') score -= 1;

    severityCounts[issue.severity]++;
    categoryCounts[issue.category]++;
  }

  for (const dep of dependencies) {
    if (dep.status === 'Known-vulnerable') score -= 10;
    else if (dep.status === 'Deprecated') score -= 5;
    else if (dep.status === 'Outdated') score -= 2;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    healthScore: score,
    totalFiles: files.length,
    scannedFiles: files.length,
    totalIssues: allIssues.length,
    severityCounts,
    categoryCounts,
    issues: allIssues,
    dependencies,
    bestPractices: [
      '100% Offline Static Engine active - Zero code leaves your browser.',
      'All security credentials, database URIs, and API tokens are checked against local rule set.',
      'Dependencies evaluated against local offline vulnerability snapshot.',
    ],
    aiProvider: 'CLYRO Offline Rule Engine',
    aiStatusMessage: 'Rule-based analysis complete (100% Local / Zero Network)',
  };
}

