const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class EgresoRecurrente extends Model {}

EgresoRecurrente.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  egreso_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Egreso',
      key: 'id'
    }
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  frecuencia: {
    type: DataTypes.ENUM('diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'semestral', 'anual'),
    allowNull: false,
    defaultValue: 'mensual'
  },
  dia_mes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 31
    }
  },
  dia_semana: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 6
    }
  },
  cantidad_repeticiones: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  repeticiones_completadas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ultima_ejecucion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  proxima_ejecucion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  es_activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'EgresoRecurrente',
  tableName: 'egresos_recurrentes',
  timestamps: true
});

// Definir las asociaciones
EgresoRecurrente.associate = (models) => {
  EgresoRecurrente.belongsTo(models.Egreso, { 
    foreignKey: 'egreso_id',
    as: 'egreso' 
  });
};

module.exports = EgresoRecurrente;