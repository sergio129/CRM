'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('roles');

    if (tableInfo.permissions) {
      await queryInterface.removeColumn('roles', 'permissions');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('roles');

    if (!tableInfo.permissions) {
      await queryInterface.addColumn('roles', 'permissions', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  }
};
