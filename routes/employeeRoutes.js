const express = require('express');
const { 
    getEmployees, 
    getEmployeeById, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee, 
    bulkDeleteEmployees, 
    searchEmployeeByIdNumber, 
    getEmployeeByIdNumber,
    getActiveEmployees 
} = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Reordenar las rutas específicas primero (orden es importante)
router.get('/search', authenticate, async (req, res) => {
    try {
        const { id_number } = req.query;
        
        console.log("Buscando empleado con ID:", id_number); // Debug

        const employee = await Employee.findOne({
            where: { id_number: id_number },
            attributes: [
                'id', 'id_number', 'full_name', 'email', 'phone', 'address',
                'role', 'department', 'position', 'hire_date', 'tipo_contrato',
                'salario_base', 'eps', 'banco', 'tipo_cuenta', 'cuenta_bancaria',
                'fondo_pension', 'fondo_cesantias', 'caja_compensacion', 'status'
            ]
        });

        if (!employee) {
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
router.get('/by-id-number/:id_number', authenticate, authorize(['Administrador']), getEmployeeByIdNumber);
router.get('/active', authenticate, authorize(['Administrador']), getActiveEmployees);
router.post('/bulk-delete', authenticate, authorize(['Administrador']), bulkDeleteEmployees);

// Rutas genéricas después
router.get('/', authenticate, authorize(['Administrador']), getEmployees);
router.post('/', authenticate, authorize(['Administrador']), createEmployee);
router.get('/:id', authenticate, authorize(['Administrador']), getEmployeeById);
router.put('/:id', authenticate, authorize(['Administrador']), updateEmployee);
router.delete('/:id', authenticate, authorize(['Administrador']), deleteEmployee);

module.exports = router;
