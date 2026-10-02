@echo off
TITLE Smart City Infrastructure and Management System - Launcher
echo ========================================================
echo   Smart City Infrastructure and Management System        
echo ========================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

REM Check if Node is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js 18+.
    pause
    exit /b 1
)

echo [1/3] Starting FastAPI Backend (Port 8005)...
start "SmartCity Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload"

echo [2/3] Starting React Vite Frontend (Port 3005)...
start "SmartCity Frontend" cmd /k "cd /d %~dp0frontend\cityreport && npm run dev"

echo [3/3] Launching web browser to http://localhost:3005 ...
timeout /t 3 /nobreak >nul
start "" http://localhost:3005

echo.
echo ========================================================
echo   Smart City Infrastructure System is LIVE!
echo ========================================================
echo.
echo Application URLs:
echo   - Frontend App:     http://localhost:3005
echo   - Backend API Docs: http://localhost:8005/docs
echo.
echo Default Demo Logins:
echo   - Superadmin: tarunta850@gmail.com (pass: password123)
echo   - Officer:    priya.officer@city.gov (pass: password123)
echo   - Citizen:    citizen@example.com (pass: citizen123)
echo ========================================================
echo.
echo Press any key to close this launcher window (services will stay running)...
pause >nul
