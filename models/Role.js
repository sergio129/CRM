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
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: false, // Deshabilitar completamente los timestamps
    indexes: [
        {
            unique: true,
            fields: ['role_name']
        }
    ]
});

// Relación con permisos
Role.associate = (models) => {
    Role.belongsToMany(models.Permission, {
        through: 'role_permissions',
        foreignKey: 'role_id',
        otherKey: 'permission_id',
        as: 'permissions' // Alias para incluir permisos
    });
};

module.exports = Role;