#!/usr/bin/env pwsh

$appname=$args[0] -as [string]
$directory=$args[1] -as [string]

if (-not $directory -or -not $appname) {
    throw "Directory or app name must be filled out."
}
$diritems=Get-ChildItem -Path $directory -Recurse
$files=$diritems | Select-Object Name
$index=$files | Where-Object {
    $_.Name -eq "index.html"
}
if (($index | Measure-Object | Select-Object -Exp Count) -gt 1) {
    throw "Duplicate `"index.html`". in directory $directory"
}
if (-not $index) {
    throw "`"index.html`" does not found on directory $directory."
}
$raw;
try {
    $pathtofile=$directory.Normalize()
    $raw=Get-Content "$(if ($pathtofile -match '\\$' -or 
        $pathtofile -match '/$') { 
        $pathtofile 
    } else { $pathtofile + '/' })$($index.Name)" -Raw
} catch {
    throw "Malformed directory path."
}
$requestInit=@{
    Uri="http://localhost:8080/data?token=$TOKEN"
    Method="POST"
    Body=@{
        appName=$appname
        mainPage=$raw
    }
}
$response=Invoke-WebRequest @requestInit
if ($response.StatusCode -gt 199 -and $response.StatusCode -lt 300) {
    Write-Host "Successfully deploy your app." -ForegroundColor Green
    exit 0
} else {
    throw "Failed to deploy your app."
}
