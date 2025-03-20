'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
