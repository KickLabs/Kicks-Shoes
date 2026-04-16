# Script tự động setup AWS infrastructure cho PowerShell
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  AWS Infrastructure Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "AWS CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Visit: https://aws.amazon.com/cli/"
    exit 1
}

# Check AWS credentials
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Host "AWS credentials not configured." -ForegroundColor Red
    Write-Host "Run: aws configure"
    exit 1
}

# Get parameters
$ProjectName = Read-Host "Enter project name [kicks-shoes]"
if ([string]::IsNullOrWhiteSpace($ProjectName)) {
    $ProjectName = "kicks-shoes"
}

$AwsRegion = Read-Host "Enter AWS region [ap-southeast-1]"
if ([string]::IsNullOrWhiteSpace($AwsRegion)) {
    $AwsRegion = "ap-southeast-1"
}

$HasDomain = Read-Host "Do you have a custom domain? (y/n) [n]"
if ([string]::IsNullOrWhiteSpace($HasDomain)) {
    $HasDomain = "n"
}

$Params = "ParameterKey=ProjectName,ParameterValue=$ProjectName"

if ($HasDomain -eq "y") {
    $DomainName = Read-Host "Enter domain name (e.g., www.example.com)"
    $CertArn = Read-Host "Enter ACM Certificate ARN (must be in us-east-1)"
    
    $Params += " ParameterKey=DomainName,ParameterValue=$DomainName ParameterKey=CertificateArn,ParameterValue=$CertArn"
}

Write-Host "Creating CloudFormation stack..." -ForegroundColor Yellow
Write-Host "Stack name: $ProjectName-frontend"
Write-Host "Region: $AwsRegion"

aws cloudformation create-stack `
    --stack-name "$ProjectName-frontend" `
    --template-body file://cloudformation-main.yaml `
    --parameters $Params `
    --region $AwsRegion `
    --capabilities CAPABILITY_IAM

Write-Host "Waiting for stack creation (this may take 10-15 minutes)..." -ForegroundColor Yellow

aws cloudformation wait stack-create-complete `
    --stack-name "$ProjectName-frontend" `
    --region $AwsRegion

Write-Host "Stack created successfully!" -ForegroundColor Green

# Get outputs
Write-Host "Retrieving stack outputs..." -ForegroundColor Yellow

$OutputsJson = aws cloudformation describe-stacks `
    --stack-name "$ProjectName-frontend" `
    --region $AwsRegion `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

$S3Bucket = ($OutputsJson | Where-Object { $_.OutputKey -eq "S3BucketName" }).OutputValue
$CfDistId = ($OutputsJson | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue
$CfDomain = ($OutputsJson | Where-Object { $_.OutputKey -eq "CloudFrontDomainName" }).OutputValue

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "S3 Bucket: $S3Bucket"
Write-Host "CloudFront Distribution ID: $CfDistId"
Write-Host "CloudFront Domain: $CfDomain"
Write-Host "URL: https://$CfDomain"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env.aws with the values above"
Write-Host "2. Run: .\deploy-aws.ps1 aws"
Write-Host ""

# Update .env.aws
if (Test-Path ".env.aws") {
    Write-Host "Updating .env.aws..." -ForegroundColor Yellow
    $content = Get-Content ".env.aws"
    $content = $content -replace "AWS_S3_BUCKET=.*", "AWS_S3_BUCKET=$S3Bucket"
    $content = $content -replace "AWS_CLOUDFRONT_DISTRIBUTION_ID=.*", "AWS_CLOUDFRONT_DISTRIBUTION_ID=$CfDistId"
    $content = $content -replace "AWS_CLOUDFRONT_DOMAIN=.*", "AWS_CLOUDFRONT_DOMAIN=$CfDomain"
    $content = $content -replace "AWS_REGION=.*", "AWS_REGION=$AwsRegion"
    $content | Set-Content ".env.aws"
    Write-Host ".env.aws updated!" -ForegroundColor Green
}
