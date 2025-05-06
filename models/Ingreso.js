const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ingreso = sequelize.define('Ingreso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_comprobante: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
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
      model: 'categorias_ingresos',
      key: 'id'
    }
  },
  concepto: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  valor_bruto: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  valor_retencion: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  porcentaje_retencion: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  valor_comision: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  porcentaje_comision: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  valor_neto: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  credito_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'loans',
      key: 'id'
    }
  },
  asesor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'id'
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
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmado', 'anulado'),
    defaultValue: 'confirmado'
  },
  archivos_adjuntos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'ingresos',
  timestamps: true
});

// Add the associate method to define the relationships
Ingreso.associate = function(models) {
  Ingreso.belongsTo(models.CategoriaIngreso, { 
    foreignKey: 'categoria_id', 
    as: 'Categoria' 
  });
  
  Ingreso.belongsTo(models.Client, { 
    foreignKey: 'cliente_id', 
    as: 'Cliente' 
  });
  
  Ingreso.belongsTo(models.Employee, { 
    foreignKey: 'asesor_id', 
    as: 'Asesor' 
  });
  
  Ingreso.belongsTo(models.Loan, { 
    foreignKey: 'credito_id', 
    as: 'Credito' 
  });
  
  Ingreso.belongsTo(models.User, { 
    foreignKey: 'usuario_id', 
    as: 'Usuario' 
  });
};

module.exports = Ingreso;