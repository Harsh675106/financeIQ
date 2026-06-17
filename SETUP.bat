@echo off
REM Complete Setup Script for Finance App with Google OAuth (Windows)

echo.
echo ======================================
echo 🚀 Finance App Complete Setup (Windows)
echo ======================================
echo.

REM Step 1: Install backend dependencies
echo 📦 Step 1: Installing backend dependencies...
cd backend
call npm install axios
if errorlevel 1 (
    echo Error installing axios. Make sure npm is installed.
    pause
    exit /b 1
)
call npm install
if errorlevel 1 (
    echo Error installing backend dependencies.
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

REM Step 2: Install frontend dependencies
echo 📦 Step 2: Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo Error installing frontend dependencies.
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

REM Step 3: ML Service dependencies
echo 📦 Step 3: Setting up ML service...
cd ..\ml-service
call pip install -r requirements.txt
if errorlevel 1 (
    echo Error installing ML dependencies. Make sure Python is installed.
    pause
    exit /b 1
)
echo ✓ ML service dependencies installed
echo.

REM Step 4: Environment setup
echo ⚙️  Step 4: Creating environment files...
cd ..

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo ✓ Created backend/.env (please edit with your values)
) else (
    echo ✓ backend/.env already exists
)

if not exist "frontend\.env.local" (
    copy "frontend\.env.example" "frontend\.env.local"
    echo ✓ Created frontend/.env.local (please edit with your values)
) else (
    echo ✓ frontend/.env.local already exists
)

if not exist "ml-service\.env" (
    copy "ml-service\.env.example" "ml-service\.env"
    echo ✓ Created ml-service/.env
) else (
    echo ✓ ml-service/.env already exists
)
echo.

REM Final instructions
echo ======================================
echo ✅ Setup Complete!
echo ======================================
echo.
echo 📋 Next Steps:
echo.
echo 1. 🔐 Get Google OAuth Credentials:
echo    - Visit: https://console.cloud.google.com
echo    - Create OAuth 2.0 credentials
echo    - Copy Client ID and Client Secret
echo.
echo 2. ⚙️  Configure Environment Variables:
echo    - Edit: backend\.env
echo      • Add GOOGLE_CLIENT_ID
echo      • Add GOOGLE_CLIENT_SECRET
echo      • Set JWT_SECRET
echo      • Set DATABASE_URL
echo.
echo    - Edit: frontend\.env.local
echo      • Add NEXT_PUBLIC_GOOGLE_CLIENT_ID
echo.
echo 3. 🗄️  Update Database Schema:
echo    psql -U postgres -d finance -f database/migrations/001_add_oauth_support.sql
echo.
echo 4. 🚀 Start Services (in separate terminals):
echo    Terminal 1: cd backend ^& npm start
echo    Terminal 2: cd frontend ^& npm run dev
echo    Terminal 3: cd ml-service ^& python app.py
echo.
echo 5. 🌐 Open in Browser:
echo    http://localhost:3000
echo.
echo 📖 For detailed setup guide, see: GOOGLE_OAUTH_SETUP.md
echo.
pause
