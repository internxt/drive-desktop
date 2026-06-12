$ErrorActionPreference = "Stop"

$certificateSubject = "CN=Internxt Development"
$certificateFriendlyName = "Internxt Context Menu Development"
$certificateStore = "Cert:\CurrentUser\My"
$sdkVersion = "10.0.22621.0"
$signToolPath = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin\$sdkVersion\x64\SignTool.exe"
$dllPath = Join-Path $PSScriptRoot "dist\internxt_context_menu.dll"
$hostPath = Join-Path $PSScriptRoot "dist\internxt_context_menu_host.exe"
$msixPath = Join-Path $PSScriptRoot "dist\InternxtContextMenu.msix"
$certificateExportPath = Join-Path $PSScriptRoot "dist\InternxtDevelopment.cer"

if (-not (Test-Path -LiteralPath $signToolPath)) {
  throw "SignTool.exe from Windows SDK $sdkVersion was not found."
}

# Reuse the newest valid development certificate when possible. The private
# key is required because signing cannot be performed with a public cert alone.
$certificate = Get-ChildItem $certificateStore |
  Where-Object {
    $_.Subject -eq $certificateSubject -and
    $_.HasPrivateKey -and
    $_.NotAfter -gt (Get-Date)
  } |
  Sort-Object NotAfter -Descending |
  Select-Object -First 1

if (-not $certificate) {
  # Local and QA builds use a self-signed code-signing certificate. Production
  # artifacts are signed separately with Internxt's trusted release certificate.
  $certificate = New-SelfSignedCertificate `
    -Type Custom `
    -Subject $certificateSubject `
    -FriendlyName $certificateFriendlyName `
    -CertStoreLocation $certificateStore `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -HashAlgorithm SHA256 `
    -KeyUsage DigitalSignature `
    -TextExtension @(
      "2.5.29.37={text}1.3.6.1.5.5.7.3.3",
      "2.5.29.19={text}"
    ) `
    -NotAfter (Get-Date).AddYears(1)
}

# Export only the public certificate. The private signing key remains in the
# developer's certificate store and is never included in the installer.
Export-Certificate `
  -Cert $certificate `
  -FilePath $certificateExportPath `
  -Force |
  Out-Null

# An MSIX manifest publisher must exactly match the subject of the certificate
# that signs it. The package script writes this value into AppxManifest.xml.
$env:WINDOWS_PACKAGE_PUBLISHER = $certificate.Subject

# This package-level command compiles the DLL and generates the unsigned MSIX.
# It does not call the root npm package command, so there is no recursion.
& npm.cmd run package

if ($LASTEXITCODE -ne 0) {
  throw "Context-menu package generation failed."
}

# Sign the native binaries and their MSIX container before Electron Builder
# bundles them. Windows requires the MSIX signature to register it.
foreach ($artifactPath in @($dllPath, $hostPath, $msixPath)) {
  & $signToolPath sign /fd SHA256 /sha1 $certificate.Thumbprint $artifactPath

  if ($LASTEXITCODE -ne 0) {
    throw "Failed to sign context-menu artifact: $artifactPath"
  }
}

Write-Host "Context-menu artifacts signed for development."
