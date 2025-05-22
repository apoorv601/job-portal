// migrate_users.js
const fs = require('fs');
const User = require('./models/User');
const sequelize = require('./sequelize');

async function migrate() {
  await sequelize.sync();
  const users = JSON.parse(fs.readFileSync('users_cleaned.json', 'utf8'));
  for (const user of users) {
    if (user.skills && Array.isArray(user.skills)) {
      user.skills = JSON.stringify(user.skills);
    }
    // Fix createdAt/updatedAt
    if (!user.createdAt || user.createdAt === 'Invalid date') user.createdAt = new Date();
    if (!user.updatedAt || user.updatedAt === 'Invalid date') user.updatedAt = new Date();
    await User.create(user);
  }
  console.log('Migration complete');
  process.exit();
}

migrate();
