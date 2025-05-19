const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const User = require('./models/User');
const Job = require('./models/Job');
const Company = require('./models/Company');
const Application = require('./models/Application');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret'; // In production, use environment variable

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expat_job_portal';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    connectTimeoutMS: 10000, // Give up initial connection after 10s
})

.then(() => {
    console.log('MongoDB Connected Successfully');
    console.log('Database is ready to store and retrieve job data');
})
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    console.error('Please make sure MongoDB is installed and running on your machine.');
    console.error('\nTry these solutions:');
    console.error('1. Install MongoDB Community Edition: https://www.mongodb.com/try/download/community');
    console.error('2. Or use MongoDB in Docker: docker run -d -p 27017:27017 --name mongodb mongo');
    console.error('3. Start MongoDB service if already installed');
    console.error('4. Or use MongoDB Atlas (cloud) and update the connection string');
    console.error('\nRun setup-mongodb.bat (Windows) or setup-mongodb.sh (Unix/Mac) for guided setup');
    console.error('\nThe app will continue to run but database functionality will not work.');
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, '../')));

// Authentication middleware
const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

// Role-based authorization middleware
const authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, role, name, email, nationality, currentLocation } = req.body;
        
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ 
            username, 
            password: hashedPassword, 
            role, 
            profile: { 
                name, 
                email,
                nationality,
                currentLocation
            }
        });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Update last login time
        user.lastLogin = new Date();
        await user.save();
        
        const token = jwt.sign({ 
            userId: user._id, 
            role: user.role,
            username: user.username
        }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ 
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                name: user.profile.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Get user profile
app.get('/api/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// Update user profile
app.put('/api/profile', auth, async (req, res) => {
    try {
        const { profile } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: { profile } },
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

// Upload resume
app.post('/api/upload/resume', auth, upload.single('resume'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        user.profile.resume = `/uploads/${req.file.filename}`;
        await user.save();
        res.json({ url: user.profile.resume });
    } catch (error) {
        res.status(500).json({ message: 'Resume upload failed', error: error.message });
    }
});

// Upload profile photo
app.post('/api/upload/photo', auth, upload.single('photo'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        user.profile.photo = `/uploads/${req.file.filename}`;
        await user.save();
        res.json({ url: user.profile.photo });
    } catch (error) {
        res.status(500).json({ message: 'Photo upload failed', error: error.message });
    }
});

// Post a job
app.post('/api/jobs', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        const jobData = {
            ...req.body,
            postedBy: req.user.userId
        };
        const job = new Job(jobData);
        await job.save();
        res.status(201).json({ message: 'Job posted successfully', jobId: job._id });
    } catch (error) {
        res.status(500).json({ message: 'Failed to post job', error: error.message });
    }
});

// Search jobs endpoint
app.get('/api/jobs/search', async (req, res) => {
    try {
        const { q: query } = req.query;
        if (!query || query.trim() === '') {
            // Return latest jobs if no query
            const jobs = await Job.find({}).sort({ postedAt: -1 }).limit(20).lean();
            return res.json(jobs);
        }
        // Use MongoDB text search with the text index we've already defined in the Job schema
        const jobs = await Job.find(
            { 
                $text: { $search: query },
                // Only include non-expired jobs
                $or: [
                    { expiryDate: { $gt: new Date() } },
                    { expiryDate: { $exists: false } }
                ]
            },
            // Add a relevance score
            { score: { $meta: "textScore" } }
        )
        .sort({ score: { $meta: "textScore" } }) // Sort by relevance
        .limit(20) // Limit to top 20 most relevant results
        .lean();
        
        // If text search doesn't find enough results, try a more flexible search
        if (jobs.length < 5) {
            const keywordJobs = await Job.find({
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { company: { $regex: query, $options: 'i' } },
                    { industry: { $regex: query, $options: 'i' } },
                    { category: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ],
                // Only include non-expired jobs
                $and: [
                    {
                        $or: [
                            { expiryDate: { $gt: new Date() } },
                            { expiryDate: { $exists: false } }
                        ]
                    }
                ]
            })
            .limit(20)
            .lean();
            
            // Combine and deduplicate results
            const combinedJobs = [...jobs];
            const existingIds = new Set(jobs.map(job => job._id.toString()));
            
            keywordJobs.forEach(job => {
                if (!existingIds.has(job._id.toString())) {
                    combinedJobs.push(job);
                    existingIds.add(job._id.toString());
                }
            });
            
            return res.json(combinedJobs);
        }
        
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to search jobs', error: error.message });
    }
});

