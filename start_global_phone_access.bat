@echo off
TITLE Smart City Infrastructure - Global Phone & Public Access Launcher
cd /d "%~dp0"

echo ======================================================================
echo   Smart City Infrastructure - Global Mobile & Web Deployment
echo ======================================================================
echo.

echo [*] Starting Docker backend, database, and frontend containers...
docker compose up -d
if errorlevel 1 (
    echo.
    echo [ERROR] Docker could not start containers. Make sure Docker Desktop is running!
    pause
    exit /b 1
)

echo.
echo [*] Launching Cloudflare Global Tunnel to expose http://localhost:3005...
echo [*] You can open this public HTTPS URL on ANY phone, tablet, or PC worldwide!
echo.
echo ======================================================================
echo   Local Access:      http://localhost:3005
echo   Local API Docs:    http://localhost:8005/docs
echo ======================================================================
echo.
echo Starting Tunnel... Watch below for your live 'https://*.trycloudflare.com' URL:
echo.

.\cloudflared.exe tunnel --url http://localhost:3005
