@echo off
cd /d "%~dp0.."
if exist "%~dp0..\runtime\node.exe" (
  "%~dp0..\runtime\node.exe" "%~dp0server.mjs"
  pause
  exit /b
)
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Keep the portable runtime folder inside quiet-shelf.
  pause
  exit /b 1
)
node pc/server.mjs
pause
