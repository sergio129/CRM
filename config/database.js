const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME, // Nombre de la base de datos
    process.env.DB_USER, // Usuario
    process.env.DB_PASSWORD, // Contraseña
    {
        host: process.env.DB_HOST, // Dirección del host
        port: process.env.DB_PORT || 1000, // Puerto (por defecto 3306 para MySQL)
        dialect: 'mysql', // Dialecto de la base de datos
        logging: false // Deshabilitar logs de Sequelize
    }
);

module.exports = sequelize;
