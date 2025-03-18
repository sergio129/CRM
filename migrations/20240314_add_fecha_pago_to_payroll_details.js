'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');
      
      if (!tableInfo.fecha_pago) {
        await queryInterface.addColumn('payroll_details', 'fecha_pago', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        });

        // Actualizar registros existentes
        await queryInterface.sequelize.query(`
          UPDATE payroll_details pd
          JOIN payrolls p ON pd.payroll_id = p.id
          SET pd.fecha_pago = p.payment_date
          WHERE pd.fecha_pago IS NULL
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
      
      if (tableInfo.fecha_pago) {
        await queryInterface.removeColumn('payroll_details', 'fecha_pago');
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
