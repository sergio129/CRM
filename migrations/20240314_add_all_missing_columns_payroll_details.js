'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');

      const columnsToAdd = [
        {
          name: 'horas_extras_diurnas',
          config: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          }
        },
        {
          name: 'valor_hora_extra_diurna',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'horas_extras_nocturnas',
          config: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          }
        },
        {
          name: 'valor_hora_extra_nocturna',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'bonificaciones',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'comisiones',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'recargo_dominical',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'auxilio_transporte',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'prestamos',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'embargos',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'otros_descuentos',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'deduccion_salud',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'deduccion_pension',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'aporte_salud_empleado',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'aporte_pension_empleado',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'aporte_salud_empleador',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'aporte_pension_empleador',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'aporte_arl',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'aporte_caja_compensacion',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'aporte_icbf',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'aporte_sena',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'provision_prima',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'provision_cesantias',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'provision_intereses_cesantias',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'provision_vacaciones',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        },
        {
          name: 'total_provisiones',
          config: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
          }
        }
      ];

      // Agregar todas las columnas que no existan
      for (const column of columnsToAdd) {
        if (!tableInfo[column.name]) {
          console.log(`Agregando columna: ${column.name}`);
          await queryInterface.addColumn('payroll_details', column.name, column.config);
        }
      }

      console.log('Migración completada exitosamente');

    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');
      
      const columnsToRemove = [
        'horas_extras_diurnas', 'valor_hora_extra_diurna', 'horas_extras_nocturnas',
        'valor_hora_extra_nocturna', 'bonificaciones', 'comisiones', 'recargo_dominical',
        'auxilio_transporte', 'prestamos', 'embargos', 'otros_descuentos',
        'deduccion_salud', 'deduccion_pension', 'aporte_salud_empleado',
        'aporte_pension_empleado', 'aporte_salud_empleador', 'aporte_pension_empleador',
        'aporte_arl', 'aporte_caja_compensacion', 'aporte_icbf', 'aporte_sena',
        'provision_prima', 'provision_cesantias', 'provision_intereses_cesantias',
        'provision_vacaciones', 'total_provisiones'
      ];

      for (const columnName of columnsToRemove) {
        if (tableInfo[columnName]) {
          console.log(`Eliminando columna: ${columnName}`);
          await queryInterface.removeColumn('payroll_details', columnName);
        }
      }

      console.log('Reversión completada exitosamente');
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
