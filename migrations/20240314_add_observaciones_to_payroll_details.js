'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');
      
      if (!tableInfo.observaciones) {
        await queryInterface.addColumn('payroll_details', 'observaciones', {
          type: Sequelize.TEXT,
          allowNull: true
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
      
      if (tableInfo.observaciones) {
        await queryInterface.removeColumn('payroll_details', 'observaciones');
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
