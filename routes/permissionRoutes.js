const express = require('express');
const { getPermissions } = require('../controllers/permissionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Ruta para obtener todos los permisos
router.get('/', authenticate, authorize(['Administrador']), getPermissions);

module.exports = router;
