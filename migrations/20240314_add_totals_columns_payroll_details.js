'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');

      const columnsToAdd = [
        {
          name: 'total_ingresos',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: false
          }
        },
        {
          name: 'total_deducciones',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: false
          }
        },
        {
          name: 'neto_pagar',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: false
          }
        }
      ];

      // Agregar las columnas si no existen
      for (const column of columnsToAdd) {
        if (!tableInfo[column.name]) {
          await queryInterface.addColumn('payroll_details', column.name, column.config);
        }
      }

      // Actualizar los valores existentes
      await queryInterface.sequelize.query(`
        UPDATE payroll_details
        SET total_ingresos = COALESCE(salario_base, 0) +
                            COALESCE(valor_hora_extra_diurna, 0) +
                            COALESCE(valor_hora_extra_nocturna, 0) +
                            COALESCE(bonificaciones, 0) +
                            COALESCE(comisiones, 0) +
                            COALESCE(recargo_dominical, 0),
            total_deducciones = COALESCE(deduccion_salud, 0) +
                               COALESCE(deduccion_pension, 0) +
                               COALESCE(prestamos, 0) +
                               COALESCE(otros_descuentos, 0),
            neto_pagar = (COALESCE(salario_base, 0) +
                         COALESCE(valor_hora_extra_diurna, 0) +
                         COALESCE(valor_hora_extra_nocturna, 0) +
                         COALESCE(bonificaciones, 0) +
                         COALESCE(comisiones, 0) +
                         COALESCE(recargo_dominical, 0)) -
                        (COALESCE(deduccion_salud, 0) +
                         COALESCE(deduccion_pension, 0) +
                         COALESCE(prestamos, 0) +
                         COALESCE(otros_descuentos, 0))
      `);

    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const columns = ['total_ingresos', 'total_deducciones', 'neto_pagar'];
      
      for (const columnName of columns) {
        await queryInterface.removeColumn('payroll_details', columnName);
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
