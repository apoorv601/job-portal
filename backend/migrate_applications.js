// migrate_applications.js
const fs = require('fs');
const Application = require('./models/Application');
const sequelize = require('./sequelize');

async function migrate() {
  await sequelize.sync();
  const applications = JSON.parse(fs.readFileSync('applications_cleaned.json', 'utf8'));
  for (const application of applications) {
    // Fix appliedAt/createdAt/updatedAt
    if (!application.appliedAt || application.appliedAt === 'Invalid date') application.appliedAt = new Date();
    if (!application.createdAt || application.createdAt === 'Invalid date') application.createdAt = new Date();
    if (!application.updatedAt || application.updatedAt === 'Invalid date') application.updatedAt = new Date();
    await Application.create(application);
  }
  console.log('Application migration complete');
  process.exit();
}

migrate();
