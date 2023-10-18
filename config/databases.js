require('dotenv').config()
const Sequelize = require('sequelize');

const connect = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
});

// Kiểm tra kết nối
connect
    .authenticate()
    .then(() => {
        console.log('Connected to database successfully');
    })
    .catch((error) => {
        console.error('Error connecting to database:', error);
    });

module.exports = connect;
