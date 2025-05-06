const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear tabla de categorías de ingresos
    await queryInterface.createTable('categorias_ingresos', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      es_activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      requiere_cliente: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      porcentaje_retencion: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
      },
      permite_comision: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      es_credito: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Índices para la tabla de categorías
    await queryInterface.addIndex('categorias_ingresos', ['nombre'], {
      unique: true,
      name: 'idx_categorias_ingresos_nombre'
    });
    
    // Añadir datos iniciales de categorías
    await queryInterface.bulkInsert('categorias_ingresos', [
      {
        nombre: 'Ingresos brutos de actividad ordinaria',
        descripcion: 'Ingresos principales del negocio',
        es_activo: true,
        requiere_cliente: false,
        porcentaje_retencion: 0,
        permite_comision: false,
        es_credito: false
      },
      {
        nombre: 'Otros ingresos brutos',
        descripcion: 'Ingresos secundarios y extraordinarios',
        es_activo: true,
        requiere_cliente: false,
        porcentaje_retencion: 0,
        permite_comision: false,
        es_credito: false
      },
      {
        nombre: 'Intereses - Créditos de consumo',
        descripcion: 'Intereses generados por créditos de consumo',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 0,
        permite_comision: true,
        es_credito: true
      },
      {
        nombre: 'Intereses - Libranza',
        descripcion: 'Intereses generados por créditos de libranza',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 0,
        permite_comision: true,
        es_credito: true
      },
      {
        nombre: 'Intereses - Libre inversión',
        descripcion: 'Intereses generados por créditos de libre inversión',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 0,
        permite_comision: true,
        es_credito: true
      },
      {
        nombre: 'Servicios jurídicos',
        descripcion: 'Honorarios y comisiones por servicios jurídicos',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 10,
        permite_comision: true,
        es_credito: false
      },
      {
        nombre: 'Servicios contables',
        descripcion: 'Honorarios por servicios contables y financieros',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 10,
        permite_comision: true,
        es_credito: false
      },
      {
        nombre: 'Servicios financieros',
        descripcion: 'Comisiones por servicios financieros',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 7,
        permite_comision: true,
        es_credito: false
      },
      {
        nombre: 'Capacitaciones a terceros',
        descripcion: 'Ingresos por servicios de capacitación',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 5,
        permite_comision: true,
        es_credito: false
      },
      {
        nombre: 'Ingresos a través de beneficiarios',
        descripcion: 'Ingresos recibidos a través de terceros beneficiarios',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 0,
        permite_comision: true,
        es_credito: false
      },
      {
        nombre: 'Cuentas en participación',
        descripcion: 'Ingresos por contratos de cuentas en participación',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 0,
        permite_comision: false,
        es_credito: false
      },
      {
        nombre: 'Consorcios/uniones temporales',
        descripcion: 'Ingresos por participación en consorcios',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 0,
        permite_comision: false,
        es_credito: false
      },
      {
        nombre: 'Contratos de avales',
        descripcion: 'Ingresos por servicios de avalistas',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 0,
        permite_comision: true,
        es_credito: false
      },
      {
        nombre: 'Aseguradoras',
        descripcion: 'Ingresos por comisiones de aseguradoras',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 0,
        permite_comision: true,
        es_credito: false
      },
      {
        nombre: 'Pagos recibidos para terceros',
        descripcion: 'Ingresos recibidos para transferir a terceros',
        es_activo: true,
        requiere_cliente: true,
        porcentaje_retencion: 0,
        permite_comision: false,
        es_credito: false
      }
    ]);

    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('categorias_ingresos');
    return Promise.resolve();
  }
};