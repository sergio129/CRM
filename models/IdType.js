const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const IdType = sequelize.define('IdType', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    timestamps: false,
    tableName: 'id_types'
});

module.exports = IdType;
