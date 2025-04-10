const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Proveedor extends Model {}

Proveedor.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo_documento: {
    type: DataTypes.ENUM('CC', 'NIT', 'CE', 'TI', 'pasaporte', 'otro'),
    allowNull: false
  },
  numero_documento: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'El número de documento es obligatorio'
      }
    }
  },
  razon_social: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La razón social es obligatoria'
      }
    }
  },
  nombre_comercial: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  persona_contacto: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  celular: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'El formato del correo electrónico no es válido'
      }
    }
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  departamento: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  pais: {
    type: DataTypes.STRING(100),
    defaultValue: 'Colombia'
  },
  banco: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  tipo_cuenta: {
    type: DataTypes.ENUM('ahorro', 'corriente', 'otro'),
    allowNull: true
  },
  numero_cuenta: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  es_activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Proveedor',
  tableName: 'proveedores',
  timestamps: true
});

module.exports = Proveedor;