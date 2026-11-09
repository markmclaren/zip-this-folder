@echo off
setlocal

:: Navigate to script directory
cd /d "%~dp0"

echo ========================================================
echo   Building "Zip This Folder" Extension
echo ========================================================
echo.

:: Check Node.js installation
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    goto :error
)

:: Check npm installation
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not found in your PATH.
    goto :error
)

:: Install dependencies if node_modules is missing
if not exist "node_modules" (
    echo [*] Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        goto :error
    )
    echo.
)

:: Typecheck
echo [*] Typechecking TypeScript sources...
call npm run check-types
if %ERRORLEVEL% neq 0 (
    echo [ERROR] TypeScript compilation/typecheck failed.
    goto :error
)
echo.

:: Build & Package VSIX
echo [*] Bundling extension and creating VSIX package...
call npm run package-vsix
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Packaging failed.
    goto :error
)
echo.

echo ========================================================
echo   Build Successful!
echo ========================================================
echo.
echo Generated VSIX file:
for %%f in (*.vsix) do echo   - %%~nxf  (%%~zf bytes)
echo.
echo To install in VS Code or Antigravity:
echo   code --install-extension zip-this-folder-0.1.0.vsix
echo.
goto :end

:error
echo.
echo ========================================================
echo   Build FAILED!
echo ========================================================
echo.

:end
:: If "--no-pause" was passed, don't pause
if /i "%1"=="--no-pause" exit /b %ERRORLEVEL%

:: If launched from Windows Explorer (double-clicked), keep window open
echo %cmdcmdline% | find /i "/c" >nul
if not errorlevel 1 (
    echo Press any key to exit...
    pause >nul
)

exit /b %ERRORLEVEL%