// Get jobs posted by the current user
app.get('/api/jobs/my', auth, authorize(['recruiter']), async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user.userId })
            .sort({ postedAt: -1 }) // Most recent first
            .lean();
        
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve jobs', error: error.message });
    }
});

// Get job listings with pagination and filters
app.get('/api/jobs', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            location, 
            type, 
            industry, 
            minSalary, 
            maxSalary,
            suitableForExpats,
            language,
            visaSponsorshipOffered,
            search
        } = req.query;

        // Build filter query
        const filter = {};
        
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (type) filter.type = type;
        if (industry) filter.industry = industry;
        if (minSalary) filter['salary.min'] = { $gte: Number(minSalary) };
        if (maxSalary) filter['salary.max'] = { $lte: Number(maxSalary) };
        if (suitableForExpats === 'true') filter.suitableForExpats = true;
        if (visaSponsorshipOffered === 'true') filter.visaSponsorshipOffered = true;
        
        if (language) {
            filter.languages = {
                $elemMatch: {
                    language: language
                }
            };
        }
        
        // Text search
        if (search) {
            filter.$text = { $search: search };
        }

        // Pagination
        const startIndex = (Number(page) - 1) * Number(limit);
        
        // Get jobs with pagination
        const jobs = await Job.find(filter)
            .skip(startIndex)
            .limit(Number(limit))
            .sort({ postedAt: -1, featuredJob: -1 })
            .populate('postedBy', 'username profile.name');
            
        // Get total count
        const total = await Job.countDocuments(filter);
        
        res.json({
            jobs,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            totalJobs: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve jobs', error: error.message });
    }
});

// Get a single job by ID
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('postedBy', 'username profile.name')
            .populate('applicants.userId', 'username profile.name profile.email');
            
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve job', error: error.message });
    }
});

// Update a job
app.put('/api/jobs/:id', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check if the user is the job poster or an admin
        if (job.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this job' });
        }
        
        const updatedJob = await Job.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        res.json(updatedJob);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update job', error: error.message });
    }
});

// Delete a job
app.delete('/api/jobs/:id', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check if the user is the job poster or an admin
        if (job.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this job' });
        }
        
        await Job.findByIdAndDelete(req.params.id);
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete job', error: error.message });
    }
});

// Apply for a job
app.post('/api/jobs/:id/apply', auth, authorize(['applicant']), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check if already applied
        const alreadyApplied = job.applicants.some(
            applicant => applicant.userId.toString() === req.user.userId
        );
        
        if (alreadyApplied) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }
        
        // Add applicant to the job
        job.applicants.push({
            userId: req.user.userId,
            status: 'Applied',
            appliedAt: new Date()
        });
        // Also add job to user's appliedJobs array
        await User.findByIdAndUpdate(
            req.user.userId,
            { $addToSet: { appliedJobs: job._id } }
        );
        // Create an Application document for history
        await Application.create({
            applicantId: req.user.userId,
            jobId: job._id,
            jobTitle: job.title,
            status: 'Submitted',
            coverLetter: req.body.coverLetter || '',
            applicantName: req.body.applicantName || '',
            applicantEmail: req.body.applicantEmail || ''
        });
        await job.save();
        res.json({ message: 'Application submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to apply for job', error: error.message });
    }
});

// Get company by ID
app.get('/api/companies/:id', async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve company', error: error.message });
    }
});

