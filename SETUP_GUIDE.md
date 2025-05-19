# Hong Kong Expat Jobs Portal - Setup Guide

This guide will help you set up the Hong Kong Expat Jobs Portal application step by step.

## Prerequisites

1. **Node.js and npm**: Required to run the application
2. **MongoDB**: Required for the database

## MongoDB Setup

### Option 1: Install MongoDB locally

1. Download MongoDB Community Server from the [official website](https://www.mongodb.com/try/download/community)
2. Follow the installation instructions for Windows
3. Add MongoDB bin directory to your system PATH
4. Create a data directory for MongoDB: `mkdir -p C:\data\db`
5. Start MongoDB server: `mongod --dbpath=C:\data\db`

### Option 2: Use MongoDB Atlas (Cloud)

1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster
3. Configure network access to allow connections from your IP
4. Create a database user
5. Get your connection string
6. Update the `MONGODB_URI` in `backend/server.js` and `backend/seed-data.js`

## Setting Up the Application

### Step 1: Install dependencies

```powershell
cd C:\Workspace\Job_Portal
npm install
```

### Step 2: Start MongoDB (if using local installation)

Open a new PowerShell window and run:

```powershell
mongod --dbpath=C:\data\db
```

Keep this terminal window open while working with the application.

### Step 3: Seed the database with test data

```powershell
cd C:\Workspace\Job_Portal
node backend/seed-data.js
```

You should see success messages:
- "Users created successfully"
- "Companies created successfully"
- "Jobs created successfully"
- "All data seeded successfully"

### Step 4: Start the application

```powershell
npm start
```

Visit http://localhost:5000 in your web browser.

## Test Accounts

Once the database is seeded, you can use the following accounts to test the application:

### Admin User
- **Username**: admin
- **Password**: admin123

### Recruiter User
- **Username**: recruiter
- **Password**: recruiter123

### Job Seeker Users
- **Username**: jobseeker
- **Password**: jobseeker123
- **Username**: maria
- **Password**: jobseeker456

## Troubleshooting

### MongoDB Connection Issues

If you see errors like "Operation buffering timed out" or "MongoNetworkError", check that:

1. MongoDB is running (look for the mongod process)
2. The MongoDB connection string in the code is correct
3. Your firewall allows connections to MongoDB (port 27017)

### Fixing MongoDB Connection in the Code

If needed, modify the MongoDB connection string in these files:
- `backend/server.js`
- `backend/seed-data.js`

Default connection string: `mongodb://localhost:27017/expat_job_portal`

### Unable to Install MongoDB

If you can't install MongoDB locally, consider:
1. Using Docker: `docker run -d -p 27017:27017 --name mongodb mongo`
2. Using MongoDB Atlas (cloud service) and updating connection strings

## Database Schema

Review the README.md for detailed information about the database schema and API endpoints.
