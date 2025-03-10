const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('Administrador', 'Asesor', 'Cliente'), defaultValue: 'Cliente' },
    status: { type: DataTypes.ENUM('Activo', 'Inactivo', 'Suspendido'), defaultValue: 'Activo' },

    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'roles', // Nombre de la tabla
          key: 'id'
        }
      }
}, {
    tableName: 'users',  // 🔹 Especificar el nombre exacto de la tabla
    freezeTableName: true, // 🔹 Evitar que Sequelize pluralice o modifique el nombre
    timestamps: false // 🔹 Evita `createdAt` y `updatedAt` si no los necesitas
});

// 🔽 Agregar asociación
User.associate = function(models) {
    User.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role' // Alias para la relación
    });
  };
module.exports = User;
