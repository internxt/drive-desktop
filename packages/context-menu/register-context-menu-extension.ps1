$ErrorActionPreference = "Stop"

$packageName = "com.internxt.drive.contextmenu"
$packagePath = Join-Path $PSScriptRoot "InternxtContextMenu.msix"
$certificatePath = Join-Path $PSScriptRoot "InternxtDevelopment.cer"
$minimumWindows10Build = 10240
$minimumWindows11Build = 22000

# Keep the sparse package identity and its ACL changes isolated from Electron.
# The manifest's host executable and COM DLL both live beside this script.
$externalLocation = Resolve-Path $PSScriptRoot

$windowsVersion = Get-ItemProperty `
  -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion" `
  -Name CurrentBuildNumber
$windowsBuild = [int] $windowsVersion.CurrentBuildNumber

if ($windowsBuild -lt $minimumWindows10Build) {
  Write-Host "Internxt context-menu integration requires Windows 10 or newer. Current build is $windowsBuild; skipping registration."
  exit 0
}

if ($windowsBuild -lt $minimumWindows11Build) {
  Write-Host "Internxt Windows 10 context-menu integration is not available yet. Current build is $windowsBuild; skipping registration."
  exit 0
}

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
      -WindowStyle Hidden `
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

# Explorer may need to restart before showing a newly registered extension.
# We deliberately avoid restarting it during installation because that closes
# the user's File Explorer windows and briefly refreshes the Windows desktop.
#
# Stop-Process -Name explorer -Force
# Start-Process explorer.exe
