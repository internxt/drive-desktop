# https://docs.digicert.com/zf/digicert-keylocker/ci-cd-integrations-and-deployment-piplelines/plugins/github/install-client-tools-for-standard-keypair-signing-on-github.html

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$version = $packageJson.version

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$exePath = "build\Internxt-Setup-$version.exe"
$yamlPath = "build\latest.yml"
$certPath = Join-Path $scriptDir "certificate.p12"

Write-Host "Exe path: $exePath"

$envVars = Get-Content ".env" | Where-Object { $_ -match '^\s*[^#]' -and $_ -match '=' }

foreach ($line in $envVars) {
    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    Set-Variable -Name $key -Value $value
}

[IO.File]::WriteAllBytes($certPath, [Convert]::FromBase64String($CERT_BASE64))

smctl.exe creds save $SM_API_KEY $SM_CLIENT_CERT_PASSWORD

$env:SM_HOST = "http://clientauth.one.digicert.com/"
$env:SM_CLIENT_CERT_FILE = $certPath

smctl.exe healthcheck
smctl.exe sign --keypair-alias=key_1153997366 -d=SHA256 --input "$exePath" --verbose

$hash = (Get-FileHash $exePath -Algorithm SHA512).Hash
$bytes = [System.Convert]::FromHexString($hash)
$base64 = [System.Convert]::ToBase64String($bytes)

Write-Host "Exe base64 hash: $base64"

(Get-Content $yamlPath) `
| ForEach-Object { $_ -replace '^(\s*sha512:\s*).+', "`$1$base64" } `
| Set-Content $yamlPath
