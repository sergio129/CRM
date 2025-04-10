const express = require('express');
const { getRoles, createRole, updateRole, deleteRole, getRoleById, getRolePermissions } = require('../controllers/roleController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize(['Administrador']), getRoles);
router.get('/:id', authenticate, authorize(['Administrador']), getRoleById);
router.get('/:id/permissions', authenticate, authorize(['Administrador']), getRolePermissions);
router.post('/', authenticate, authorize(['Administrador']), createRole);
router.put('/:id', authenticate, authorize(['Administrador']), updateRole);
router.delete('/:id', authenticate, authorize(['Administrador']), deleteRole);

module.exports = router;
