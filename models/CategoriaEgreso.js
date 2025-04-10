const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class CategoriaEgreso extends Model {}

CategoriaEgreso.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre de la categoría es obligatorio'
      }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  es_activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'CategoriaEgreso',
  tableName: 'categorias_egresos',
  timestamps: true
});

module.exports = CategoriaEgreso;