const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const sequelize = require('./sequelize');
const User = require('./models/User');
const Job = require('./models/Job');
const Company = require('./models/Company');
const Application = require('./models/Application');

// Associations
User.hasMany(Application, { foreignKey: 'userId' });
Application.belongsTo(User, { foreignKey: 'userId' });
Job.hasMany(Application, { foreignKey: 'jobId' });
Application.belongsTo(Job, { foreignKey: 'jobId' });
Company.hasMany(Job, { foreignKey: 'companyId' });
Job.belongsTo(Company, { foreignKey: 'companyId' });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret'; // In production, use environment variable

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

// Serve frontend files from Job_Portal root (parent of backend)
const frontendBuildPath = path.join(__dirname, '..');
const BASE_PATH = process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/Job_for_Expats' : '/');

if (fs.existsSync(path.join(frontendBuildPath, 'index.html'))) {
    app.use(BASE_PATH, express.static(frontendBuildPath));
    // SPA fallback: serve index.html for any non-API, non-upload route under BASE_PATH
    app.get(`${BASE_PATH}*`, (req, res, next) => {
        if (!req.path.startsWith(`${BASE_PATH}api`) && !req.path.startsWith(`${BASE_PATH}uploads`)) {
            res.sendFile(path.join(frontendBuildPath, 'index.html'));
        } else {
            next();
        }
    });
}

// Remove or comment out this route to allow frontend SPA to handle /Job_for_Expats
// app.get('/Job_for_Expats', (req, res) => {
//     res.send('Job for Expats route is working!');
// });

// DB Status endpoint - does not require authentication
app.get('/api/dbstatus', (req, res) => {
    res.json({
        connected: true, // If server is running, MariaDB is connected
        error: null,
        timestamp: new Date().toISOString()
    });
});

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
    const { username, password, role, name, email, nationality, currentLocation } = req.body;
    try {
        const existing = await User.findOne({ where: { username } });
        if (existing) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            password: hashed,
            role,
            name,
            email,
            nationality,
            currentLocation
        });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user profile (MariaDB/Sequelize version, return profile object for frontend)
