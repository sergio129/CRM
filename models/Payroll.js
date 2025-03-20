const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Employee = require('./Employee');

const Payroll = sequelize.define('Payroll', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    periodo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El período es obligatorio'
            },
            notEmpty: {
                msg: 'El período no puede estar vacío'
            }
        }
    },
    salario_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    total_ingresos: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    total_deducciones: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    neto_pagar: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    payment_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Pendiente', 'Pagado', 'Anulado'),
        defaultValue: 'Pendiente'
    }
}, {
    timestamps: false,
    tableName: 'payrolls'
});

// Definir la relación con Employee
Payroll.belongsTo(Employee, {
    foreignKey: 'employee_id',
    as: 'Employee'
});

module.exports = Payroll;