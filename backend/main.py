from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import concurrent.futures
from typing import List, Dict, Optional
import os

from scanner.models import ScanRequest, SingleFileScanRequest, ScanResult, Issue, DependencyItem
from scanner.rules import scan_file_content
from scanner.dependencies import check_package_json, check_requirements_txt
from scanner.ollama_client import check_ollama_status, enhance_issue_with_ai

app = FastAPI(title="CODEGUARD AI Scanner API", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thread pool for parallel CPU-bound regex/AST analysis
executor = concurrent.futures.ThreadPoolExecutor(max_workers=8)

# Files to skip (large files > 300KB, lock files, minified bundles, maps)
MAX_FILE_SIZE = 300 * 1024  # 300 KB
SKIPPED_FILES = {
    'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'composer.lock',
    'cargo.lock', 'poetry.lock', 'gemfile.lock'
}

def compute_health_score(issues: List[Issue], dependencies: List[DependencyItem]) -> int:
    score = 100
    for issue in issues:
        if issue.severity == "Critical":
            score -= 15
        elif issue.severity == "High":
            score -= 8
        elif issue.severity == "Medium":
            score -= 4
        elif issue.severity == "Low":
            score -= 1

    for dep in dependencies:
        if dep.status == "Known-vulnerable":
            score -= 10
        elif dep.status == "Deprecated":
            score -= 5
        elif dep.status == "Outdated":
            score -= 2

    return max(0, min(100, score))

def generate_best_practices(issues: List[Issue], dependencies: List[DependencyItem]) -> List[str]:
    practices = []
    titles = [i.title for i in issues]
    
    if any("Secret" in t or "Private Key" in t for t in titles):
        practices.append("Eliminate hardcoded secrets: Migrate all tokens, database credentials, and API keys to environment variables (.env) or a secret manager.")
    
    if any("SQL Injection" in t for t in titles):
        practices.append("Prevent SQL Injection: Use parameterized prepared statements or a trusted ORM instead of string concatenation / f-strings.")

    if any(d.status in ["Known-vulnerable", "Deprecated"] for d in dependencies):
        practices.append("Patch vulnerable dependencies: Update packages flagged with critical CVEs (e.g. lodash, axios, urllib3) immediately.")

    if any("XSS" in t or "eval" in t for t in titles):
        practices.append("Eliminate dynamic code injection: Remove dangerous eval() calls and sanitize all unescaped HTML injections with DOMPurify.")

    if any("Loose Equality" in t for t in titles):
        practices.append("Enforce strict equality: Replace loose equality ('==') with strict equality ('===') to eliminate coercion bugs.")

    if any("Mutable Default" in t for t in titles):
        practices.append("Avoid mutable default arguments in Python: Use 'def fn(param=None):' and initialize containers inside the function body.")

    if any("Unhandled Async" in t or "Empty catch" in t for t in titles):
        practices.append("Handle all asynchronous exceptions: Wrap await statements in try/catch blocks and avoid empty exception handlers.")

    defaults = [
        "Enforce pre-commit linting (ESLint, Ruff, Prettier) to catch syntax and formatting issues before team merge.",
        "Add comprehensive unit tests for core utilities and mock all external API boundaries.",
        "Maintain an active dependency update schedule using automated tools like Dependabot or Renovate.",
        "Ensure all exceptions in try/catch blocks are properly logged and monitored with structured error telemetry."
    ]
    for d in defaults:
        if len(practices) < 5 and d not in practices:
            practices.append(d)

    return practices[:5]

@app.get("/api/health")
async def health_check():
    ollama_online, default_model, models = await check_ollama_status()
    return {
        "status": "healthy",
        "service": "CODEGUARD AI",
        "ollama": {
            "online": ollama_online,
            "selected_model": default_model,
            "available_models": models,
            "message": f"Connected to local Ollama ({default_model})" if ollama_online else "Ollama offline. Rule-based static engine active."
        }
    }

def process_single_file_sync(path: str, content: str):
    """Synchronous CPU worker run inside ThreadPoolExecutor"""
    base_name = os.path.basename(path).lower()

    # Skip files larger than 300KB or lock files
    if len(content) > MAX_FILE_SIZE or base_name in SKIPPED_FILES or path.endswith(('.min.js', '.min.css', '.map')):
        return [], []

    deps = []
    if base_name == "package.json":
        deps = check_package_json(content)
    elif base_name in ["requirements.txt", "requirements-dev.txt"]:
        deps = check_requirements_txt(content)

    issues = scan_file_content(path, content)
    return issues, deps

@app.post("/api/scan-file")
async def scan_single_file(request: SingleFileScanRequest):
    """Fast, debounced 600ms single file scanner for live Monaco Editor typing."""
    loop = asyncio.get_running_loop()
    issues, deps = await loop.run_in_executor(
        executor, process_single_file_sync, request.path, request.content
    )
    return {
        "filePath": request.path,
        "issues": issues,
        "dependencies": deps
    }

@app.post("/api/scan", response_model=ScanResult)
async def scan_project(request: ScanRequest):
    """
    Parallel rule-based scan:
    - Runs in parallel across thread pool (4 to 8 at a time)
    - Returns results immediately in milliseconds
    """
    files = request.files
    total_files = len(files)
    
    if total_files == 0:
        raise HTTPException(status_code=400, detail="No files provided for scanning.")

    loop = asyncio.get_running_loop()

    # Process files in parallel batches of 8 using ThreadPoolExecutor
    batch_size = 8
    all_issues: List[Issue] = []
    all_dependencies: List[DependencyItem] = []
    scanned_count = 0

    for i in range(0, total_files, batch_size):
        batch = files[i:i + batch_size]
        tasks = [
            loop.run_in_executor(executor, process_single_file_sync, f.path, f.content)
            for f in batch
        ]
        results = await asyncio.gather(*tasks)
        for issues, deps in results:
            scanned_count += 1
            all_issues.extend(issues)
            all_dependencies.extend(deps)

    # Calculate category counts with support for both singular and plural
    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    category_counts = {
        "error": 0,
        "errors": 0,
        "bug": 0,
        "bugs": 0,
        "security": 0,
        "performance": 0,
        "perf": 0,
        "dependency": len(all_dependencies),
        "deps": len(all_dependencies),
        "quality": 0
    }

    for issue in all_issues:
        if issue.severity in severity_counts:
            severity_counts[issue.severity] += 1
        cat = issue.category.lower()
        if cat in ["error", "errors"]:
            category_counts["error"] += 1
            category_counts["errors"] += 1
        elif cat in ["bug", "bugs"]:
            category_counts["bug"] += 1
            category_counts["bugs"] += 1
        elif cat in ["security"]:
            category_counts["security"] += 1
        elif cat in ["performance", "perf"]:
            category_counts["performance"] += 1
            category_counts["perf"] += 1
        elif cat in ["quality"]:
            category_counts["quality"] += 1

    health_score = compute_health_score(all_issues, all_dependencies)
    best_practices = generate_best_practices(all_issues, all_dependencies)

    return ScanResult(
        healthScore=health_score,
        totalFiles=total_files,
        scannedFiles=scanned_count,
        totalIssues=len(all_issues),
        severityCounts=severity_counts,
        categoryCounts=category_counts,
        issues=all_issues,
        dependencies=all_dependencies,
        bestPractices=best_practices,
        aiProvider="qwen2.5-coder:7b",
        aiStatusMessage="Rule-based static analysis complete. Ollama AI pass ready."
    )

@app.post("/api/scan-ai-enhance")
async def scan_ai_enhance(request: ScanRequest):
    """
    Background AI enhancement pass:
    - Limited to 2 concurrent Ollama requests
    - Sends only relevant code chunks with keep_alive='10m'
    - Enhances critical/high priority issues
    """
    ollama_online, default_model, _ = await check_ollama_status()
    if not ollama_online:
        return {"enhancedIssues": []}

    active_model = request.aiModel or default_model or "qwen2.5-coder:7b"
    file_map = {f.path: f.content for f in request.files}

    # Only scan top critical/high issues from files
    enhanced: List[Issue] = []
    
    # Process up to 5 critical/high issues with Ollama
    for f in request.files:
        issues = scan_file_content(f.path, f.content)
        high_pri = [i for i in issues if i.severity in ["Critical", "High"]]
        for issue in high_pri[:2]:
            enh = await enhance_issue_with_ai(issue, f.content, active_model)
            if enh.aiEnhanced:
                enhanced.append(enh)
            if len(enhanced) >= 6:
                break
        if len(enhanced) >= 6:
            break

    return {"enhancedIssues": enhanced}
