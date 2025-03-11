const Payroll = require('../models/Payroll');
const PayrollDetail = require('../models/PayrollDetail');
const Employee = require('../models/Employee');
const { validationResult } = require('express-validator');

exports.getPayrolls = async (req, res) => {
    try {
        const payrolls = await Payroll.findAll({
            attributes: ['id', 'employee_id', 'salary', 'payment_date', 'status'],
            include: {
                model: Employee,
                attributes: ['full_name', 'id_number'] // Incluir id_number
            }
        });
        res.json(payrolls);
    } catch (error) {
        console.error("Error al obtener nóminas:", error);
        res.status(500).json({ message: "Error al obtener nóminas", error });
    }
};

exports.getPayrollById = async (req, res) => {
    try {
        const payroll = await Payroll.findByPk(req.params.id, {
            attributes: ['id', 'employee_id', 'salary', 'payment_date', 'status'],
            include: {
                model: Employee,
                attributes: ['full_name', 'id_number'] // Incluir id_number
            }
        });

        if (!payroll) return res.status(404).json({ message: "Nómina no encontrada" });

        res.json(payroll);
    } catch (error) {
        console.error("Error al obtener la nómina:", error);
        res.status(500).json({ message: "Error al obtener la nómina", error });
    }
};

exports.createPayroll = async (req, res) => {
    try {
        const {
            employee_id,
            periodo,
            salario_base,
            tipo_pago,
            dias_trabajados,
            horas_extras,
            valor_horas_extras,
            bonificaciones,
            comisiones,
            prestamos,
            otros_descuentos
        } = req.body;

        // Calcular deducciones de ley
        const aporte_salud = salario_base * 0.04; // 4% del salario base
        const aporte_pension = salario_base * 0.04; // 4% del salario base

        // Calcular totales
        const total_ingresos = parseFloat(salario_base) + 
                             parseFloat(valor_horas_extras) + 
                             parseFloat(bonificaciones) + 
                             parseFloat(comisiones);

        const total_deducciones = parseFloat(aporte_salud) + 
                                parseFloat(aporte_pension) + 
                                parseFloat(prestamos) + 
                                parseFloat(otros_descuentos);

        const neto_pagar = total_ingresos - total_deducciones;

        const payrollDetail = await PayrollDetail.create({
            employee_id,
            periodo,
            salario_base,
            tipo_pago,
            dias_trabajados,
            horas_extras,
            valor_horas_extras,
            bonificaciones,
            comisiones,
            aporte_salud,
            aporte_pension,
            prestamos,
            otros_descuentos,
            total_ingresos,
            total_deducciones,
            neto_pagar
        });

        res.status(201).json({ 
            message: "Nómina creada correctamente", 
            payroll: payrollDetail 
        });
    } catch (error) {
        console.error("Error al crear la nómina:", error);
        res.status(500).json({ 
            message: "Error al crear la nómina", 
            error: error.message 
        });
    }
};

exports.updatePayroll = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { employee_id, salary, payment_date, status } = req.body;
        const payroll = await Payroll.findByPk(req.params.id);
        if (!payroll) return res.status(404).json({ message: "Nómina no encontrada" });

        await payroll.update({
            employee_id,
            salary,
            payment_date,
            status
        });

        res.json({ message: "Nómina actualizada correctamente", payroll });
    } catch (error) {
        console.error("Error al actualizar la nómina:", error);
        res.status(500).json({ message: "Error al actualizar la nómina", error });
    }
};

exports.deletePayroll = async (req, res) => {
    try {
        const payroll = await Payroll.findByPk(req.params.id);
        if (!payroll) return res.status(404).json({ message: "Nómina no encontrada" });

        await payroll.destroy();
        res.json({ message: "Nómina eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar la nómina:", error);
        res.status(500).json({ message: "Error al eliminar la nómina", error });
    }
};
