# https://docs.digicert.com/zf/digicert-keylocker/ci-cd-integrations-and-deployment-piplelines/plugins/github/install-client-tools-for-standard-keypair-signing-on-github.html

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$version = $packageJson.version

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$exePath = "build\Internxt-Setup-$version.exe"
$yamlPath = "build\latest.yml"
$certPath = Join-Path $scriptDir "certificate.p12"
$contextMenuDllPath = "packages\context-menu\dist\internxt_context_menu.dll"
$contextMenuHostPath = "packages\context-menu\dist\internxt_context_menu_host.exe"
$contextMenuMsixPath = "packages\context-menu\dist\InternxtContextMenu.msix"

Write-Host "Exe path: $exePath"

$envVars = Get-Content ".env" | Where-Object { $_ -match '^\s*[^#]' -and $_ -match '=' }

foreach ($line in $envVars) {
    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    Set-Variable -Name $key -Value $value
}

[IO.File]::WriteAllBytes($certPath, [Convert]::FromBase64String($SM_CLIENT_CERT_FILE_B64))

smctl.exe creds save $SM_API_KEY $SM_CLIENT_CERT_PASSWORD

$env:SM_HOST = "https://clientauth.one.digicert.com/"
$env:SM_CLIENT_CERT_FILE = $certPath

smctl.exe healthcheck

if ($LASTEXITCODE -ne 0) {
    throw "DigiCert Software Trust Manager health check failed."
}

function Sign-Artifact {
    param(
        [Parameter(Mandatory)]
        [string] $Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Artifact to sign was not found: $Path"
    }

    smctl.exe sign --keypair-alias=key_1153997366 -d=SHA256 --input "$Path" --verbose

    if ($LASTEXITCODE -ne 0) {
        throw "DigiCert signing failed for: $Path"
    }
}

# Sign the native files before generating the MSIX. The production packaging
# command deliberately does not recompile them, so these signatures are kept.
Sign-Artifact -Path $contextMenuDllPath
Sign-Artifact -Path $contextMenuHostPath

# The MSIX manifest publisher must exactly match its signing certificate.
# Derive it from the DLL signature so no separate GitHub variable can drift.
$contextMenuSignature = Get-AuthenticodeSignature $contextMenuDllPath

if (
    $contextMenuSignature.Status -ne "Valid" -or
    -not $contextMenuSignature.SignerCertificate
) {
    throw "The signed context-menu DLL does not have a valid signer certificate."
}

$env:WINDOWS_PACKAGE_PUBLISHER =
    $contextMenuSignature.SignerCertificate.Subject

& npm.cmd run package:context-menu:production

if ($LASTEXITCODE -ne 0) {
    throw "Production context-menu MSIX generation failed."
}

Sign-Artifact -Path $contextMenuMsixPath

# Electron Builder now bundles the signed DLL, host, and MSIX into the main
# installer. Production packaging omits the development certificate.
& npx.cmd electron-builder build --publish never

if ($LASTEXITCODE -ne 0) {
    throw "Electron installer generation failed."
}

Sign-Artifact -Path $exePath

$hash = (Get-FileHash $exePath -Algorithm SHA512).Hash
$bytes = [System.Convert]::FromHexString($hash)
$base64 = [System.Convert]::ToBase64String($bytes)

Write-Host "Exe base64 hash: $base64"

(Get-Content $yamlPath) `
| ForEach-Object { $_ -replace '^(\s*sha512:\s*).+', ('${1}' + $base64) } `
| Set-Content $yamlPath
