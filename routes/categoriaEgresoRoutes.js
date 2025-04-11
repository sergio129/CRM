const express = require('express');
const { body } = require('express-validator');
const { 
  getCategorias, 
  getCategoriaById, 
  createCategoria, 
  updateCategoria, 
  deleteCategoria,
  reactivateCategoria
} = require('../controllers/categoriaEgresoController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Validaciones para categorías
const categoriaValidator = [
  body('nombre').notEmpty().withMessage('El nombre de la categoría es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre debe tener máximo 100 caracteres')
];

// Rutas para categorías
router.get('/', authenticate, getCategorias);
router.get('/:id', authenticate, getCategoriaById);
router.post('/', authenticate, authorize(['Administrador']), categoriaValidator, createCategoria);
router.put('/:id', authenticate, authorize(['Administrador']), categoriaValidator, updateCategoria);
router.delete('/:id', authenticate, authorize(['Administrador']), deleteCategoria);
router.patch('/:id/reactivar', authenticate, authorize(['Administrador']), reactivateCategoria);

module.exports = router;