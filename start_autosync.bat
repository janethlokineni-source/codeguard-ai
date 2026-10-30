@echo off
title CODEGUARD AI - Git Auto-Sync Watcher
echo Starting Git Auto-Push Watcher...
powershell -ExecutionPolicy Bypass -File "%~dp0auto_sync.ps1"
pause

