# Hong Kong Expat Jobs

A specialized job portal designed for expatriates and foreigners seeking employment opportunities in Hong Kong.

## Features

### For Job Seekers
- Create a detailed profile with expat-specific information (nationality, visa status, languages)
- Search and filter jobs based on multiple criteria
- View expat-friendly jobs and positions offering visa sponsorship
- Easy job application process
- Resume/CV upload and management

### For Recruiters
- Post detailed job listings with options to mark as expat-friendly
- Indicate visa sponsorship availability
- Manage applications and hiring process
- Create company profiles to showcase company culture

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT (JSON Web Tokens)
- File Storage: Local file system (uploads folder)

## Quick Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. **MongoDB Setup**: 
   - Make sure MongoDB is installed and running
   - For detailed setup steps, run `setup-mongodb.bat` (Windows) or `setup-mongodb.sh` (Unix/Mac)

3. Seed the database with test data:
   ```
   node backend/seed-data.js
   ```

4. Start the server:
   ```
   npm start
   ```

5. Visit `http://localhost:5000` in your browser

For detailed setup instructions with MongoDB options, please see `SETUP_GUIDE.md`.

## Development

For development mode with auto-reload:
```
npm run dev
```

## Database Schema

### User Schema
- username (String, required): Unique username for login
- password (String, required): Encrypted password
- role (String, required): 'applicant', 'recruiter', or 'admin'
- profile (Object):
  - name (String): Full name
  - email (String): Email address
  - phone (String): Contact phone
  - nationality (String): Country of citizenship
  - currentLocation (String): Current city/country
  - languages (Array): Languages with proficiency levels
  - visaStatus (String): Hong Kong visa/work permit status
  - skills (Array): Professional skills
  - education (Array): Educational history with international context
  - workExperience (Array): Employment history with Hong Kong flag
  - resume (String): URL to uploaded resume
  - photo (String): URL to profile photo
- createdAt (Date): Account creation timestamp
- lastLogin (Date): Last login timestamp

### Job Schema
- title (String, required): Job title
- company (String, required): Company name
- location (String, required): Job location in Hong Kong
- district (String): Specific Hong Kong district
- type (String, required): Job type (full-time, part-time, etc.)
- industry (String): Industry sector
- description (String, required): Detailed job description
- responsibilities (Array): Key job responsibilities
- requirements (Array): Job requirements
- qualifications (Array): Required qualifications
- salary (Object): Salary details with range, currency, period
- benefits (Array): Job benefits
- languages (Array): Required languages with proficiency levels
- requiredExperience (Number): Experience in years
- visaSponsorshipOffered (Boolean): Whether visa sponsorship is available
- expiryDate (Date): Job posting expiration
- applicants (Array): Applicants with status and timestamps
- postedBy (ObjectId): Recruiter reference
- postedAt (Date): Posting timestamp
- suitableForExpats (Boolean): Whether suitable for expatriates
- featuredJob (Boolean): Featured status for premium listings

### Company Schema
- name (String, required): Company name
- logo (String): URL to company logo
- description (String): About the company
- industry (String): Industry sector
- website (String): Company website
- size (String): Company size range
- founded (Number): Year founded
- address (Object): Physical address with Hong Kong context
- contactPerson (Object): Primary contact details
- socialMedia (Object): Social media links
- benefits (Array): Company benefits
- culture (String): Company culture description
- photos (Array): URLs to company photos
- internationalOffices (Array): Countries with company offices
- recruiterId (ObjectId): Recruiter reference
- verified (Boolean): Company verification status
- createdAt (Date): Profile creation timestamp

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login and get JWT token

### User Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `POST /api/upload/resume` - Upload resume
- `POST /api/upload/photo` - Upload profile photo

### Jobs
- `GET /api/jobs` - Get job listings with filters and pagination
- `GET /api/jobs/:id` - Get single job details
- `POST /api/jobs` - Post a new job (recruiter only)
- `PUT /api/jobs/:id` - Update job posting (owner or admin only)
- `DELETE /api/jobs/:id` - Delete job posting (owner or admin only)
- `POST /api/jobs/:id/apply` - Apply for a job (applicant only)

### Company Profiles
- `GET /api/companies/:id` - Get company profile
- `POST /api/companies` - Create or update company profile (recruiter only)
- `POST /api/companies/logo` - Upload company logo (recruiter only)

### Applications
- `GET /api/applications` - Get all applications (recruiter only)
- `PUT /api/jobs/:jobId/applications/:userId` - Update application status (recruiter only)

## Future Enhancements
- Social media login
- Email notifications
- Advanced search with AI matching
- Interview scheduling
- Multilingual support
- Mobile app version

The application uses MongoDB with the following main collections:
- Users (job seekers and recruiters)
- Jobs
- Companies

## Future Enhancements
- Email notifications
- Advanced search features
- Interview scheduling
- Multilingual support
- Mobile application
