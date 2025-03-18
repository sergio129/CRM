const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Client = require('./Client'); // Modelo de cliente existente

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Client,
      key: 'id'
    }
  },
  loan_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  amount_requested: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  interest_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  interest_type: {
    type: DataTypes.ENUM('Fijo', 'Variable'),
    defaultValue: 'Fijo',
    allowNull: false
  },
  payment_term: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payment_frequency: {
    type: DataTypes.ENUM('Semanal', 'Quincenal', 'Mensual'),
    defaultValue: 'Mensual',
    allowNull: false
  },
  guarantee_type: {
    type: DataTypes.ENUM('Personal', 'Prendaria', 'Hipotecaria', 'Aval Digital'),
    allowNull: true
  },
  co_signer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Client,
      key: 'id'
    }
  },
  additional_income: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  loan_status: {
    type: DataTypes.ENUM('Activo', 'Cancelado', 'Vencido', 'En Mora'),
    defaultValue: 'Activo',
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'loans'
});

Loan.belongsTo(Client, { foreignKey: 'client_id', as: 'Client' });
Loan.belongsTo(Client, { foreignKey: 'co_signer_id', as: 'CoSigner' });

module.exports = Loan;
