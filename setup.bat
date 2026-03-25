@echo off
echo ==========================================
echo Context Graph Query System - Setup Script
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    exit /b 1
)
cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies
    exit /b 1
)
cd ..

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Create PostgreSQL database: createdb context_graph
echo 2. Configure backend/.env with your database credentials
echo 3. Initialize database: cd backend ^&^& npm run seed
echo 4. Ingest data: npm run ingest
echo 5. Start backend: npm run dev
echo 6. Start frontend (new terminal): cd frontend ^&^& npm run dev
echo 7. Open http://localhost:5173 in your browser
echo.
pause
