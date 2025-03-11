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
router.get('/search', authenticate, authorize(['Administrador']), searchEmployeeByIdNumber);
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
