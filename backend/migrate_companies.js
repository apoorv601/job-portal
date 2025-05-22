// migrate_companies.js
const fs = require('fs');
const Company = require('./models/Company');
const sequelize = require('./sequelize');

async function migrate() {
  await sequelize.sync();
  const companies = JSON.parse(fs.readFileSync('companies_cleaned.json', 'utf8'));
  for (const company of companies) {
    if (company.address && typeof company.address === 'object') company.address = JSON.stringify(company.address);
    if (company.contactPerson && typeof company.contactPerson === 'object') company.contactPerson = JSON.stringify(company.contactPerson);
    if (company.socialMedia && typeof company.socialMedia === 'object') company.socialMedia = JSON.stringify(company.socialMedia);
    if (company.benefits && Array.isArray(company.benefits)) company.benefits = JSON.stringify(company.benefits);
    if (company.photos && Array.isArray(company.photos)) company.photos = JSON.stringify(company.photos);
    if (company.internationalOffices && Array.isArray(company.internationalOffices)) company.internationalOffices = JSON.stringify(company.internationalOffices);
    // Fix createdAt/updatedAt
    if (!company.createdAt || company.createdAt === 'Invalid date') company.createdAt = new Date();
    if (!company.updatedAt || company.updatedAt === 'Invalid date') company.updatedAt = new Date();
    await Company.create(company);
  }
  console.log('Company migration complete');
  process.exit();
}

migrate();
