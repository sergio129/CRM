const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategoriaIngreso = sequelize.define('CategoriaIngreso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  es_activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requiere_cliente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  porcentaje_retencion: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  permite_comision: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  es_credito: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'categorias_ingresos',
  timestamps: true
});

module.exports = CategoriaIngreso;