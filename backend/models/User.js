const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, // 'applicant', 'recruiter', 'admin'
    profile: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        nationality: { type: String },
        currentLocation: { type: String },
        languages: [{ 
            language: String, 
            proficiency: { type: String, enum: ['Basic', 'Intermediate', 'Professional', 'Native'] } 
        }],
        visaStatus: { type: String }, // Hong Kong work permit status
        yearsOfExperience: { type: Number },
        skills: [String],
        education: [{
            degree: String,
            institution: String,
            field: String,
            startDate: Date,
            endDate: Date,
            country: String
        }],
        workExperience: [{
            title: String,
            company: String,
            location: String,
            startDate: Date,
            endDate: Date,
            description: String,
            isInHongKong: Boolean
        }],
        resume: { type: String }, // URL to stored resume
        photo: { type: String } // URL to profile photo
    },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }]
});

module.exports = mongoose.model('User', UserSchema);
