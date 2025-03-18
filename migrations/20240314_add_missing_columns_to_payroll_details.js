'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');

      // Array de columnas a agregar con sus configuraciones
      const columnsToAdd = [
        {
          name: 'dias_trabajados',
          config: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 30
          }
        },
        {
          name: 'dias_vacaciones',
          config: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 0
          }
        },
        {
          name: 'dias_incapacidad',
          config: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 0
          }
        },
        {
          name: 'auxilio_transporte',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
          }
        },
        {
          name: 'recargo_dominical',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
          }
        }
      ];

      // Agregar cada columna si no existe
      for (const column of columnsToAdd) {
        if (!tableInfo[column.name]) {
          await queryInterface.addColumn('payroll_details', column.name, column.config);
        }
      }

      // Actualizar registros existentes con valores por defecto
      await queryInterface.sequelize.query(`
        UPDATE payroll_details 
        SET dias_trabajados = 30,
            dias_vacaciones = 0,
            dias_incapacidad = 0,
            auxilio_transporte = 0.00,
            recargo_dominical = 0.00
        WHERE dias_trabajados IS NULL
      `);

    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const columns = [
        'dias_trabajados',
        'dias_vacaciones',
        'dias_incapacidad',
        'auxilio_transporte',
        'recargo_dominical'
      ];

      for (const columnName of columns) {
        const tableInfo = await queryInterface.describeTable('payroll_details');
        if (tableInfo[columnName]) {
          await queryInterface.removeColumn('payroll_details', columnName);
        }
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
