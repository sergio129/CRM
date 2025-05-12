// Ejecutar la migración para actualizar la estructura de categorías
'use strict';

const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

// Leer archivo de migración
const migrationPath = path.join(__dirname, '..', 'migrations', '20250512_add_subcategories_to_categorias_ingresos.js');
const migration = require(migrationPath);

// Función principal
async function runMigration() {
    try {
        console.log('Iniciando migración de categorías de ingresos...');
        
        // Ejecutar la migración
        await migration.up(sequelize.getQueryInterface(), sequelize);
        
        console.log('Migración completada exitosamente.');
    } catch (error) {
        console.error('Error al ejecutar la migración:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('Proceso de migración finalizado.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error en el proceso de migración:', err);
            process.exit(1);
        });
}

module.exports = runMigration;
