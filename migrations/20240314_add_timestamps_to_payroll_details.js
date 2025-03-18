'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');
      
      // Agregar createdAt si no existe
      if (!tableInfo.createdAt) {
        await queryInterface.addColumn('payroll_details', 'createdAt', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        });
      }

      // Agregar updatedAt si no existe
      if (!tableInfo.updatedAt) {
        await queryInterface.addColumn('payroll_details', 'updatedAt', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        });
      }

    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');
      
      // Eliminar columnas si existen
      if (tableInfo.createdAt) {
        await queryInterface.removeColumn('payroll_details', 'createdAt');
      }
      if (tableInfo.updatedAt) {
        await queryInterface.removeColumn('payroll_details', 'updatedAt');
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
