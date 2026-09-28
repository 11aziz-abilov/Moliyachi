@echo off
echo ========================================================
echo   Smart Finance AI (Moliyachi Platformasi) Ishga Tushmoqda...
echo ========================================================

echo 1. FastAPI Backend ishga tushirilmoqda (Port 8000)...
start "Smart Finance AI - FastAPI Backend" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo 2. Next.js Frontend ishga tushirilmoqda (Port 3000)...
start "Smart Finance AI - Next.js Frontend" cmd /k "cd frontend && npm run dev -- -p 3000"

echo.
echo ========================================================
echo   Tizim ishga tushirildi!
echo   Frontend UI: http://localhost:3000
echo   API Docs:    http://127.0.0.1:8000/docs
echo ========================================================
pause
