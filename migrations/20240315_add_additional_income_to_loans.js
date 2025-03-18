'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('loans');

    if (!tableInfo.additional_income) {
      await queryInterface.addColumn('loans', 'additional_income', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('loans');

    if (tableInfo.additional_income) {
      await queryInterface.removeColumn('loans', 'additional_income');
    }
  }
};
