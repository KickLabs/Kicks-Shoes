# ============================================================================
# Full AWS Deployment Script (Infrastructure + Application)
# ============================================================================
# This script performs complete deployment:
# 1. Deploy WAF (us-east-1)
# 2. Deploy Frontend Stack (S3 + CloudFront)
# 3. Build and deploy application
# ============================================================================

param(
    [string]$ProjectName = "kicks-shoes",
    [string]$Region = "ap-southeast-1",
    [string]$Environment = "production",
    [switch]$SkipInfrastructure = $false,
    [switch]$SkipWAF = $false
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  🚀 Full AWS Deployment" -ForegroundColor Green
Write-Host "  Project: $ProjectName" -ForegroundColor Green
Write-Host "  Region: $Region" -ForegroundColor Green
Write-Host "  Environment: $Environment" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Phase 1: Deploy Infrastructure (if not skipped)
# ============================================================================
if (-not $SkipInfrastructure) {
    Write-Info "Phase 1: Deploying Infrastructure..."
    Write-Host ""
    
    $infraParams = @{
        ProjectName = $ProjectName
        Region = $Region
    }
    
    if ($SkipWAF) {
        $infraParams.SkipWAF = $true
    }
    
    & .\deploy-infrastructure.ps1 @infraParams
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Infrastructure deployment failed"
        exit 1
    }
    
    Write-Host ""
    Write-Success "✅ Phase 1 Complete: Infrastructure deployed"
    Write-Host ""
    Write-Warning "⏳ Waiting 30 seconds for CloudFront to stabilize..."
    Start-Sleep -Seconds 30
} else {
    Write-Warning "Phase 1: Skipping infrastructure deployment (--SkipInfrastructure flag set)"
}

# ============================================================================
# Phase 2: Deploy Application
# ============================================================================
Write-Host ""
Write-Info "Phase 2: Deploying Application..."
Write-Host ""

# Check if .env.production exists
if (-not (Test-Path ".env.$Environment")) {
    Write-Error "❌ .env.$Environment not found"
    Write-Error "   Run infrastructure deployment first or create the file manually"
    exit 1
}

# Run application deployment
& .\deploy-aws.ps1 $Environment

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Application deployment failed"
    exit 1
}

Write-Host ""
Write-Success "✅ Phase 2 Complete: Application deployed"

# ============================================================================
# Final Summary
# ============================================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  🎉 Full Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Get CloudFront URL from .env.production
$CloudFrontDomain = ""
if (Test-Path ".env.$Environment") {
    Get-Content ".env.$Environment" | ForEach-Object {
        if ($_ -match '^AWS_CLOUDFRONT_DOMAIN=(.*)$') {
            $CloudFrontDomain = $matches[1].Trim()
        }
    }
}

if ($CloudFrontDomain) {
    Write-Info "🌐 Your application is available at:"
    Write-Host "   https://$CloudFrontDomain" -ForegroundColor White
    Write-Host ""
    Write-Warning "⏳ Note: CloudFront cache invalidation may take 2-5 minutes"
}

Write-Host ""
Write-Info "Deployment Summary:"
Write-Host "  ✅ Infrastructure: Deployed" -ForegroundColor White
Write-Host "  ✅ Application: Built and uploaded" -ForegroundColor White
Write-Host "  ✅ CloudFront: Cache invalidated" -ForegroundColor White
Write-Host ""
Write-Success "✅ All done!"
Write-Host ""
