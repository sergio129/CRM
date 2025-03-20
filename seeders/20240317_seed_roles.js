'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si ya existen roles con los mismos nombres
    const existingRoles = await queryInterface.sequelize.query(
      'SELECT role_name FROM roles WHERE role_name IN ("Administrador", "Asesor", "Cliente")',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingRoles.length > 0) {
      console.error('Error: Algunos roles ya existen en la base de datos.');
      return;
    }

    await queryInterface.bulkInsert('roles', [
      { role_name: 'Administrador', description: 'Acceso completo al sistema' },
      { role_name: 'Asesor', description: 'Gestión de clientes y préstamos' },
      { role_name: 'Cliente', description: 'Acceso a su información personal y préstamos' }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
