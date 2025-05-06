const express = require('express');
const router = express.Router();
const ingresoController = require('../controllers/ingresoController');
const { authenticate } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Obtener todos los ingresos con filtros opcionales
router.get('/', ingresoController.getIngresos);

// Obtener estadísticas de ingresos
router.get('/estadisticas', ingresoController.getEstadisticas);

// Obtener un ingreso por ID
router.get('/:id', ingresoController.getIngresoById);

// Crear un nuevo ingreso
router.post('/', [
  check('categoria_id').isInt().withMessage('La categoría de ingreso es obligatoria'),
  check('concepto').not().isEmpty().withMessage('El concepto es obligatorio'),
  check('fecha').isISO8601().withMessage('La fecha debe ser válida'),
  check('valor_bruto').isNumeric().withMessage('El valor bruto debe ser un número'),
  check('valor_neto').isNumeric().withMessage('El valor neto debe ser un número'),
  check('metodo_pago').not().isEmpty().withMessage('El método de pago es obligatorio')
], ingresoController.createIngreso);

// Actualizar un ingreso
router.put('/:id', [
  check('categoria_id').isInt().withMessage('La categoría de ingreso es obligatoria'),
  check('concepto').not().isEmpty().withMessage('El concepto es obligatorio'),
  check('fecha').isISO8601().withMessage('La fecha debe ser válida'),
  check('valor_bruto').isNumeric().withMessage('El valor bruto debe ser un número'),
  check('valor_neto').isNumeric().withMessage('El valor neto debe ser un número'),
  check('metodo_pago').not().isEmpty().withMessage('El método de pago es obligatorio')
], ingresoController.updateIngreso);

// Anular un ingreso
router.post('/:id/anular', ingresoController.anularIngreso);

// Cambiar estado de un ingreso
router.post('/:id/estado', [
  check('estado').isIn(['pendiente', 'confirmado']).withMessage('Estado válido requerido (pendiente/confirmado)')
], ingresoController.cambiarEstado);

// Eliminar un archivo adjunto
router.delete('/:id/archivos/:nombreArchivo', ingresoController.eliminarArchivo);

// Generar número de comprobante
router.post('/:id/comprobante', ingresoController.generarComprobante);

module.exports = router;