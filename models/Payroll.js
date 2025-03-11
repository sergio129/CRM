const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');
const Employee = require('./Employee');

const Payroll = sequelize.define('Payroll', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    employee_id: { // Agregar la columna employee_id
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Employee,
            key: 'id'
        }
    },
    salary: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    payment_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'payrolls'
});

Payroll.belongsTo(Employee, { foreignKey: 'employee_id' });

module.exports = Payroll;
