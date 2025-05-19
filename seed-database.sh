#!/bin/bash

echo "==================================================================="
echo "Hong Kong Expat Jobs Portal - Database Seeding Script"
echo "==================================================================="
echo
echo "This script will populate your MongoDB database with test data including:"
echo "- User accounts (Admin, Recruiter, Job Seekers)"
echo "- Company profiles"
echo "- Job listings"
echo
echo "This will DELETE all existing data in these collections!"
echo
echo "Press Ctrl+C now to cancel if you want to keep your existing data."
echo "Otherwise, press Enter to continue..."
read

echo
echo "Seeding database with test data..."
node backend/seed-data.js

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
read -p "Press Enter to exit..."
