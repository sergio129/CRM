const Employee = require('../models/Employee');
const { validationResult } = require('express-validator');

exports.getEmployees = async (req, res) => {
    const { page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const { count, rows: employees } = await Employee.findAndCountAll({
            attributes: [
                'id', 'full_name', 'email', 'phone', 'address', 'role', 
                ['salario_base', 'salario_base'], // Alias opcional: mapear salario_base a salario_base (sin 'salary')
                'status', 'id_type_id', 'id_number', 'department', 
                'position', 'hire_date', 'eps','fondo_pension','fondo_cesantias','caja_compensacion','contract_type', 'work_schedule'
            ],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const totalPages = Math.ceil(count / limit);
        res.json({ employees, totalPages });
    } catch (error) {
        console.error("Error al obtener empleados:", error);
        res.status(500).json({ message: "Error al obtener empleados", error });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            attributes: [
                'id', 'full_name', 'email', 'phone', 'address', 'role',
                'salario_base', 'status', 'id_type_id', 'id_number', 'department',
                'position', 'hire_date','riesgo_arl', 'eps','fondo_pension','fondo_cesantias','caja_compensacion','contract_type', 'work_schedule'
            ]
        });

        if (!employee) return res.status(404).json({ message: "Empleado no encontrado" });

        res.json(employee);
    } catch (error) {
        console.error("Error al obtener el empleado:", error);
        res.status(500).json({ message: "Error al obtener el empleado", error });
    }
};

exports.getEmployeeByIdNumber = async (req, res) => {
    try {
        const employee = await Employee.findOne({
            where: { id_number: req.params.id_number },
            attributes: [
                'id', 'full_name', 'email', 'phone', 'address', 'role',
                'salario_base', 'status', 'id_type_id', 'id_number', 'department',
                'position', 'hire_date','riesgo_arl','eps','fondo_pension','fondo_cesantias','caja_compensacion', 'contract_type', 'work_schedule'
            ]
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
        // Agregar console.log para debuggear
        console.log("Datos recibidos en createEmployee:", req.body);

        const { 
            full_name, 
            email, 
            phone, 
            address, 
            role, 
            status, 
            id_type_id, 
            id_number, 
            department, 
            position, 
            hire_date, 
            tipo_contrato,
            salario_base,  // Este es el nuevo campo que usaremos
            riesgo_arl,
            eps,
            fondo_pension,
            fondo_cesantias,
            caja_compensacion
        } = req.body;

        // Asegurar que se impriman los valores recibidos para debug
        console.log("createEmployee req.body:", req.body);

        const newEmployee = await Employee.create({
            full_name,
            email,
            phone,
            address,
            role,
            salario_base, // El nuevo campo
            status,
            id_type_id,
            id_number,
            department,
            position,
            hire_date: hire_date || null,
            tipo_contrato,
            riesgo_arl,
            eps: eps || null,
            fondo_pension: fondo_pension || null,
            fondo_cesantias: fondo_cesantias || null,
            caja_compensacion: caja_compensacion || null
        });

        console.log("Empleado creado:", newEmployee.toJSON());
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
        // Agregar console.log para debuggear
        console.log("Datos recibidos en updateEmployee:", req.body);

        const employeeId = req.params.id;
        const {
            full_name, 
            email, 
            phone, 
            address, 
            role,
            id_type_id,
            id_number,
            department,
            position,
            hire_date,
            tipo_contrato,
            salario_base,
            riesgo_arl,
            eps,
            fondo_pension,
            fondo_cesantias,
            caja_compensacion,
            status
        } = req.body;

        console.log("updateEmployee req.body:", req.body);

        const employee = await Employee.findByPk(employeeId);
        
        if (!employee) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }

        await employee.update({
            full_name,
            email,
            phone,
            address,
            role,
            id_type_id,
            id_number,
            department,
            position,
            hire_date: hire_date || null,
            tipo_contrato,
            salario_base,
            riesgo_arl,
            eps: eps || null,
            fondo_pension: fondo_pension || null,
            fondo_cesantias: fondo_cesantias || null,
            caja_compensacion: caja_compensacion || null,
            status
        });

        console.log("Empleado actualizado:", employee.toJSON());
        res.json({ 
            message: "Empleado actualizado correctamente", 
            employee: employee.toJSON() 
        });
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

exports.bulkDeleteEmployees = async (req, res) => {
    const { ids } = req.body;
    try {
        await Employee.destroy({
            where: {
                id: ids
            }
        });
        res.json({ message: "Empleados eliminados correctamente" });
    } catch (error) {
        console.error("Error al eliminar los empleados:", error);
        res.status(500).json({ message: "Error al eliminar los empleados", error });
    }
};

exports.searchEmployeeByIdNumber = async (req, res) => {
    const { id_number } = req.query;
    
    try {
        if (!id_number) {
            return res.status(400).json({ message: "Por favor ingrese un número de documento" });
        }

        const employees = await Employee.findAll({
            where: { 
                id_number: id_number.toString().trim()
            },
            attributes: [
                'id', 'full_name', 'email', 'phone', 'address', 'role', 
                'salario_base', 'status', 'id_type_id', 'id_number', 'department', 
                'position', 'hire_date','riesgo_arl','eps','fondo_pension','fondo_cesantias','caja_compensacion','contract_type', 'work_schedule'
            ]
        });

        if (!employees || employees.length === 0) {
            return res.status(404).json({ 
                message: "No se encontró ningún empleado con ese número de documento" 
            });
        }

        res.json(employees);
    } catch (error) {
        console.error("Error en la búsqueda:", error);
        res.status(500).json({ 
            message: "Error al buscar empleado", 
            error: error.message 
        });
    }
};

// Agregar este nuevo método al controlador
exports.getActiveEmployees = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            where: { status: 'Activo' },
            attributes: [
                'id', 
                'full_name', 
                'id_number', 
                'salario_base' // Asegurarse de incluir salario_base
            ],
            order: [['full_name', 'ASC']]
        });

        res.json({ employees });
    } catch (error) {
        console.error("Error al obtener empleados activos:", error);
        res.status(500).json({ message: "Error al obtener empleados activos", error });
    }
};