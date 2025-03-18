'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Verificar si las columnas existen antes de agregarlas
      const tableInfo = await queryInterface.describeTable('payroll_details');
      
      if (!tableInfo.deduccion_salud) {
        await queryInterface.addColumn('payroll_details', 'deduccion_salud', {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0,
          allowNull: false
        }, { transaction });
      }

      if (!tableInfo.deduccion_pension) {
        await queryInterface.addColumn('payroll_details', 'deduccion_pension', {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0,
          allowNull: false
        }, { transaction });
      }

      if (!tableInfo.prestamos) {
        await queryInterface.addColumn('payroll_details', 'prestamos', {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0,
          allowNull: false
        }, { transaction });
      }

      if (!tableInfo.otros_descuentos) {
        await queryInterface.addColumn('payroll_details', 'otros_descuentos', {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0,
          allowNull: false
        }, { transaction });
      }

      // Actualizar las columnas existentes si es necesario
      await queryInterface.changeColumn('payroll_details', 'total_deducciones', {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('payroll_details', 'deduccion_salud', { transaction });
      await queryInterface.removeColumn('payroll_details', 'deduccion_pension', { transaction });
      await queryInterface.removeColumn('payroll_details', 'prestamos', { transaction });
      await queryInterface.removeColumn('payroll_details', 'otros_descuentos', { transaction });
    });
  }
};
