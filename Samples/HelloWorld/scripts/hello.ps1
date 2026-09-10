param(
    [string]$Name = "World"
)

Write-Host "Hello, $Name! Running from $(Get-Location)"
Write-Host "PSScriptRoot is $PSScriptRoot"

exit 0
