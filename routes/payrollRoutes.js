const express = require('express');
const { 
    getPayrolls, 
    getPayrollById, 
    createPayroll, 
    updatePayroll, 
    deletePayroll,
    generatePayrollPDF,
    markPayrollAsPaid,
    getPayrollSummary
} = require('../controllers/payrollController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
    try {
        // Construir el objeto de condiciones para la consulta
        const whereConditions = {};
        
        // Filtro por mes (período)
        if (req.query.month) {
            whereConditions.periodo = {
                [Op.like]: `%${req.query.month}%`
            };
        }
        
        // Filtro por estado
        if (req.query.status) {
            whereConditions.status = req.query.status;
        }
        
        // Filtro por empleado
        if (req.query.employee_id) {
            whereConditions.employee_id = req.query.employee_id;
        }
        
        console.log('Filtros aplicados:', req.query, 'Where conditions:', whereConditions);
        
        const payrolls = await Payroll.findAll({
            where: whereConditions,
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

// Añadir ruta para obtener el resumen de nóminas para el dashboard
// Esta ruta debe ir ANTES de las rutas con parámetros
router.get('/summary', authenticate, getPayrollSummary);

// Añadir ruta para buscar nóminas
router.get('/search', authenticate, async (req, res) => {
    try {
        const { term } = req.query;
        if (!term) {
            return res.status(400).json({ message: 'Se requiere un término de búsqueda' });
        }
        
        const payrolls = await Payroll.findAll({
            include: [{
                model: Employee,
                as: 'Employee',
                where: {
                    [Op.or]: [
                        { full_name: { [Op.like]: `%${term}%` } },
                        { id_number: { [Op.like]: `%${term}%` } }
                    ]
                },
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
        console.error("Error en la búsqueda:", error);
        res.status(500).json({
            message: "Error en la búsqueda",
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

        if (payroll.status === 'Pagado') {
            return res.status(400).json({ message: 'No se puede modificar una nómina ya pagada' });
        }

        await payroll.update(req.body);
        
        // Si se está marcando como pagada, actualizar la fecha de pago
        if (req.body.status === 'Pagado') {
            await payroll.update({
                payment_date: new Date()
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
// Añadir nueva ruta para marcar nómina como pagada
router.put('/:id/pay', authenticate, authorize(['Administrador']), markPayrollAsPaid);

module.exports = router;
