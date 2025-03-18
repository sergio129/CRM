'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');

      if (!tableInfo.metodo_pago) {
        await queryInterface.addColumn('payroll_details', 'metodo_pago', {
          type: Sequelize.ENUM('Transferencia', 'Cheque', 'Efectivo'),
          defaultValue: 'Transferencia',
          allowNull: false
        });

        // Actualizar registros existentes
        await queryInterface.sequelize.query(`
          UPDATE payroll_details 
          SET metodo_pago = 'Transferencia' 
          WHERE metodo_pago IS NULL
        `);
      }
    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');
      
      if (tableInfo.metodo_pago) {
        // Primero eliminar el tipo ENUM
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_payroll_details_metodo_pago');
        // Luego eliminar la columna
        await queryInterface.removeColumn('payroll_details', 'metodo_pago');
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
