$ErrorActionPreference = "Stop"

$packageName = "com.internxt.drive.contextmenu"
$packagePath = Join-Path $PSScriptRoot "InternxtContextMenu.msix"
$certificatePath = Join-Path $PSScriptRoot "InternxtDevelopment.cer"
$contextMenuDllPath = Join-Path $PSScriptRoot "internxt_context_menu.dll"
$contextMenuClsid = "{F47A034D-852C-4F60-B721-C31C854183F2}"
$contextMenuVerbId = "InternxtCopyShareLink"
$contextMenuTitle = "Copy Internxt share link"
$contextMenuIconResourceId = 101
$minimumWindows10Build = 10240
$minimumWindows11Build = 22000

# Keep the sparse package identity and its ACL changes isolated from Electron.
# The manifest's host executable and COM DLL both live beside this script.
$externalLocation = Resolve-Path $PSScriptRoot

function Set-CurrentUserRegistryValue {
  param(
    [Parameter(Mandatory)]
    [string] $SubKeyPath,
    [Parameter(Mandatory)]
    [string] $Name,
    [Parameter(Mandatory)]
    [string] $Value
  )

  $registryKey = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey($SubKeyPath)
  if (-not $registryKey) {
    throw "Registry key could not be created: HKCU\$SubKeyPath"
  }

  try {
    $registryKey.SetValue($Name, $Value, [Microsoft.Win32.RegistryValueKind]::String)
  } finally {
    $registryKey.Dispose()
  }
}

function Register-Windows10ContextMenuExtension {
  if (-not (Test-Path -LiteralPath $contextMenuDllPath)) {
    throw "Context-menu DLL was not found: $contextMenuDllPath"
  }

  Set-CurrentUserRegistryValue `
    -SubKeyPath "Software\Classes\CLSID\$contextMenuClsid\InprocServer32" `
    -Name "" `
    -Value $contextMenuDllPath

  Set-CurrentUserRegistryValue `
    -SubKeyPath "Software\Classes\CLSID\$contextMenuClsid\InprocServer32" `
    -Name "ThreadingModel" `
    -Value "Apartment"

  foreach ($itemType in @("*", "Directory")) {
    $verbKeyPath = "Software\Classes\$itemType\shell\$contextMenuVerbId"

    Set-CurrentUserRegistryValue `
      -SubKeyPath $verbKeyPath `
      -Name "ExplorerCommandHandler" `
      -Value $contextMenuClsid

    Set-CurrentUserRegistryValue `
      -SubKeyPath $verbKeyPath `
      -Name "MUIVerb" `
      -Value $contextMenuTitle

    Set-CurrentUserRegistryValue `
      -SubKeyPath $verbKeyPath `
      -Name "Icon" `
      -Value "$contextMenuDllPath,-$contextMenuIconResourceId"
  }

  Write-Host "Internxt Windows 10 context-menu extension registered."
}

$windowsVersion = Get-ItemProperty `
  -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion" `
  -Name CurrentBuildNumber
$windowsBuild = [int] $windowsVersion.CurrentBuildNumber

if ($windowsBuild -lt $minimumWindows10Build) {
  Write-Host "Internxt context-menu integration requires Windows 10 or newer. Current build is $windowsBuild; skipping registration."
  exit 0
}

if ($windowsBuild -lt $minimumWindows11Build) {
  Register-Windows10ContextMenuExtension
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
