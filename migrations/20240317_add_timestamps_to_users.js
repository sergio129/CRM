'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('users');

    if (!tableInfo.createdAt) {
      await queryInterface.addColumn('users', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    }

    if (!tableInfo.updatedAt) {
      await queryInterface.addColumn('users', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('users');

    if (tableInfo.createdAt) {
      await queryInterface.removeColumn('users', 'createdAt');
    }

    if (tableInfo.updatedAt) {
      await queryInterface.removeColumn('users', 'updatedAt');
    }
  }
};
