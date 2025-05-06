const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear tabla de ingresos
    await queryInterface.createTable('ingresos', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      numero_comprobante: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      categoria_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'categorias_ingresos',
          key: 'id'
        }
      },
      concepto: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      valor_bruto: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      valor_retencion: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
      },
      porcentaje_retencion: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
      },
      valor_comision: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
      },
      porcentaje_comision: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
      },
      valor_neto: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      cliente_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'clients',
          key: 'id'
        }
      },
      credito_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'loans',
          key: 'id'
        }
      },
      asesor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'id'
        }
      },
      metodo_pago: {
        type: DataTypes.ENUM('efectivo', 'cheque', 'transferencia', 'tarjeta', 'otro'),
        defaultValue: 'efectivo'
      },
      referencia_pago: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      estado: {
        type: DataTypes.ENUM('pendiente', 'confirmado', 'anulado'),
        defaultValue: 'confirmado'
      },
      archivos_adjuntos: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
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

    // Índices para la tabla de ingresos
    await queryInterface.addIndex('ingresos', ['numero_comprobante'], {
      unique: true,
      name: 'idx_ingresos_numero_comprobante'
    });
    await queryInterface.addIndex('ingresos', ['fecha'], {
      name: 'idx_ingresos_fecha'
    });
    await queryInterface.addIndex('ingresos', ['categoria_id'], {
      name: 'idx_ingresos_categoria_id'
    });
    await queryInterface.addIndex('ingresos', ['cliente_id'], {
      name: 'idx_ingresos_cliente_id'
    });
    await queryInterface.addIndex('ingresos', ['credito_id'], {
      name: 'idx_ingresos_credito_id'
    });
    await queryInterface.addIndex('ingresos', ['asesor_id'], {
      name: 'idx_ingresos_asesor_id'
    });
    await queryInterface.addIndex('ingresos', ['estado'], {
      name: 'idx_ingresos_estado'
    });
    await queryInterface.addIndex('ingresos', ['usuario_id'], {
      name: 'idx_ingresos_usuario_id'
    });

    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ingresos');
    return Promise.resolve();
  }
};