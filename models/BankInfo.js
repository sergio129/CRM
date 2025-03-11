const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');
const Employee = require('./Employee');

const BankInfo = sequelize.define('BankInfo', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Employee,
            key: 'id'
        }
    },
    bank_account_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bank_account_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bank_name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'bank_info'
});

BankInfo.belongsTo(Employee, { foreignKey: 'employee_id' });

module.exports = BankInfo;
