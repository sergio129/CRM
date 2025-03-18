'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('loans', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clients', // Tabla de clientes existente
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount_requested: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      interest_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      interest_type: {
        type: Sequelize.ENUM('Fijo', 'Variable'),
        defaultValue: 'Fijo',
        allowNull: false
      },
      payment_term: {
        type: Sequelize.INTEGER, // Plazo en meses
        allowNull: false
      },
      payment_frequency: {
        type: Sequelize.ENUM('Semanal', 'Quincenal', 'Mensual'),
        defaultValue: 'Mensual',
        allowNull: false
      },
      guarantee_type: {
        type: Sequelize.ENUM('Personal', 'Prendaria', 'Hipotecaria', 'Aval Digital'),
        allowNull: true
      },
      co_signer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clients', // Tabla de clientes existente
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      loan_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      loan_status: {
        type: Sequelize.ENUM('Activo', 'Cancelado', 'Vencido', 'En Mora'),
        defaultValue: 'Activo',
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('loans');
  }
};
