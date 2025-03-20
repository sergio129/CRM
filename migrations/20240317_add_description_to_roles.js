'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('roles');

    if (!tableInfo.description) {
      await queryInterface.addColumn('roles', 'description', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('roles');

    if (tableInfo.description) {
      await queryInterface.removeColumn('roles', 'description');
    }
  }
};
