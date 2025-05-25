const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Job = sequelize.define('Job', {
  title: { type: DataTypes.STRING, allowNull: false },
  company: DataTypes.STRING,
  companyId: DataTypes.INTEGER, // FK to Company
  location: DataTypes.STRING,
  type: DataTypes.STRING,
  industry: DataTypes.STRING,
  salaryMin: DataTypes.INTEGER,
  salaryMax: DataTypes.INTEGER,
  salaryCurrency: DataTypes.STRING,
  salaryPeriod: DataTypes.STRING,
  description: DataTypes.TEXT,
  requirements: DataTypes.TEXT, // Store as JSON string
  responsibilities: DataTypes.TEXT, // Store as JSON string
  languages: DataTypes.TEXT, // Store as JSON string
  benefits: DataTypes.TEXT, // Store as JSON string
  suitableForExpats: DataTypes.BOOLEAN,
  visaSponsorshipOffered: DataTypes.BOOLEAN,
  postedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'jobs',
  freezeTableName: true
});

module.exports = Job;
