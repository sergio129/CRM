'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('proveedores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tipo_documento: {
        type: Sequelize.ENUM('CC', 'NIT', 'CE', 'TI', 'pasaporte', 'otro'),
        allowNull: false
      },
      numero_documento: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true
      },
      razon_social: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      nombre_comercial: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      persona_contacto: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      celular: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      direccion: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      ciudad: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      departamento: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      pais: {
        type: Sequelize.STRING(100),
        defaultValue: 'Colombia'
      },
      banco: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      tipo_cuenta: {
        type: Sequelize.ENUM('ahorro', 'corriente', 'otro'),
        allowNull: true
      },
      numero_cuenta: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      es_activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Índices
    await queryInterface.addIndex('proveedores', ['numero_documento']);
    await queryInterface.addIndex('proveedores', ['razon_social']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('proveedores');
  }
};