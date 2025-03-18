const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Employee = require('./Employee');
const Payroll = require('./Payroll');

const PayrollDetails = sequelize.define('PayrollDetails', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    payroll_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'payrolls',
            key: 'id'
        }
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    periodo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_pago: {
        type: DataTypes.DATE,
        allowNull: false
    },
    tipo_pago: {
        type: DataTypes.ENUM('Mensual', 'Quincenal', 'Semanal'),
        defaultValue: 'Mensual',
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
    salario_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    auxilio_transporte: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    // Ingresos adicionales
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
        defaultValue: 0.00
    },
    recargo_dominical: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    bonificaciones: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        get() {
            const value = this.getDataValue('bonificaciones');
            return value === null ? 0 : parseFloat(value);
        },
        set(value) {
            this.setDataValue('bonificaciones', parseFloat(value || 0));
        }
    },
    comisiones: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    // Deducciones
    deduccion_salud: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false
    },
    deduccion_pension: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false
    },
    prestamos: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false
    },
    otros_descuentos: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false
    },
    embargos: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    aporte_salud_empleado: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    aporte_pension_empleado: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    aporte_salud_empleador: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    aporte_pension_empleador: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    aporte_arl: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    aporte_caja_compensacion: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    aporte_icbf: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    aporte_sena: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    // Totales
    total_ingresos: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    total_deducciones: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false
    },
    neto_pagar: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    provision_prima: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    provision_cesantias: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    provision_intereses_cesantias: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    provision_vacaciones: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    total_provisiones: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    metodo_pago: {
        type: DataTypes.ENUM('Transferencia', 'Cheque', 'Efectivo'),
        defaultValue: 'Transferencia'
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('Pendiente', 'Pagado', 'Anulado'),
        defaultValue: 'Pendiente',
        allowNull: false
    }
}, {
    timestamps: true, // Habilitar timestamps
    tableName: 'PayrollDetails', // Asegurarse de que el nombre de la tabla coincida con el de la base de datos
    underscored: true, // Esto hará que Sequelize use snake_case para los campos timestamp
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Establecer relaciones
PayrollDetails.belongsTo(Employee, { foreignKey: 'employee_id' });
PayrollDetails.belongsTo(Payroll, { foreignKey: 'payroll_id' });

module.exports = PayrollDetails;
