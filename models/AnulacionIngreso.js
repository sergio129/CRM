const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Ingreso = require('./Ingreso');
const User = require('./User');

const AnulacionIngreso = sequelize.define('anulacion_ingresos', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ingreso_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Ingreso,
            key: 'id'
        }
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    fecha_anulacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    motivo_anulacion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    datos_ingreso_anulado: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'JSON con los datos completos del ingreso antes de la anulación'
    },
    ip_usuario: {
        type: DataTypes.STRING,
        allowNull: true
    },
    navegador_usuario: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Establecer relación con Ingreso
AnulacionIngreso.belongsTo(Ingreso, { foreignKey: 'ingreso_id' });
Ingreso.hasOne(AnulacionIngreso, { foreignKey: 'ingreso_id' });

// Establecer relación con User
AnulacionIngreso.belongsTo(User, { foreignKey: 'usuario_id' });

module.exports = AnulacionIngreso;
