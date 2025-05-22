// migrate_jobs.js
const fs = require('fs');
const Job = require('./models/Job');
const sequelize = require('./sequelize');

async function migrate() {
  await sequelize.sync();
  const jobs = JSON.parse(fs.readFileSync('jobs_cleaned.json', 'utf8'));
  for (const job of jobs) {
    if (job.requirements && Array.isArray(job.requirements)) job.requirements = JSON.stringify(job.requirements);
    if (job.responsibilities && Array.isArray(job.responsibilities)) job.responsibilities = JSON.stringify(job.responsibilities);
    if (job.languages && Array.isArray(job.languages)) job.languages = JSON.stringify(job.languages);
    if (job.benefits && Array.isArray(job.benefits)) job.benefits = JSON.stringify(job.benefits);
    // Fix postedAt/createdAt/updatedAt
    if (!job.postedAt || job.postedAt === 'Invalid date') job.postedAt = new Date();
    if (!job.createdAt || job.createdAt === 'Invalid date') job.createdAt = new Date();
    if (!job.updatedAt || job.updatedAt === 'Invalid date') job.updatedAt = new Date();
    await Job.create(job);
  }
  console.log('Job migration complete');
  process.exit();
}

migrate();
