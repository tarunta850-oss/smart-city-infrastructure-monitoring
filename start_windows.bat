@echo off
TITLE Smart Civic System - Launcher
echo ========================================================
echo        Smart Civic Road Issue Reporting System         
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
start "Civic Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload"

echo [2/3] Starting React Vite Frontend (Port 3005)...
start "Civic Frontend" cmd /k "cd /d %~dp0frontend\cityreport && npm run dev"

echo [3/3] System starting up!
echo.
echo --------------------------------------------------------
echo Application URLs:
echo   - Frontend: http://localhost:3005
echo   - Backend Docs: http://localhost:8005/docs
echo.
echo Login Credentials:
echo   - Superadmin: superadmin@example.com (pass: admin123)
echo   - Officer: taruna.24.becs@acharya.ac.in (pass: password123)
echo   - Citizen: tarunta850@gmail.com (pass: password123)
echo --------------------------------------------------------
echo.
echo Press any key to exit this launcher window (services keep running)...
pause >nul
