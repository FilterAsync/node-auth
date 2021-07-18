@echo off
title Authentication
for /f "tokens=*" %%v in (config.conf) do set %%v
if not exist "%CD%/login.ps1" (
    exit /b %FAILURE_EXIT_CODE%
)
reg query "HKCU\Console\Test" > nul 2> nul
if %ERRORLEVEL%==%SUCCESS_EXIT_CODE% (
    exit /b %SUCCESS_EXIT_CODE%
) else (
    reg add "HKCU\Console\Test" > nul 2> nul
)
:auth
    set /p email=Email: 
    set /p password=Password: 
    powershell -ExecutionPolicy RemoteSigned -Command "./login.ps1" %email% %password%
    if %ERRORLEVEL%==%SUCCESS_EXIT_CODE% (
        reg add "HKCU\Console\Test" /t REG_SZ /v Email /d %email% > nul 2> nul
        reg add "HKCU\Console\Test" /t REG_SZ /v Password /d %password% > nul 2> nul
        if %ERRORLEVEL%==%SUCCESS_EXIT_CODE% (
            echo Authentication Succeeded. && set /p _=Press any key to exit... 
            exit /b %SUCCESS_EXIT_CODE%
        ) else (
            echo Something went wrong!
            exit /b %FAILURE_EXIT_CODE%
        )
    ) else (
        echo Authentication Failed.
        goto :authchoice
    )
goto :EOF
:authchoice
    set /p userchoice=Do you want to continue? [Y/N]: 
    if %userchoice%==Y (
        goto :auth
    ) else (
        goto :end
    )
    pause>nul
goto :EOF
:end
    exit /b
goto :EOF
pause>nul
