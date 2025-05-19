const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    district: { type: String }, // Hong Kong district
    type: { type: String, required: true }, // Full-time, Part-time, Contract, etc.
    industry: { type: String },
    category: { type: String }, // Job category
    description: { type: String, required: true },
    responsibilities: [String],
    requirements: [String],
    qualifications: [String],
    salary: {
        min: Number,
        max: Number,
        currency: { type: String, default: 'HKD' },
        period: { type: String, default: 'monthly' } // monthly, annual, hourly
    },
    benefits: [String],
    languages: [{ 
        language: String, 
        proficiency: { type: String, enum: ['Basic', 'Intermediate', 'Professional', 'Native'] } 
    }],
    requiredExperience: { type: Number }, // in years
    visaSponsorshipOffered: { type: Boolean, default: false },
    expiryDate: { type: Date },
    applicants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Offered'] },
        appliedAt: { type: Date, default: Date.now }
    }],
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postedAt: { type: Date, default: Date.now },
    suitableForExpats: { type: Boolean, default: false },
    featuredJob: { type: Boolean, default: false }
});

// Add text index for improved search capability
JobSchema.index({
    title: 'text',
    description: 'text',
    company: 'text',
    industry: 'text',
    category: 'text'
});

module.exports = mongoose.model('Job', JobSchema);
