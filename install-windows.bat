@echo off
:: Windows Installation Script for editly-mcp
:: Run this script as Administrator for best results

echo ===========================================
echo      Editly MCP - Windows Setup Script
echo ===========================================
echo.

:: Check if running as Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator ✓
) else (
    echo WARNING: Not running as Administrator
    echo Some installations may fail without admin privileges
    echo.
)

:: Check if Python is installed
python --version >nul 2>&1
if %errorLevel% == 0 (
    echo Python found ✓
    python --version
) else (
    echo Python not found ❌
    echo Please install Python 3.8+ from https://python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    goto :error
)

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo Node.js found ✓
    node --version
) else (
    echo Node.js not found ❌
    echo Please install Node.js 16+ from https://nodejs.org/
    goto :error
)

:: Check if FFmpeg is installed
ffmpeg -version >nul 2>&1
if %errorLevel% == 0 (
    echo FFmpeg found ✓
) else (
    echo FFmpeg not found ❌
    echo.
    echo Choose an installation method:
    echo 1. Install via Chocolatey (recommended)
    echo 2. Install via winget
    echo 3. Manual installation
    echo.
    set /p choice="Enter your choice (1-3): "
    
    if "%choice%"=="1" (
        echo Installing FFmpeg via Chocolatey...
        choco install ffmpeg -y
        if %errorLevel% neq 0 (
            echo Chocolatey installation failed
            echo Install Chocolatey first: https://chocolatey.org/install
            goto :error
        )
    ) else if "%choice%"=="2" (
        echo Installing FFmpeg via winget...
        winget install --id=Gyan.FFmpeg
        if %errorLevel% neq 0 (
            echo winget installation failed
            goto :error
        )
    ) else (
        echo Manual installation required:
        echo 1. Download FFmpeg from https://ffmpeg.org/download.html#build-windows
        echo 2. Extract to C:\ffmpeg\
        echo 3. Add C:\ffmpeg\bin to your system PATH
        echo 4. Restart this script
        pause
        exit /b 1
    )
)

:: Check for Visual Studio Build Tools
where cl >nul 2>&1
if %errorLevel% == 0 (
    echo Visual Studio Build Tools found ✓
) else (
    echo Visual Studio Build Tools not found ❌
    echo.
    echo Installing Visual Studio Build Tools...
    echo This requires internet connection and may take several minutes
    echo.
    set /p confirm="Continue with installation? (y/n): "
    if /i "%confirm%"=="y" (
        echo Downloading Visual Studio Build Tools...
        :: Note: This would require additional setup for automatic download
        echo Please manually install Visual Studio Build Tools from:
        echo https://visualstudio.microsoft.com/downloads/
        echo Make sure to include "C++ build tools" and "Windows 10/11 SDK"
        pause
    ) else (
        echo Build tools installation skipped
        echo You may encounter compilation errors without build tools
    )
)

:: Install editly-mcp
echo.
echo Installing editly-mcp...
npm install -g editly-mcp
if %errorLevel% neq 0 (
    echo Installation failed ❌
    echo.
    echo Common solutions:
    echo 1. Run as Administrator
    echo 2. Clear npm cache: npm cache clean --force
    echo 3. Try: npm install -g editly-mcp --unsafe-perm
    goto :error
)

:: Test installation
echo.
echo Testing installation...
editly-mcp --help >nul 2>&1
if %errorLevel% == 0 (
    echo Installation successful ✓
    echo.
    echo editly-mcp is now installed and ready to use!
    echo.
    echo Next steps:
    echo 1. Configure your MCP client to use editly-mcp
    echo 2. Test with: editly-mcp
    echo 3. Run diagnostics: npm run diagnose
) else (
    echo Installation test failed ❌
    echo The package was installed but may not be working correctly
    goto :error
)

echo.
echo Installation complete!
pause
exit /b 0

:error
echo.
echo Installation failed. Please check the error messages above.
echo.
echo For help:
echo 1. Check the README.md file
echo 2. Run system diagnostic: npm run diagnose
echo 3. Visit: https://github.com/moeloubani/editly-mcp
echo.
pause
exit /b 1