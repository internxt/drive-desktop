$packageJson = Get-Content "..\package.json" -Raw | ConvertFrom-Json
$version = $packageJson.version

$envPath = "..\.env"
$exeFileName = "Internxt-Setup-$version.exe"
$exePath = "..\build\$exeFileName"
$yamlPath = "..\build\latest.yml"

Write-Host "Exe name: $exeFileName"

$envVars = Get-Content $envPath | Where-Object { $_ -match '^\s*[^#]' -and $_ -match '=' }

foreach ($line in $envVars) {
    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    Set-Variable -Name $key -Value $value
}

Write-Host "SM_API_KEY: $SM_API_KEY"
Write-Host "SM_CLIENT_CERT_PASSWORD: $SM_CLIENT_CERT_PASSWORD"

.\smctl.exe creds save $SM_API_KEY $SM_CLIENT_CERT_PASSWORD

$env:SM_HOST = "http://clientauth.one.digicert.com/"
$env:SM_CLIENT_CERT_FILE = "certificate.p12"

.\smctl.exe sign --keypair-alias=key_1153997366 -d=SHA256 --input "$exePath" --verbose

$hash = (Get-FileHash $exePath -Algorithm SHA512).Hash
$bytes = [System.Convert]::FromHexString($hash)
$base64 = [System.Convert]::ToBase64String($bytes)

Write-Host "Exe base64 hash: $base64"

(Get-Content $yamlPath) `
| ForEach-Object { $_ -replace '^(\s*sha512:\s*).+', "`$1$base64" } `
| Set-Content $yamlPath
