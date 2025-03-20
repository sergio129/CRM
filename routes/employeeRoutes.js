const express = require('express');
const Employee = require('../models/Employee'); // Importar el modelo Employee
const { 
    getEmployees, 
    getEmployeeById, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee, 
    bulkDeleteEmployees, 
    getEmployeeByIdNumber,
    getActiveEmployees 
} = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Reordenar las rutas específicas primero (orden es importante)
router.get('/search', authenticate, async (req, res) => {
    try {
        const { id } = req.query; // Cambiar a buscar por `id`
        
        console.log("Buscando empleado con ID:", id); // Debug

        if (!id) {
            return res.status(400).json({ message: 'El parámetro "id" es obligatorio.' });
        }

        const employee = await Employee.findOne({
            where: { id: id }, // Buscar por `id`
            attributes: [
                'id', 'id_number', 'full_name', 'email', 'phone', 'address',
                'role', 'department', 'position', 'hire_date', 'tipo_contrato',
                'salario_base', 'eps', 'banco', 'tipo_cuenta', 'cuenta_bancaria',
                'fondo_pension', 'fondo_cesantias', 'caja_compensacion', 'status'
            ]
        });

        if (!employee) {
            console.log("Empleado no encontrado. Verifica si el ID existe en la base de datos."); // Debug
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        console.log("Empleado encontrado:", employee.toJSON()); // Debug
        res.json(employee);
    } catch (error) {
        console.error("Error al buscar empleado:", error);
        res.status(500).json({ 
            message: 'Error al buscar empleado',
            error: error.message 
        });
    }
});
router.get('/by-id/:id', authenticate, authorize(['Administrador']), getEmployeeById); // Cambiar a buscar por `id`
router.get('/id/:id', authenticate, authorize(['Administrador']), getEmployeeById);
router.get('/active', authenticate, authorize(['Administrador']), getActiveEmployees);
router.post('/bulk-delete', authenticate, authorize(['Administrador']), bulkDeleteEmployees);

// Rutas genéricas después
router.get('/', authenticate, getEmployees); // Requiere autenticación
router.post('/', authenticate, createEmployee); // Requiere autenticación
router.get('/:id', authenticate, authorize(['Administrador']), getEmployeeById);
router.put('/:id', authenticate, updateEmployee); // Requiere autenticación
router.delete('/:id', authenticate, deleteEmployee); // Requiere autenticación

module.exports = router;
