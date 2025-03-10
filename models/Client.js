const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Client = sequelize.define('Client', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(100), allowNull: false },
    address: { type: DataTypes.STRING(100), allowNull: false },
    deuda_total: { type: DataTypes.STRING(100), allowNull: false },
    ultimo_pago: { type: DataTypes.STRING(100), allowNull: false },
    estado_financiero: { type: DataTypes.STRING(100), allowNull: false },
    identification: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('Activo', 'Inactivo'), defaultValue: 'Activo' }
}, {
    tableName: 'clients',
    freezeTableName: true,
    timestamps: false
});

module.exports = Client;
