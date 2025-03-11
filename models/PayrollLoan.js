const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Employee = require('./Employee');

const PayrollLoan = sequelize.define('PayrollLoan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Employee,
            key: 'id'
        }
    },
    monto_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    cuotas_totales: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cuotas_pagadas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    valor_cuota: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin_estimada: {
        type: DataTypes.DATE,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('Activo', 'Pagado', 'Cancelado'),
        defaultValue: 'Activo'
    },
    descripcion: {
        type: DataTypes.TEXT
    }
});

PayrollLoan.belongsTo(Employee, { foreignKey: 'employee_id' });

module.exports = PayrollLoan;
