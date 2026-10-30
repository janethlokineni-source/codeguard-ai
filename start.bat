@echo off
echo ========================================================
echo               STARTING CODEGUARD AI
echo ========================================================
echo.
echo 1. Launching FastAPI Backend on http://localhost:8000 ...
start "CODEGUARD Backend (Port 8000)" cmd /k "cd backend && "C:\Users\gmsur\AppData\Local\Programs\Python\Python312\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo 2. Launching Next.js Frontend on http://localhost:3000 ...
start "CODEGUARD Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo All services launched!
echo Open your browser at: http://localhost:3000
echo ========================================================

