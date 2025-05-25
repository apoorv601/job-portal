const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  nationality: DataTypes.STRING,
  currentLocation: DataTypes.STRING,
  visaStatus: DataTypes.STRING,
  yearsOfExperience: DataTypes.INTEGER,
  skills: DataTypes.TEXT, // Store as JSON string
  resume: DataTypes.STRING, // URL to stored resume
  photo: DataTypes.STRING, // URL to profile photo
}, {
  tableName: 'users',
  freezeTableName: true
});

module.exports = User;
