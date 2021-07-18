@echo off
title Deployment
for /f "tokens=*" %%v in (config.conf) do set %%v
:deploy
    set /p appname=Application Name: 
    set /p directory=Directory: 
    powershell -ExecutionPolicy RemoteSigned -Command "./test.ps1" %appname% %directory%
    if %ERRORLEVEL%==%SUCCESS_EXIT_CODE% (
        echo Deployment succeeded. && set /p _=Press any key to exit...
        exit /b %SUCCESS_EXIT_CODE
    ) else (
        goto :choice
    )
    pause>nul
goto :EOF
:choice
    set /P choice=Failed to deploy. Do you want to try again? [Y/N]:  
    if %choice%==Y (
        goto :deploy
    ) else (
        goto :end
    )
    pause>nul
goto :EOF
:end
    exit /b
goto :EOF
pause>nul
