import sys
import os
import json

# Add backend to path
sys.path.insert(0, os.path.abspath("backend"))

from scanner.rules import scan_file_content
from scanner.dependencies import check_package_json, check_requirements_txt
from main import compute_health_score, generate_best_practices

print("=== Testing CODEGUARD AI Rules Engine ===")

# 1. Test auth.py
auth_path = "sample-buggy-project/backend/auth.py"
with open(auth_path, "r", encoding="utf-8") as f:
    auth_content = f.read()
auth_issues = scan_file_content(auth_path, auth_content)
print(f"\n[+] {auth_path} - Issues Found: {len(auth_issues)}")
for issue in auth_issues:
    print(f"  - [{issue.severity}] {issue.title} (line {issue.lineNumber}): {issue.snippet}")

# 2. Test UserProfile.tsx
profile_path = "sample-buggy-project/frontend/UserProfile.tsx"
with open(profile_path, "r", encoding="utf-8") as f:
    profile_content = f.read()
profile_issues = scan_file_content(profile_path, profile_content)
print(f"\n[+] {profile_path} - Issues Found: {len(profile_issues)}")
for issue in profile_issues:
    print(f"  - [{issue.severity}] {issue.title} (line {issue.lineNumber}): {issue.snippet}")

# 3. Test package.json
pkg_path = "sample-buggy-project/package.json"
with open(pkg_path, "r", encoding="utf-8") as f:
    pkg_content = f.read()
pkg_deps = check_package_json(pkg_content)
print(f"\n[+] {pkg_path} - Dependencies Audited: {len(pkg_deps)}")
for d in pkg_deps:
    print(f"  - {d.package} ({d.currentVersion} -> {d.latestVersion}) status: {d.status} | fix: {d.upgradeCommand}")

# 4. Test requirements.txt
req_path = "sample-buggy-project/requirements.txt"
with open(req_path, "r", encoding="utf-8") as f:
    req_content = f.read()
req_deps = check_requirements_txt(req_content)
print(f"\n[+] {req_path} - Dependencies Audited: {len(req_deps)}")
for d in req_deps:
    print(f"  - {d.package} ({d.currentVersion} -> {d.latestVersion}) status: {d.status} | fix: {d.upgradeCommand}")

all_issues = auth_issues + profile_issues
all_deps = pkg_deps + req_deps
score = compute_health_score(all_issues, all_deps)
best_practices = generate_best_practices(all_issues, all_deps)

print(f"\n[+] Overall Project Health Score: {score}/100")
print("[+] Top 5 Best Practices:")
for i, p in enumerate(best_practices, 1):
    print(f"  {i}. {p}")

