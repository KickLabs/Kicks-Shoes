Write-Host "Installing AWS SDK dependencies..." -ForegroundColor Green

npm install @aws-sdk/client-s3@^3.1031.0 `
  @aws-sdk/lib-storage@^3.1031.0 `
  @aws-sdk/s3-request-presigner@^3.1031.0

Write-Host ""
Write-Host "AWS dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy backend/.env.example to backend/.env"
Write-Host "2. Configure AWS credentials in .env"
Write-Host "3. Set UPLOAD_STRATEGY=s3 to use S3"
Write-Host "4. Run: npm start"
