# CODEGUARD AI 🛡️

> **Instant Pre-Merge Code & Security Scanner for Hackathon Teams**  
> 100% Local, Offline-First, and Privacy-Preserving. Zero Code Leaves Your Machine.

---

## 🚀 Overview

In fast-paced hackathons, team members (frontend, backend, database, UI) write code in silos. When merging branches right before judging, broken builds, security holes, unhandled exceptions, and outdated packages run rampant.

**CODEGUARD AI** allows your team to upload an entire project folder and instantly get a full audit report with actionable side-by-side code fixes, dependency remediation commands, and an animated Project Health Score.

---

## 🌟 Key Features

1. **Minimal Single-Action Landing**: Starts cleanly with a single `+ Add Folder` button (and `Add Files`), plus drag-and-drop folder support.
2. **Comprehensive Multi-Language Static Engine**:
   - **Programming Errors**: Python syntax errors via AST, bare/silent exception handlers, empty catch blocks, unhandled promises.
   - **Bugs**: Loose equality (`==` vs `===`), mutable default parameters, array off-by-one errors (`<= array.length`), infinite loop patterns.
   - **Security**: Hardcoded secrets/API keys/private keys, SQL injection (f-strings/string concatenation), XSS (`dangerouslySetInnerHTML`), `eval()`, command injection (`shell=True`), insecure CORS wildcards, weak crypto (MD5/SHA-1), exposed `.env` credentials.
   - **Performance**: Blocking synchronous I/O (`readFileSync`), heavy unoptimized bundle imports (`import * as _ from 'lodash'`), N+1 query patterns.
   - **Outdated & Vulnerable Dependencies**: Automatic parsing of `package.json` and `requirements.txt` with known CVE cross-referencing and exact upgrade commands.
   - **Code Quality**: Oversized functions (> 60 lines), debug logs left in production (`console.log`, plain `print`).
3. **Dual-Layer Architecture**:
   - **Layer 1**: Lightning-fast offline regex and AST static analysis engine that always works without any external services.
   - **Layer 2 (Optional AI)**: Local Ollama integration (`qwen2.5-coder:7b` or `codellama`) running on `localhost:11434` to provide enhanced plain-English explanations and contextual fixes. Gracefully falls back if Ollama is not active.
4. **Interactive Dashboard**:
   - Big animated **Project Health Score (0-100)** circular gauge.
   - 6 Interactive summary cards that filter issues on click.
   - Grouped issue list by file with accordion expansion.
   - Side-by-side **Before / After code diff** with line numbers and 1-click **Copy Fix** buttons.
   - Dedicated **Dependencies Tab** with package status badges and copyable remediation commands.
   - **Top 5 Best Practices Panel** tailored to the project's specific risks.
   - **Download Report (JSON)** for sharing with team members or mentors.

---

## 📁 Project Structure

```text
hackthon/
├── backend/
│   ├── scanner/
│   │   ├── __init__.py
│   │   ├── models.py          # Pydantic schemas (Issue, DependencyItem, ScanResult)
│   │   ├── rules.py           # Multi-language AST and regex static analyzers
│   │   ├── dependencies.py    # CVE & version audit for npm and PyPI manifests
│   │   └── ollama_client.py   # Local Ollama integration & offline fallback
│   ├── main.py                # FastAPI endpoints (/api/health, /api/scan)
│   └── requirements.txt       # Backend dependencies
├── frontend/
│   ├── app/
│   │   ├── globals.css        # Clean dark theme styling & scanner beam animation
│   │   ├── layout.tsx         # Root layout & page metadata
│   │   └── page.tsx           # Multi-phase user flow (Upload -> Preview -> Scan -> Dashboard)
│   ├── components/
│   │   ├── HealthGauge.tsx    # Animated SVG circular score meter
│   │   ├── SummaryCard.tsx    # Category cards with hover lift & active indicators
│   │   ├── IssueItem.tsx      # Accordion row with side-by-side before/after code diff
│   │   ├── DependenciesTab.tsx# Dependency audit table with copyable update commands
│   │   └── BestPracticesPanel.tsx # Top 5 prioritized recommendations
│   ├── types/
│   │   └── scanner.ts         # TypeScript definitions
│   └── package.json
├── sample-buggy-project/      # Ready-to-test project with intentional vulnerabilities
│   ├── backend/auth.py        # Hardcoded secret, SQL injection, mutable default argument
│   ├── frontend/UserProfile.tsx # XSS, eval(), loose equality, off-by-one loop
│   ├── package.json           # Outdated & vulnerable npm packages (lodash, axios, express)
│   └── requirements.txt       # Outdated PyPI packages (requests, flask, urllib3)
├── start.bat                  # Single command Windows launcher
├── start.ps1                  # Single command PowerShell launcher
└── README.md
```

---

## ⚡ Quick Start

### 1. Launch Everything with One Command

Run the startup script in PowerShell:
```powershell
.\start.ps1
```
Or double-click `start.bat`.

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Manual Startup (Optional)

#### Backend:
```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend:
```powershell
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing with the Included Sample Project

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **+ Add Folder**.
3. Select the `sample-buggy-project` folder located in this workspace.
4. Review the file tree preview and click **Scan Project**.
5. Observe the animated health gauge, issue counts, and click each issue to review the side-by-side corrected code!

