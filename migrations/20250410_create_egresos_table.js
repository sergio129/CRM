'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('egresos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      numero_comprobante: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      categoria_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'categorias_egresos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      concepto: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      monto: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      metodo_pago: {
        type: Sequelize.ENUM('efectivo', 'cheque', 'transferencia', 'tarjeta', 'otro'),
        defaultValue: 'efectivo'
      },
      referencia_pago: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      beneficiario: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'pagado', 'anulado'),
        defaultValue: 'pagado'
      },
      archivos_adjuntos: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URLs o rutas a documentos adjuntos, separadas por comas'
      },
      es_recurrente: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      frecuencia_recurrencia: {
        type: Sequelize.ENUM('diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'semestral', 'anual'),
        allowNull: true
      },
      fecha_proximo_pago: {
        type: Sequelize.DATE,
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

    // Índices para mejorar el rendimiento de las consultas
    await queryInterface.addIndex('egresos', ['categoria_id']);
    await queryInterface.addIndex('egresos', ['fecha']);
    await queryInterface.addIndex('egresos', ['usuario_id']);
    await queryInterface.addIndex('egresos', ['estado']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('egresos');
  }
};