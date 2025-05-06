const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const { sequelize } = require('../utils/database');
const { validationResult } = require('express-validator');

exports.createUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, username, password, role } = req.body;

    try {
        // Modificado: guardando contraseña en texto plano
        const passwordHash = password;
        
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { full_name, email, username, password, role, status } = req.body;
        
        // Modificado: guardando contraseña en texto plano
        const hashedPassword = password;
        
        if (!full_name || !email || !username || !password || !role || !status) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username } = req.params;
        const { newRole } = req.body;

        if (!username || !newRole) {
            return res.status(400).json({ 
                message: "Faltan parámetros requeridos",
                details: {
                    received: { username, newRole }
                }
            });
        }

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

// Obtener el usuario actual autenticado
exports.getCurrentUser = async (req, res) => {
    try {
        // El middleware de autenticación ya añade req.usuario
        if (!req.usuario || !req.usuario.id) {
            return res.status(401).json({ message: "No autenticado" });
        }

        const userId = req.usuario.id;
        const user = await User.findByPk(userId, {
            attributes: ['id', 'nombre', 'apellido', 'email', 'username', 'role', 'status', 'imagen_perfil'],
            include: [
                {
                    model: Role,
                    as: 'userRole',
                    attributes: ['role_name']
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Devolver la información del usuario
        res.json({
            success: true,
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                username: user.username,
                role: user.role,
                roleName: user.userRole ? user.userRole.role_name : null,
                status: user.status,
                imagen_perfil: user.imagen_perfil
            }
        });

    } catch (error) {
        console.error("Error al obtener usuario actual:", error);
        res.status(500).json({ 
            success: false,
            message: "Error al obtener información del usuario actual", 
            error: error.message 
        });
    }
};