const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Job = require('./models/Job');
const Company = require('./models/Company');

const MONGODB_URI = 'mongodb://localhost:27017/expat_job_portal';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    connectTimeoutMS: 10000, // Give up initial connection after 10s
})
.then(() => console.log('MongoDB Connected for seeding'))
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    console.error('\nPlease ensure MongoDB is running before seeding the database.');
    console.error('\nTry these solutions:');
    console.error('1. Install MongoDB Community Edition: https://www.mongodb.com/try/download/community');
    console.error('2. Or use MongoDB in Docker: docker run -d -p 27017:27017 --name mongodb mongo');
    console.error('3. Start MongoDB service if already installed');
    console.error('4. Or use MongoDB Atlas (cloud) and update the connection string');
    console.error('\nRun setup-mongodb.bat (Windows) or setup-mongodb.sh (Unix/Mac) for guided setup');
    process.exit(1);
});

// Create dummy users
const createUsers = async () => {
    try {
        // Clear existing users
        await User.deleteMany({});
        
        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
            username: 'admin',
            password: adminPassword,
            role: 'admin',
            profile: {
                name: 'Admin User',
                email: 'admin@hkexpatjobs.com',
                nationality: 'Hong Kong'
            },
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        // Create recruiter user
        const recruiterPassword = await bcrypt.hash('recruiter123', 10);
        const recruiter = new User({
            username: 'recruiter',
            password: recruiterPassword,
            role: 'recruiter',
            profile: {
                name: 'Sarah Wong',
                email: 'recruiter@hkexpatjobs.com',
                phone: '+852 5555 1234',
                nationality: 'Hong Kong'
            },
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        // Create job seeker user
        const jobSeekerPassword = await bcrypt.hash('jobseeker123', 10);
        const jobSeeker = new User({
            username: 'jobseeker',
            password: jobSeekerPassword,
            role: 'applicant',
            profile: {
                name: 'John Smith',
                email: 'john.smith@example.com',
                phone: '+1 234 567 8901',
                nationality: 'United States',
                currentLocation: 'New York, USA',
                languages: [
                    { language: 'English', proficiency: 'Native' },
                    { language: 'Mandarin', proficiency: 'Basic' }
                ],
                visaStatus: 'Seeking sponsorship',
                yearsOfExperience: 5,
                skills: ['Project Management', 'Marketing Strategy', 'Digital Marketing', 'Team Leadership'],
                education: [
                    {
                        degree: 'Bachelor of Business Administration',
                        institution: 'New York University',
                        field: 'Marketing',
                        startDate: new Date('2015-09-01'),
                        endDate: new Date('2019-05-30'),
                        country: 'United States'
                    }
                ],
                workExperience: [
                    {
                        title: 'Marketing Manager',
                        company: 'ABC Corporation',
                        location: 'New York',
                        startDate: new Date('2019-06-15'),
                        endDate: new Date('2023-04-30'),
                        description: 'Led marketing campaigns for various product lines, managed a team of 5 marketing professionals.',
                        isInHongKong: false
                    }
                ],
                resume: '/uploads/sample-resume.pdf'
            },
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        // Create another job seeker
        const jobSeeker2Password = await bcrypt.hash('jobseeker456', 10);
        const jobSeeker2 = new User({
            username: 'maria',
            password: jobSeeker2Password,
            role: 'applicant',
            profile: {
                name: 'Maria Garcia',
                email: 'maria.garcia@example.com',
                phone: '+34 612 345 678',
                nationality: 'Spain',
                currentLocation: 'Barcelona, Spain',
                languages: [
                    { language: 'Spanish', proficiency: 'Native' },
                    { language: 'English', proficiency: 'Professional' },
                    { language: 'French', proficiency: 'Intermediate' }
                ],
                visaStatus: 'Not applicable yet',
                yearsOfExperience: 3,
                skills: ['Web Development', 'React', 'Node.js', 'MongoDB', 'Express'],
                education: [
                    {
                        degree: 'Master of Computer Science',
                        institution: 'University of Barcelona',
                        field: 'Software Engineering',
                        startDate: new Date('2019-09-01'),
                        endDate: new Date('2021-06-30'),
                        country: 'Spain'
                    }
                ],
                workExperience: [
                    {
                        title: 'Frontend Developer',
                        company: 'Tech Innovators SL',
                        location: 'Barcelona',
                        startDate: new Date('2021-07-15'),
                        endDate: null,
                        description: 'Developing responsive web applications using React and integrating with RESTful APIs.',
                        isInHongKong: false
                    }
                ]
            },
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        await admin.save();
        await recruiter.save();
        await jobSeeker.save();
        await jobSeeker2.save();
        
        console.log('✅ Users created successfully');
        return { admin, recruiter, jobSeeker };
        
    } catch (error) {
        console.error('Error creating users:', error);
        process.exit(1);
    }
};

// Create dummy companies
const createCompanies = async (recruiter) => {
    try {
        // Clear existing companies
        await Company.deleteMany({});
        
        const company1 = new Company({
            name: 'Hong Kong Tech Innovators',
            description: 'A leading technology company specializing in innovative solutions for businesses in Asia.',
            industry: 'it',
            website: 'https://www.hktech.example.com',
            size: '50-200 employees',
            founded: 2010,
            address: {
                street: '123 Innovation Drive',
                district: 'Central',
                city: 'Hong Kong',
                country: 'Hong Kong',
                postalCode: '123456'
            },
            contactPerson: {
                name: 'Sarah Wong',
                email: 'recruiter@hkexpatjobs.com',
                phone: '+852 5555 1234',
                position: 'HR Manager'
            },
            socialMedia: {
                linkedin: 'https://www.linkedin.com/company/hktechinnovators',
                facebook: 'https://www.facebook.com/hktechinnovators'
            },
            benefits: [
                'Competitive salary packages',
                'Medical insurance',
                'Annual performance bonuses',
                'Professional development opportunities',
                'Flexible working hours'
            ],
            culture: 'We foster an inclusive, innovative culture where diverse perspectives are valued and employees are encouraged to think outside the box.',
            internationalOffices: ['Singapore', 'Tokyo', 'Shanghai'],
            recruiterId: recruiter._id,
            verified: true,
            createdAt: new Date()
        });
        
        const company2 = new Company({
            name: 'Global Finance HK',
            description: 'A multinational financial institution providing comprehensive banking and investment services across Asia.',
            industry: 'finance',
            website: 'https://www.globalfinancehk.example.com',
            size: '500+ employees',
            founded: 2005,
            address: {
                street: '888 Finance Street',
                district: 'Wan Chai',
                city: 'Hong Kong',
                country: 'Hong Kong',
                postalCode: '567890'
            },
            contactPerson: {
                name: 'Sarah Wong',
                email: 'recruiter@hkexpatjobs.com',
                phone: '+852 5555 1234',
                position: 'Talent Acquisition Manager'
            },
            socialMedia: {
                linkedin: 'https://www.linkedin.com/company/globalfinancehk',
                twitter: 'https://www.twitter.com/globalfinancehk'
            },
            benefits: [
                'Competitive remuneration package',
                'Annual bonus scheme',
                'Comprehensive health benefits',
                'Retirement plan',
                'Global mobility opportunities'
            ],
            culture: 'We maintain a professional, fast-paced environment with a strong emphasis on excellence, integrity, and global collaboration.',
            internationalOffices: ['New York', 'London', 'Sydney', 'Singapore', 'Shanghai'],
            recruiterId: recruiter._id,
            verified: true,
            createdAt: new Date()
        });
        
        await company1.save();
        await company2.save();
        
        console.log('✅ Companies created successfully');
        return { company1, company2 };
        
    } catch (error) {
        console.error('Error creating companies:', error);
        process.exit(1);
    }
};

// Create dummy jobs
const createJobs = async (recruiter, { company1, company2 }) => {
    try {
        // Clear existing jobs
        await Job.deleteMany({});
        
        const job1 = new Job({
            title: 'Senior Full Stack Developer',
            company: 'Hong Kong Tech Innovators',
            companyId: company1._id,
            location: 'Central, Hong Kong',
            district: 'Central',
            type: 'full-time',
            industry: 'it',
            category: 'Software Development',
            description: 'We are looking for an experienced Full Stack Developer to join our innovative team in Hong Kong. The ideal candidate will have experience with modern web technologies and be comfortable working in a fast-paced environment.',
            responsibilities: [
                'Design and develop high-quality applications using React.js and Node.js',
                'Collaborate with cross-functional teams to define, design, and ship new features',
                'Write clean, maintainable, and efficient code',
                'Implement responsive design and ensure cross-browser compatibility',
                'Optimize applications for maximum performance and scalability'
            ],
            requirements: [
                'Bachelor\'s degree in Computer Science or related field',
                'At least 5 years of experience in full-stack development',
                'Strong proficiency in JavaScript, including DOM manipulation and the JavaScript object model',
                'Experience with React.js and Node.js',
                'Familiarity with RESTful APIs and modern authorization mechanisms',
                'Understanding of server-side templating languages'
            ],
            salary: {
                min: 45000,
                max: 60000,
                currency: 'HKD',
                period: 'monthly'
            },
            benefits: [
                'Competitive salary',
                'Medical insurance',
                'Performance bonuses',
                'Professional development opportunities',
                'Flexible working hours'
            ],
            languages: [
                { language: 'English', proficiency: 'Professional' },
                { language: 'Cantonese', proficiency: 'Basic' }
            ],
            requiredExperience: 5,
            visaSponsorshipOffered: true,
            postedBy: recruiter._id,
            postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            suitableForExpats: true,
            featuredJob: true
        });
        
        const job2 = new Job({
            title: 'Marketing Manager',
            company: 'Hong Kong Tech Innovators',
            companyId: company1._id,
            location: 'Central, Hong Kong',
            district: 'Central',
            type: 'full-time',
            industry: 'it',
            category: 'Marketing',
            description: 'We\'re seeking a talented Marketing Manager to lead our marketing initiatives in the APAC region. This role is perfect for someone who is creative, data-driven, and experienced in technology marketing.',
            responsibilities: [
                'Develop and implement comprehensive marketing strategies',
                'Manage digital marketing campaigns across various channels',
                'Analyze market trends and competitor activities',
                'Create engaging content for various platforms',
                'Work with sales team to generate leads and drive conversions'
            ],
            requirements: [
                'Bachelor\'s degree in Marketing, Business Administration, or related field',
                '3-5 years of experience in marketing, preferably in the tech industry',
                'Strong understanding of digital marketing concepts and best practices',
                'Excellent analytical skills with the ability to use data to inform decisions',
                'Outstanding communication and presentation skills'
            ],
            salary: {
                min: 35000,
                max: 45000,
                currency: 'HKD',
                period: 'monthly'
            },
            benefits: [
                'Competitive salary',
                'Medical insurance',
                'Performance bonuses',
                'Professional development budget',
                'Team building activities'
            ],
            languages: [
                { language: 'English', proficiency: 'Professional' },
                { language: 'Cantonese', proficiency: 'Intermediate' }
            ],
            requiredExperience: 3,
            visaSponsorshipOffered: false,
            postedBy: recruiter._id,
            postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            suitableForExpats: true
        });
        
        const job3 = new Job({
            title: 'Financial Analyst',
            company: 'Global Finance HK',
            companyId: company2._id,
            location: 'Wan Chai, Hong Kong',
            district: 'Wan Chai',
            type: 'full-time',
            industry: 'finance',
            category: 'Finance',
            description: 'Global Finance HK is seeking a detail-oriented Financial Analyst to join our expanding team in Hong Kong. This role involves analyzing financial data, preparing reports, and supporting key investment decisions.',
            responsibilities: [
                'Analyze financial information to produce forecasts on business performance',
                'Create financial models and provide investment recommendations',
                'Prepare monthly, quarterly, and annual financial reports',
                'Monitor economic trends in the APAC region',
                'Support senior management with financial planning and analysis'
            ],
            requirements: [
                'Bachelor\'s degree in Finance, Economics, Accounting, or related field',
                'At least 2 years of experience in financial analysis',
                'Strong proficiency in Excel and financial modeling',
                'Knowledge of financial markets and investment principles',
                'CFA designation or progress toward certification is a plus'
            ],
            salary: {
                min: 30000,
                max: 40000,
                currency: 'HKD',
                period: 'monthly'
            },
            benefits: [
                'Competitive salary package',
                'Annual bonus potential',
                'Comprehensive health benefits',
                'Retirement plan',
                'Professional certification support'
            ],
            languages: [
                { language: 'English', proficiency: 'Professional' },
                { language: 'Mandarin', proficiency: 'Intermediate' }
            ],
            requiredExperience: 2,
            visaSponsorshipOffered: true,
            postedBy: recruiter._id,
            postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            suitableForExpats: true
        });
        
        const job4 = new Job({
            title: 'ESL Teacher',
            company: 'International Education Center',
            location: 'Kowloon, Hong Kong',
            district: 'Kowloon',
            type: 'full-time',
            industry: 'education',
            category: 'Teaching',
            description: 'International Education Center is looking for passionate ESL teachers to join our team in Hong Kong. You will be teaching English to students of various age groups and proficiency levels.',
            responsibilities: [
                'Teach English to students of different age groups and levels',
                'Prepare lesson plans and teaching materials',
                'Assess student progress and provide regular feedback',
                'Participate in school events and activities',
                'Collaborate with other teachers and staff members'
            ],
            requirements: [
                'Bachelor\'s degree in any field',
                'TEFL/TESOL certification',
                'Native English speaker or equivalent proficiency',
                'Teaching experience is preferred but not required',
                'Passion for teaching and cultural exchange'
            ],
            salary: {
                min: 25000,
                max: 30000,
                currency: 'HKD',
                period: 'monthly'
            },
            benefits: [
                'Housing allowance',
                'Flight reimbursement',
                'Medical insurance',
                'Contract completion bonus',
                'Professional development opportunities'
            ],
            languages: [
                { language: 'English', proficiency: 'Native' }
            ],
            requiredExperience: 0,
            visaSponsorshipOffered: true,
            postedBy: recruiter._id,
            postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            suitableForExpats: true
        });
        
        const job5 = new Job({
            title: 'Hotel Guest Relations Manager',
            company: 'Luxury Bay Hotel',
            location: 'Tsim Sha Tsui, Hong Kong',
            district: 'Tsim Sha Tsui',
            type: 'full-time',
            industry: 'hospitality',
            category: 'Hotel Management',
            description: 'Luxury Bay Hotel is seeking an experienced Guest Relations Manager to ensure exceptional guest experiences at our 5-star property in the heart of Hong Kong.',
            responsibilities: [
                'Manage and enhance guest experiences from check-in to check-out',
                'Address guest inquiries, requests, and complaints promptly',
                'Coordinate with various hotel departments to fulfill guest needs',
                'Train and supervise guest relations staff',
                'Implement strategies to improve guest satisfaction and loyalty'
            ],
            requirements: [
                'Bachelor\'s degree in Hospitality Management or related field',
                'At least 3 years of experience in guest relations at a 4-5 star hotel',
                'Excellent communication and interpersonal skills',
                'Problem-solving abilities and attention to detail',
                'Flexibility to work different shifts including weekends and holidays'
            ],
            salary: {
                min: 28000,
                max: 35000,
                currency: 'HKD',
                period: 'monthly'
            },
            benefits: [
                'Competitive salary',
                'Meal allowance',
                'Medical insurance',
                'Hotel stay discounts worldwide',
                'Career advancement opportunities'
            ],
            languages: [
                { language: 'English', proficiency: 'Professional' },
                { language: 'Cantonese', proficiency: 'Basic' },
                { language: 'Mandarin', proficiency: 'Intermediate' }
            ],
            requiredExperience: 3,
            visaSponsorshipOffered: true,
            postedBy: recruiter._id,
            postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            suitableForExpats: true
        });
        
        await job1.save();
        await job2.save();
        await job3.save();
        await job4.save();
        await job5.save();
        
        console.log('✅ Jobs created successfully');
        
    } catch (error) {
        console.error('Error creating jobs:', error);
        process.exit(1);
    }
};

// Main function to seed all data
const seedData = async () => {
    try {
        const { admin, recruiter, jobSeeker } = await createUsers();
        const companies = await createCompanies(recruiter);
        await createJobs(recruiter, companies);
        
        console.log('✅ All data seeded successfully');
        mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
