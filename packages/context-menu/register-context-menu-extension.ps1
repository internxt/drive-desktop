$ErrorActionPreference = "Stop"

$packageName = "com.internxt.drive.contextmenu"
$packagePath = Join-Path $PSScriptRoot "InternxtContextMenu.msix"

# The script is installed in resources\context-menu, while the sparse MSIX
# references Internxt.exe and its DLL from the application installation root.
$externalLocation = Resolve-Path (Join-Path $PSScriptRoot "..\..")

if (-not (Test-Path -LiteralPath $packagePath)) {
  throw "Context-menu package was not found: $packagePath"
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
