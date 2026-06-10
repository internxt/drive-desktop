$ErrorActionPreference = "Stop"

$sdkVersion = "10.0.22621.0"
$projectPath = Join-Path $PSScriptRoot "InternxtContextMenu.vcxproj"
$outputPath = Join-Path $PSScriptRoot "dist\internxt_context_menu.dll"
$vswherePath = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
$sdkIncludePath = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\Include\$sdkVersion"

if (-not (Test-Path -LiteralPath $vswherePath)) {
  throw "Visual Studio Installer was not found. Install Visual Studio Build Tools with the C++ workload."
}

$msbuildPath = & $vswherePath `
  -latest `
  -products * `
  -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
  -find "MSBuild\**\Bin\MSBuild.exe" |
  Select-Object -First 1

if (-not $msbuildPath) {
  throw "MSVC x64/x86 build tools were not found."
}

$visualStudioPath = & $vswherePath `
  -latest `
  -products * `
  -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
  -property installationPath

$vcTargetsRoot = Get-ChildItem (Join-Path $visualStudioPath "MSBuild\Microsoft\VC") -Directory |
  Where-Object Name -Match "^v\d+$" |
  Sort-Object Name -Descending |
  Select-Object -First 1

$platformToolset = Get-ChildItem (Join-Path $vcTargetsRoot.FullName "Platforms\x64\PlatformToolsets") -Directory -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending |
  Select-Object -First 1 -ExpandProperty Name

if (-not $platformToolset) {
  throw "The installed Visual Studio C++ platform toolset could not be determined."
}

if (-not (Test-Path -LiteralPath $sdkIncludePath)) {
  throw "Windows SDK $sdkVersion was not found."
}

& $msbuildPath `
  $projectPath `
  /t:Rebuild `
  /p:Configuration=Release `
  /p:Platform=x64 `
  /p:PlatformToolset=$platformToolset `
  /m

if ($LASTEXITCODE -ne 0) {
  throw "Context-menu DLL build failed."
}

if (-not (Test-Path -LiteralPath $outputPath)) {
  throw "Build completed without producing the expected DLL: $outputPath"
}

Write-Host "Context-menu DLL created at $outputPath"
