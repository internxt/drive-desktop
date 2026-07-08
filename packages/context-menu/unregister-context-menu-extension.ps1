$ErrorActionPreference = "Stop"

$packageName = "com.internxt.drive.contextmenu"
$certificatePath = Join-Path $PSScriptRoot "InternxtDevelopment.cer"

# Remove the context-menu registration for the current Windows user before
# NSIS deletes the external DLL and host executable from the installation.
$installedPackage = Get-AppxPackage -Name $packageName
if ($installedPackage) {
  $installedPackage | Remove-AppxPackage
}

# Development builds add this public certificate to LocalMachine\TrustedPeople.
# When the certificate is not bundled, this cleanup step is skipped.
if (Test-Path -LiteralPath $certificatePath) {
  $certificate = New-Object `
    System.Security.Cryptography.X509Certificates.X509Certificate2($certificatePath)

  $trustedCertificate = Get-ChildItem "Cert:\LocalMachine\TrustedPeople" |
    Where-Object Thumbprint -eq $certificate.Thumbprint |
    Select-Object -First 1

  if ($trustedCertificate) {
    $untrustScriptPath = Join-Path $PSScriptRoot "untrust-development-certificate.ps1"

    # Removing a LocalMachine certificate requires administrator approval.
    $untrustProcess = Start-Process `
      -FilePath "powershell.exe" `
      -ArgumentList @(
        "-NoLogo",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", "`"$untrustScriptPath`"",
        "-Thumbprint", $certificate.Thumbprint
      ) `
      -Verb RunAs `
      -WindowStyle Hidden `
      -Wait `
      -PassThru

    if ($untrustProcess.ExitCode -ne 0) {
      throw "The context-menu development certificate could not be removed."
    }
  }
}

Write-Host "Internxt context-menu extension unregistered."
