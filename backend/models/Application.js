// Application.js - Mongoose model for job applications
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    jobTitle: { type: String, required: true },
    status: { type: String, default: 'Submitted' },
    coverLetter: { type: String },
    applicantName: { type: String },
    applicantEmail: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', ApplicationSchema);
