const express = require('express');
const router = express.Router();
const retencionController = require('../controllers/retencionController');
const { check } = require('express-validator');
const { authenticate } = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Obtener todos los conceptos de retención
router.get('/conceptos', retencionController.getConceptosRetencion);

// Actualizar porcentaje de retención para una categoría
router.put('/conceptos/:id', [
    check('porcentaje_retencion', 'El porcentaje de retención debe ser un número entre 0 y 100').isFloat({ min: 0, max: 100 })
], retencionController.actualizarPorcentajeRetencion);

// Configurar fecha límite de envío a la DIAN
router.post('/configuracion', [
    check('fechaLimiteEnvio', 'La fecha límite de envío es obligatoria').not().isEmpty(),
    check('fechaLimiteEnvio', 'La fecha límite debe ser una fecha válida').isISO8601()
], retencionController.configurarRetencion);

// Generar reporte de retenciones para la DIAN
router.get('/reporte', retencionController.generarReporteRetenciones);

module.exports = router;