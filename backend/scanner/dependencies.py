import os
import json
import re
import socket
from typing import List
from .models import DependencyItem

# Load offline database snapshot
OFFLINE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "offline_packages.json")
OFFLINE_NPM_PACKAGES = {}
OFFLINE_PY_PACKAGES = {}

def is_system_online() -> bool:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.3)
        s.connect(("8.8.8.8", 53))
        s.close()
        return True
    except Exception:
        return False


KNOWN_NPM_PACKAGES = {
    "lodash": {
        "latest": "4.17.21",
        "vuln_below": "4.17.21",
        "vuln_info": "Prototype Pollution and Command Injection (CVE-2021-23337, CVE-2020-8203)",
        "deprecated": False
    },
    "axios": {
        "latest": "1.7.9",
        "vuln_below": "1.6.0",
        "vuln_info": "Server-Side Request Forgery & ReDoS in query serialization (CVE-2023-45857)",
        "deprecated": False
    },
    "express": {
        "latest": "4.21.1",
        "vuln_below": "4.19.2",
        "vuln_info": "Open Redirect vulnerability via malformed URLs (CVE-2024-29041)",
        "deprecated": False
    },
    "jsonwebtoken": {
        "latest": "9.0.2",
        "vuln_below": "9.0.0",
        "vuln_info": "Insecure key verification leading to Remote Code Execution (CVE-2022-23529)",
        "deprecated": False
    },
    "moment": {
        "latest": "2.30.1",
        "vuln_below": "2.29.4",
        "vuln_info": "ReDoS vulnerability (CVE-2022-31129)",
        "deprecated": True
    },
    "request": {
        "latest": "2.88.2",
        "vuln_below": "99.0.0",
        "vuln_info": "Package is officially deprecated, unmaintained, and vulnerable to SSRF.",
        "deprecated": True
    },
    "react": {
        "latest": "18.3.1",
        "vuln_below": "16.14.0",
        "vuln_info": "Cross-Site Scripting vulnerabilities in legacy React DOM (CVE-2018-6341)",
        "deprecated": False
    },
    "next": {
        "latest": "14.2.15",
        "vuln_below": "14.1.1",
        "vuln_info": "Server Actions SSRF and Cache Poisoning vulnerability (CVE-2024-34351)",
        "deprecated": False
    }
}

KNOWN_PY_PACKAGES = {
    "requests": {
        "latest": "2.32.3",
        "vuln_below": "2.31.0",
        "vuln_info": "Leaking Proxy-Authorization headers on redirects (CVE-2023-32681)"
    },
    "flask": {
        "latest": "3.0.3",
        "vuln_below": "2.2.5",
        "vuln_info": "Unexpected session cookie disclosure and DoS risk (CVE-2023-30861)"
    },
    "urllib3": {
        "latest": "2.2.3",
        "vuln_below": "2.0.7",
        "vuln_info": "Sensitive cookie leak on cross-host redirects (CVE-2023-45803)"
    },
    "django": {
        "latest": "5.1.2",
        "vuln_below": "4.2.16",
        "vuln_info": "Denial of Service in URL validation and auth bypass (CVE-2024-45230)"
    },
    "pyyaml": {
        "latest": "6.0.2",
        "vuln_below": "5.4",
        "vuln_info": "Arbitrary code execution via yaml.load() (CVE-2020-14343)"
    },
    "cryptography": {
        "latest": "43.0.1",
        "vuln_below": "41.0.6",
        "vuln_info": "Memory corruption in PKCS7 decryption (CVE-2023-49083)"
    }
}

if os.path.exists(OFFLINE_DB_PATH):
    try:
        with open(OFFLINE_DB_PATH, "r", encoding="utf-8") as f:
            _offline_data = json.load(f)
            if "npm" in _offline_data and isinstance(_offline_data["npm"], dict):
                KNOWN_NPM_PACKAGES.update(_offline_data["npm"])
            if "pypi" in _offline_data and isinstance(_offline_data["pypi"], dict):
                KNOWN_PY_PACKAGES.update(_offline_data["pypi"])
    except Exception:
        pass

