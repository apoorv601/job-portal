#!/bin/bash

echo "==================================================================="
echo "Hong Kong Expat Jobs Portal Setup Script"
echo "==================================================================="
echo

echo "Step 1: Installing dependencies..."
echo "-------------------------------------------------------------------"
npm install
echo

echo "Step 2: Checking MariaDB..."
echo "-------------------------------------------------------------------"
echo "For the application to work properly, you need to have MariaDB installed and running."
echo
# Add MariaDB check here if needed

echo "Setup complete."

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
