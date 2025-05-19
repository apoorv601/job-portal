@echo off
echo ===================================================================
echo Hong Kong Expat Jobs Portal - MongoDB Setup Helper
echo ===================================================================
echo.
echo This script will help set up MongoDB for the Job Portal application.
echo.
echo MongoDB Options:
echo 1. Install MongoDB Community Edition (recommended)
echo 2. Use MongoDB with Docker
echo 3. Use MongoDB Atlas (cloud)
echo 4. I already have MongoDB installed/running
echo.
set /p option=Enter your choice (1-4): 

if "%option%"=="1" (
    echo.
    echo Please follow these steps:
    echo 1. Visit https://www.mongodb.com/try/download/community
    echo 2. Download MongoDB Community Server for Windows
    echo 3. Run the installer and follow installation instructions
    echo 4. Add MongoDB bin directory to your PATH
    echo 5. Create data directory: mkdir C:\data\db
    echo 6. Run MongoDB: mongod --dbpath=C:\data\db
    echo.
    echo After completing these steps, return to this script.
    echo.
    pause
)

if "%option%"=="2" (
    echo.
    echo Checking for Docker...
    docker -v >nul 2>&1
    if %errorlevel% neq 0 (
        echo Docker not found. Please install Docker Desktop first.
        echo Visit: https://www.docker.com/products/docker-desktop
        echo.
        pause
        exit /b 1
    )

    echo Running MongoDB container...
    docker run -d -p 27017:27017 --name mongodb mongo
    if %errorlevel% neq 0 (
        echo.
        echo Could not start MongoDB container.
        echo If it's already running, that's fine - we'll use the existing one.
    ) else (
        echo MongoDB Docker container started successfully!
    )
    echo.
)

if "%option%"=="3" (
    echo.
    echo Please follow these steps to set up MongoDB Atlas:
    echo 1. Create a free account on MongoDB Atlas: https://www.mongodb.com/cloud/atlas/register
    echo 2. Create a new cluster (the free tier is sufficient)
    echo 3. Configure network access to allow connections from your IP
    echo 4. Create a database user with password
    echo 5. Get your connection string
    echo.
    set /p connection_string=Enter your MongoDB Atlas connection string: 
    
    echo.
    echo Updating connection string in files...
    echo.
    
    echo // Updating backend/server.js
    powershell -Command "(Get-Content backend\server.js) -replace 'mongodb://localhost:27017/expat_job_portal', '%connection_string%' | Set-Content backend\server.js"
    
    echo // Updating backend/seed-data.js
    powershell -Command "(Get-Content backend\seed-data.js) -replace 'mongodb://localhost:27017/expat_job_portal', '%connection_string%' | Set-Content backend\seed-data.js"
    
    echo Connection strings updated successfully.
    echo.
)

echo ===================================================================
echo Seeding the database with test data
echo ===================================================================
echo.
echo This will add test users, companies, and job listings to the database.
echo.
echo Press Ctrl+C now to cancel if you want to keep your existing data.
echo Otherwise, press any key to continue...
pause > nul

echo.
echo Running seed-data.js script...
echo.
node backend/seed-data.js

if %errorlevel% neq 0 (
    echo.
    echo There was an error seeding the database.
    echo Please make sure MongoDB is running and accessible.
    echo Check SETUP_GUIDE.md for troubleshooting tips.
    echo.
    pause
    exit /b 1
)

echo.
echo ===================================================================
echo Database seeding complete!
echo.
echo The following test accounts have been created:
echo.
echo ADMIN:
echo   username: admin
echo   password: admin123
echo.
echo RECRUITER:
echo   username: recruiter
echo   password: recruiter123
echo.
echo JOB SEEKER:
echo   username: jobseeker
echo   password: jobseeker123
echo.
echo JOB SEEKER 2:
echo   username: maria
echo   password: jobseeker456
echo ===================================================================
echo.
echo Would you like to start the application now?
echo.
set /p start_app=Start application? (y/n): 

if /i "%start_app%"=="y" (
    echo.
    echo Starting the application...
    npm start
) else (
    echo.
    echo You can start the application later by running:
    echo npm start
    echo.
    echo Thank you for setting up the Hong Kong Expat Jobs Portal!
    echo.
    pause
)
