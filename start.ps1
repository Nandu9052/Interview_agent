# Interview Trainer - One-Command Start Script
# Serves BOTH frontend and backend from a single Flask server on port 5000

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       InterviewAI — IBM Granite 4 Powered        ║" -ForegroundColor Cyan
Write-Host "║          RAG-Powered Interview Trainer           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check API key
$configPath = "$PSScriptRoot\backend\config.env"
$configContent = Get-Content $configPath -Raw
if ($configContent -match "YOUR_NEW_API_KEY_HERE") {
    Write-Host "⚠  WARNING: API key not set in backend/config.env" -ForegroundColor Yellow
    Write-Host "   Please update WATSONX_API_KEY in backend/config.env" -ForegroundColor Yellow
    Write-Host ""
}

# Build frontend (if dist is outdated)
Write-Host "📦 Building frontend..." -ForegroundColor Green
Set-Location "$PSScriptRoot\frontend"
npm run build --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built" -ForegroundColor Green

# Start unified Flask server
Write-Host ""
Write-Host "🚀 Starting unified server on http://localhost:5000 ..." -ForegroundColor Green
Write-Host "   Frontend + API served from one process" -ForegroundColor White
Write-Host ""

Set-Location "$PSScriptRoot\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    Write-Host 'InterviewAI Server' -ForegroundColor Cyan
    Set-Location '$PSScriptRoot\backend'
    python app.py
" -WindowStyle Normal

Start-Sleep -Seconds 3
Write-Host "✅ Server started!" -ForegroundColor Green
Write-Host ""
Write-Host "  Open: http://localhost:5000" -ForegroundColor Cyan
Write-Host "  API:  http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to open in browser..."
$null = Read-Host
Start-Process "http://localhost:5000"
