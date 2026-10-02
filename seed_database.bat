@echo off
TITLE Smart City Infrastructure - Database Seeder
echo ========================================================
echo   Smart City Infrastructure Database & Accounts Seeder   
echo ========================================================
echo.

cd /d %~dp0backend
echo [*] Performing complete database reset and test account creation...
python complete_reset.py
if %errorlevel% neq 0 (
    echo [!] Standard python command failed, trying python3 or py...
    py complete_reset.py
)

echo.
echo [*] Database reset and test accounts seeding finished!
pause
