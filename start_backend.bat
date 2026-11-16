@echo off
echo ===================================================
echo   BAIRAJESHWAR PREMIER LEAGUE (BPL) - BACKEND
echo ===================================================
set PYTHONPATH=backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
