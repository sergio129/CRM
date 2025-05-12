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
  },
  categoria_padre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categorias_ingresos',
      key: 'id'
    }
  }
}, {
  tableName: 'categorias_ingresos',
  timestamps: true
});

// Definir relación de auto-referencia para categorías y subcategorías
CategoriaIngreso.associate = function(models) {
  CategoriaIngreso.belongsTo(CategoriaIngreso, {
    foreignKey: 'categoria_padre_id',
    as: 'CategoriaPadre'
  });
  
  CategoriaIngreso.hasMany(CategoriaIngreso, {
    foreignKey: 'categoria_padre_id',
    as: 'Subcategorias'
  });
};

module.exports = CategoriaIngreso;