# Complete Deployment Script for Kicks Shoes
Write-Host "Starting complete deployment..." -ForegroundColor Green

# 1. Deploy Backend to Heroku
Write-Host "Step 1: Deploying Backend to Heroku..." -ForegroundColor Yellow
git push heroku kicks-develop-clean:main

# 2. Deploy Frontend to Firebase
Write-Host "Step 2: Deploying Frontend to Firebase..." -ForegroundColor Yellow

# Set environment variable
$env:VITE_API_BASE_URL = "https://kicks-shoes-backend-2025-509fffbae16a.herokuapp.com/api"

# Navigate to frontend directory
Set-Location frontend

# Install dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
npm install

# Build the project
Write-Host "Building frontend project..." -ForegroundColor Cyan
npm run build

# Deploy to Firebase
Write-Host "Deploying to Firebase..." -ForegroundColor Cyan
firebase deploy --only hosting

# Return to root directory
Set-Location ..

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Backend URL: https://kicks-shoes-backend-2025-509fffbae16a.herokuapp.com" -ForegroundColor Cyan
Write-Host "Frontend URL: https://kicks-shoes-2025.web.app" -ForegroundColor Cyan 