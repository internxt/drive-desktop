[CmdletBinding()]
param(
  [string]$ReleaseTag,
  [string]$Repository = 'internxt/mail-bridge-desktop',
  [string]$DestinationDirectory
)

if ([string]::IsNullOrWhiteSpace($DestinationDirectory)) {
  # Keep downloaded binaries outside source control while making the location predictable for Electron.
  $DestinationDirectory = Join-Path $PSScriptRoot '..\.mail-bridge'
}

if ([string]::IsNullOrWhiteSpace($ReleaseTag)) {
  # The core module owns the bridge version so Desktop and its local artifact cannot drift apart.
  $coreConstantsPath = Join-Path $PSScriptRoot '..\packages\core\src\backend\features\mail-bridge\constants.ts'
  if (-not (Test-Path -LiteralPath $coreConstantsPath -PathType Leaf)) {
    throw 'Could not find the Mail Bridge release pin in packages/core.'
  }

  $releaseTagMatch = Select-String -LiteralPath $coreConstantsPath -Pattern "export const mailBridgeReleaseTag = '(?<releaseTag>[^']+)';" | Select-Object -First 1
  if ($null -eq $releaseTagMatch) {
    throw 'Could not read the Mail Bridge release pin from packages/core.'
  }

  $ReleaseTag = $releaseTagMatch.Matches[0].Groups['releaseTag'].Value
}

# The release workflow includes the version in each platform archive name.
$archiveName = "mail-bridge_$($ReleaseTag.TrimStart('v'))_windows_amd64.zip"
# Isolate intermediate release files so a failed download cannot alter the installed binary.
$stagingDirectory = Join-Path ([System.IO.Path]::GetTempPath()) "mail-bridge-$([guid]::NewGuid())"

try {
  New-Item -ItemType Directory -Force -Path $stagingDirectory | Out-Null

  # Read the release metadata first to obtain GitHub's digest for this exact archive.
  $release = & gh release view $ReleaseTag --repo $Repository --json assets | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) {
    throw "Could not read Mail Bridge release $ReleaseTag from $Repository."
  }

  $releaseAsset = @($release.assets | Where-Object { $_.name -eq $archiveName })
  if ($releaseAsset.Count -ne 1 -or [string]::IsNullOrWhiteSpace($releaseAsset[0].digest)) {
    throw "Release $ReleaseTag does not provide a SHA-256 digest for $archiveName."
  }

  $releaseChecksum = $releaseAsset[0].digest -replace '^sha256:', ''
  if ($releaseChecksum -notmatch '^[a-fA-F0-9]{64}$') {
    throw "Release $ReleaseTag provides an invalid SHA-256 digest for $archiveName."
  }

  # Download only the Windows archive selected by the pinned release tag.
  & gh release download $ReleaseTag --repo $Repository --pattern $archiveName --dir $stagingDirectory
  if ($LASTEXITCODE -ne 0) {
    throw "Could not download Mail Bridge release $ReleaseTag from $Repository."
  }

  $archivePath = Join-Path $stagingDirectory $archiveName
  if (-not (Test-Path -LiteralPath $archivePath -PathType Leaf)) {
    throw "Release $ReleaseTag is missing $archiveName."
  }

  # Trust the binary only after its locally calculated digest matches GitHub's release metadata.
  $actualChecksum = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
  if ($actualChecksum -ine $releaseChecksum) {
    throw "Checksum mismatch for $archiveName."
  }

  # Older releases wrap the executable in a second archive; current releases contain it directly.
  Expand-Archive -LiteralPath $archivePath -DestinationPath $stagingDirectory -Force
  $executables = @(Get-ChildItem -LiteralPath $stagingDirectory -Recurse -File -Filter 'mail-bridge.exe')

  if ($executables.Count -eq 0) {
    $nestedArchives = @(
      Get-ChildItem -LiteralPath $stagingDirectory -Recurse -File -Filter 'mail-bridge*.zip' |
        Where-Object { $_.FullName -ne $archivePath }
    )
    if ($nestedArchives.Count -ne 1) {
      throw "$archiveName must contain exactly one nested Mail Bridge archive when it does not contain mail-bridge.exe directly."
    }

    Expand-Archive -LiteralPath $nestedArchives[0].FullName -DestinationPath $stagingDirectory -Force
    $executables = @(Get-ChildItem -LiteralPath $stagingDirectory -Recurse -File -Filter 'mail-bridge.exe')
  }

  if ($executables.Count -ne 1) {
    throw "$archiveName must contain exactly one mail-bridge.exe."
  }

  # Replace the local development copy only after every validation above succeeds.
  New-Item -ItemType Directory -Force -Path $DestinationDirectory | Out-Null
  Copy-Item -LiteralPath $executables[0].FullName -Destination (Join-Path $DestinationDirectory 'mail-bridge.exe') -Force
  Write-Output "Mail Bridge $ReleaseTag is ready at $DestinationDirectory."
} finally {
  # Release metadata and archives are temporary and must not remain after success or failure.
  $resolvedStagingDirectory = [System.IO.Path]::GetFullPath($stagingDirectory)
  $temporaryDirectory = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\'
  if (-not $resolvedStagingDirectory.StartsWith($temporaryDirectory, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Mail Bridge staging directory must remain inside the temporary directory.'
  }
  Remove-Item -LiteralPath $resolvedStagingDirectory -Recurse -Force -ErrorAction SilentlyContinue
}
