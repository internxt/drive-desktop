$ErrorActionPreference = "Stop"

$packageName = "com.internxt.drive.contextmenu"
$packagePath = Join-Path $PSScriptRoot "InternxtContextMenu.msix"
$certificatePath = Join-Path $PSScriptRoot "InternxtDevelopment.cer"

# The script is installed in resources\context-menu, while the sparse MSIX
# references Internxt.exe and its DLL from the application installation root.
$externalLocation = Resolve-Path (Join-Path $PSScriptRoot "..\..")

if (-not (Test-Path -LiteralPath $packagePath)) {
  throw "Context-menu package was not found: $packagePath"
}

# Development builds include their public self-signed certificate so the QA
# machine can trust the MSIX. Production signing is handled separately.
if (Test-Path -LiteralPath $certificatePath) {
  $certificate = New-Object `
    System.Security.Cryptography.X509Certificates.X509Certificate2($certificatePath)

  $trustedCertificate = Get-ChildItem "Cert:\LocalMachine\TrustedPeople" |
    Where-Object Thumbprint -eq $certificate.Thumbprint |
    Select-Object -First 1

  if (-not $trustedCertificate) {
    $trustScriptPath = Join-Path $PSScriptRoot "trust-development-certificate.ps1"

    # LocalMachine certificate changes require administrator approval. RunAs
    # displays the standard Windows elevation prompt only when trust is missing.
    $trustProcess = Start-Process `
      -FilePath "powershell.exe" `
      -ArgumentList @(
        "-NoLogo",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", "`"$trustScriptPath`"",
        "-CertificatePath", "`"$certificatePath`""
      ) `
      -Verb RunAs `
      -Wait `
      -PassThru

    if ($trustProcess.ExitCode -ne 0) {
      throw "The context-menu development certificate could not be trusted."
    }
  }
}

$installedPackage = Get-AppxPackage -Name $packageName
if ($installedPackage) {
  $installedPackage | Remove-AppxPackage
}

Add-AppxPackage `
  -Path $packagePath `
  -ExternalLocation $externalLocation.Path `
  -ForceUpdateFromAnyVersion

Write-Host "Internxt context-menu package registered."
