#!/usr/bin/env python3
"""
Offline Package Database Updater
Queries online registries (PyPI & npm) to update the bundled offline database.
Run this script while online to refresh package intelligence.
"""

import json
import os
import urllib.request
import urllib.error
from datetime import datetime

DATA_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "backend", "data", "offline_packages.json")
)

def is_online() -> bool:
    try:
        urllib.request.urlopen("https://registry.npmjs.org", timeout=2.5)
        return True
    except Exception:
        return False

def fetch_npm_latest(package_name: str) -> str:
    try:
        url = f"https://registry.npmjs.org/{package_name}/latest"
        req = urllib.request.Request(url, headers={"User-Agent": "CLYRO-Offline-Updater"})
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("version", "")
    except Exception:
        return ""

def fetch_pypi_latest(package_name: str) -> str:
    try:
        url = f"https://pypi.org/pypi/{package_name}/json"
        req = urllib.request.Request(url, headers={"User-Agent": "CLYRO-Offline-Updater"})
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("info", {}).get("version", "")
    except Exception:
        return ""

def update_offline_database():
    print("[*] Checking network connectivity...")
    if not is_online():
        print("[!] No internet connection detected. Offline snapshot remains unchanged.")
        return

    print("[*] Internet connected. Updating offline security snapshot...")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        db = json.load(f)

    # Update npm
    for pkg in db.get("npm", {}):
        latest = fetch_npm_latest(pkg)
        if latest:
            db["npm"][pkg]["latest"] = latest
            print(f"  [npm]  {pkg} -> {latest}")

    # Update pypi
    for pkg in db.get("pypi", {}):
        latest = fetch_pypi_latest(pkg)
        if latest:
            db["pypi"][pkg]["latest"] = latest
            print(f"  [pypi] {pkg} -> {latest}")

    db["updated_at"] = datetime.utcnow().isoformat() + "Z"

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)

    print(f"[+] Successfully refreshed {DATA_PATH}!")

if __name__ == "__main__":
    update_offline_database()

