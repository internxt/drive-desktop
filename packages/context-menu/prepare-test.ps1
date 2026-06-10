$ErrorActionPreference = "Stop"

$certificateSubject = "CN=Internxt Development"
$certificateFriendlyName = "Internxt Context Menu Development"
$certificateStore = "Cert:\CurrentUser\My"
$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$sdkVersion = "10.0.22621.0"
$signToolPath = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin\$sdkVersion\x64\SignTool.exe"
$dllPath = Join-Path $PSScriptRoot "dist\internxt_context_menu.dll"
$msixPath = Join-Path $PSScriptRoot "dist\InternxtContextMenu.msix"
$testInstallPath = Join-Path $PSScriptRoot "build\test-install"
$testContextMenuPath = Join-Path $testInstallPath "resources\context-menu"
$testExecutableSourcePath = Join-Path $rootPath "node_modules\electron\dist\electron.exe"
$testExecutablePath = Join-Path $testInstallPath "Internxt.exe"
$testDllPath = Join-Path $testContextMenuPath "internxt_context_menu.dll"

if (-not (Test-Path -LiteralPath $signToolPath)) {
  throw "SignTool.exe from Windows SDK $sdkVersion was not found."
}

if (-not (Test-Path -LiteralPath $testExecutableSourcePath)) {
  throw "Electron executable was not found. Run npm install before preparing the test package."
}

$certificate = Get-ChildItem $certificateStore |
  Where-Object {
    $_.Subject -eq $certificateSubject -and
    $_.HasPrivateKey -and
    $_.NotAfter -gt (Get-Date) -and
    $_.Extensions.Oid.Value -contains "2.5.29.19"
  } |
  Sort-Object NotAfter -Descending |
  Select-Object -First 1

if (-not $certificate) {
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

$certificateExportPath = Join-Path $PSScriptRoot "build\InternxtDevelopment.cer"
New-Item -ItemType Directory -Path (Split-Path $certificateExportPath) -Force | Out-Null
Export-Certificate -Cert $certificate -FilePath $certificateExportPath -Force | Out-Null

$env:WINDOWS_PACKAGE_PUBLISHER = $certificate.Subject
& npm.cmd run package

if ($LASTEXITCODE -ne 0) {
  throw "Context-menu package generation failed."
}

foreach ($artifactPath in @($dllPath, $msixPath)) {
  & $signToolPath sign /fd SHA256 /sha1 $certificate.Thumbprint $artifactPath

  if ($LASTEXITCODE -ne 0) {
    throw "Failed to sign context-menu artifact: $artifactPath"
  }
}

if (Test-Path -LiteralPath $testInstallPath) {
  Remove-Item -LiteralPath $testInstallPath -Recurse -Force
}

New-Item -ItemType Directory -Path $testContextMenuPath -Force | Out-Null
Copy-Item -LiteralPath $testExecutableSourcePath -Destination $testExecutablePath
Copy-Item -LiteralPath $dllPath -Destination $testDllPath

Write-Host "Context-menu test artifacts are ready."
Write-Host "Certificate thumbprint: $($certificate.Thumbprint)"
Write-Host "Certificate to trust: $certificateExportPath"
Write-Host "Signed package: $msixPath"
Write-Host "External location: $testInstallPath"
Write-Host "Before registration, import the certificate into LocalMachine\TrustedPeople from an administrator PowerShell."
