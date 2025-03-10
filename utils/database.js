const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de Sequelize con variables de entorno
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false // Cambia a true si quieres ver logs de SQL en la consola
    }
);

// Probar la conexión a la base de datos
sequelize.authenticate()
    .then(() => console.log('✅ Conectado a la base de datos MySQL'))
    .catch(err => console.error('❌ Error de conexión a MySQL:', err));

module.exports = sequelize;
