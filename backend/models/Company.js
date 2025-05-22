const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Company = sequelize.define('Company', {
  name: { type: DataTypes.STRING, allowNull: false },
  logo: DataTypes.STRING, // URL to company logo
  description: DataTypes.TEXT,
  industry: DataTypes.STRING,
  website: DataTypes.STRING,
  size: DataTypes.STRING, // Company size range
  founded: DataTypes.INTEGER, // Year founded
  address: DataTypes.TEXT, // Store as JSON string
  contactPerson: DataTypes.TEXT, // Store as JSON string
  socialMedia: DataTypes.TEXT, // Store as JSON string
  benefits: DataTypes.TEXT, // Store as JSON string
  culture: DataTypes.TEXT,
  photos: DataTypes.TEXT, // Store as JSON string
  internationalOffices: DataTypes.TEXT, // Store as JSON string
  recruiterId: { type: DataTypes.INTEGER, references: { model: 'Users', key: 'id' } },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = Company;
