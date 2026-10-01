$ErrorActionPreference = "Stop"

$certificatePath = Join-Path $PSScriptRoot "build\InternxtDevelopment.cer"
$artifactPaths = @(
  (Join-Path $PSScriptRoot "dist\internxt_context_menu.dll"),
  (Join-Path $PSScriptRoot "dist\internxt_context_menu_host.exe"),
  (Join-Path $PSScriptRoot "dist\InternxtContextMenu.msix")
)

if (-not (Test-Path -LiteralPath $certificatePath)) {
  throw "Development certificate not found. Run npm run prepare:test:context-menu first."
}

$signToolPath = Get-ChildItem -Path (Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin") -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^\d+\.\d+\.\d+\.\d+$' } |
  Sort-Object { [version]$_.Name } -Descending |
  ForEach-Object { Join-Path $_.FullName "x64\SignTool.exe" } |
  Where-Object { Test-Path -LiteralPath $_ } |
  Select-Object -First 1

if (-not $signToolPath) {
  throw "SignTool.exe was not found under any installed Windows SDK."
}

$isAdministrator = (
  New-Object Security.Principal.WindowsPrincipal(
    [Security.Principal.WindowsIdentity]::GetCurrent()
  )
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdministrator) {
  throw "Run this command from an administrator PowerShell."
}

$certificate = Import-Certificate `
  -FilePath $certificatePath `
  -CertStoreLocation "Cert:\LocalMachine\TrustedPeople"

Write-Host "Trusted development certificate: $($certificate.Thumbprint)"

foreach ($artifactPath in $artifactPaths) {
  if (-not (Test-Path -LiteralPath $artifactPath)) {
    throw "Signed context-menu artifact not found: $artifactPath"
  }

  & $signToolPath verify /pa $artifactPath

  if ($LASTEXITCODE -ne 0) {
    throw "Signature verification failed for: $artifactPath"
  }
}

Write-Host "Context-menu artifact signatures verified."
