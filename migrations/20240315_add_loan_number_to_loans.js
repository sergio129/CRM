'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('loans');

    if (!tableInfo.loan_number) {
      await queryInterface.addColumn('loans', 'loan_number', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('loans');

    if (tableInfo.loan_number) {
      await queryInterface.removeColumn('loans', 'loan_number');
    }
  }
};
