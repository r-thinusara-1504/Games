@echo off
title Sands of Ra - Age of Pharaohs RTS Launcher
color 0e
echo ==============================================================
echo           SANDS OF RA: AGE OF PHARAOHS (3D RTS)
echo                WINDOWS ONE-CLICK LAUNCHER
echo ==============================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to run the game server locally.
    echo Please install Node.js from https://nodejs.org/ (LTS recommended).
    echo Opening nodejs.org in your browser...
    start https://nodejs.org/
    pause
    exit /b
)

echo [1/3] Node.js detected: OK
echo.

:: 2. Check if node_modules exist, if not run npm install
if not exist "node_modules\" (
    echo [2/3] Installing game dependencies (first launch only)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies. Check your internet connection.
        pause
        exit /b
    )
) else (
    echo [2/3] Dependencies verified: OK
)
echo.

:: 3. Launch local game server and open in browser
echo [3/3] Starting Sands of Ra local 3D game server...
start "" http://localhost:3000
call npm run dev

pause
