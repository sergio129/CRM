const express = require('express');
const { 
    getPayrolls, 
    getPayrollById, 
    createPayroll, 
    updatePayroll, 
    deletePayroll,
    generatePayrollPDF
} = require('../controllers/payrollController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize(['Administrador']), getPayrolls);
router.get('/:id', authenticate, authorize(['Administrador']), getPayrollById);
router.post('/', authenticate, authorize(['Administrador']), createPayroll);
router.put('/:id', authenticate, authorize(['Administrador']), updatePayroll);
router.delete('/:id', authenticate, authorize(['Administrador']), deletePayroll);
router.get('/:id/pdf', authenticate, authorize(['Administrador']), generatePayrollPDF);

module.exports = router;
