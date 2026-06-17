$ErrorActionPreference = "Stop"

$dllPath = Join-Path $PSScriptRoot "dist\internxt_context_menu.dll"
$hostPath = Join-Path $PSScriptRoot "dist\internxt_context_menu_host.exe"
$msixPath = Join-Path $PSScriptRoot "dist\InternxtContextMenu.msix"
$developmentCertificatePath = Join-Path $PSScriptRoot "dist\InternxtDevelopment.cer"
$packageScriptPath = Join-Path $PSScriptRoot "package.ps1"

if ([string]::IsNullOrWhiteSpace($env:WINDOWS_PACKAGE_PUBLISHER)) {
  throw "WINDOWS_PACKAGE_PUBLISHER is required for production MSIX generation."
}

# The release pipeline signs both native binaries before this script runs.
# Recompiling here would replace those signed files with unsigned versions.
foreach ($nativeArtifactPath in @($dllPath, $hostPath)) {
  if (-not (Test-Path -LiteralPath $nativeArtifactPath)) {
    throw "Signed context-menu artifact was not found: $nativeArtifactPath"
  }
}

# Development builds export this certificate for local trust. It must never be
# bundled in a production installer, even when dist contains a stale local file.
if (Test-Path -LiteralPath $developmentCertificatePath) {
  Remove-Item -LiteralPath $developmentCertificatePath -Force
}

# package.ps1 writes the required production publisher into the manifest and
# generates the unsigned MSIX. DigiCert signs that MSIX in the following step.
& $packageScriptPath

if ($LASTEXITCODE -ne 0) {
  throw "Production context-menu MSIX generation failed."
}

if (-not (Test-Path -LiteralPath $msixPath)) {
  throw "Production MSIX generation did not produce: $msixPath"
}

Write-Host "Production context-menu MSIX created at $msixPath"
