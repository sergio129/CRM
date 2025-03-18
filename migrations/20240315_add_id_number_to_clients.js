'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('clients');

    if (!tableInfo.id_number) {
      await queryInterface.addColumn('clients', 'id_number', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('clients');

    if (tableInfo.id_number) {
      await queryInterface.removeColumn('clients', 'id_number');
    }
  }
};
