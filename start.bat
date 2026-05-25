@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   评审材料模板管理系统 - 一键启动
echo ========================================
echo.

:: Kill any existing processes
echo [1/3] 清理旧进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul
echo       已清理。

:: Start backend
echo [2/3] 启动后端 (端口 8000)...
start "Backend-8000" cmd /c "cd /d %~dp0backend && C:\Users\杨仁先\.workbuddy\binaries\python\envs\review-system\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 4 /nobreak >nul
echo       后端已启动。

:: Start frontend
echo [3/3] 启动前端 (端口 5173)...
start "Frontend-5173" cmd /c "cd /d %~dp0frontend && C:\Users\杨仁先\.workbuddy\binaries\node\versions\22.12.0\npx.cmd vite --host --port 5173"
timeout /t 5 /nobreak >nul
echo       前端已启动。
echo.
echo ========================================
echo   启动完成！
echo   前端: http://localhost:5173
echo   后端: http://localhost:8000/docs
echo   (首次需初始化数据: python backend\seed.py)
echo ========================================
echo.
pause
