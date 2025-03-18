'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');
      
      if (!tableInfo.tipo_pago) {
        await queryInterface.addColumn('payroll_details', 'tipo_pago', {
          type: Sequelize.ENUM('Mensual', 'Quincenal', 'Semanal'),
          defaultValue: 'Mensual',
          allowNull: false
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
      
      if (tableInfo.tipo_pago) {
        await queryInterface.removeColumn('payroll_details', 'tipo_pago');
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
