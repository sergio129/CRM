// migrations/XXXXXXXX-add-roleId-to-users.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
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
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'roleId');
  }
};