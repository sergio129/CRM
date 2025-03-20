const express = require('express');
const { getRoles, createRole, updateRole, deleteRole } = require('../controllers/roleController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize(['Administrador']), getRoles);
router.post('/', authenticate, authorize(['Administrador']), createRole);
router.put('/:id', authenticate, authorize(['Administrador']), updateRole);
router.delete('/:id', authenticate, authorize(['Administrador']), deleteRole);

module.exports = router;
