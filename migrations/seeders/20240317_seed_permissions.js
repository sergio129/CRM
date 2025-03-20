'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('permissions', [
      { permission_name: 'Crear Usuarios', description: 'Permite crear nuevos usuarios' },
      { permission_name: 'Editar Usuarios', description: 'Permite editar usuarios existentes' },
      { permission_name: 'Eliminar Usuarios', description: 'Permite eliminar usuarios' },
      { permission_name: 'Ver Roles', description: 'Permite ver la lista de roles' },
      { permission_name: 'Asignar Roles', description: 'Permite asignar roles a usuarios' },
      { permission_name: 'Gestionar Nómina', description: 'Permite gestionar la nómina' },
      { permission_name: 'Gestionar Préstamos', description: 'Permite gestionar préstamos' }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
