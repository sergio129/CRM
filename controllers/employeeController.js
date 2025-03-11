const Employee = require('../models/Employee');
const { validationResult } = require('express-validator');

exports.getEmployees = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            attributes: ['id', 'full_name', 'email', 'phone', 'address', 'role', 'salary', 'status', 'id_type_id', 'id_number']
        });
        res.json(employees);
    } catch (error) {
        console.error("Error al obtener empleados:", error);
        res.status(500).json({ message: "Error al obtener empleados", error });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            attributes: ['id', 'full_name', 'email', 'phone', 'address', 'role', 'salary', 'status', 'id_type_id', 'id_number']
        });

        if (!employee) return res.status(404).json({ message: "Empleado no encontrado" });

        res.json(employee);
    } catch (error) {
        console.error("Error al obtener el empleado:", error);
        res.status(500).json({ message: "Error al obtener el empleado", error });
    }
};

exports.createEmployee = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { full_name, email, phone, address, role, salary, status, id_type_id, id_number } = req.body;
        const newEmployee = await Employee.create({
            full_name,
            email,
            phone,
            address,
            role,
            salary,
            status,
            id_type_id,
            id_number
        });

        res.status(201).json({ message: "Empleado creado correctamente", employee: newEmployee });
    } catch (error) {
        console.error("Error al crear el empleado:", error);
        res.status(500).json({ message: "Error al crear el empleado", error });
    }
};

exports.updateEmployee = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { full_name, email, phone, address, role, salary, status, id_type_id, id_number } = req.body;
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json({ message: "Empleado no encontrado" });

        await employee.update({
            full_name,
            email,
            phone,
            address,
            role,
            salary,
            status,
            id_type_id,
            id_number
        });

        res.json({ message: "Empleado actualizado correctamente", employee });
    } catch (error) {
        console.error("Error al actualizar el empleado:", error);
        res.status(500).json({ message: "Error al actualizar el empleado", error });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) return res.status(404).json({ message: "Empleado no encontrado" });

        await employee.destroy();
        res.json({ message: "Empleado eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar el empleado:", error);
        res.status(500).json({ message: "Error al eliminar el empleado", error });
    }
};
