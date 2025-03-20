'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const roles = await queryInterface.sequelize.query('SELECT id, role_name FROM roles', { type: Sequelize.QueryTypes.SELECT });
    const permissions = await queryInterface.sequelize.query('SELECT id, permission_name FROM permissions', { type: Sequelize.QueryTypes.SELECT });

    if (!roles.length || !permissions.length) {
      console.error('Error: Las tablas "roles" o "permissions" están vacías.');
      return;
    }

    const rolePermissions = [];

    // Asociar todos los permisos al rol "Administrador"
    const adminRole = roles.find(role => role.role_name === 'Administrador');
    if (adminRole) {
      permissions.forEach(permission => {
        rolePermissions.push({ role_id: adminRole.id, permission_id: permission.id });
      });
    }

    // Asociar permisos específicos al rol "Asesor"
    const asesorRole = roles.find(role => role.role_name === 'Asesor');
    if (asesorRole) {
      const asesorPermissions = permissions.filter(permission =>
        ['Ver Roles', 'Gestionar Préstamos'].includes(permission.permission_name)
      );
      asesorPermissions.forEach(permission => {
        rolePermissions.push({ role_id: asesorRole.id, permission_id: permission.id });
      });
    }

    // Insertar las relaciones en la tabla `role_permissions`
    if (rolePermissions.length) {
      await queryInterface.bulkInsert('role_permissions', rolePermissions);
    } else {
      console.error('Error: No se encontraron roles o permisos para asociar.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('role_permissions', null, {});
  }
};
