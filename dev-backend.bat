@echo off
cd backend && .venv\Scripts\uvicorn main:app --reload --port 8000
