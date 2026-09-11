@echo off
echo ========================================================
echo   RESCUENET AI - EMERGENCY MANAGEMENT GIS PLATFORM
echo   Launching Backend API & Frontend Dashboard...
echo ========================================================

start "RescueNet AI - Backend API (Port 8010)" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8010 --reload"
timeout /t 2 /nobreak >nul

start "RescueNet AI - Frontend Dashboard (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo [OK] Both servers launched!
echo - Frontend: http://localhost:5173
echo - Backend:  http://127.0.0.1:8010
echo - Swagger:  http://127.0.0.1:8010/docs
echo ========================================================
