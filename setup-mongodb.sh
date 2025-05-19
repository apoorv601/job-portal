#!/bin/bash

echo "==================================================================="
echo "Hong Kong Expat Jobs Portal - MongoDB Setup Helper"
echo "==================================================================="
echo
echo "This script will help set up MongoDB for the Job Portal application."
echo
echo "MongoDB Options:"
echo "1. Install MongoDB Community Edition (recommended)"
echo "2. Use MongoDB with Docker"
echo "3. Use MongoDB Atlas (cloud)"
echo "4. I already have MongoDB installed/running"
echo
read -p "Enter your choice (1-4): " option

if [ "$option" = "1" ]; then
    echo
    echo "Please follow these steps for your operating system:"
    echo
    echo "For macOS:"
    echo "1. Install Homebrew if not installed: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "2. Install MongoDB: brew tap mongodb/brew && brew install mongodb-community"
    echo "3. Start MongoDB: brew services start mongodb-community"
    echo
    echo "For Ubuntu/Debian:"
    echo "1. Import MongoDB public key: wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -"
    echo "2. Create list file: echo \"deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse\" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list"
    echo "3. Update package database: sudo apt-get update"
    echo "4. Install MongoDB: sudo apt-get install -y mongodb-org"
    echo "5. Start MongoDB: sudo systemctl start mongod"
    echo
    echo "After completing these steps, return to this script."
    echo
    read -p "Press Enter to continue..."
fi

if [ "$option" = "2" ]; then
    echo
    echo "Checking for Docker..."
    if ! command -v docker &> /dev/null; then
        echo "Docker not found. Please install Docker first."
        echo "Visit: https://www.docker.com/products/docker-desktop"
        echo
        read -p "Press Enter to exit..."
        exit 1
    fi

    echo "Running MongoDB container..."
    docker run -d -p 27017:27017 --name mongodb mongo
    if [ $? -ne 0 ]; then
        echo
        echo "Could not start MongoDB container."
        echo "If it's already running, that's fine - we'll use the existing one."
    else
        echo "MongoDB Docker container started successfully!"
    fi
    echo
fi

if [ "$option" = "3" ]; then
    echo
    echo "Please follow these steps to set up MongoDB Atlas:"
    echo "1. Create a free account on MongoDB Atlas: https://www.mongodb.com/cloud/atlas/register"
    echo "2. Create a new cluster (the free tier is sufficient)"
    echo "3. Configure network access to allow connections from your IP"
    echo "4. Create a database user with password"
    echo "5. Get your connection string"
    echo
    read -p "Enter your MongoDB Atlas connection string: " connection_string
    
    echo
    echo "Updating connection string in files..."
    echo
    
    echo "// Updating backend/server.js"
    sed -i "s|mongodb://localhost:27017/expat_job_portal|$connection_string|g" backend/server.js
    
    echo "// Updating backend/seed-data.js"
    sed -i "s|mongodb://localhost:27017/expat_job_portal|$connection_string|g" backend/seed-data.js
    
    echo "Connection strings updated successfully."
    echo
fi

echo "==================================================================="
echo "Seeding the database with test data"
echo "==================================================================="
echo
echo "This will add test users, companies, and job listings to the database."
echo
echo "Press Ctrl+C now to cancel if you want to keep your existing data."
echo "Otherwise, press Enter to continue..."
read

echo
echo "Running seed-data.js script..."
echo
node backend/seed-data.js

if [ $? -ne 0 ]; then
    echo
    echo "There was an error seeding the database."
    echo "Please make sure MongoDB is running and accessible."
    echo "Check SETUP_GUIDE.md for troubleshooting tips."
    echo
    read -p "Press Enter to exit..."
    exit 1
fi

echo
echo "==================================================================="
echo "Database seeding complete!"
echo
echo "The following test accounts have been created:"
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
echo "Would you like to start the application now?"
echo
read -p "Start application? (y/n): " start_app

if [[ "$start_app" =~ ^[Yy]$ ]]; then
    echo
    echo "Starting the application..."
    npm start
else
    echo
    echo "You can start the application later by running:"
    echo "npm start"
    echo
    echo "Thank you for setting up the Hong Kong Expat Jobs Portal!"
    echo
    read -p "Press Enter to exit..."
fi
