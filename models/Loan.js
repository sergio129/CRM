const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Importar el modelo Client de forma diferida para evitar dependencias circulares
const Client = require('./Client');

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
    type: DataTypes.ENUM('Activo', 'Pagado', 'Vencido', 'En Mora'),
    defaultValue: 'Activo',
    allowNull: false
  },
  total_due: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  remaining_installments: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  installment_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
},
  risk_score: {
    type: DataTypes.DECIMAL(5, 2), // Puntaje de riesgo entre 0 y 1
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'loans'
});

// Configurar las relaciones después de definir ambos modelos
Loan.associate = (models) => {
Loan.belongsTo(models.Client, { foreignKey: 'client_id', as: 'Client' });
Loan.belongsTo(models.Client, { foreignKey: 'co_signer_id', as: 'CoSigner' });
};

module.exports = Loan;
