Write-Host "Building JWT Authorizer Lambda..." -ForegroundColor Cyan

Set-Location $PSScriptRoot

npm install --omit=dev

if (Test-Path "authorizer.zip") {
    Remove-Item "authorizer.zip" -Force
}

Compress-Archive -Path "index.js", "node_modules" -DestinationPath "authorizer.zip"

Write-Host "Done: authorizer.zip created" -ForegroundColor Green
