const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Egreso extends Model {}

Egreso.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_comprobante: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'CategoriaEgreso',
      key: 'id'
    }
  },
  concepto: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El concepto es obligatorio'
      }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  monto: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'El monto debe ser un valor numérico válido'
      },
      min: {
        args: [0.01],
        msg: 'El monto debe ser mayor a cero'
      }
    }
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo', 'cheque', 'transferencia', 'tarjeta', 'otro'),
    defaultValue: 'efectivo'
  },
  referencia_pago: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  beneficiario: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'pagado', 'anulado'),
    defaultValue: 'pagado'
  },
  archivos_adjuntos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  es_recurrente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  frecuencia_recurrencia: {
    type: DataTypes.ENUM('diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'semestral', 'anual'),
    allowNull: true
  },
  fecha_proximo_pago: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Egreso',
  tableName: 'egresos',
  timestamps: true,
  hooks: {
    beforeCreate: (egreso) => {
      if (!egreso.numero_comprobante) {
        // Generar número de comprobante automático
        const fecha = new Date();
        const año = fecha.getFullYear().toString().substr(2);
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const aleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        egreso.numero_comprobante = `EG-${año}${mes}-${aleatorio}`;
      }
    }
  }
});

// Definir las asociaciones en un método que se llamará después de que todos los modelos estén definidos
Egreso.associate = (models) => {
  Egreso.belongsTo(models.CategoriaEgreso, { 
    foreignKey: 'categoria_id',
    as: 'categoria' 
  });
  
  Egreso.belongsTo(models.User, { 
    foreignKey: 'usuario_id',
    as: 'usuario' 
  });
  
  Egreso.hasOne(models.EgresoRecurrente, {
    foreignKey: 'egreso_id',
    as: 'recurrencia'
  });
};

module.exports = Egreso;