'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// ✅ 1. Mejor práctica para cargar configuración
const config = require(__dirname + '/../config/config.js')(env); // Usar archivo .js en vez de .json
const db = {};

// ✅ 2. Configuración mejorada de sequelize
let sequelize;
if (config.url) {
  sequelize = new Sequelize(config.url, {
    ...config,
    dialectOptions: config.dialectOptions,
    logging: config.logging
  });
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: config.dialect,
      port: config.port,
      logging: config.logging,
      dialectOptions: config.dialectOptions
    }
  );
}

// ✅ 3. Cargar modelos con orden controlado
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => 
    file !== basename &&
    file.endsWith('.js') &&
    !file.includes('.test.js')
  )
  .sort((a, b) => { // Ordenar para cargar modelos base primero
    const modelPriority = {
      'Role.js': 1,
      'User.js': 2,
      // Agregar otros modelos según dependencias
    };
    return (modelPriority[a] || 99) - (modelPriority[b] || 99);
  });

modelFiles.forEach(file => {
  const modelPath = path.join(__dirname, file);
  const model = require(modelPath)(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
});

// ✅ 4. Asociaciones mejoradas
Object.keys(db).forEach(modelName => {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

// ✅ 5. Conexión y sincronización inicial
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a DB establecida');
    
    if (env === 'development') {
      await sequelize.sync({ alter: true });
      console.log('🔁 Modelos sincronizados (alter)');
    }
  } catch (error) {
    console.error('❌ Error de conexión a DB:', error);
    process.exit(1);
  }
})();

// ✅ 6. Exportación mejorada
module.exports = {
  ...db,
  sequelize,
  Sequelize,
  transaction: () => sequelize.transaction()
};