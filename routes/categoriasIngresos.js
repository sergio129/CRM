const express = require('express');
const router = express.Router();
const categoriaIngresoController = require('../controllers/categoriaIngresoController');
const { check } = require('express-validator');
const { authenticate } = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Obtener todas las categorías de ingresos
router.get('/', categoriaIngresoController.getCategorias);

// Obtener una categoría de ingreso por ID
router.get('/:id', categoriaIngresoController.getCategoriaById);

// Crear una nueva categoría de ingreso
router.post('/', [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('nombre', 'El nombre debe tener menos de 100 caracteres').isLength({ max: 100 }),
    check('porcentaje_retencion', 'El porcentaje de retención debe ser un número entre 0 y 100').isFloat({ min: 0, max: 100 })
], categoriaIngresoController.createCategoria);

// Actualizar una categoría de ingreso
router.put('/:id', [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('nombre', 'El nombre debe tener menos de 100 caracteres').isLength({ max: 100 }),
    check('porcentaje_retencion', 'El porcentaje de retención debe ser un número entre 0 y 100').isFloat({ min: 0, max: 100 })
], categoriaIngresoController.updateCategoria);

// Eliminar una categoría de ingreso (lógicamente)
router.delete('/:id', categoriaIngresoController.deleteCategoria);

module.exports = router;