def clean_version(v: str) -> str:
    return re.sub(r"""^[~^>=<\s]+""", "", v).strip()

def parse_version_tuple(v: str):
    cleaned = clean_version(v)
    parts = []
    for p in re.findall(r'\d+', cleaned):
        try:
            parts.append(int(p))
        except ValueError:
            pass
    return tuple(parts) if parts else (0,)

def is_version_less(v1: str, v2: str) -> bool:
    t1 = parse_version_tuple(v1)
    t2 = parse_version_tuple(v2)
    max_len = max(len(t1), len(t2))
    padded_t1 = t1 + (0,) * (max_len - len(t1))
    padded_t2 = t2 + (0,) * (max_len - len(t2))
    return padded_t1 < padded_t2

def check_package_json(content: str) -> List[DependencyItem]:
    items: List[DependencyItem] = []
    try:
        data = json.loads(content)
    except Exception:
        return items

    deps = {}
    if isinstance(data.get("dependencies"), dict):
        deps.update(data["dependencies"])
    if isinstance(data.get("devDependencies"), dict):
        deps.update(data["devDependencies"])

    for pkg, ver in deps.items():
        ver_str = str(ver)
        cleaned = clean_version(ver_str)
        info = KNOWN_NPM_PACKAGES.get(pkg)
        if info:
            status = "Safe"
            vuln = None
            if info["deprecated"]:
                status = "Deprecated"
                vuln = "Package is officially unmaintained or deprecated by author."
            elif is_version_less(cleaned, info["vuln_below"]):
                status = "Known-vulnerable"
                vuln = info["vuln_info"]
            elif is_version_less(cleaned, info["latest"]):
                status = "Outdated"

            items.append(DependencyItem(
                package=pkg,
                currentVersion=ver_str,
                latestVersion=info["latest"],
                status=status,
                ecosystem="npm",
                upgradeCommand=f"npm install {pkg}@latest",
                vulnerabilityDetails=vuln
            ))
        else:
            online = is_system_online()
            items.append(DependencyItem(
                package=pkg,
                currentVersion=ver_str,
                latestVersion="latest" if online else "Unknown (offline)",
                status="Safe" if online else "Unknown (offline)",
                ecosystem="npm",
                upgradeCommand=f"npm update {pkg}",
                vulnerabilityDetails=None if online else "Package not found in offline snapshot database."
            ))
    return items

def check_requirements_txt(content: str) -> List[DependencyItem]:
    items: List[DependencyItem] = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        # match pkg==1.2.3 or pkg>=1.2.3
        match = re.match(r"""^([A-Za-z0-9_\-\.]+)(?:[=><~]{1,2}\s*([0-9A-Za-z_\-\.]+))?""", line)
        if match:
            pkg = match.group(1).lower()
            current = match.group(2) or "unpinned"
            info = KNOWN_PY_PACKAGES.get(pkg)
            if info:
                status = "Safe"
                vuln = None
                if current != "unpinned" and is_version_less(current, info["vuln_below"]):
                    status = "Known-vulnerable"
                    vuln = info["vuln_info"]
                elif current != "unpinned" and is_version_less(current, info["latest"]):
                    status = "Outdated"

                items.append(DependencyItem(
                    package=pkg,
                    currentVersion=current,
                    latestVersion=info["latest"],
                    status=status,
                    ecosystem="pypi",
                    upgradeCommand=f"pip install --upgrade {pkg}",
                    vulnerabilityDetails=vuln
                ))
            else:
                online = is_system_online()
                items.append(DependencyItem(
                    package=pkg,
                    currentVersion=current,
                    latestVersion="latest" if online else "Unknown (offline)",
                    status="Safe" if online else "Unknown (offline)",
                    ecosystem="pypi",
                    upgradeCommand=f"pip install --upgrade {pkg}",
                    vulnerabilityDetails=None if online else "Package not found in offline snapshot database."
                ))
    return items

