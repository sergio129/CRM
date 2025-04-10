const { Sequelize } = require('sequelize');
require('dotenv').config();

// Log database connection parameters for debugging
console.log('Database connection parameters:');
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_USER: ${process.env.DB_USER}`);

// Use environment variables with fallbacks
const host = process.env.DB_HOST || 'db';
// Forzar puerto 3306 para conexiones dentro de Docker
const port = process.env.NODE_ENV === 'production' ? 3306 : (process.env.DB_PORT || 3307);
const database = process.env.DB_NAME || 'gescoop_db';
const username = process.env.DB_USER || 'gescoop_user';
const password = process.env.DB_PASSWORD || 'gescoop_password';

console.log(`Usando puerto: ${port} para conectarse a la base de datos`);
console.log(`Entorno: ${process.env.NODE_ENV}`);

const sequelize = new Sequelize(
    database,
    username,
    password,
    {
        host: host,
        port: port,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            dateStrings: true,
            typeCast: true,
            // Add authentication plugin settings for MySQL 8
            authPlugins: {
                mysql_native_password: () => () => Buffer.from(password + "\0")
            }
        },
        timezone: '-05:00'
    }
);

module.exports = sequelize;
