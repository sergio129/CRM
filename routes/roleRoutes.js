const express = require('express');
const { getRoles, getRoleById, createRole, updateRole, deleteRole, searchRole } = require('../controllers/roleController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas del CRUD de Roles
router.get('/', authenticate, getRoles);
router.get('/:id', authenticate, getRoleById);
router.post('/', authenticate, createRole);
router.put('/:id', authenticate, updateRole);
router.delete('/:id', authenticate, deleteRole);

// Buscar roles por nombre
router.get('/search/:role_name', authenticate, searchRole);

module.exports = router;
