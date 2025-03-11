const express = require('express');
const { getUsers, getUserById, createUser, updateUser, deleteUser, searchUser, changeUserRole } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', authenticate, authorize(['Administrador']), getUsers);
router.get('/:id', authenticate, authorize(['Administrador']), getUserById);
router.post('/', authenticate, authorize(['Administrador']), createUser);
router.put('/:id', authenticate, authorize(['Administrador']), updateUser);
router.delete('/:id', authenticate, authorize(['Administrador']), deleteUser);

router.get('/search/:username', authenticate, authorize(['Administrador']), searchUser);
router.put('/update-role/:username', authenticate, authorize(['Administrador']), changeUserRole);

module.exports = router;
