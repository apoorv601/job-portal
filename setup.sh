#!/bin/bash

echo "==================================================================="
echo "Hong Kong Expat Jobs Portal Setup Script"
echo "==================================================================="
echo

echo "Step 1: Installing dependencies..."
echo "-------------------------------------------------------------------"
npm install
echo

echo "Step 2: Checking MongoDB..."
echo "-------------------------------------------------------------------"
echo "For the application to work properly, you need to have MongoDB installed and running."
echo

if command -v mongod &> /dev/null; then
    echo "MongoDB found in PATH."
    echo "Checking if MongoDB is running..."
    
    # Check if MongoDB is running
    if pgrep -x "mongod" > /dev/null; then
        echo "MongoDB is already running."
    else
        echo "MongoDB is not running. Starting MongoDB..."
        echo "If this fails, please start MongoDB manually from another terminal before proceeding."
        mongod --fork --logpath /tmp/mongodb.log
        echo "Waiting 5 seconds for MongoDB to start..."
        sleep 5
    fi
else
    echo "MongoDB command not found in PATH."
    echo
    echo "Please ensure MongoDB is installed and running before proceeding:"
    echo "1. Install MongoDB:"
    echo "   - For Mac: brew install mongodb-community"
    echo "   - For Ubuntu: sudo apt-get install -y mongodb"
    echo "2. Start MongoDB service"
    echo "3. Run this script again"
    echo
    echo "Or run MongoDB using Docker if you have Docker installed:"
    echo "docker run -d -p 27017:27017 --name mongodb mongo"
    echo
    read -p "Press Enter to continue after MongoDB is running..."
fi

echo
echo "Step 3: Seeding the database with test data..."
echo "-------------------------------------------------------------------"
echo "This will add test users, companies, and job listings to the database."
node backend/seed-data.js

echo
echo "Step 4: Starting the server..."
echo "-------------------------------------------------------------------"
echo "The server will start. Press Ctrl+C to stop it when done."
echo
echo "==================================================================="
echo "Login credentials:"
echo
echo "ADMIN:"
echo "  username: admin"
echo "  password: admin123"
echo
echo "RECRUITER:"
echo "  username: recruiter"
echo "  password: recruiter123"
echo
echo "JOB SEEKER:"
echo "  username: jobseeker"
echo "  password: jobseeker123"
echo
echo "JOB SEEKER 2:"
echo "  username: maria"
echo "  password: jobseeker456"
echo "==================================================================="
echo

npm start
