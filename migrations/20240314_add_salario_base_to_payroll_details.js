'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');
      
      if (!tableInfo.salario_base) {
        await queryInterface.addColumn('payroll_details', 'salario_base', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00
        });

        // Actualizar registros existentes con el salario base del empleado
        await queryInterface.sequelize.query(`
          UPDATE payroll_details pd
          JOIN employees e ON pd.employee_id = e.id
          SET pd.salario_base = e.salario_base
          WHERE pd.salario_base = 0
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
      
      if (tableInfo.salario_base) {
        await queryInterface.removeColumn('payroll_details', 'salario_base');
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
