$ErrorActionPreference = "Stop"

$logsPath = Join-Path $env:APPDATA "internxt-drive\logs"
$registrationLogPath = Join-Path $logsPath "context-menu.log"
$registrationLogMaxBytes = 1MB
$packageName = "com.internxt.drive.contextmenu"
$packagePath = Join-Path $PSScriptRoot "InternxtContextMenu.msix"
$certificatePath = Join-Path $PSScriptRoot "InternxtDevelopment.cer"
$contextMenuDllPath = Join-Path $PSScriptRoot "internxt_context_menu.dll"
$contextMenuClsid = "{F47A034D-852C-4F60-B721-C31C854183F2}"
$contextMenuVerbId = "InternxtCopyShareLink"
$contextMenuTitle = "Internxt Drive context menu"
$minimumWindows10Build = 10240
$minimumWindows11Build = 22000

function Write-RegistrationLog {
  param(
    [Parameter(Mandatory)]
    [string] $Message
  )

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
  New-Item -ItemType Directory -Path $logsPath -Force | Out-Null

  if (
    (Test-Path -LiteralPath $registrationLogPath) -and
    ((Get-Item -LiteralPath $registrationLogPath).Length -ge $registrationLogMaxBytes)
  ) {
    Clear-Content -LiteralPath $registrationLogPath
  }

  Add-Content -LiteralPath $registrationLogPath -Value "[$timestamp] $Message"
}

function Get-WindowsBuild {
  $windowsVersion = Get-ItemProperty `
    -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion" `
    -Name CurrentBuildNumber

  return [int] $windowsVersion.CurrentBuildNumber
}

function Test-IsWindows10OrNewer {
  param(
    [Parameter(Mandatory)]
    [int] $WindowsBuild
  )

  return $WindowsBuild -ge $minimumWindows10Build
}

function Test-IsWindows11OrNewer {
  param(
    [Parameter(Mandatory)]
    [int] $WindowsBuild
  )

  return $WindowsBuild -ge $minimumWindows11Build
}

function Test-ShouldRelaunchWithNativePowerShell {
  return [Environment]::Is64BitOperatingSystem -and -not [Environment]::Is64BitProcess
}

function Invoke-NativePowerShellRegistration {
  $nativePowerShellPath = Join-Path $env:WINDIR "sysnative\WindowsPowerShell\v1.0\powershell.exe"

  if (-not (Test-Path -LiteralPath $nativePowerShellPath)) {
    return $false
  }

  Write-RegistrationLog "Relaunching registration through native PowerShell: $nativePowerShellPath"

  $nativePowerShell = Start-Process `
    -FilePath $nativePowerShellPath `
    -ArgumentList @(
      "-NoLogo",
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-File", "`"$PSCommandPath`""
    ) `
    -Wait `
    -PassThru

  Write-RegistrationLog "Native PowerShell registration finished with exit code $($nativePowerShell.ExitCode)"
  exit $nativePowerShell.ExitCode
}

function Set-CurrentUserRegistryValue {
  param(
    [Parameter(Mandatory)]
    [string] $SubKeyPath,
    [Parameter(Mandatory)]
    [AllowEmptyString()]
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
    $displayName = if ($Name -eq "") { "(Default)" } else { $Name }
    Write-RegistrationLog "Wrote HKCU\$SubKeyPath [$displayName] = $Value"
  } finally {
    $registryKey.Dispose()
  }
}

function Register-Windows10ContextMenuExtension {
  Write-RegistrationLog "Registering Windows 10 context-menu extension. DLL=$contextMenuDllPath"

  if (-not (Test-Path -LiteralPath $contextMenuDllPath)) {
    throw "Context-menu DLL was not found: $contextMenuDllPath"
  }

  Set-CurrentUserRegistryValue `
    -SubKeyPath "Software\Classes\CLSID\$contextMenuClsid" `
    -Name "" `
    -Value $contextMenuTitle

  Set-CurrentUserRegistryValue `
    -SubKeyPath "Software\Classes\CLSID\$contextMenuClsid\InprocServer32" `
    -Name "" `
    -Value $contextMenuDllPath

  Set-CurrentUserRegistryValue `
    -SubKeyPath "Software\Classes\CLSID\$contextMenuClsid\InprocServer32" `
    -Name "ThreadingModel" `
    -Value "Apartment"

  Set-CurrentUserRegistryValue `
    -SubKeyPath "Software\Microsoft\Windows\CurrentVersion\Shell Extensions\Approved" `
    -Name $contextMenuClsid `
    -Value $contextMenuTitle

  foreach ($itemType in @("*", "Directory", "AllFileSystemObjects")) {
    Set-CurrentUserRegistryValue `
      -SubKeyPath "Software\Classes\$itemType\shellex\ContextMenuHandlers\$contextMenuVerbId" `
      -Name "" `
      -Value $contextMenuClsid
  }

  Write-Host "Internxt Windows 10 context-menu extension registered."
  Write-RegistrationLog "Windows 10 context-menu extension registered."
}

function Register-Windows11ContextMenuExtension {
  if (-not (Test-Path -LiteralPath $packagePath)) {
    throw "Context-menu package was not found: $packagePath"
  }

  # Keep the sparse package identity and its ACL changes isolated from Electron.
  # The manifest's host executable and COM DLL both live beside this script.
  $externalLocation = Resolve-Path $PSScriptRoot

  Write-RegistrationLog "Registering Windows 11 context-menu package. Package=$packagePath; ExternalLocation=$($externalLocation.Path)"

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

  Write-Host "Internxt Windows 11 context-menu package registered."
  Write-RegistrationLog "Windows 11 context-menu package registered."
}

trap {
  Write-RegistrationLog "ERROR: $($_.Exception.Message)"
  Write-RegistrationLog "ERROR_DETAILS: $($_ | Out-String)"
  exit 1
}

Write-RegistrationLog "Starting context-menu registration. Is64BitOS=$([Environment]::Is64BitOperatingSystem); Is64BitProcess=$([Environment]::Is64BitProcess); Script=$PSCommandPath"

if (Test-ShouldRelaunchWithNativePowerShell) {
  Invoke-NativePowerShellRegistration | Out-Null
}

$windowsBuild = Get-WindowsBuild
Write-RegistrationLog "Detected Windows build $windowsBuild"

if (-not (Test-IsWindows10OrNewer -WindowsBuild $windowsBuild)) {
  Write-Host "Internxt context-menu integration requires Windows 10 or newer. Current build is $windowsBuild; skipping registration."
  Write-RegistrationLog "Skipping registration because Windows build is below $minimumWindows10Build"
  exit 0
}

if (-not (Test-IsWindows11OrNewer -WindowsBuild $windowsBuild)) {
  Register-Windows10ContextMenuExtension
  exit 0
}

Register-Windows11ContextMenuExtension

# Explorer may need to restart before showing a newly registered extension.
# We deliberately avoid restarting it during installation because that closes
# the user's File Explorer windows and briefly refreshes the Windows desktop.
#
# Stop-Process -Name explorer -Force
# Start-Process explorer.exe
