param(
  [Parameter(Mandatory = $true)]
  [string]$SecretName,

  [string]$SourceFile = "D:\AWS\Kicks-Shoes-AWS\ket.md",

  [string]$Region = "ap-southeast-1"
)

if (-not (Test-Path $SourceFile)) {
  throw "Source file not found: $SourceFile"
}

$kv = @{}
Get-Content $SourceFile | ForEach-Object {
  $line = $_.Trim()
  if ([string]::IsNullOrWhiteSpace($line)) { return }
  if ($line.StartsWith("#")) { return }
  if ($line -notmatch "=") { return }

  $parts = $line.Split("=", 2)
  if ($parts.Count -ne 2) { return }

  $key = $parts[0].Trim()
  $value = $parts[1].Trim()

  if (-not [string]::IsNullOrWhiteSpace($key)) {
    $kv[$key] = $value
  }
}

if ($kv.Count -eq 0) {
  throw "No KEY=VALUE entries parsed from $SourceFile"
}

$secretJson = $kv | ConvertTo-Json -Compress

$exists = $false
try {
  aws secretsmanager describe-secret --secret-id $SecretName --region $Region | Out-Null
  $exists = $true
} catch {
  $exists = $false
}

if ($exists) {
  aws secretsmanager update-secret `
    --secret-id $SecretName `
    --secret-string $secretJson `
    --region $Region | Out-Null

  Write-Host "Updated secret: $SecretName"
} else {
  aws secretsmanager create-secret `
    --name $SecretName `
    --secret-string $secretJson `
    --region $Region | Out-Null

  Write-Host "Created secret: $SecretName"
}

Write-Host "Done. Parsed $($kv.Count) keys from $SourceFile"
