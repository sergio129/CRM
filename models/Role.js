const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/database');

class Role extends Model {}

Role.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        validate: {
            isInt: true
        }
    },
    role_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [3, 50]
        }
    },
    permissions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [], // Permisos vacíos por defecto
        validate: {
            isValidPermissions(value) {
                if (!Array.isArray(value)) {
                    throw new Error('Los permisos deben ser un array');
                }
            }
        }
    }
}, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['role_name']
        }
    ]
});

// Relación con Usuarios (si aplica)
Role.associate = function(models) {
    this.hasMany(models.User, {
        foreignKey: 'roleId',
        as: 'users'
    });
};

module.exports = Role;