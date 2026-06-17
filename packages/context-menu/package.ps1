$ErrorActionPreference = "Stop"

$sdkVersion = "10.0.22621.0"
$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$rootPackageJsonPath = Join-Path $rootPath "package.json"
$manifestTemplatePath = Join-Path $PSScriptRoot "AppxManifest.template.xml"
$stagingPath = Join-Path $PSScriptRoot "build\package"
$assetsPath = Join-Path $stagingPath "Assets"
$outputPath = Join-Path $PSScriptRoot "dist\InternxtContextMenu.msix"
$iconPath = Join-Path $rootPath "assets\icon.ico"
$makeAppxPath = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin\$sdkVersion\x64\MakeAppx.exe"
$publisher = if ($env:WINDOWS_PACKAGE_PUBLISHER) {
  $env:WINDOWS_PACKAGE_PUBLISHER
} else {
  "CN=Internxt Development"
}

if (-not (Test-Path -LiteralPath $makeAppxPath)) {
  throw "MakeAppx.exe from Windows SDK $sdkVersion was not found."
}

if (-not (Test-Path -LiteralPath $iconPath)) {
  throw "Internxt icon was not found: $iconPath"
}

$rootPackageJson = Get-Content $rootPackageJsonPath -Raw | ConvertFrom-Json
$versionParts = $rootPackageJson.version.Split(".")

if ($versionParts.Count -ne 3) {
  throw "The application version must contain three numeric parts."
}

$packageVersion = "$($versionParts[0]).$($versionParts[1]).$($versionParts[2]).0"
$escapedPublisher = [System.Security.SecurityElement]::Escape($publisher)

if (Test-Path -LiteralPath $stagingPath) {
  Remove-Item -LiteralPath $stagingPath -Recurse -Force
}

New-Item -ItemType Directory -Path $assetsPath -Force | Out-Null
New-Item -ItemType Directory -Path (Split-Path $outputPath) -Force | Out-Null

$manifest = Get-Content $manifestTemplatePath -Raw
$manifest = $manifest.Replace("__PUBLISHER__", $escapedPublisher)
$manifest = $manifest.Replace("__VERSION__", $packageVersion)
Set-Content -LiteralPath (Join-Path $stagingPath "AppxManifest.xml") -Value $manifest -Encoding utf8

Add-Type -AssemblyName System.Drawing

function Write-PackageLogo {
  param(
    [Parameter(Mandatory)]
    [string] $OutputPath,
    [Parameter(Mandatory)]
    [int] $Size
  )

  $source = [System.Drawing.Image]::FromFile($iconPath)
  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($source, 0, 0, $Size, $Size)
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
    $source.Dispose()
  }
}

Write-PackageLogo -OutputPath (Join-Path $assetsPath "StoreLogo.png") -Size 50
Write-PackageLogo -OutputPath (Join-Path $assetsPath "Square150x150Logo.png") -Size 150
Write-PackageLogo -OutputPath (Join-Path $assetsPath "Square44x44Logo.png") -Size 44

& $makeAppxPath pack /o /nv /d $stagingPath /p $outputPath

if ($LASTEXITCODE -ne 0) {
  throw "Context-menu sparse package generation failed."
}

if (-not (Test-Path -LiteralPath $outputPath)) {
  throw "Package generation completed without producing the expected MSIX: $outputPath"
}

Write-Host "Unsigned context-menu package created at $outputPath"
Write-Host "Publisher: $publisher"
Write-Host "Version: $packageVersion"
