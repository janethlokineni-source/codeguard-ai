# ========================================================
# CODEGUARD AI - Automatic Git Auto-Push Watcher
# Automatically commits and pushes whenever files change.
# ========================================================

param(
    [string]$Branch = "main",
    [int]$DebounceSeconds = 5
)

$repoRoot = $PSScriptRoot
Set-Location $repoRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       CODEGUARD AI - AUTOMATIC GIT SYNC ACTIVE        " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Repository: $repoRoot" -ForegroundColor Gray
Write-Host "Target:     origin/$Branch" -ForegroundColor Gray
Write-Host "Debounce:   $DebounceSeconds seconds" -ForegroundColor Gray
Write-Host "Watching for file modifications... (Press Ctrl+C to stop)" -ForegroundColor Yellow
Write-Host ""

# Ignored paths pattern
$ignoredPattern = "(\.git|node_modules|\.next|__pycache__|\.turbo|\.log$)"

# Setup FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repoRoot
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::LastWrite

$script:lastChangeTime = [DateTime]::MinValue
$script:isSyncing = $false

$action = {
    param($source, $eventArgs)
    $path = $eventArgs.FullPath
    if ($path -match $ignoredPattern) {
        return
    }
    $script:lastChangeTime = [DateTime]::Now
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null

while ($true) {
    Start-Sleep -Seconds 1
    
    if ($script:lastChangeTime -ne [DateTime]::MinValue -and -not $script:isSyncing) {
        $elapsed = ([DateTime]::Now - $script:lastChangeTime).TotalSeconds
        if ($elapsed -ge $DebounceSeconds) {
            $script:isSyncing = $true
            $script:lastChangeTime = [DateTime]::MinValue
            
            $status = git status --porcelain
            if ($status) {
                $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Write-Host "[$timestamp] Detected changes, preparing auto-push..." -ForegroundColor Cyan
                
                git add .
                git commit -m "auto: sync changes $timestamp" | Out-Null
                
                Write-Host "[$timestamp] Pushing to origin/$Branch..." -ForegroundColor Yellow
                $pushOutput = git push origin $Branch 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[$timestamp] Successfully pushed to GitHub!" -ForegroundColor Green
                } else {
                    Write-Host "[$timestamp] Push warning: $pushOutput" -ForegroundColor Red
                }
            }
            $script:isSyncing = $false
        }
    }
}
