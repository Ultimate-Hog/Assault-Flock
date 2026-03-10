# Usage:
#   .\deploy.ps1                  - commits with default message "update demo"
#   .\deploy.ps1 "your message"   - commits with a custom message
#
# Run from the repo root: d:\gitz\big hog games

param(
    [string]$CommitMessage = "update demo"
)

$ErrorActionPreference = "Stop"

Write-Host "Syncing docs from demo..." -ForegroundColor Cyan
Copy-Item "shoot\Assault Flock\demo\index.html" docs\index.html -Force
Copy-Item "shoot\Assault Flock\demo\style.css"  docs\style.css  -Force
Copy-Item "shoot\Assault Flock\demo\game.js"    docs\game.js    -Force
Write-Host "Sync complete." -ForegroundColor Green

git add .
git commit -m $CommitMessage
git push
