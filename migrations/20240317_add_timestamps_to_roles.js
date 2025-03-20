'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('roles');

    if (!tableInfo.createdAt) {
      await queryInterface.addColumn('roles', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    }

    if (!tableInfo.updatedAt) {
      await queryInterface.addColumn('roles', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('roles');

    if (tableInfo.createdAt) {
      await queryInterface.removeColumn('roles', 'createdAt');
    }

    if (tableInfo.updatedAt) {
      await queryInterface.removeColumn('roles', 'updatedAt');
    }
  }
};
