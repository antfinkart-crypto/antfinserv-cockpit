@echo off
title AntFinserv Cockpit CRM - COM Bridge Daemon (ARN-94204)
echo ========================================================
echo   ANTFINSERV COCKPIT CRM - LOCAL PYTHON COM BRIDGE
echo   AMFI Regd. Mutual Fund Distributor ARN-94204
echo   Zero File-Locking Windows COM Client
echo ========================================================
echo.

if exist ".venv\Scripts\python.exe" (
    echo [1/1] Launching Bi-Directional COM Bridge Daemon (.venv)...
    ".venv\Scripts\python.exe" bridge_daemon.py
    pause
    exit /b 0
)

where uv >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/2] Creating virtual environment with uv...
    uv venv --python 3.11 .venv
    uv pip install -r requirements.txt
    ".venv\Scripts\python.exe" bridge_daemon.py
    pause
    exit /b 0
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/2] Verifying Python dependencies...
    python -m pip install --quiet -r requirements.txt
    python bridge_daemon.py
    pause
    exit /b 0
)

echo [ERROR] Neither .venv nor Python was found on PATH.
pause
exit /b 1
