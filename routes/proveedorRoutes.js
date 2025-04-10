const express = require('express');
const { body } = require('express-validator');
const { 
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  reactivateProveedor
} = require('../controllers/proveedorController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Validaciones para proveedores
const proveedorValidator = [
  body('tipo_documento').notEmpty().withMessage('El tipo de documento es obligatorio'),
  body('numero_documento').notEmpty().withMessage('El número de documento es obligatorio')
    .isLength({ min: 5, max: 30 }).withMessage('El número de documento debe tener entre 5 y 30 caracteres'),
  body('razon_social').notEmpty().withMessage('La razón social es obligatoria')
    .isLength({ max: 200 }).withMessage('La razón social debe tener máximo 200 caracteres'),
  body('email').optional().isEmail().withMessage('El email debe tener un formato válido')
];

// Rutas para proveedores
router.get('/', authenticate, getProveedores);
router.get('/:id', authenticate, getProveedorById);
router.post('/', authenticate, authorize(['Administrador', 'Contador']), proveedorValidator, createProveedor);
router.put('/:id', authenticate, authorize(['Administrador', 'Contador']), proveedorValidator, updateProveedor);
router.delete('/:id', authenticate, authorize(['Administrador']), deleteProveedor);
router.patch('/:id/reactivar', authenticate, authorize(['Administrador']), reactivateProveedor);

module.exports = router;