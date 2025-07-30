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

$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath, $CERT_PASSWORD, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)
$cert.Extensions | Where-Object { $_.Oid.FriendlyName -eq "Enhanced Key Usage" } | ForEach-Object { $_.EnhancedKeyUsages | ForEach-Object { $_.FriendlyName } }

Write-Host "Certificate loaded: $($cert.Subject)"

Import-PfxCertificate -FilePath $certPath -CertStoreLocation Cert:\CurrentUser\My -Password (ConvertTo-SecureString -String $CERT_PASSWORD -AsPlainText -Force)

Get-ChildItem Cert:\CurrentUser\My | Where-Object { $_.HasPrivateKey }

.\sign\signtool.exe sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /sha1 90E9EEE4AE33BA76F90B05CE1388F2AF463AD953 $exePath

$hash = (Get-FileHash $exePath -Algorithm SHA512).Hash
$bytes = [System.Convert]::FromHexString($hash)
$base64 = [System.Convert]::ToBase64String($bytes)

Write-Host "Exe base64 hash: $base64"

(Get-Content $yamlPath) `
| ForEach-Object { $_ -replace '^(\s*sha512:\s*).+', "`$1$base64" } `
| Set-Content $yamlPath
