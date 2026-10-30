Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "               STARTING CODEGUARD AI" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$pythonExe = "C:\Users\gmsur\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
}

Write-Host "1. Launching FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process -FilePath powershell -ArgumentList "-NoExit", "-Command", "cd backend; & '$pythonExe' -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "2. Launching Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process -FilePath powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Both services launched!" -ForegroundColor Green
Write-Host "Frontend URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

