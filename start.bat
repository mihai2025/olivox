@echo off
title husepersonalizate.ro - Dev Server
echo.
echo  ========================================
echo   husepersonalizate.ro - Dev Server
echo  ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo  [*] Installing dependencies...
    echo.
    call npm install
    echo.
)

echo  [*] Starting development server...
echo  [*] Open http://localhost:3000 in browser
echo.
call npx next dev -p 3000
pause
