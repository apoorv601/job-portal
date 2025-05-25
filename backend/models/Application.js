// Application.js - Sequelize model for job applications
const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Application = sequelize.define('Application', {
  userId: { type: DataTypes.INTEGER, allowNull: false }, // FK to User
  jobId: { type: DataTypes.INTEGER, allowNull: false }, // FK to Job
  coverLetter: DataTypes.TEXT,
  applicantName: DataTypes.STRING,
  applicantEmail: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  appliedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'applications',
  freezeTableName: true
});

module.exports = Application;
