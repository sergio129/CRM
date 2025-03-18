'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 1. Verificar si la tabla de backup ya existe
      const backupExists = await queryInterface.sequelize.query(
        "SHOW TABLES LIKE 'PayrollDetails_backup'",
        { type: Sequelize.QueryTypes.SHOWLIKE }
      );

      // 2. Si existe el backup, eliminarla
      if (backupExists.length > 0) {
        await queryInterface.dropTable('PayrollDetails_backup');
      }

      // 3. Crear el backup de la tabla actual
      await queryInterface.sequelize.query('CREATE TABLE PayrollDetails_backup LIKE PayrollDetails');
      await queryInterface.sequelize.query('INSERT PayrollDetails_backup SELECT * FROM PayrollDetails');

      // 4. Actualizar la tabla existente en lugar de recrearla
      const tableInfo = await queryInterface.describeTable('PayrollDetails');

      // 5. Agregar nuevas columnas si no existen
      if (!tableInfo.tipo_pago) {
        await queryInterface.addColumn('PayrollDetails', 'tipo_pago', {
          type: Sequelize.ENUM('Mensual', 'Quincenal', 'Semanal'),
          defaultValue: 'Mensual',
          allowNull: false
        });
      }

      // Agregar otras columnas necesarias aquí...

      // 6. Actualizar valores por defecto
      await queryInterface.sequelize.query(`
        UPDATE PayrollDetails 
        SET tipo_pago = 'Mensual' 
        WHERE tipo_pago IS NULL
      `);

    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Verificar si existe la tabla de backup
      const backupExists = await queryInterface.sequelize.query(
        "SHOW TABLES LIKE 'PayrollDetails_backup'",
        { type: Sequelize.QueryTypes.SHOWLIKE }
      );

      if (backupExists.length > 0) {
        // Restaurar desde el backup
        await queryInterface.dropTable('PayrollDetails');
        await queryInterface.sequelize.query('CREATE TABLE PayrollDetails LIKE PayrollDetails_backup');
        await queryInterface.sequelize.query('INSERT PayrollDetails SELECT * FROM PayrollDetails_backup');
        await queryInterface.dropTable('PayrollDetails_backup');
      }
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
};
