const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Employee = require('./Employee');

const PayrollDetail = sequelize.define('PayrollDetail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Employee,
            key: 'id'
        }
    },
    // Período y datos básicos
    periodo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_pago: {
        type: DataTypes.DATE,
        allowNull: false
    },
    dias_trabajados: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    dias_vacaciones: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    dias_incapacidad: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },

    // Ingresos
    salario_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    auxilio_transporte: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    horas_extras_diurnas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    valor_hora_extra_diurna: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    horas_extras_nocturnas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    valor_hora_extra_nocturna: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    bonificaciones: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    comisiones: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    recargo_dominical: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },

    // Deducciones de ley
    aporte_salud_empleado: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    aporte_pension_empleado: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    aporte_salud_empleador: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    aporte_pension_empleador: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    aporte_arl: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    aporte_caja_compensacion: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    aporte_icbf: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    aporte_sena: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },

    // Otras deducciones
    prestamos: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    embargos: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    otros_descuentos: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },

    // Provisiones
    provision_prima: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    provision_cesantias: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    provision_intereses_cesantias: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    provision_vacaciones: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },

    // Totales
    total_ingresos: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    total_deducciones: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    total_provisiones: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    neto_pagar: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },

    // Estado del pago
    estado: {
        type: DataTypes.ENUM('Pendiente', 'Pagado', 'Anulado'),
        defaultValue: 'Pendiente'
    },
    metodo_pago: {
        type: DataTypes.ENUM('Transferencia', 'Cheque', 'Efectivo'),
        defaultValue: 'Transferencia'
    },
    observaciones: {
        type: DataTypes.TEXT
    }
}, {
    timestamps: false, // Deshabilitar timestamps
    tableName: 'payroll_details'
});

// Establecer relaciones
PayrollDetail.belongsTo(Employee, { foreignKey: 'employee_id' });

module.exports = PayrollDetail;
