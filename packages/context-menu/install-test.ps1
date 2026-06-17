$ErrorActionPreference = "Stop"

$packageName = "com.internxt.drive.contextmenu"
$certificateSubject = "CN=Internxt Development"
$packagePath = Join-Path $PSScriptRoot "dist\InternxtContextMenu.msix"
$externalLocation = Join-Path $PSScriptRoot "build\test-install\context-menu"
$trustScriptPath = Join-Path $PSScriptRoot "trust-test-certificate.ps1"

if (-not (Test-Path -LiteralPath $packagePath)) {
  throw "Context-menu test package was not found. Run the prepare:test command first."
}

if (-not (Test-Path -LiteralPath $externalLocation)) {
  throw "Context-menu external location was not found. Run the prepare:test command first."
}

$trustedCertificate = Get-ChildItem "Cert:\LocalMachine\TrustedPeople" |
  Where-Object {
    $_.Subject -eq $certificateSubject -and
    $_.NotAfter -gt (Get-Date)
  } |
  Sort-Object NotAfter -Descending |
  Select-Object -First 1

if (-not $trustedCertificate) {
  Write-Host "The development certificate requires trust. Windows will request administrator approval."

  $trustProcess = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @(
      "-NoLogo",
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-File", "`"$trustScriptPath`""
    ) `
    -Verb RunAs `
    -Wait `
    -PassThru

  if ($trustProcess.ExitCode -ne 0) {
    throw "The development certificate could not be trusted."
  }
}

$installedPackage = Get-AppxPackage -Name $packageName
if ($installedPackage) {
  $installedPackage | Remove-AppxPackage
}

Add-AppxPackage `
  -Path (Resolve-Path $packagePath).Path `
  -ExternalLocation (Resolve-Path $externalLocation).Path `
  -ForceUpdateFromAnyVersion

Write-Host "Context-menu test package installed."
