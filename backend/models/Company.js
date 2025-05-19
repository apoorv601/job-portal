const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    logo: { type: String }, // URL to company logo
    description: { type: String },
    industry: { type: String },
    website: { type: String },
    size: { type: String }, // Company size range
    founded: { type: Number }, // Year founded
    address: { 
        street: String,
        district: String,
        city: { type: String, default: 'Hong Kong' },
        country: { type: String, default: 'Hong Kong' },
        postalCode: String
    },
    contactPerson: {
        name: String,
        email: String,
        phone: String,
        position: String
    },
    socialMedia: {
        linkedin: String,
        facebook: String,
        twitter: String
    },
    benefits: [String], // Company benefits
    culture: String, // Description of company culture
    photos: [String], // URLs to company photos
    internationalOffices: [String], // List of countries with offices
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', CompanySchema);
