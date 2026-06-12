$ErrorActionPreference = "Stop"

$packageName = "com.internxt.drive.contextmenu"
$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$msixPath = Join-Path $PSScriptRoot "dist\InternxtContextMenu.msix"
$testDllPath = Join-Path $PSScriptRoot "build\test-install\context-menu\internxt_context_menu.dll"
$testHostPath = Join-Path $PSScriptRoot "build\test-install\context-menu\internxt_context_menu_host.exe"

$inputPaths = @(
  (Join-Path $rootPath "package.json"),
  (Join-Path $rootPath "assets\icon.ico"),
  (Join-Path $PSScriptRoot "package.json"),
  (Join-Path $PSScriptRoot "InternxtContextMenu.vcxproj"),
  (Join-Path $PSScriptRoot "InternxtContextMenuHost.vcxproj"),
  (Join-Path $PSScriptRoot "AppxManifest.template.xml"),
  (Join-Path $PSScriptRoot "build.ps1"),
  (Join-Path $PSScriptRoot "package.ps1"),
  (Join-Path $PSScriptRoot "prepare-test.ps1"),
  (Join-Path $PSScriptRoot "install-test.ps1"),
  (Join-Path $PSScriptRoot "src\context_menu.cpp"),
  (Join-Path $PSScriptRoot "src\context_menu_host.cpp"),
  (Join-Path $PSScriptRoot "src\context_menu.def"),
  (Join-Path $PSScriptRoot "src\context_menu.rc"),
  (Join-Path $PSScriptRoot "src\resource.h")
)

$missingInput = $inputPaths | Where-Object { -not (Test-Path -LiteralPath $_) } | Select-Object -First 1
if ($missingInput) {
  throw "Required context-menu input was not found: $missingInput"
}

$installedPackage = Get-AppxPackage -Name $packageName
$artifactsExist =
  (Test-Path -LiteralPath $msixPath) -and
  (Test-Path -LiteralPath $testDllPath) -and
  (Test-Path -LiteralPath $testHostPath)

$requiresSetup = -not $installedPackage -or -not $artifactsExist

if (-not $requiresSetup) {
  $latestInputWriteTime = ($inputPaths | Get-Item | Measure-Object LastWriteTimeUtc -Maximum).Maximum
  $oldestArtifactWriteTime = (@($msixPath, $testDllPath, $testHostPath) | Get-Item | Measure-Object LastWriteTimeUtc -Minimum).Minimum
  $requiresSetup = $latestInputWriteTime -gt $oldestArtifactWriteTime
}

if (-not $requiresSetup) {
  Write-Host "Context-menu test package is already up to date."
  exit 0
}

Write-Host "Context-menu test package is missing or stale. Preparing it now."
& npm.cmd run setup:test

if ($LASTEXITCODE -ne 0) {
  throw "Context-menu test setup failed."
}
