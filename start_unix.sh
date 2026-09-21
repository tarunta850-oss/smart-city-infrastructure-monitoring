#!/usr/bin/env bash
# ========================================================
#        Smart Civic Road Issue Reporting System         
# ========================================================

echo "========================================================"
echo "       Smart Civic Road Issue Reporting System          "
echo "========================================================"
echo ""

# Ensure we are in project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.10+"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "[ERROR] node could not be found. Please install Node.js 18+"
    exit 1
fi

echo "[1/3] Starting FastAPI Backend (Port 8005)..."
cd "$SCRIPT_DIR/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload &
BACKEND_PID=$!

echo "[2/3] Starting React Vite Frontend (Port 3005)..."
cd "$SCRIPT_DIR/frontend/cityreport"
npm run dev &
FRONTEND_PID=$!

echo "[3/3] System starting up!"
echo ""
echo "--------------------------------------------------------"
echo "Application URLs:"
echo "  - Frontend: http://localhost:3005"
echo "  - Backend Docs: http://localhost:8005/docs"
echo ""
echo "Login Credentials:"
echo "  - Superadmin: superadmin@example.com (pass: admin123)"
echo "  - Officer: taruna.24.becs@acharya.ac.in (pass: password123)"
echo "  - Citizen: tarunta850@gmail.com (pass: password123)"
echo "--------------------------------------------------------"
echo ""
echo "Press CTRL+C to stop all services..."

# Trap CTRL+C and kill both background processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
