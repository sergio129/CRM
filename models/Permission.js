const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    permission_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: false, // Deshabilitar completamente los timestamps
    tableName: 'permissions'
});

Permission.associate = (models) => {
    Permission.belongsToMany(models.Role, {
        through: 'role_permissions',
        foreignKey: 'permission_id',
        otherKey: 'role_id',
        as: 'roles' // Alias para incluir roles
    });
};

module.exports = Permission;
