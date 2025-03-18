'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('payroll_details');
      
      if (!tableInfo.estado) {
        // Primero crear el tipo ENUM si no existe
        await queryInterface.sequelize.query(`
          CREATE TYPE enum_payroll_details_estado AS ENUM ('Pendiente', 'Pagado', 'Anulado')
        `).catch(() => {
          // Si el tipo ya existe, ignorar el error
          console.log('El tipo ENUM ya existe');
        });

        // Luego agregar la columna
        await queryInterface.addColumn('payroll_details', 'estado', {
          type: Sequelize.ENUM('Pendiente', 'Pagado', 'Anulado'),
          defaultValue: 'Pendiente',
          allowNull: false
        });

        // Actualizar registros existentes
        await queryInterface.sequelize.query(`
          UPDATE payroll_details 
          SET estado = 'Pendiente' 
          WHERE estado IS NULL
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
      
      if (tableInfo.estado) {
        // Eliminar la columna
        await queryInterface.removeColumn('payroll_details', 'estado');
        
        // Eliminar el tipo ENUM
        await queryInterface.sequelize.query(`
          DROP TYPE IF EXISTS enum_payroll_details_estado
        `);
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
