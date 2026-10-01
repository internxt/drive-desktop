$ErrorActionPreference = "Stop"

$projectPath = Join-Path $PSScriptRoot "InternxtContextMenu.vcxproj"
$hostProjectPath = Join-Path $PSScriptRoot "InternxtContextMenuHost.vcxproj"
$dllOutputPath = Join-Path $PSScriptRoot "dist\internxt_context_menu.dll"
$hostOutputPath = Join-Path $PSScriptRoot "dist\internxt_context_menu_host.exe"
$vswherePath = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
$windowsKitsIncludePath = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\Include"

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

$sdkVersion = Get-ChildItem -Path $windowsKitsIncludePath -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^\d+\.\d+\.\d+\.\d+$' } |
  Sort-Object { [version]$_.Name } -Descending |
  Select-Object -First 1 -ExpandProperty Name

if (-not $sdkVersion) {
  throw "No installed Windows SDK was found under $windowsKitsIncludePath."
}

foreach ($nativeProjectPath in @($projectPath, $hostProjectPath)) {
  & $msbuildPath `
    $nativeProjectPath `
    /t:Rebuild `
    /p:Configuration=Release `
    /p:Platform=x64 `
    /p:PlatformToolset=$platformToolset `
    /p:WindowsTargetPlatformVersion=$sdkVersion `
    /m

  if ($LASTEXITCODE -ne 0) {
    throw "Context-menu native build failed: $nativeProjectPath"
  }
}

foreach ($outputPath in @($dllOutputPath, $hostOutputPath)) {
  if (-not (Test-Path -LiteralPath $outputPath)) {
    throw "Build completed without producing the expected artifact: $outputPath"
  }
}

Write-Host "Context-menu DLL created at $dllOutputPath"
Write-Host "Context-menu host created at $hostOutputPath"
