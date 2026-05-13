# =============================================================================
# deploy-dev.ps1 — Manual deploy script for dev environment (Windows/PowerShell)
# Usage: .\scripts\deploy-dev.ps1 [-SkipBuild] [-SkipNetwork] [-PlanOnly]
#
# Prerequisites:
#   - AWS CLI configured
#   - Terraform >= 1.5.0
#   - Docker Desktop running
# =============================================================================
param(
    [switch]$SkipBuild,
    [switch]$SkipNetwork,
    [switch]$PlanOnly
)

$ErrorActionPreference = "Stop"

# ── Config ────────────────────────────────────────────────────────────────────
$AWS_REGION       = $env:AWS_REGION       ?? "ap-southeast-1"
$TF_STATE_BUCKET  = $env:TF_STATE_BUCKET  ?? "kicks-shoes-tf-state"
$ECR_REPOSITORY   = $env:ECR_REPOSITORY   ?? "kicks-shoes-backend"
$TF_NETWORK_DIR   = "infra/terraform/environments/dev/01-network"
$TF_APP_DIR       = "infra/terraform/environments/dev/02-app"
$AUTHORIZER_DIR   = "backend/lambda/jwt-authorizer"

function Write-Info    { param($msg) Write-Host "[INFO] $msg"    -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK]   $msg"    -ForegroundColor Green }
function Write-Warn    { param($msg) Write-Host "[WARN] $msg"    -ForegroundColor Yellow }
function Write-Err     { param($msg) Write-Host "[ERROR] $msg"   -ForegroundColor Red; exit 1 }

# ── Preflight ─────────────────────────────────────────────────────────────────
Write-Info "Checking prerequisites..."
if (-not (Get-Command aws -ErrorAction SilentlyContinue))       { Write-Err "aws CLI not found" }
if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) { Write-Err "terraform not found" }
if (-not (Get-Command docker -ErrorAction SilentlyContinue))    { Write-Err "docker not found" }

$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
Write-Success "AWS Account: $ACCOUNT_ID | Region: $AWS_REGION"

# ── Terraform state bucket ────────────────────────────────────────────────────
Write-Info "Ensuring Terraform state bucket: $TF_STATE_BUCKET"
$bucketExists = aws s3api head-bucket --bucket $TF_STATE_BUCKET 2>&1
if ($LASTEXITCODE -ne 0) {
    aws s3api create-bucket `
        --bucket $TF_STATE_BUCKET `
        --region $AWS_REGION `
        --create-bucket-configuration LocationConstraint=$AWS_REGION
    aws s3api put-bucket-versioning `
        --bucket $TF_STATE_BUCKET `
        --versioning-configuration Status=Enabled
    Write-Success "State bucket created"
} else {
    Write-Success "State bucket exists"
}

# ── Build JWT Authorizer ──────────────────────────────────────────────────────
if (Test-Path "$AUTHORIZER_DIR/package.json") {
    Write-Info "Building JWT Authorizer Lambda..."
    Push-Location $AUTHORIZER_DIR
    npm install --omit=dev
    if (Test-Path "authorizer.zip") { Remove-Item "authorizer.zip" -Force }
    Compress-Archive -Path "index.js","node_modules" -DestinationPath "authorizer.zip"
    Pop-Location
    Write-Success "authorizer.zip built"
}

# ── Build & push Docker image ─────────────────────────────────────────────────
$ECR_REGISTRY = "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
$IMAGE_URI = ""

if (-not $SkipBuild) {
    Write-Info "Ensuring ECR repository: $ECR_REPOSITORY"
    aws ecr describe-repositories --repository-names $ECR_REPOSITORY 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        aws ecr create-repository --repository-name $ECR_REPOSITORY | Out-Null
    }

    aws ecr get-login-password --region $AWS_REGION | `
        docker login --username AWS --password-stdin $ECR_REGISTRY

    $COMMIT_SHA = (git rev-parse --short HEAD 2>&1)
    if ($LASTEXITCODE -ne 0) { $COMMIT_SHA = "local" }
    $IMAGE_URI = "$ECR_REGISTRY/${ECR_REPOSITORY}:dev-$COMMIT_SHA"
    $IMAGE_LATEST = "$ECR_REGISTRY/${ECR_REPOSITORY}:dev-latest"

    Write-Info "Building Docker image: $IMAGE_URI"
    docker build -f backend/Dockerfile -t $IMAGE_URI -t $IMAGE_LATEST ./backend
    docker push $IMAGE_URI
    docker push $IMAGE_LATEST
    Write-Success "Image pushed: $IMAGE_URI"
} else {
    $IMAGE_URI = "$ECR_REGISTRY/${ECR_REPOSITORY}:dev-latest"
    Write-Warn "Skipping build — using: $IMAGE_URI"
}

# ── Helper: terraform init ────────────────────────────────────────────────────
function Invoke-TfInit {
    param($Dir, $Key)
    terraform -chdir=$Dir init -reconfigure `
        -backend-config="bucket=$TF_STATE_BUCKET" `
        -backend-config="key=$Key" `
        -backend-config="region=$AWS_REGION" `
        -backend-config="encrypt=true"
}

# ── 01-network ────────────────────────────────────────────────────────────────
if (-not $SkipNetwork) {
    Write-Info "=== Deploying 01-network ==="
    Invoke-TfInit $TF_NETWORK_DIR "dev/01-network/terraform.tfstate"

    if ($PlanOnly) {
        terraform -chdir=$TF_NETWORK_DIR plan -var-file="terraform.tfvars"
        Write-Info "Plan only — stopping after 01-network plan."
        exit 0
    }

    terraform -chdir=$TF_NETWORK_DIR apply -auto-approve -var-file="terraform.tfvars"
    Write-Success "01-network deployed"
} else {
    Write-Warn "Skipping 01-network"
}

# ── 02-app ────────────────────────────────────────────────────────────────────
Write-Info "=== Deploying 02-app ==="
Invoke-TfInit $TF_APP_DIR "dev/02-app/terraform.tfstate"

if ($PlanOnly) {
    terraform -chdir=$TF_APP_DIR plan `
        -var="container_image=$IMAGE_URI" `
        -var-file="terraform.tfvars"
    Write-Info "Plan only — done."
    exit 0
}

terraform -chdir=$TF_APP_DIR apply -auto-approve `
    -var="container_image=$IMAGE_URI" `
    -var-file="terraform.tfvars"

Write-Success "02-app deployed"

# ── Outputs ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== W5 Deployment Complete ===" -ForegroundColor Green
terraform -chdir=$TF_APP_DIR output

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Copy api_gateway_invoke_url → set VITE_BEDROCK_API_URL in frontend/.env"
Write-Host "  2. Test health: curl http://`$(terraform -chdir=$TF_APP_DIR output -raw alb_dns_name)/api/health"
Write-Host "  3. Test EFS:    curl -X POST http://<alb>/api/efs/write -d '{`"filename`":`"w5-test.txt`"}'"
