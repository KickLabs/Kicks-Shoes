# ============================================================================
# AWS CloudFormation Infrastructure Deployment Script
# ============================================================================
# This script deploys:
# 1. WAF Web ACL (us-east-1) - for CloudFront protection
# 2. Frontend Stack (S3 + CloudFront + Logging)
# 3. Updates .env.production with stack outputs
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectName = "kicks-shoes",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-southeast-1",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipWAF = $false
)

$ErrorActionPreference = "Stop"

# Validate parameters
if ([string]::IsNullOrWhiteSpace($ProjectName) -or $ProjectName -like "-*") {
    Write-Host "ERROR: Invalid ProjectName parameter: '$ProjectName'" -ForegroundColor Red
    Write-Host "Usage: .\deploy-infrastructure.ps1 -ProjectName 'kicks-shoes' -Region 'ap-southeast-1'" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrWhiteSpace($Region) -or $Region -like "-*") {
    Write-Host "ERROR: Invalid Region parameter: '$Region'" -ForegroundColor Red
    Write-Host "Usage: .\deploy-infrastructure.ps1 -ProjectName 'kicks-shoes' -Region 'ap-southeast-1'" -ForegroundColor Yellow
    exit 1
}

# Colors for output
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  AWS Infrastructure Deployment" -ForegroundColor Green
Write-Host "  Project: $ProjectName" -ForegroundColor Green
Write-Host "  Region: $Region" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Debug: Show actual parameter values
Write-Host "DEBUG: ProjectName = '$ProjectName'" -ForegroundColor Yellow
Write-Host "DEBUG: Region = '$Region'" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# Step 1: Verify AWS Credentials
# ============================================================================
Write-Info "Step 1: Verifying AWS credentials..."
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Success "✅ AWS credentials verified"
    Write-Info "   Account: $($identity.Account)"
    Write-Info "   User: $($identity.Arn)"
} catch {
    Write-Error "❌ AWS credentials not configured or invalid"
    Write-Error "   Run: aws configure"
    exit 1
}

# ============================================================================
# Step 2: Deploy WAF Stack (us-east-1)
# ============================================================================
$WAF_ARN = ""

if (-not $SkipWAF) {
    Write-Host ""
    Write-Info "Step 2: Deploying WAF Stack (us-east-1)..."
    Write-Warning "   This may take 2-3 minutes..."
    
    try {
        $wafStackName = "${ProjectName}-waf"
        Write-Host "DEBUG: WAF Stack Name = '$wafStackName'" -ForegroundColor Yellow
        
        # Use array form to avoid parameter parsing issues
        $deployArgs = @(
            "cloudformation", "deploy",
            "--template-file", "cloudformation-waf.yaml",
            "--stack-name", $wafStackName,
            "--region", "us-east-1",
            "--capabilities", "CAPABILITY_NAMED_IAM",
            "--no-fail-on-empty-changeset"
        )
        
        & aws $deployArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✅ WAF stack deployed successfully"
        } else {
            throw "WAF deployment failed"
        }
        
        # Get WAF ARN
        $WAF_ARN = aws cloudformation describe-stacks `
            --stack-name $wafStackName `
            --region us-east-1 `
            --query 'Stacks[0].Outputs[?OutputKey==`WAFWebACLArn`].OutputValue' `
            --output text
        
        Write-Info "   WAF ARN: $WAF_ARN"
        
    } catch {
        Write-Error "❌ Failed to deploy WAF stack"
        Write-Error "   Error: $_"
        exit 1
    }
} else {
    Write-Warning "Step 2: Skipping WAF deployment (--SkipWAF flag set)"
    
    # Try to get existing WAF ARN
    try {
        $wafStackName = "$ProjectName-waf"
        $WAF_ARN = aws cloudformation describe-stacks `
            --stack-name $wafStackName `
            --region us-east-1 `
            --query 'Stacks[0].Outputs[?OutputKey==`WAFWebACLArn`].OutputValue' `
            --output text 2>$null
        
        if ($WAF_ARN) {
            Write-Info "   Using existing WAF ARN: $WAF_ARN"
        }
    } catch {
        Write-Warning "   No existing WAF found. Proceeding without WAF."
    }
}

# ============================================================================
# Step 3: Deploy Frontend Stack (S3 + CloudFront)
# ============================================================================
Write-Host ""
Write-Info "Step 3: Deploying Frontend Stack (S3 + CloudFront)..."
Write-Warning "   This may take 5-10 minutes (CloudFront distribution creation)..."

try {
    $frontendStackName = "${ProjectName}-frontend"
    Write-Host "DEBUG: Frontend Stack Name = '$frontendStackName'" -ForegroundColor Yellow
    
    if ($WAF_ARN) {
        $deployArgs = @(
            "cloudformation", "deploy",
            "--template-file", "cloudformation-main.yaml",
            "--stack-name", $frontendStackName,
            "--region", $Region,
            "--parameter-overrides", "ProjectName=$ProjectName", "WAFWebACLArn=$WAF_ARN",
            "--capabilities", "CAPABILITY_NAMED_IAM",
            "--no-fail-on-empty-changeset"
        )
    } else {
        $deployArgs = @(
            "cloudformation", "deploy",
            "--template-file", "cloudformation-main.yaml",
            "--stack-name", $frontendStackName,
            "--region", $Region,
            "--parameter-overrides", "ProjectName=$ProjectName",
            "--capabilities", "CAPABILITY_NAMED_IAM",
            "--no-fail-on-empty-changeset"
        )
    }
    
    & aws $deployArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ Frontend stack deployed successfully"
    } else {
        throw "Frontend stack deployment failed"
    }
    
} catch {
    Write-Error "❌ Failed to deploy frontend stack"
    Write-Error "   Error: $_"
    exit 1
}

