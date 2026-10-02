@echo off
TITLE Smart City Infrastructure - Docker Launcher
cd /d "%~dp0"

echo ========================================================
echo   Starting Smart City Infrastructure in Docker Desktop...
echo ========================================================
echo.

docker compose up --detach
if errorlevel 1 (
    echo.
    echo [ERROR] Docker could not start the containers. Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo.
echo [*] Waiting for services to initialize...
timeout /t 4 /nobreak >nul

echo [*] Opening http://localhost:3005 in your default browser...
start "" http://localhost:3005

echo.
echo ========================================================
echo   Smart City Infrastructure is running at:
echo   - Web App:       http://localhost:3005
echo   - Swagger Docs:  http://localhost:8005/docs
echo ========================================================
echo.
pause
