const express = require('express');
const { getRoles, getRoleById, createRole, updateRole, deleteRole, searchRole } = require('../controllers/roleController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas del CRUD de Roles
router.get('/', authenticate, authorize(['Administrador']), getRoles);
router.get('/:id', authenticate, authorize(['Administrador']), getRoleById);
router.post('/', authenticate, authorize(['Administrador']), createRole);
router.put('/:id', authenticate, authorize(['Administrador']), updateRole);
router.delete('/:id', authenticate, authorize(['Administrador']), deleteRole);

// Buscar roles por nombre
router.get('/search/:role_name', authenticate, authorize(['Administrador']), searchRole);

module.exports = router;
