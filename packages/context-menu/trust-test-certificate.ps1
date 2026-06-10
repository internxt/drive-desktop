$ErrorActionPreference = "Stop"

$sdkVersion = "10.0.22621.0"
$certificatePath = Join-Path $PSScriptRoot "build\InternxtDevelopment.cer"
$signToolPath = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin\$sdkVersion\x64\SignTool.exe"
$artifactPaths = @(
  (Join-Path $PSScriptRoot "dist\internxt_context_menu.dll"),
  (Join-Path $PSScriptRoot "dist\InternxtContextMenu.msix")
)

if (-not (Test-Path -LiteralPath $certificatePath)) {
  throw "Development certificate not found. Run npm run prepare:test:context-menu first."
}

if (-not (Test-Path -LiteralPath $signToolPath)) {
  throw "SignTool.exe from Windows SDK $sdkVersion was not found."
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
