const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Campos obligatorios
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    identification: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    ultimo_pago: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    // Campos Personales
    full_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tipo_documento: {
        type: DataTypes.ENUM('DNI', 'Pasaporte', 'Cédula', 'Otro'),
        allowNull: true
    },
    fecha_nacimiento: DataTypes.DATE,
    genero: DataTypes.ENUM('Masculino', 'Femenino', 'Otro'),
    estado_civil: DataTypes.ENUM('Soltero', 'Casado', 'Divorciado', 'Viudo', 'Otro'),
    nacionalidad: DataTypes.STRING,

    // Datos de Contacto
    telefono_movil: DataTypes.STRING,
    telefono_fijo: DataTypes.STRING,
    email: DataTypes.STRING,
    ciudad: DataTypes.STRING,
    codigo_postal: DataTypes.STRING,
    pais: DataTypes.STRING,

    // Datos Financieros
    numero_cuenta: DataTypes.STRING,
    tipo_cuenta: DataTypes.ENUM('Corriente', 'Ahorros'),
    moneda: DataTypes.STRING(3),
    saldo_disponible: {
        type: DataTypes.DECIMAL(15,2),
        defaultValue: 0
    },
    limite_credito: DataTypes.DECIMAL(15,2),

    // Datos Laborales
    ocupacion: DataTypes.STRING,
    empresa: DataTypes.STRING,
    sector_economico: DataTypes.STRING,
    ingresos_mensuales: DataTypes.DECIMAL(15,2),
    tipo_contrato: DataTypes.ENUM('Indefinido', 'Temporal', 'Autónomo', 'Otro'),
    antiguedad_trabajo: DataTypes.DATE,

    // Datos de Crédito y Riesgo
    scoring_crediticio: DataTypes.INTEGER,
    deudas_actuales: {
        type: DataTypes.DECIMAL(15,2),
        defaultValue: 0
    },
    creditos_vigentes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    deuda_total: {
        type: DataTypes.DECIMAL(15,2),
        defaultValue: 0
    },
    estado_financiero: DataTypes.STRING,
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Activo'
    },
    id_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    timestamps: false, // Deshabilitar timestamps
    tableName: 'clients'
});

module.exports = Client;
