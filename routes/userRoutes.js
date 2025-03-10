const express = require('express');
const { getUsers, getUserById, createUser, updateUser, deleteUser, searchUser } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { changeUserRole } = require('../controllers/userController');
const router = express.Router();
const userController = require("../controllers/userController");
// Obtener todos los usuarios
router.get('/', authenticate, getUsers);
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

// Buscar usuario por nombre de usuario
router.get('/search/:username', authenticate, searchUser);
// Nueva ruta para actualizar roles
router.put('/update-role/:username', authenticate, changeUserRole);



module.exports = router;
