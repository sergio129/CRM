const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    id_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.STRING,
        allowNull: true
    },
    salary: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    position: {
        type: DataTypes.STRING,
        allowNull: true
    },
    hire_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    contract_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    work_schedule: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tipo_contrato: {
        type: DataTypes.ENUM('Indefinido', 'Fijo', 'Obra', 'Aprendizaje'),
        allowNull: false
    },
    salario_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    riesgo_arl: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    cuenta_bancaria: {
        type: DataTypes.STRING
    },
    banco: {
        type: DataTypes.STRING
    },
    tipo_cuenta: {
        type: DataTypes.ENUM('Ahorros', 'Corriente')
    },
    eps: {
        type: DataTypes.STRING
    },
    fondo_pension: {
        type: DataTypes.STRING
    },
    fondo_cesantias: {
        type: DataTypes.STRING
    },
    caja_compensacion: {
        type: DataTypes.STRING
    }
}, {
    timestamps: false,
    tableName: 'employees'
});

module.exports = Employee;
