require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Redirect console logs to stderr.log
const fsLog = require('fs');
const logStream = fsLog.createWriteStream('stderr.log', { flags: 'a' });

// Enhanced logging setup
console.log = function(...args) {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] INFO: ${args.join(' ')}\n`);
};
console.error = function(...args) {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] ERROR: ${args.join(' ')}\n`);
};
console.warn = function(...args) {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] WARN: ${args.join(' ')}\n`);
};

// Global error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.stack || error);
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});

// Use environment variables for DB credentials
const isDevelopment = process.env.NODE_ENV !== 'production';
const dbConfig = {
    host: process.env.DB_HOST || (isDevelopment ? 'localhost' : 'localhost'),
    username: process.env.DB_USER || (isDevelopment ? 'root' : 'adagepho_root'),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || (isDevelopment ? 'job_portal_db' : 'adagepho_job_portal_db'),
    dialect: 'mysql',
    logging: (msg) => console.log(msg) // Log SQL queries to stderr.log
};

console.log('Database configuration:', {
    host: dbConfig.host,
    database: dbConfig.database,
    username: dbConfig.username,
    environment: process.env.NODE_ENV || 'development'
});

const { sequelize, User, Job, Company, Application } = require('./backend/models');

// Configure Sequelize connection retry
sequelize.options.retry = {
    max: 3, // Maximum number of connection retries
    timeout: 3000, // Timeout between retries in milliseconds
    match: [ // Retry on these errors
        /ETIMEDOUT/,
        /ECONNREFUSED/,
        /SequelizeConnectionError/
    ]
};

// Test database connection at startup
const testDatabaseConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error.message);
        console.error('Connection details:', {
            host: dbConfig.host,
            database: dbConfig.database,
            username: dbConfig.username,
            environment: process.env.NODE_ENV || 'development'
        });
        return false;
    }
};

const app = express();
const PORT = process.env.PORT || 3000;
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
const frontendBuildPath = __dirname;
const BASE_PATH = process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/Job_for_Expats/' : '/');  // Added trailing slash for production

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

// DB Status endpoint - does not require authentication
app.get('/api/dbstatus', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({
            connected: true,
            error: null,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.json({
            connected: false,
            error: e.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Debug endpoint to show DB config (for troubleshooting only, remove in production)
app.get('/api/dbdebug', async (req, res) => {
    let status = 'unknown';
    let error = null;
    try {
        await sequelize.authenticate();
        status = 'connected';
    } catch (e) {
        status = 'error';
        error = e.message;
        console.error('Database connection error:', e);
    }
    res.json({
        db_host: process.env.DB_HOST,
        db_user: process.env.DB_USER,
        db_name: process.env.DB_NAME,
        db_status: status,
        error: error,
        node_env: process.env.NODE_ENV
    });
});

// --- Sequelize Associations (from old server.js) ---
User.hasMany(Application, { foreignKey: 'userId' });
Application.belongsTo(User, { foreignKey: 'userId' });
Job.hasMany(Application, { foreignKey: 'jobId' });
Application.belongsTo(Job, { foreignKey: 'jobId' });
Company.hasMany(Job, { foreignKey: 'companyId' });
Job.belongsTo(Company, { foreignKey: 'companyId' });

// --- Authentication Middleware ---
const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Authentication failed' });
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

const authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

// --- Registration Endpoint ---
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

// --- Improved Login Endpoint (accepts just username/password) ---
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

// --- Profile Endpoint (with auth) ---
app.get('/api/profile', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
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
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Enhanced /api/jobs endpoint with search support
app.get('/api/jobs', async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        const offset = (page - 1) * limit;

        // Search support
        const where = {};
        const { q, title, location, type, company } = req.query;
        if (q) {
            where[sequelize.Op.or] = [
                { title: { [sequelize.Op.like]: `%${q}%` } },
                { description: { [sequelize.Op.like]: `%${q}%` } },
                { location: { [sequelize.Op.like]: `%${q}%` } },
            ];
        }
        if (title) where.title = { [sequelize.Op.like]: `%${title}%` };
        if (location) where.location = { [sequelize.Op.like]: `%${location}%` };
        if (type) where.type = { [sequelize.Op.like]: `%${type}%` };

        // Company search (join)
        let include = [{ model: Company, attributes: ['id', 'name'] }];
        if (company) {
            include = [{
                model: Company,
                attributes: ['id', 'name'],
                where: { name: { [sequelize.Op.like]: `%${company}%` } }
            }];
        }

        const { count, rows: jobs } = await Job.findAndCountAll({
            where,
            include,
            attributes: ['id', 'title', 'description', 'location', 'type', 'salaryMin', 'salaryMax', 'salaryCurrency', 'postedAt', 'createdAt', 'updatedAt'],
            order: [['postedAt', 'DESC'], ['createdAt', 'DESC']],
            offset,
            limit
        });
        res.json({
            jobs,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'An error occurred while fetching jobs.' });
    }
});

app.post('/api/jobs', async (req, res) => {
    const { title, description, salary, location, type, companyId } = req.body;
    try {
        // Remove 'salary' from the create call as well
        const job = await Job.create({ title, description, location, type, companyId });
        res.status(201).json(job);
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'An error occurred while creating the job.' });
    }
});

// --- Search jobs endpoint (for /api/jobs/search?q=...) ---
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

// --- Enhanced /api/jobs/:id endpoint (flatten company, parse JSON fields) ---
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

app.put('/api/jobs/:id', async (req, res) => {
    const jobId = req.params.id;
    const { title, description, salary, location, type, companyId } = req.body;
    try {
        const job = await Job.findByPk(jobId);
        if (job) {
            // Remove 'salary' from the update call as well
            await job.update({ title, description, location, type, companyId });
            res.json(job);
        } else {
            res.status(404).json({ error: 'Job not found' });
        }
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'An error occurred while updating the job.' });
    }
});

app.delete('/api/jobs/:id', async (req, res) => {
    const jobId = req.params.id;
    try {
        const job = await Job.findByPk(jobId);
        if (job) {
            await job.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Job not found' });
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'An error occurred while deleting the job.' });
    }
});

app.get('/api/companies', async (req, res) => {
    try {
        const companies = await Company.findAll();
        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'An error occurred while fetching companies.' });
    }
});

app.post('/api/companies', async (req, res) => {
    const { name, description, website, email, phone } = req.body;
    try {
        const company = await Company.create({ name, description, website, email, phone });
        res.status(201).json(company);
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'An error occurred while creating the company.' });
    }
});

app.get('/api/companies/:id', async (req, res) => {
    const companyId = req.params.id;
    try {
        const company = await Company.findByPk(companyId);
        if (company) {
            res.json(company);
        } else {
            res.status(404).json({ error: 'Company not found' });
        }
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ error: 'An error occurred while fetching the company.' });
    }
});

app.put('/api/companies/:id', async (req, res) => {
    const companyId = req.params.id;
    const { name, description, website, email, phone } = req.body;
    try {
        const company = await Company.findByPk(companyId);
        if (company) {
            await company.update({ name, description, website, email, phone });
            res.json(company);
        } else {
            res.status(404).json({ error: 'Company not found' });
        }
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'An error occurred while updating the company.' });
    }
});

app.delete('/api/companies/:id', async (req, res) => {
    const companyId = req.params.id;
    try {
        const company = await Company.findByPk(companyId);
        if (company) {
            await company.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Company not found' });
        }
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'An error occurred while deleting the company.' });
    }
});

app.get('/api/profile', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
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
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/profile', async (req, res) => {
    const userId = req.user.id;
    const { name, email, password, phone, resume } = req.body;
    try {
        const user = await User.findByPk(userId);
        if (user) {
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await user.update({ name, email, password: hashedPassword, phone, resume });
            } else {
                await user.update({ name, email, phone, resume });
            }
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'An error occurred while updating the profile.' });
    }
});

app.post('/api/applications', async (req, res) => {
    const { userId, jobId, coverLetter, resume } = req.body;
    try {
        const application = await Application.create({ userId, jobId, coverLetter, resume });
        res.status(201).json(application);
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ error: 'An error occurred while creating the application.' });
    }
});

// Add auth to /api/applications and return applications for logged-in user
app.get('/api/applications', auth, async (req, res) => {
    const userId = req.user.id;
    try {
        const applications = await Application.findAll({
            where: { userId },
            include: [
                { model: Job, include: [{ model: Company, attributes: ['id', 'name'] }] }
            ]
        });
        res.json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'An error occurred while fetching applications.' });
    }
});

// --- Get current user's applications (for /api/applications/my) ---
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

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Base Path: ${BASE_PATH}`);
    
    // Test database connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
        console.error('Warning: Server started but database connection failed');
    }
});