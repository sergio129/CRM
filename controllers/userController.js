const bcrypt = require('bcrypt');
const User = require('../models/User');
// Agrega al inicio del archivo
const Role = require('../models/Role'); // Asegúrate que la ruta sea correcta

// En controllers/userController.js (parte superior del archivo)
const { sequelize } = require('../utils/database'); // ✅ Importación necesaria




exports.createUser = async (req, res) => {
    const { full_name, email, username, password, role } = req.body;

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await User.create({ full_name, email, username, password_hash: passwordHash, role });

        res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear usuario', error });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'full_name', 'email', 'username', 'role', 'status']
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios', error });
    }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'full_name', 'email', 'username', 'role', 'status']
        });

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el usuario", error });
    }
};

// Crear un nuevo usuario
exports.createUser = async (req, res) => {
    try {
        const { full_name, email, username, password, role, status } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
          // Validar que los campos requeridos estén presentes
          if (!full_name || !email || !username || !password || !role || !status) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }
   // Crear el usuario en la base de datos
        const newUser = await User.create({
            full_name,
            email,
            username,
            password_hash: hashedPassword,
            role,
            status
        });

        res.status(201).json({ message: "Usuario creado correctamente", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el usuario", error });
    }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
    try {
        const { full_name, email, username, role, status } = req.body;

        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        await user.update({ full_name, email, username, role, status });

        res.json({ message: "Usuario actualizado correctamente", user });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el usuario", error });
    }
};

// Eliminar usuario
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        await user.destroy();
        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el usuario", error });
    }
};

// Buscar usuario por nombre de usuario
exports.searchUser = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { username: req.params.username },
            attributes: ['id', 'full_name', 'email', 'username', 'role', 'status']
        });

        if (users.length === 0) {
            return res.status(404).json({ message: "No se encontraron usuarios con ese nombre" });
        }

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error al buscar usuario", error });
    }
};

exports.changeUserRole = async (req, res) => {
    try {
        const { username } = req.params;
        const { newRole } = req.body;

        // 1. Validar entrada
        if (!username || !newRole) {
            return res.status(400).json({ 
                message: "Faltan parámetros requeridos",
                details: {
                    received: { username, newRole }
                }
            });
        }

        // 2. Buscar usuario
        const user = await User.findOne({ 
            where: { username },
            include: [{
                model: Role,
                as: 'role',
                required: false
            }]
        });
        
        if (!user) {
            return res.status(404).json({ 
                message: "Usuario no encontrado",
                username: username
            });
        }

        // 3. Verificar existencia del nuevo rol
        const validRole = await Role.findOne({
            where: { role_name: newRole }
        });
        
        if (!validRole) {
            const availableRoles = await Role.findAll({ attributes: ['role_name'] });
            return res.status(400).json({
                message: "Rol inválido",
                validRoles: availableRoles.map(r => r.role_name)
            });
        }

        // 4. Actualizar con transacción
        const transaction = await sequelize.transaction();
        
        try {
            await user.update({ roleId: validRole.id }, { transaction });
            await transaction.commit();
            
            const updatedUser = await User.findByPk(user.id, {
                include: [{
                    model: Role,
                    as: 'role'
                }]
            });

            return res.json({
                message: "Rol actualizado exitosamente",
                previousRole: user.userRole?.role_name,
                newRole: updatedUser.userRole.role_name
            });
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error("Error detallado:", {
            message: error.message,
            stack: error.stack,
            parameters: {
                username: req.params.username,
                body: req.body
            }
        });
        
        res.status(500).json({
            message: "Error en el servidor al actualizar el rol",
            errorDetails: {
                code: error.code,
                sqlMessage: error.parent?.sqlMessage,
                databaseError: error.parent?.sql
            }
        });
    }
};