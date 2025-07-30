# base64 -w 0 certificate.p12 > CERT_BASE64

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$version = $packageJson.version

$envPath = ".env"
$exePath = "build\Internxt-Setup-$version.exe"
$yamlPath = "build\latest.yml"
$certPath = "sign\certificate.p12"

Write-Host "Exe name: $exePath"

$envVars = Get-Content $envPath | Where-Object { $_ -match '^\s*[^#]' -and $_ -match '=' }

foreach ($line in $envVars) {
    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    Set-Variable -Name $key -Value $value
}

[IO.File]::WriteAllBytes($certPath, [Convert]::FromBase64String($CERT_BASE64))

try {
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath, $CERT_PASSWORD, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)
    Write-Host "Certificate loaded: $($cert.Subject)"
} catch {
    Write-Error "Failed to load certificate: $_"
}

.\sign\signtool.exe sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /f $certPath /p $CERT_PASSWORD $exePath

$hash = (Get-FileHash $exePath -Algorithm SHA512).Hash
$bytes = [System.Convert]::FromHexString($hash)
$base64 = [System.Convert]::ToBase64String($bytes)

Write-Host "Exe base64 hash: $base64"

(Get-Content $yamlPath) `
| ForEach-Object { $_ -replace '^(\s*sha512:\s*).+', "`$1$base64" } `
| Set-Content $yamlPath
