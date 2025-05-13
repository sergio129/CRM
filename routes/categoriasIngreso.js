const express = require('express');
const router = express.Router();
const categoriaIngresoController = require('../controllers/categoriaIngresoController');
const authMiddleware = require('../middleware/authMiddleware');
const { check } = require('express-validator');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware.authenticate);

// Obtener todas las categorías de ingreso
router.get('/', categoriaIngresoController.getCategorias);

// Obtener una categoría por ID
router.get('/:id', categoriaIngresoController.getCategoriaById);

// Obtener subcategorías de una categoría
router.get('/:id/subcategorias', categoriaIngresoController.getSubcategorias);

// Crear una nueva categoría
router.post('/', [
  check('nombre').not().isEmpty().withMessage('El nombre es obligatorio'),
  check('descripcion').optional(),
  check('categoria_padre_id').optional().isNumeric().withMessage('La categoría padre debe ser un ID válido')
], categoriaIngresoController.createCategoria);

// Actualizar una categoría
router.put('/:id', [
  check('nombre').not().isEmpty().withMessage('El nombre es obligatorio'),
  check('descripcion').optional(),
  check('categoria_padre_id')
    .optional()
    .custom((value) => {
      // Permitir null o un número válido
      return value === null || value === undefined || (!isNaN(value) && Number.isInteger(Number(value)));
    })
    .withMessage('La categoría padre debe ser un ID válido o null')
], categoriaIngresoController.updateCategoria);

// Eliminar una categoría
router.delete('/:id', categoriaIngresoController.deleteCategoria);

module.exports = router;