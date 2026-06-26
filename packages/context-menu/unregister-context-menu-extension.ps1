$ErrorActionPreference = "Stop"

$packageName = "com.internxt.drive.contextmenu"
$certificatePath = Join-Path $PSScriptRoot "InternxtDevelopment.cer"
$contextMenuClsid = "{F47A034D-852C-4F60-B721-C31C854183F2}"
$contextMenuVerbId = "InternxtCopyShareLink"

function Remove-CurrentUserRegistryTree {
  param(
    [Parameter(Mandatory)]
    [string] $SubKeyPath
  )

  $currentUserKey = [Microsoft.Win32.Registry]::CurrentUser
  $existingKey = $currentUserKey.OpenSubKey($SubKeyPath)

  if (-not $existingKey) {
    return
  }

  $existingKey.Dispose()
  $currentUserKey.DeleteSubKeyTree($SubKeyPath)
}

function Unregister-Windows10ContextMenuExtension {
  foreach ($itemType in @("*", "Directory")) {
    Remove-CurrentUserRegistryTree `
      -SubKeyPath "Software\Classes\$itemType\shell\$contextMenuVerbId"
  }

  Remove-CurrentUserRegistryTree `
    -SubKeyPath "Software\Classes\CLSID\$contextMenuClsid"

  Write-Host "Internxt Windows 10 context-menu extension unregistered."
}

# Remove the context-menu registration for the current Windows user before
# NSIS deletes the external DLL and host executable from the installation.
Unregister-Windows10ContextMenuExtension

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
