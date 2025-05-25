const sequelize = require('../sequelize');
const User = require('./User');
const Job = require('./Job');
const Company = require('./Company');
const Application = require('./Application');

// Associations
User.hasMany(Application, { foreignKey: 'userId' });
Application.belongsTo(User, { foreignKey: 'userId' });
Job.hasMany(Application, { foreignKey: 'jobId' });
Application.belongsTo(Job, { foreignKey: 'jobId' });
Company.hasMany(Job, { foreignKey: 'companyId' });
Job.belongsTo(Company, { foreignKey: 'companyId' });

module.exports = {
  sequelize,
  User,
  Job,
  Company,
  Application,
};
