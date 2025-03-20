'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('role_permissions');

    if (!tableInfo.createdAt) {
      await queryInterface.addColumn('role_permissions', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    }

    if (!tableInfo.updatedAt) {
      await queryInterface.addColumn('role_permissions', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('role_permissions');

    if (tableInfo.createdAt) {
      await queryInterface.removeColumn('role_permissions', 'createdAt');
    }

    if (tableInfo.updatedAt) {
      await queryInterface.removeColumn('role_permissions', 'updatedAt');
    }
  }
};
