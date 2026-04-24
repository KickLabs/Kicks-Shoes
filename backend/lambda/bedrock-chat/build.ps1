# Build script for Lambda function (PowerShell)

Write-Host "🔨 Building Lambda function..." -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install --production

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
Set-Location ..

if (Test-Path "bedrock-chat.zip") {
    Remove-Item "bedrock-chat.zip" -Force
}

# Use PowerShell Compress-Archive
$exclude = @("*.git*", "*.md", "build.sh", "build.ps1", "test-local.js")
Get-ChildItem -Path "bedrock-chat" -Recurse | 
    Where-Object { 
        $item = $_
        -not ($exclude | Where-Object { $item.Name -like $_ })
    } | 
    Compress-Archive -DestinationPath "bedrock-chat.zip" -CompressionLevel Optimal

Write-Host "✅ Lambda package created: bedrock-chat.zip" -ForegroundColor Green
Write-Host "📊 Package size:" -ForegroundColor Cyan
Get-Item "bedrock-chat.zip" | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}

Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Green
Write-Host "1. Copy to Terraform directory:" -ForegroundColor Yellow
Write-Host "   Copy-Item backend\lambda\bedrock-chat.zip infra\terraform\lambda-placeholder.zip" -ForegroundColor White
Write-Host ""
Write-Host "2. Deploy with Terraform:" -ForegroundColor Yellow
Write-Host "   cd infra\terraform\environments\dev\02-app" -ForegroundColor White
Write-Host "   terraform init" -ForegroundColor White
Write-Host "   terraform plan" -ForegroundColor White
Write-Host "   terraform apply" -ForegroundColor White

Set-Location bedrock-chat
