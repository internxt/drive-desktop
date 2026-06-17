param(
  [Parameter(Mandatory)]
  [string] $CertificatePath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $CertificatePath)) {
  throw "Development certificate was not found: $CertificatePath"
}

# This helper is launched with RunAs by the registration script because
# LocalMachine\TrustedPeople can only be modified with administrator rights.
Import-Certificate `
  -FilePath $CertificatePath `
  -CertStoreLocation "Cert:\LocalMachine\TrustedPeople" |
  Out-Null
