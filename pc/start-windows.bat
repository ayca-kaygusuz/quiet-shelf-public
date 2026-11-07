@echo off
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Please install the free Node.js LTS from https://nodejs.org then try again.
  pause
  exit /b 1
)
node pc/server.mjs
pause
