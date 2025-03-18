const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Loan = require('./Loan');

const PaymentHistory = sequelize.define('PaymentHistory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    loan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Loan,
            key: 'id'
        }
    },
    payment_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    payment_method: {
        type: DataTypes.ENUM('Transferencia', 'Cheque', 'Efectivo'),
        defaultValue: 'Transferencia',
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'payment_histories'
});

PaymentHistory.belongsTo(Loan, { foreignKey: 'loan_id', as: 'Loan' });

module.exports = PaymentHistory;
