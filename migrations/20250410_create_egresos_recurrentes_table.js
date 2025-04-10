'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('egresos_recurrentes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      egreso_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'egresos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fecha_inicio: {
        type: Sequelize.DATE,
        allowNull: false
      },
      fecha_fin: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'NULL significa que no tiene fecha de finalización'
      },
      frecuencia: {
        type: Sequelize.ENUM('diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'semestral', 'anual'),
        allowNull: false,
        defaultValue: 'mensual'
      },
      dia_mes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Día del mes para frecuencias mensuales o superiores'
      },
      dia_semana: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Día de la semana (0=domingo, 1=lunes, ...) para frecuencias semanales o quincenales'
      },
      cantidad_repeticiones: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Número máximo de repeticiones, NULL para ilimitado'
      },
      repeticiones_completadas: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      ultima_ejecucion: {
        type: Sequelize.DATE,
        allowNull: true
      },
      proxima_ejecucion: {
        type: Sequelize.DATE,
        allowNull: false
      },
      es_activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.addIndex('egresos_recurrentes', ['egreso_id']);
    await queryInterface.addIndex('egresos_recurrentes', ['proxima_ejecucion']);
    await queryInterface.addIndex('egresos_recurrentes', ['es_activo']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('egresos_recurrentes');
  }
};