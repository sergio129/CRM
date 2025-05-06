const express = require('express');
const router = express.Router();
const categoriaIngresoController = require('../controllers/categoriaIngresoController');
const authMiddleware = require('../middleware/authMiddleware');
const { check } = require('express-validator');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware.verifyToken);

// Obtener todas las categorías de ingreso
router.get('/', categoriaIngresoController.getCategorias);

// Obtener una categoría por ID
router.get('/:id', categoriaIngresoController.getCategoriaById);

// Crear una nueva categoría
router.post('/', [
  check('nombre').not().isEmpty().withMessage('El nombre es obligatorio'),
  check('descripcion').optional()
], categoriaIngresoController.createCategoria);

// Actualizar una categoría
router.put('/:id', [
  check('nombre').not().isEmpty().withMessage('El nombre es obligatorio'),
  check('descripcion').optional()
], categoriaIngresoController.updateCategoria);

// Eliminar una categoría
router.delete('/:id', categoriaIngresoController.deleteCategoria);

module.exports = router;