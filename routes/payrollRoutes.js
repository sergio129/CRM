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
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
    try {
        const payrolls = await Payroll.findAll({
            include: [{
                model: Employee,
                as: 'Employee',
                attributes: ['id_number', 'full_name']
            }],
            attributes: [
                'id',
                'employee_id',
                'periodo',
                'salario_base',
                'total_ingresos',
                'total_deducciones',
                'neto_pagar',
                'status'
            ],
            order: [['id', 'DESC']]
        });

        res.json(payrolls);
    } catch (error) {
        console.error("Error al obtener nóminas:", error);
        res.status(500).json({
            message: "Error al obtener nóminas",
            error: error.message
        });
    }
});

router.get('/:id', authenticate, authorize(['Administrador']), getPayrollById);
router.post('/', authenticate, authorize(['Administrador']), createPayroll);
router.put('/:id', authenticate, async (req, res) => {
    try {
        const payroll = await Payroll.findByPk(req.params.id);
        
        if (!payroll) {
            return res.status(404).json({ message: 'Nómina no encontrada' });
        }

        if (payroll.estado === 'Pagado') {
            return res.status(400).json({ message: 'No se puede modificar una nómina ya pagada' });
        }

        await payroll.update(req.body);
        
        // Si se está marcando como pagada, actualizar la fecha de pago
        if (req.body.estado === 'Pagado') {
            await payroll.update({
                fecha_pago: new Date()
            });
        }

        res.json({
            message: 'Nómina actualizada correctamente',
            payroll: payroll
        });
    } catch (error) {
        console.error("Error al actualizar nómina:", error);
        res.status(500).json({ 
            message: "Error al actualizar nómina", 
            error: error.message 
        });
    }
});
router.delete('/:id', authenticate, authorize(['Administrador']), deletePayroll);
router.get('/:id/pdf', authenticate, authorize(['Administrador']), generatePayrollPDF);

module.exports = router;
