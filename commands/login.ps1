#!/usr/bin/env pwsh

$user=$args[0]
$password=$args[1]

if (-not $user -or -not $password) {
    throw "Email or password is empty."
}
$requestInit=@{
    Uri="http://localhost:8080/oauth"
    Method="POST"
    Body=@{
        email=$user
        password=$password
    }
}
try {
    Invoke-RestMethod @requestInit -Verbose
} catch {
    Write-Error "Invalid credentials."
}
