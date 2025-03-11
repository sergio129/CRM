const express = require('express');
const { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize(['Administrador']), getEmployees);
router.get('/:id', authenticate, authorize(['Administrador']), getEmployeeById);
router.post('/', authenticate, authorize(['Administrador']), createEmployee);
router.put('/:id', authenticate, authorize(['Administrador']), updateEmployee);
router.delete('/:id', authenticate, authorize(['Administrador']), deleteEmployee);

module.exports = router;
