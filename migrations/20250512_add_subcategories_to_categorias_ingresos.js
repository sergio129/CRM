// Migración para añadir soporte de subcategorías a categorías de ingresos
'use strict';

const sequelize = require('../config/database');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Iniciando migración para añadir soporte de subcategorías...');
    try {
      // Añadir columna categoria_padre_id a la tabla categorias_ingresos
      console.log('Añadiendo columna categoria_padre_id...');
      await queryInterface.addColumn('categorias_ingresos', 'categoria_padre_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categorias_ingresos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // Crear índice para mejorar el rendimiento
      console.log('Creando índice para categoria_padre_id...');
      await queryInterface.addIndex('categorias_ingresos', ['categoria_padre_id']);
      
      console.log('Migración completada exitosamente!');
    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Eliminar columna categoria_padre_id si se revierte la migración
    await queryInterface.removeIndex('categorias_ingresos', ['categoria_padre_id']);
    await queryInterface.removeColumn('categorias_ingresos', 'categoria_padre_id');
  }
};

// Si este archivo se ejecuta directamente, ejecutar la migración
if (require.main === module) {
  console.log('Ejecutando migración directamente...');
  
  const Sequelize = require('sequelize');
  
  (async () => {
    try {
      await module.exports.up(sequelize.getQueryInterface(), Sequelize);
      console.log('Migración ejecutada correctamente.');
      process.exit(0);
    } catch (error) {
      console.error('Error al ejecutar la migración:', error);
      process.exit(1);
    }
  })();
}
