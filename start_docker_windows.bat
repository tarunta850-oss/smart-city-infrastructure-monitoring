@echo off
TITLE Smart Civic System - Docker Launcher
cd /d "%~dp0"

echo Starting Smart Civic in Docker Desktop...
docker compose up --detach
if errorlevel 1 (
    echo.
    echo Docker could not start the project. Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo.
echo Smart Civic is running at http://localhost:3005
start "" http://localhost:3005
pause
