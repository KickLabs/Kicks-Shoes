#!/usr/bin/env pwsh
# Deploy Kicks Shoes Infrastructure to US-EAST-1
# Usage: .\deploy-us-east-1.ps1 [-Destroy] [-SkipNetwork] [-SkipApp]

param(
    [switch]$Destroy,
    [switch]$SkipNetwork,
    [switch]$SkipApp,
    [switch]$AutoApprove
)

$ErrorActionPreference = "Stop"
$Region = "us-east-1"
$ProjectName = "kicks-shoes-dev-tientp"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kicks Shoes - Deploy to US-EAST-1" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check AWS CLI
try {
    $awsVersion = aws --version
    Write-Host "✓ AWS CLI: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Check Terraform
try {
    $tfVersion = terraform version -json | ConvertFrom-Json
    Write-Host "✓ Terraform: $($tfVersion.terraform_version)" -ForegroundColor Green
} catch {
    Write-Host "✗ Terraform not found. Please install Terraform first." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
try {
    $identity = aws sts get-caller-identity --region $Region | ConvertFrom-Json
    Write-Host "✓ AWS Account: $($identity.Account)" -ForegroundColor Green
    Write-Host "✓ AWS User: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Function to run terraform
function Invoke-Terraform {
    param(
        [string]$Action,
        [string]$Layer,
        [string]$Path
    )
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "$Action $Layer Layer" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Push-Location $Path
    
    try {
        # Initialize
        Write-Host "Running terraform init..." -ForegroundColor Yellow
        terraform init
        if ($LASTEXITCODE -ne 0) {
            throw "Terraform init failed"
        }
        
        # Plan
        Write-Host "Running terraform plan..." -ForegroundColor Yellow
        if ($Action -eq "Destroy") {
            terraform plan -destroy
        } else {
            terraform plan
        }
        if ($LASTEXITCODE -ne 0) {
            throw "Terraform plan failed"
        }
        
        # Apply or Destroy
        if ($AutoApprove) {
            $confirm = "y"
        } else {
            Write-Host ""
            $confirm = Read-Host "Do you want to proceed? (y/n)"
        }
        
        if ($confirm -eq "y") {
            Write-Host "Running terraform $Action..." -ForegroundColor Yellow
            if ($Action -eq "Destroy") {
                terraform destroy -auto-approve
            } else {
                terraform apply -auto-approve
            }
            if ($LASTEXITCODE -ne 0) {
                throw "Terraform $Action failed"
            }
            Write-Host "✓ $Layer layer $Action completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "Skipped $Layer layer" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ Error in $Layer layer: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
    Write-Host ""
}

# Main deployment logic
$action = if ($Destroy) { "Destroy" } else { "Deploy" }

if ($Destroy) {
    Write-Host "WARNING: This will DESTROY all infrastructure in us-east-1!" -ForegroundColor Red
    Write-Host ""
    
    # Destroy in reverse order: App first, then Network
    if (-not $SkipApp) {
        Invoke-Terraform -Action "Destroy" -Layer "App (02-app)" -Path "infra/terraform/environments/dev/02-app"
    }
    
    if (-not $SkipNetwork) {
        Invoke-Terraform -Action "Destroy" -Layer "Network (01-network)" -Path "infra/terraform/environments/dev/01-network"
    }
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Destroy completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    # Deploy in order: Network first, then App
    if (-not $SkipNetwork) {
        Invoke-Terraform -Action "Apply" -Layer "Network (01-network)" -Path "infra/terraform/environments/dev/01-network"
    }
    
    if (-not $SkipApp) {
        # Check if ECR image exists
        Write-Host "Checking ECR image..." -ForegroundColor Yellow
        try {
            $images = aws ecr describe-images `
                --repository-name kicks-shoes-backend `
                --image-ids imageTag=dev-latest `
                --region $Region 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ ECR image found" -ForegroundColor Green
            } else {
                Write-Host "✗ ECR image not found. Please build and push the image first:" -ForegroundColor Red
                Write-Host "  cd backend" -ForegroundColor Yellow
                Write-Host "  aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin 318662970982.dkr.ecr.$Region.amazonaws.com" -ForegroundColor Yellow
                Write-Host "  docker build -t kicks-shoes-backend:dev-latest ." -ForegroundColor Yellow
                Write-Host "  docker tag kicks-shoes-backend:dev-latest 318662970982.dkr.ecr.$Region.amazonaws.com/kicks-shoes-backend:dev-latest" -ForegroundColor Yellow
                Write-Host "  docker push 318662970982.dkr.ecr.$Region.amazonaws.com/kicks-shoes-backend:dev-latest" -ForegroundColor Yellow
                Write-Host ""
                $continue = Read-Host "Continue anyway? (y/n)"
                if ($continue -ne "y") {
                    exit 1
                }
            }
        } catch {
            Write-Host "Warning: Could not check ECR image" -ForegroundColor Yellow
        }
        
        # Check if Secrets Manager secret exists
        Write-Host "Checking Secrets Manager..." -ForegroundColor Yellow
        try {
            $secret = aws secretsmanager describe-secret `
                --secret-id "$ProjectName/app-config" `
                --region $Region 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Secrets Manager secret found" -ForegroundColor Green
            } else {
                Write-Host "✗ Secrets Manager secret not found. Please create it first:" -ForegroundColor Red
                Write-Host "  aws secretsmanager create-secret --name $ProjectName/app-config --region $Region --secret-string '{...}'" -ForegroundColor Yellow
                Write-Host ""
                $continue = Read-Host "Continue anyway? (y/n)"
                if ($continue -ne "y") {
                    exit 1
                }
            }
        } catch {
            Write-Host "Warning: Could not check Secrets Manager" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Invoke-Terraform -Action "Apply" -Layer "App (02-app)" -Path "infra/terraform/environments/dev/02-app"
    }
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Show outputs
    if (-not $SkipApp) {
        Write-Host "Getting outputs..." -ForegroundColor Yellow
        Push-Location "infra/terraform/environments/dev/02-app"
        terraform output
        Pop-Location
        Write-Host ""
    }
    
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Check ECS service status:" -ForegroundColor White
    Write-Host "   aws ecs describe-services --cluster $ProjectName-cluster --services $ProjectName-service --region $Region" -ForegroundColor Gray
    Write-Host "2. Check logs:" -ForegroundColor White
    Write-Host "   aws logs tail /ecs/$ProjectName --follow --region $Region" -ForegroundColor Gray
    Write-Host "3. Test API health:" -ForegroundColor White
    Write-Host "   curl http://<alb-dns-name>/api/health" -ForegroundColor Gray
}
