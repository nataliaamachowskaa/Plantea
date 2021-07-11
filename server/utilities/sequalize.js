const { Sequelize } = require('sequelize');
const mysql = require('mysql');

// Initialising dotenv module to manage server's configuration data, which can be found in the root directory in ".env" file
require('dotenv').config();

const database = process.env.DB_DATABASE;
const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const pass = '';

const sequalize = new Sequelize(database, user, pass, {
    host,
    dialect: 'mysql',
    define: {
        timestamps: false
    }
})

module.exports = sequalize;