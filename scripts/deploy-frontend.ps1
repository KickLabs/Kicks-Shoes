# Frontend Deployment Script for Firebase
Write-Host "Deploying Frontend to Firebase..." -ForegroundColor Green

# Get the script directory and navigate to project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $ProjectRoot "frontend"

Write-Host "Project Root: $ProjectRoot" -ForegroundColor Cyan
Write-Host "Frontend Directory: $FrontendDir" -ForegroundColor Cyan

# Check if frontend directory exists
if (-not (Test-Path $FrontendDir)) {
    Write-Host "Error: Frontend directory not found at $FrontendDir" -ForegroundColor Red
    exit 1
}

# Navigate to frontend directory
Set-Location $FrontendDir

# Install dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

# Set environment variables for production build
Write-Host "Setting production environment variables..." -ForegroundColor Cyan
$env:VITE_API_BASE_URL = "https://kicks-shoes-backend.azurewebsites.net/api"
$env:VITE_SOCKET_URL = "https://kicks-shoes-backend.azurewebsites.net"

# Optional: Set TURN server credentials if available
# Uncomment and fill in your TURN server details:
# $env:VITE_TURN_URL = "turn:your-turn-server.com:3478?transport=udp,turn:your-turn-server.com:3478?transport=tcp"
# $env:VITE_TURN_USERNAME = "your_turn_username"
# $env:VITE_TURN_CREDENTIAL = "your_turn_password"

# For debugging cross-network issues, set this to 1
# $env:VITE_WEBRTC_FORCE_TURN = "1"

# Build the project
Write-Host "Building frontend project..." -ForegroundColor Yellow
npm run build

# Navigate back to project root for Firebase deploy
Set-Location $ProjectRoot

# Deploy to Firebase
Write-Host "Deploying to Firebase..." -ForegroundColor Yellow
firebase deploy --only hosting

Write-Host "Frontend deployment completed!" -ForegroundColor Green 