// sequelize.js
const { Sequelize } = require('sequelize');

const dbName = process.env.DB_NAME || 'job_portal_db';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || '@poorv91';
const dbHost = process.env.DB_HOST || 'localhost';

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: 'mariadb',
  logging: false,
});

module.exports = sequelize;
