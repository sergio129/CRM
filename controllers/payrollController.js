const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { validationResult } = require('express-validator');

exports.getPayrolls = async (req, res) => {
    try {
        const payrolls = await Payroll.findAll({
            attributes: ['id', 'employee_id', 'salary', 'payment_date', 'status'], // Agregar employee_id
            include: {
                model: Employee,
                attributes: ['full_name']
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
            attributes: ['id', 'employee_id', 'salary', 'payment_date', 'status'], // Agregar employee_id
            include: {
                model: Employee,
                attributes: ['full_name']
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { employee_id, salary, payment_date, status } = req.body;
        const newPayroll = await Payroll.create({
            employee_id,
            salary,
            payment_date,
            status
        });

        res.status(201).json({ message: "Nómina creada correctamente", payroll: newPayroll });
    } catch (error) {
        console.error("Error al crear la nómina:", error);
        res.status(500).json({ message: "Error al crear la nómina", error });
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
