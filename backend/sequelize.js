// sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('job_portal_db', 'root', '@poorv91', {
  host: 'localhost', // Change to your cPanel host if needed
  dialect: 'mariadb',
  logging: false,
});

module.exports = sequelize;
