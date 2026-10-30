from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
from typing import List, Dict

from scanner.models import ScanRequest, SingleFileScanRequest, ScanResult, Issue, DependencyItem
from scanner.rules import scan_file_content
from scanner.dependencies import check_package_json, check_requirements_txt
from scanner.ollama_client import check_ollama_status, enhance_issue_with_ai

app = FastAPI(title="CODEGUARD AI Scanner API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/api/scan-file")
async def scan_single_file(request: SingleFileScanRequest):
    """Scans a single modified file on debounced user typing in Monaco Editor."""
    file_issues = scan_file_content(request.path, request.content)
    
    # Check dependencies if manifest
    dependencies = []
    base_name = request.path.split("/")[-1].split("\\")[-1].lower()
    if base_name == "package.json":
        dependencies = check_package_json(request.content)
    elif base_name in ["requirements.txt", "requirements-dev.txt"]:
        dependencies = check_requirements_txt(request.content)

    return {
        "filePath": request.path,
        "issues": file_issues,
        "dependencies": dependencies
    }

@app.post("/api/scan", response_model=ScanResult)
async def scan_project(request: ScanRequest):
    files = request.files
    total_files = len(files)
    
    if total_files == 0:
        raise HTTPException(status_code=400, detail="No files provided for scanning.")

    all_issues: List[Issue] = []
    all_dependencies: List[DependencyItem] = []
    scanned_count = 0

    ollama_online, default_model, _ = await check_ollama_status()
    use_ai = request.enableAiEnhancement and ollama_online
    active_model = request.aiModel or default_model or "qwen2.5-coder:7b"

    for file_item in files:
        path = file_item.path
        content = file_item.content
        scanned_count += 1

        # Check dependencies if manifest
        base_name = path.split("/")[-1].split("\\")[-1].lower()
        if base_name == "package.json":
            all_dependencies.extend(check_package_json(content))
        elif base_name in ["requirements.txt", "requirements-dev.txt"]:
            all_dependencies.extend(check_requirements_txt(content))

        # Run code rule checks
        file_issues = scan_file_content(path, content)
        
        # Second pass with Ollama if online for critical/high issues
        if use_ai and file_issues:
            for issue in file_issues[:3]:
                if issue.severity in ["Critical", "High"]:
                    enhanced = await enhance_issue_with_ai(issue, content, active_model)
                    issue.explanation = enhanced.explanation
                    issue.suggestedFix = enhanced.suggestedFix
                    issue.aiEnhanced = enhanced.aiEnhanced

        all_issues.extend(file_issues)

    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    category_counts = {
        "error": 0,
        "bug": 0,
        "security": 0,
        "performance": 0,
        "dependency": len(all_dependencies),
        "quality": 0
    }

    for issue in all_issues:
        if issue.severity in severity_counts:
            severity_counts[issue.severity] += 1
        if issue.category in category_counts:
            category_counts[issue.category] += 1

    health_score = compute_health_score(all_issues, all_dependencies)
    best_practices = generate_best_practices(all_issues, all_dependencies)

    ai_msg = (
        f"Local AI enhancement active via Ollama ({active_model}). 100% private & offline."
        if use_ai
        else "Ollama is offline. Full rule-based static engine active."
    )

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
        aiProvider=active_model if use_ai else None,
        aiStatusMessage=ai_msg
    )
