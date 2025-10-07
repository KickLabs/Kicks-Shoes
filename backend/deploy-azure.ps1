# Azure App Service Deployment Script for Kicks Shoes Backend (no Docker)
# Works with Azure for Students; auto-picks an allowed region by actually trying to create the plan.

Write-Host "Starting Azure deployment for Kicks Shoes Backend..." -ForegroundColor Green

# ========= Configuration =========
$RESOURCE_GROUP = "kicks-shoes-rg"
$APP_PLAN       = "kicks-shoes-plan"
$APP_NAME       = "kicks-shoes-backend"

# Regions (ưu tiên gần VN trước). Script sẽ thử lần lượt.
$PREFERRED_REGIONS = @("southeastasia","eastasia","australiaeast","westeurope","eastus","westus2")

# Runtime đúng định dạng cho Linux Web App
$RUNTIME       = "NODE:20-lts"

# Thử Free trước, nếu bị policy chặn -> Basic (B1)
$SKUS_TO_TRY   = @("F1","B1")
# =================================

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "Resource Group: $RESOURCE_GROUP"
Write-Host "App Plan: $APP_PLAN"
Write-Host "App Name: $APP_NAME"
Write-Host "Runtime: $RUNTIME"
Write-Host ""

# ---- Check Azure CLI (forced path first, else fallback to PATH) ----
Write-Host "Checking Azure CLI..." -ForegroundColor Yellow
$azCommand = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
if (-not (Test-Path $azCommand)) {
  $alt = "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
  if (Test-Path $alt) { $azCommand = $alt } else { $azCommand = "az" }
}
try { & $azCommand version 1>$null 2>$null } catch {
  Write-Host "Azure CLI not found. Install: https://learn.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Red
  exit 1
}
Write-Host "Azure CLI found: $azCommand" -ForegroundColor Green

# ---- Login check ----
Write-Host "Checking Azure login..." -ForegroundColor Yellow
& $azCommand account show 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Please log in to Azure..." -ForegroundColor Yellow
  & $azCommand login | Out-Null
}
Write-Host "Logged in to Azure" -ForegroundColor Green

function Run-Az {
  param(
    [Parameter(Mandatory=$true)][string]$Cmd,
    [Parameter(Mandatory=$true)][string]$Desc,
    [switch]$IgnoreError
  )
  Write-Host "$Desc..." -ForegroundColor Yellow
  # Parse command properly and execute with & operator
  $cmdArray = $Cmd -split ' '
  $res = & $azCommand $cmdArray
  if ($LASTEXITCODE -ne 0 -and -not $IgnoreError) {
    Write-Host "Failed: $Desc" -ForegroundColor Red
    Write-Host "Error: $res" -ForegroundColor Red
    exit 1
  }
  if ($LASTEXITCODE -eq 0) { Write-Host "$Desc completed" -ForegroundColor Green }
  return $res
}

# ---- Ensure Resource Group (tạm dùng region đầu danh sách; RG khác region resource vẫn OK) ----
$rgExists = & $azCommand group show --name $RESOURCE_GROUP --query name -o tsv 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($rgExists)) {
  $rgLoc = $PREFERRED_REGIONS[0]
  Run-Az "group create --name $RESOURCE_GROUP --location $rgLoc --output table" "Creating resource group"
} else {
  Write-Host "Resource group already exists: $RESOURCE_GROUP" -ForegroundColor Green
}

# ---- Try to create (or reuse) App Service Plan iterating region x SKU ----
$PLAN_CREATED = $false
$CHOSEN_REGION = $null
$CHOSEN_SKU = $null

# If plan already exists, read its location & sku
$planCheck = & $azCommand appservice plan show --name $APP_PLAN --resource-group $RESOURCE_GROUP -o json 2>$null
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($planCheck)) {
  $planObj = $planCheck | ConvertFrom-Json
  $PLAN_CREATED = $true
  $CHOSEN_REGION = $planObj.location
  $CHOSEN_SKU = $planObj.sku.name
  Write-Host "App Service plan already exists: $APP_PLAN ($CHOSEN_SKU @ $CHOSEN_REGION)" -ForegroundColor Green
} else {
  foreach ($sku in $SKUS_TO_TRY) {
    foreach ($loc in $PREFERRED_REGIONS) {
      Write-Host "Trying to create plan '$APP_PLAN' with SKU $sku in $loc ..." -ForegroundColor Yellow
      $out = & $azCommand appservice plan create --name $APP_PLAN --resource-group $RESOURCE_GROUP --sku $sku --is-linux --location $loc -o none 2>&1
      if ($LASTEXITCODE -eq 0) {
        $PLAN_CREATED = $true
        $CHOSEN_REGION = $loc
        $CHOSEN_SKU = $sku
        Write-Host "Plan created: $APP_PLAN ($sku @ $loc)" -ForegroundColor Green
        break
      } else {
        # common policy errors: RequestDisallowedByAzure / location not allowed / sku unsupported
        Write-Host "Failed at $loc/$sku → $out" -ForegroundColor DarkYellow
      }
    }
    if ($PLAN_CREATED) { break }
  }
}

if (-not $PLAN_CREATED) {
  Write-Host "No allowed regions/SKUs worked for App Service Plan. Your subscription may be restricted by policy." -ForegroundColor Red
  Write-Host "Tip: thử mở rộng danh sách PREFERRED_REGIONS (vd: centralus, westus, northeurope) hoặc dùng Azure Portal để xem region được phép." -ForegroundColor Yellow
  exit 1
}

# ---- Ensure Web App ----
$appExists = & $azCommand webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME --query name -o tsv 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($appExists)) {
  Run-Az "webapp create --resource-group $RESOURCE_GROUP --plan $APP_PLAN --name $APP_NAME --runtime $RUNTIME --output table" "Creating web app"
} else {
  Write-Host "Web App already exists: $APP_NAME" -ForegroundColor Green
  Run-Az "webapp config set --resource-group $RESOURCE_GROUP --name $APP_NAME --linux-fx-version '$RUNTIME'" "Aligning runtime" -IgnoreError
}

# ---- Configure app settings ----
# IMPORTANT: App Service cấp PORT động; app Node phải listen(process.env.PORT)
Run-Az "webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings NODE_ENV=production WEBSITE_NODE_DEFAULT_VERSION=18-lts" "Configuring app settings"

Write-Host ""
Write-Host "Azure App Service is ready!" -ForegroundColor Green
Write-Host "Plan: $APP_PLAN ($CHOSEN_SKU @ $CHOSEN_REGION)" -ForegroundColor Yellow
Write-Host "App URL: https://$APP_NAME.azurewebsites.net" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1) Add secrets: Azure Portal > App Services > $APP_NAME > Configuration (Mongo URI, JWT, Cloudinary,...)" 
Write-Host "2) Deploy code via Git:" 
Write-Host "   git remote add azure https://$APP_NAME.scm.azurewebsites.net/$APP_NAME.git"
Write-Host "   git push azure main"
Write-Host "   (Hoặc dùng: az webapp up --name $APP_NAME --resource-group $RESOURCE_GROUP --location $CHOSEN_REGION --runtime '$RUNTIME')"
Write-Host ""
Write-Host "Done." -ForegroundColor Green
