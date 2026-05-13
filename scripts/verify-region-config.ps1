# PowerShell script to verify region configuration for us-east-1 migration
# Usage: .\scripts\verify-region-config.ps1

$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Region Configuration Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$TARGET_REGION = "us-east-1"
$OLD_REGION = "ap-southeast-1"

function Check-File {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$Description
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "X File not found: $FilePath" -ForegroundColor Red
        return $false
    }
    
    $content = Get-Content $FilePath -Raw
    if ($content -match $Pattern) {
        Write-Host "+ $Description : $FilePath" -ForegroundColor Green
        return $true
    } else {
        Write-Host "X $Description : $FilePath" -ForegroundColor Red
        return $false
    }
}

function Check-NoOldRegion {
    param(
        [string]$FilePath,
        [string]$Description
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "! File not found: $FilePath" -ForegroundColor Yellow
        return $true
    }
    
    $content = Get-Content $FilePath -Raw
    if ($content -match $OLD_REGION) {
        Write-Host "X Still contains $OLD_REGION : $FilePath" -ForegroundColor Red
        Select-String -Path $FilePath -Pattern $OLD_REGION | Select-Object -First 5 | ForEach-Object {
            Write-Host "  Line $($_.LineNumber): $($_.Line)" -ForegroundColor Yellow
        }
        return $false
    } else {
        Write-Host "+ No old region found: $FilePath" -ForegroundColor Green
        return $true
    }
}

Write-Host "1. Checking Terraform Configuration Files" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

Check-File "infra/terraform/environments/dev/01-network/terraform.tfvars" `
    "aws_region\s*=\s*`"$TARGET_REGION`"" `
    "Dev network tfvars"

Check-File "infra/terraform/environments/dev/01-network/variables.tf" `
    "default\s*=\s*`"$TARGET_REGION`"" `
    "Dev network variables"

Check-File "infra/terraform/environments/dev/02-app/terraform.tfvars" `
    "aws_region\s*=\s*`"$TARGET_REGION`"" `
    "Dev app tfvars"

Check-File "infra/terraform/environments/dev/02-app/variables.tf" `
    "default\s*=\s*`"$TARGET_REGION`"" `
    "Dev app variables"

Check-File "infra/terraform/environments/production/variables.tf" `
    "default\s*=\s*`"$TARGET_REGION`"" `
    "Production variables"

Write-Host ""
Write-Host "2. Checking GitHub Actions Workflows" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

Check-File ".github/workflows/deploy-dev-two-stack.yml" `
    "AWS_REGION:\s*$TARGET_REGION" `
    "Dev deployment workflow"

Check-File ".github/workflows/deploy.yml" `
    "AWS_REGION:\s*$TARGET_REGION" `
    "Production deployment workflow"

Write-Host ""
Write-Host "3. Checking Backend Configuration" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

Check-File "backend/.env.example" `
    "AWS_REGION=$TARGET_REGION" `
    "Backend .env.example"

Write-Host ""
Write-Host "4. Checking for Old Region References" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

Check-NoOldRegion "infra/terraform/environments/dev/01-network/terraform.tfvars" "Dev network tfvars"
Check-NoOldRegion "infra/terraform/environments/dev/02-app/terraform.tfvars" "Dev app tfvars"
Check-NoOldRegion ".github/workflows/deploy-dev-two-stack.yml" "Dev workflow"
Check-NoOldRegion ".github/workflows/deploy.yml" "Production workflow"

Write-Host ""
Write-Host "5. AWS CLI Configuration Check" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

if (Get-Command aws -ErrorAction SilentlyContinue) {
    try {
        $currentRegion = aws configure get region 2>$null
        if (-not $currentRegion) { $currentRegion = "not set" }
        
        Write-Host "Current AWS CLI region: $currentRegion"
        
        if ($currentRegion -eq $TARGET_REGION) {
            Write-Host "+ AWS CLI configured for $TARGET_REGION" -ForegroundColor Green
        } else {
            Write-Host "! AWS CLI region is $currentRegion, not $TARGET_REGION" -ForegroundColor Yellow
            Write-Host "  Run: aws configure set region $TARGET_REGION" -ForegroundColor Yellow
        }
        
        # Check credentials
        $identity = aws sts get-caller-identity --region $TARGET_REGION 2>$null | ConvertFrom-Json
        if ($identity) {
            Write-Host "+ AWS credentials valid for $TARGET_REGION" -ForegroundColor Green
            Write-Host "  Account ID: $($identity.Account)"
        } else {
            Write-Host "X Cannot authenticate to AWS in $TARGET_REGION" -ForegroundColor Red
            Write-Host "  Check your AWS credentials" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "X Error checking AWS CLI: $_" -ForegroundColor Red
    }
} else {
    Write-Host "! AWS CLI not installed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Target Region: $TARGET_REGION" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review any warnings or errors above"
Write-Host "2. Create missing AWS resources"
Write-Host "3. Deploy using GitHub Actions or manual Terraform"
Write-Host "4. See MIGRATION_US_EAST_1.md for detailed instructions"
Write-Host ""
