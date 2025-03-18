'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('loans');

    if (!tableInfo.total_due) {
      await queryInterface.addColumn('loans', 'total_due', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      });
    }

    if (!tableInfo.remaining_installments) {
      await queryInterface.addColumn('loans', 'remaining_installments', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }

    if (!tableInfo.installment_amount) {
      await queryInterface.addColumn('loans', 'installment_amount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('loans');

    if (tableInfo.total_due) {
      await queryInterface.removeColumn('loans', 'total_due');
    }

    if (tableInfo.remaining_installments) {
      await queryInterface.removeColumn('loans', 'remaining_installments');
    }

    if (tableInfo.installment_amount) {
      await queryInterface.removeColumn('loans', 'installment_amount');
    }
  }
};
