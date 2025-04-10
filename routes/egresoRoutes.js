const express = require('express');
const { body } = require('express-validator');
const { 
  getEgresos,
  getEgresoById,
  createEgreso,
  updateEgreso,
  cancelarEgreso,
  getEstadisticasEgresos,
  uploadArchivoAdjunto,
  deleteArchivoAdjunto,
  deleteEgreso
} = require('../controllers/egresoController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Validaciones para egresos
const egresoValidator = [
  body('concepto').notEmpty().withMessage('El concepto del egreso es obligatorio'),
  body('categoria_id').notEmpty().withMessage('La categoría es obligatoria')
    .isInt().withMessage('La categoría debe ser un número entero'),
  body('monto').notEmpty().withMessage('El monto es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a cero')
];

// Rutas para egresos
router.get('/', authenticate, getEgresos);
router.get('/estadisticas', authenticate, getEstadisticasEgresos);
router.get('/:id', authenticate, getEgresoById);
router.post('/', authenticate, authorize(['Administrador', 'Contador']), egresoValidator, createEgreso);
router.put('/:id', authenticate, authorize(['Administrador', 'Contador']), egresoValidator, updateEgreso);
router.patch('/:id/cancelar', authenticate, authorize(['Administrador']), cancelarEgreso);
router.delete('/:id', authenticate, authorize(['Administrador']), deleteEgreso);

// Rutas para archivos adjuntos
router.post('/:id/archivos', authenticate, uploadArchivoAdjunto);
router.delete('/:id/archivos', authenticate, deleteArchivoAdjunto);

module.exports = router;