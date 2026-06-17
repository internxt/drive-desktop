param(
  [Parameter(Mandatory)]
  [string] $Thumbprint
)

$ErrorActionPreference = "Stop"

$certificatePath = "Cert:\LocalMachine\TrustedPeople\$Thumbprint"

if (Test-Path -LiteralPath $certificatePath) {
  Remove-Item -LiteralPath $certificatePath
}
