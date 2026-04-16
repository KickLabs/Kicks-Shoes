param(
  [Parameter(Mandatory = $true)]
  [string]$AwsAccountId,

  [string]$AwsRegion = "ap-southeast-1",
  [string]$AwsProfile = "default",
  [string]$EcrRepository = "kicks-shoes-backend",
  [string]$BaseTag = "latest",
  [string]$NewTag = "demo-$(Get-Date -Format yyyyMMdd-HHmmss)",
  [string]$TerraformEnvPath = "infra/terraform/environments/demo",
  [string]$NamePrefix = "kicks-fargate-demo",
  [string]$ContainerName = "kicks-backend",
  [string]$ContainerPort = "3000"
)

$ErrorActionPreference = "Stop"

function Invoke-Strict {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter()][string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $Command $($Arguments -join ' ')"
  }
}

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$EcrRegistry = "$AwsAccountId.dkr.ecr.$AwsRegion.amazonaws.com"
$BaseImage = "$EcrRegistry/$EcrRepository:$BaseTag"
$NewImage = "$EcrRegistry/$EcrRepository:$NewTag"

Write-Host "[1/9] Validate prerequisites"
Invoke-Strict -Command "aws" -Arguments @("--profile", $AwsProfile, "sts", "get-caller-identity")
Invoke-Strict -Command "docker" -Arguments @("version")
Invoke-Strict -Command "terraform" -Arguments @("version")

Write-Host "[2/9] Ensure ECR repository exists"
aws --profile $AwsProfile ecr describe-repositories --repository-names $EcrRepository --region $AwsRegion | Out-Null
if ($LASTEXITCODE -ne 0) {
  Invoke-Strict -Command "aws" -Arguments @("--profile", $AwsProfile, "ecr", "create-repository", "--repository-name", $EcrRepository, "--region", $AwsRegion)
}

Write-Host "[3/9] Login to ECR"
$LoginPassword = aws --profile $AwsProfile ecr get-login-password --region $AwsRegion
if ($LASTEXITCODE -ne 0) {
  throw "Failed to fetch ECR login password."
}
$LoginPassword | docker login --username AWS --password-stdin $EcrRegistry
if ($LASTEXITCODE -ne 0) {
  throw "Docker login to ECR failed."
}

Write-Host "[4/9] Pull previous developer image"
Invoke-Strict -Command "docker" -Arguments @("pull", $BaseImage)

Write-Host "[5/9] Build new image from current backend source"
Invoke-Strict -Command "docker" -Arguments @("build", "-f", (Join-Path $RepoRoot "backend/Dockerfile"), "-t", $NewImage, (Join-Path $RepoRoot "backend"))

Write-Host "[6/9] Push new image to ECR"
Invoke-Strict -Command "docker" -Arguments @("push", $NewImage)

$NewDigest = aws --profile $AwsProfile ecr describe-images --repository-name $EcrRepository --image-ids imageTag=$NewTag --region $AwsRegion --query "imageDetails[0].imageDigest" --output text
if ($LASTEXITCODE -ne 0) {
  throw "Failed to read pushed digest from ECR."
}
Write-Host "New image digest: $NewDigest"

Write-Host "[7/9] Terraform init/plan/apply"
Push-Location (Join-Path $RepoRoot $TerraformEnvPath)
Invoke-Strict -Command "terraform" -Arguments @("init", "-upgrade")
Invoke-Strict -Command "terraform" -Arguments @("plan", "-out", "tfplan", "-var", "aws_region=$AwsRegion", "-var", "name_prefix=$NamePrefix", "-var", "container_name=$ContainerName", "-var", "container_port=$ContainerPort", "-var", "container_image=$NewImage")
Invoke-Strict -Command "terraform" -Arguments @("apply", "-auto-approve", "tfplan")

$AlbDns = terraform output -raw alb_dns_name
$ClusterName = terraform output -raw ecs_cluster_name
$ServiceName = terraform output -raw ecs_service_name
Pop-Location

Write-Host "[8/9] Force new ECS deployment and wait stable"
Invoke-Strict -Command "aws" -Arguments @("--profile", $AwsProfile, "ecs", "update-service", "--cluster", $ClusterName, "--service", $ServiceName, "--force-new-deployment", "--region", $AwsRegion)
Invoke-Strict -Command "aws" -Arguments @("--profile", $AwsProfile, "ecs", "wait", "services-stable", "--cluster", $ClusterName, "--services", $ServiceName, "--region", $AwsRegion)

Write-Host "[9/9] Verify deployment"
Invoke-Strict -Command "aws" -Arguments @("--profile", $AwsProfile, "ecs", "describe-services", "--cluster", $ClusterName, "--services", $ServiceName, "--region", $AwsRegion, "--query", "services[0].{desired:desiredCount,running:runningCount,status:status}", "--output", "table")

Write-Host ""
Write-Host "Deployment completed."
Write-Host "ALB URL: http://$AlbDns"
Write-Host "Health:  http://$AlbDns/api/health"
Write-Host "Image:   $NewImage"
Write-Host "Digest:  $NewDigest"
Write-Host ""
Write-Host "Load test quick start (PowerShell + Docker hey):"
Write-Host "docker run --rm rcmorano/hey -z 8m -c 200 http://$AlbDns/api/products"