# ============================================================================
# Step 4: Get Stack Outputs
# ============================================================================
Write-Host ""
Write-Info "Step 4: Retrieving stack outputs..."

try {
    $frontendStackName = "${ProjectName}-frontend"
    
    $S3_BUCKET = aws cloudformation describe-stacks `
        --stack-name $frontendStackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' `
        --output text
    
    $CF_DIST_ID = aws cloudformation describe-stacks `
        --stack-name $frontendStackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' `
        --output text
    
    $CF_DOMAIN = aws cloudformation describe-stacks `
        --stack-name $frontendStackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' `
        --output text
    
    $CF_URL = aws cloudformation describe-stacks `
        --stack-name $frontendStackName `
        --region $Region `
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' `
        --output text
    
    Write-Success "✅ Stack outputs retrieved"
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Stack Outputs:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Info "  S3 Bucket:              $S3_BUCKET"
    Write-Info "  CloudFront Dist ID:     $CF_DIST_ID"
    Write-Info "  CloudFront Domain:      $CF_DOMAIN"
    Write-Info "  CloudFront URL:         $CF_URL"
    Write-Host "========================================" -ForegroundColor Cyan
    
} catch {
    Write-Error "❌ Failed to retrieve stack outputs"
    Write-Error "   Error: $_"
    exit 1
}

# ============================================================================
# Step 5: Update .env.production
# ============================================================================
Write-Host ""
Write-Info "Step 5: Updating .env.production..."

# Read existing .env.production if exists
$existingEnv = @{}
if (Test-Path ".env.production") {
    Get-Content ".env.production" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $existingEnv[$matches[1].Trim()] = $matches[2].Trim()
        }
    }
}

# Update AWS-specific variables
$existingEnv["AWS_REGION"] = $Region
$existingEnv["AWS_S3_BUCKET"] = $S3_BUCKET
$existingEnv["AWS_CLOUDFRONT_DISTRIBUTION_ID"] = $CF_DIST_ID
$existingEnv["AWS_CLOUDFRONT_DOMAIN"] = $CF_DOMAIN
$existingEnv["AWS_ENABLE_BACKUP"] = "false"

# Build .env.production content
$envContent = @"
# ============================================================================
# AWS Deployment Configuration
# ============================================================================
# Auto-generated by deploy-infrastructure.ps1
# Last updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================================

AWS_REGION=$($existingEnv["AWS_REGION"])
AWS_S3_BUCKET=$($existingEnv["AWS_S3_BUCKET"])
AWS_CLOUDFRONT_DISTRIBUTION_ID=$($existingEnv["AWS_CLOUDFRONT_DISTRIBUTION_ID"])
AWS_CLOUDFRONT_DOMAIN=$($existingEnv["AWS_CLOUDFRONT_DOMAIN"])
AWS_ENABLE_BACKUP=$($existingEnv["AWS_ENABLE_BACKUP"])

# ============================================================================
# Application Configuration
# ============================================================================
# Update these values according to your environment
# ============================================================================

"@

# Add other existing variables
$awsKeys = @("AWS_REGION", "AWS_S3_BUCKET", "AWS_CLOUDFRONT_DISTRIBUTION_ID", "AWS_CLOUDFRONT_DOMAIN", "AWS_ENABLE_BACKUP")
foreach ($key in $existingEnv.Keys | Sort-Object) {
    if ($key -notin $awsKeys) {
        $envContent += "$key=$($existingEnv[$key])`n"
    }
}

# Write to file
$envContent | Out-File -FilePath ".env.production" -Encoding UTF8 -NoNewline

Write-Success "✅ .env.production updated"

# ============================================================================
# Step 6: Display Summary
# ============================================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  🎉 Infrastructure Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Info "Next Steps:"
Write-Host "  1. Review .env.production and add your application variables" -ForegroundColor White
Write-Host "  2. Run: .\deploy-aws.ps1 production" -ForegroundColor White
Write-Host "  3. Access your app at: $CF_URL" -ForegroundColor White
Write-Host ""
Write-Info "Useful Commands:"
Write-Host "  # View CloudFormation stacks:" -ForegroundColor White
Write-Host "  aws cloudformation describe-stacks --stack-name ${ProjectName}-frontend --region $Region" -ForegroundColor Gray
Write-Host ""
Write-Host "  # View S3 bucket contents:" -ForegroundColor White
Write-Host "  aws s3 ls s3://$S3_BUCKET" -ForegroundColor Gray
Write-Host ""
Write-Host "  # View CloudFront distribution:" -ForegroundColor White
Write-Host "  aws cloudfront get-distribution --id $CF_DIST_ID" -ForegroundColor Gray
Write-Host ""
Write-Success "✅ All done!"
Write-Host ""