// Create or update company
app.post('/api/companies', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        let company = await Company.findOne({ recruiterId: req.user.userId });
        
        if (company) {
            // Update existing company
            company = await Company.findByIdAndUpdate(
                company._id,
                { ...req.body, recruiterId: req.user.userId },
                { new: true }
            );
        } else {
            // Create new company
            company = new Company({
                ...req.body,
                recruiterId: req.user.userId
            });
            await company.save();
        }
        
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create/update company', error: error.message });
    }
});

// Upload company logo
app.post('/api/companies/logo', auth, authorize(['recruiter', 'admin']), upload.single('logo'), async (req, res) => {
    try {
        let company = await Company.findOne({ recruiterId: req.user.userId });
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        
        company.logo = `/uploads/${req.file.filename}`;
        await company.save();
        res.json({ url: company.logo });
    } catch (error) {
        res.status(500).json({ message: 'Logo upload failed', error: error.message });
    }
});

// Get all applications for recruiter
app.get('/api/applications', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        // Find all jobs posted by this recruiter
        const jobs = await Job.find({ postedBy: req.user.userId })
            .populate('applicants.userId', 'username profile.name profile.email profile.resume');
            
        // Extract applications from all jobs
        const applications = jobs.flatMap(job => 
            job.applicants.map(applicant => ({
                jobId: job._id,
                jobTitle: job.title,
                applicant: applicant.userId,
                status: applicant.status,
                appliedAt: applicant.appliedAt
            }))
        );
        
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve applications', error: error.message });
    }
});

// Get current user's applications
app.get('/api/applications/my', auth, async (req, res) => {
    try {
        // Find all applications for the current user
        const applications = await Application.find({ applicantId: req.user.userId })
            .sort({ createdAt: -1 }) // Most recent first
            .lean(); // Convert Mongoose docs to plain objects for faster serialization
        
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve applications', error: error.message });
    }
});

// Update application status
app.put('/api/jobs/:jobId/applications/:userId', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        const { status } = req.body;
        const { jobId, userId } = req.params;
        
        const job = await Job.findById(jobId);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check if the user is the job poster
        if (job.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this application' });
        }
        
        // Find and update the applicant status
        const applicant = job.applicants.find(a => a.userId.toString() === userId);
        
        if (!applicant) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        applicant.status = status;
        await job.save();
        
        res.json({ message: 'Application status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update application', error: error.message });
    }
});

// Get user details by ID (for recruiters to view applicants)
app.get('/api/users/:id', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load user details', error: error.message });
    }
});

// Moving this endpoints to be defined before the `/api/jobs/:id` endpoint to avoid path conflicts

// Get applicants for a specific job
app.get('/api/jobs/:id/applicants', auth, authorize(['recruiter']), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        
        // Verify that the job belongs to the current recruiter
        if (job.postedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to view applicants for this job' });
        }
        
        res.json(job.applicants);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve applicants', error: error.message });
    }
});

// Get applications by applicantId and jobId
app.get('/api/applications/query', auth, authorize(['recruiter']), async (req, res) => {
    try {
        const { applicantId, jobId } = req.query;
        
        if (!applicantId || !jobId) {
            return res.status(400).json({ message: 'Both applicantId and jobId are required' });
        }
        
        // Find the job to verify ownership
        const job = await Job.findById(jobId);
        if (!job || job.postedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to access this application' });
        }
        
        const applications = await Application.find({
            applicantId,
            jobId
        }).lean();
        
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve application', error: error.message });
    }
});

// Update application status by ID
app.put('/api/applications/:id/status', auth, authorize(['recruiter']), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Submitted', 'Under Review', 'Shortlisted', 'Rejected', 'Offered'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        
        const application = await Application.findById(req.params.id);
        
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        // Verify the job belongs to the recruiter
        const job = await Job.findById(application.jobId);
        if (!job || job.postedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to update this application' });
        }
        
        // Update the application status
        application.status = status;
        await application.save();
        
        // Also update the status in the job's applicants array
        await Job.findOneAndUpdate(
            { 
                _id: application.jobId, 
                'applicants.userId': application.applicantId 
            },
            {
                $set: { 'applicants.$.status': status }
            }
        );
        
        res.json({ message: 'Application status updated', application });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update application status', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
