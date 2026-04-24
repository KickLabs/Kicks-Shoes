# Script to redeploy backend to AWS ECS (v2 - Fixed Tagging)
$AWS_ACCOUNT_ID = "438465144712"
$REGION = "us-west-2"
$ECR_REPO = "kicks-shoes-backend"
$ECS_CLUSTER = "kicks-shoes-dev-cluster"
$ECS_SERVICE = "kicks-shoes-dev-service"
$IMAGE_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:latest"

Write-Host "`n🚀 Starting Redeploy Backend to AWS..." -ForegroundColor Cyan
Write-Host "-------------------------------------------"

# 1. Login to ECR
Write-Host "1. Logging in to AWS ECR..." -ForegroundColor Yellow
$loginPassword = aws ecr get-login-password --region $REGION
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed to get ECR password" -ForegroundColor Red; return }
$loginPassword | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ ECR Login Failed" -ForegroundColor Red; return }

# 2. Build Docker Image
Write-Host "2. Building Docker Image (Backend)..." -ForegroundColor Yellow
docker build -t "${ECR_REPO}:latest" ./backend
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Docker Build Failed" -ForegroundColor Red; return }

# 3. Tag and Push
Write-Host "3. Tagging and Pushing Image to ECR..." -ForegroundColor Yellow
docker tag "${ECR_REPO}:latest" "${IMAGE_URI}"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Docker Tag Failed" -ForegroundColor Red; return }

docker push "${IMAGE_URI}"
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Docker Push Failed" -ForegroundColor Red; return }

# 4. Force ECS Update
Write-Host "4. Forcing ECS Service Update (Restarter Server)..." -ForegroundColor Yellow
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $REGION
if ($LASTEXITCODE -ne 0) { Write-Host "❌ ECS Update Failed" -ForegroundColor Red; return }

Write-Host "-------------------------------------------"
Write-Host "✅ Redeploy triggered successfully!" -ForegroundColor Green
Write-Host "Server will be ready in ~2-3 minutes." -ForegroundColor Gray
