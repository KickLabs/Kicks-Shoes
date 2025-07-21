# Frontend Deployment Script for Firebase
Write-Host "Deploying Frontend to Firebase..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location frontend

# Install dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

# Build the project
Write-Host "Building frontend project..." -ForegroundColor Yellow
npm run build

# Deploy to Firebase
Write-Host "Deploying to Firebase..." -ForegroundColor Yellow
firebase deploy --only hosting

# Return to root directory
Set-Location ..

Write-Host "Frontend deployment completed!" -ForegroundColor Green 