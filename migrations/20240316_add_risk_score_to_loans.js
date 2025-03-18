'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('loans');
    
    if (!tableInfo.risk_score) {
        await queryInterface.addColumn('loans', 'risk_score', {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: true
        });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('loans', 'risk_score');
  }
};