app.get('/api/profile', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Return a profile object for compatibility
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            profile: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                nationality: user.nationality,
                currentLocation: user.currentLocation,
                skills: user.skills ? JSON.parse(user.skills) : [],
                languages: user.languages ? JSON.parse(user.languages) : [],
                workExperience: user.workExperience ? JSON.parse(user.workExperience) : [],
                education: user.education ? JSON.parse(user.education) : [],
                resume: user.resume,
                photo: user.photo
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// Update user profile (MariaDB/Sequelize version)
app.put('/api/profile', auth, async (req, res) => {
    try {
        const { profile } = req.body;
        await User.update(profile, { where: { id: req.user.id } });
        const updatedUser = await User.findByPk(req.user.id);
        res.json(updatedUser);
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

// POST /api/jobs (MariaDB/Sequelize version)
app.post('/api/jobs', async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
        const where = {};
        if (query && query.trim() !== '') {
            where[sequelize.Sequelize.Op.or] = [
                { title: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
                { company: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
                { industry: { [sequelize.Sequelize.Op.like]: `%${query}%` } },
                { description: { [sequelize.Sequelize.Op.like]: `%${query}%` } }
            ];
        }
        const jobs = await Job.findAll({
            where,
            order: [['postedAt', 'DESC']],
            limit: 20
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to search jobs', error: error.message });
    }
});

// Get jobs posted by the current user (MariaDB/Sequelize version)
app.get('/api/jobs/my', auth, authorize(['recruiter']), async (req, res) => {
    try {
        const jobs = await Job.findAll({
            where: { recruiterId: req.user.userId },
            order: [['postedAt', 'DESC']]
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve jobs', error: error.message });
    }
});

// Get job listings with pagination and filters (MariaDB/Sequelize version)
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

        // Build filter query for Sequelize
        const where = {};
        if (location) where.location = { [sequelize.Sequelize.Op.like]: `%${location}%` };
        if (type) where.type = type;
        if (industry) where.industry = industry;
        if (minSalary) where.salaryMin = { [sequelize.Sequelize.Op.gte]: Number(minSalary) };
        if (maxSalary) where.salaryMax = { [sequelize.Sequelize.Op.lte]: Number(maxSalary) };
        if (suitableForExpats === 'true') where.suitableForExpats = true;
        if (visaSponsorshipOffered === 'true') where.visaSponsorshipOffered = true;
        if (language) where.languages = { [sequelize.Sequelize.Op.like]: `%${language}%` };
        if (search) {
            where[sequelize.Sequelize.Op.or] = [
                { title: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
                { company: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
                { industry: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
                { description: { [sequelize.Sequelize.Op.like]: `%${search}%` } }
            ];
        }
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows: jobs } = await Job.findAndCountAll({
            where,
            order: [['postedAt', 'DESC']],
            offset,
            limit: Number(limit)
        });
        res.json({
            jobs,
            totalPages: Math.ceil(count / Number(limit)),
            currentPage: Number(page),
            totalJobs: count
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve jobs', error: error.message });
    }
});

// Get a single job by ID (MariaDB/Sequelize version, flatten company info)
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        let company = null;
        if (job.companyId) {
            company = await Company.findByPk(job.companyId);
        }
        // Parse JSON fields for frontend compatibility
        const requirements = job.requirements ? JSON.parse(job.requirements) : [];
        const responsibilities = job.responsibilities ? JSON.parse(job.responsibilities) : [];
        const languages = job.languages ? JSON.parse(job.languages) : [];
        const benefits = job.benefits ? JSON.parse(job.benefits) : [];
        // Salary structure for UI
        const salary = {
            min: job.salaryMin,
            max: job.salaryMax,
            currency: job.salaryCurrency || 'HKD',
            period: job.salaryPeriod || 'monthly'
        };
        res.json({
            ...job.toJSON(),
            requirements,
            responsibilities,
            languages,
            benefits,
            salary,
            company: company ? company.name : job.company
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a job (MariaDB/Sequelize version)
app.put('/api/jobs/:id', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        // Optionally check if the user is the job poster or admin
        await job.update(req.body);
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update job', error: error.message });
    }
});

// Delete a job (MariaDB/Sequelize version)
app.delete('/api/jobs/:id', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        await job.destroy();
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete job', error: error.message });
    }
});

// Apply for a job (MariaDB/Sequelize version)
app.post('/api/jobs/:id/apply', auth, authorize(['applicant']), async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        // Check if already applied
        const existing = await Application.findOne({ where: { userId: req.user.id, jobId: job.id } });
        if (existing) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }
        // Create application
        await Application.create({
            userId: req.user.id,
            jobId: job.id,
            coverLetter: req.body.coverLetter || '',
            applicantName: req.body.applicantName || '',
            applicantEmail: req.body.applicantEmail || '',
            status: 'Submitted',
            appliedAt: new Date()
        });
        res.json({ message: 'Application submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to apply for job', error: error.message });
    }
});

// POST /api/applications (MariaDB/Sequelize version)
app.post('/api/applications', async (req, res) => {
  try {
    const application = await Application.create(req.body);
    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

// Get current user's applications (MariaDB/Sequelize version)
app.get('/api/applications/my', auth, async (req, res) => {
    try {
        const applications = await Application.findAll({
            where: { userId: req.user.id },
            order: [['appliedAt', 'DESC']]
        });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve applications', error: error.message });
    }
});

// Get all applications for recruiter (MariaDB/Sequelize version)
app.get('/api/applications', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        // Find all jobs posted by this recruiter
        const jobs = await Job.findAll({ where: { recruiterId: req.user.id } });
        const jobIds = jobs.map(j => j.id);
        const applications = await Application.findAll({
            where: { jobId: jobIds },
            order: [['appliedAt', 'DESC']]
        });
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

// Get user details by ID (for recruiters to view applicants) - MariaDB/Sequelize version, return profile object
app.get('/api/users/:id', auth, authorize(['recruiter', 'admin']), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            profile: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                nationality: user.nationality,
                currentLocation: user.currentLocation,
                skills: user.skills ? JSON.parse(user.skills) : [],
                languages: user.languages ? JSON.parse(user.languages) : [],
                workExperience: user.workExperience ? JSON.parse(user.workExperience) : [],
                education: user.education ? JSON.parse(user.education) : [],
                resume: user.resume,
                photo: user.photo
            }
        });
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
