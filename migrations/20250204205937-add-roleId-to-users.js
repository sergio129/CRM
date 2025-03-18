// migrations/XXXXXXXX-add-roleId-to-users.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('users');

    // Verificar si la columna 'roleId' ya existe
    if (!tableInfo.roleId) {
      await queryInterface.addColumn('users', 'roleId', {
        type: Sequelize.INTEGER,
        allowNull: true, // ✅ Cambiar a true
        defaultValue: null, // ✅ Valor temporal
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // Actualizar registros existentes con un rol válido
      await queryInterface.sequelize.query(`
        UPDATE users
        SET roleId = (SELECT id FROM roles WHERE role_name = 'Cliente' LIMIT 1)
        WHERE roleId IS NULL
      `);

      // Cambiar a NOT NULL después de actualizar
      await queryInterface.changeColumn('users', 'roleId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3 // Asegúrate que este ID exista en roles
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable('users');

    // Verificar si la columna 'roleId' existe antes de eliminarla
    if (tableInfo.roleId) {
      await queryInterface.removeColumn('users', 'roleId');
    }
  }
};