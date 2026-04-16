# AWS S3 + CloudFront Deployment Script for PowerShell
# Usage: .\deploy-aws.ps1 [environment]

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  AWS S3 + CloudFront Deployment" -ForegroundColor Green
Write-Host "  Environment: $Environment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Load environment variables
$EnvFile = ".env.$Environment"
if (Test-Path $EnvFile) {
    Write-Host "Loading $EnvFile" -ForegroundColor Yellow
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "Error: $EnvFile not found" -ForegroundColor Red
    exit 1
}

# Check required environment variables
$S3Bucket = $env:AWS_S3_BUCKET
$CloudFrontDistId = $env:AWS_CLOUDFRONT_DISTRIBUTION_ID
$CloudFrontDomain = $env:AWS_CLOUDFRONT_DOMAIN

if (-not $S3Bucket) {
    Write-Host "Error: AWS_S3_BUCKET not set" -ForegroundColor Red
    exit 1
}

if (-not $CloudFrontDistId) {
    Write-Host "Warning: AWS_CLOUDFRONT_DISTRIBUTION_ID not set. CloudFront invalidation will be skipped." -ForegroundColor Yellow
}

# Build the application
Write-Host "Building application..." -ForegroundColor Yellow
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "Error: dist directory not found" -ForegroundColor Red
    exit 1
}

# Backup current deployment (optional)
if ($env:AWS_ENABLE_BACKUP -eq "true") {
    Write-Host "Creating backup..." -ForegroundColor Yellow
    aws s3 sync "s3://$S3Bucket" "s3://$S3Bucket-backup-$Timestamp" --delete
}

# Upload to S3
Write-Host "Uploading to S3: $S3Bucket" -ForegroundColor Yellow

# Upload HTML files with no-cache
aws s3 sync dist/ "s3://$S3Bucket" `
    --exclude "*" `
    --include "*.html" `
    --cache-control "no-cache, no-store, must-revalidate" `
    --metadata-directive REPLACE `
    --delete

# Upload CSS and JS with cache
aws s3 sync dist/ "s3://$S3Bucket" `
    --exclude "*.html" `
    --cache-control "public, max-age=31536000, immutable" `
    --metadata-directive REPLACE `
    --delete

Write-Host "Upload completed!" -ForegroundColor Green

# Invalidate CloudFront cache
if ($CloudFrontDistId) {
    Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
    aws cloudfront create-invalidation `
        --distribution-id $CloudFrontDistId `
        --paths "/*"
    Write-Host "CloudFront invalidation created!" -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

if ($CloudFrontDomain) {
    Write-Host "Your app is available at: https://$CloudFrontDomain" -ForegroundColor Green
}
