const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Client = require('./Client');

const CreditHistory = sequelize.define('CreditHistory', {
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
    credit_score: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    report_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'credit_histories'
});

module.exports = CreditHistory;
