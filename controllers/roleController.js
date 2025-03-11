const Role = require('../models/Role');
const { validationResult } = require('express-validator');

// Obtener todos los roles
exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({  attributes: ['id', 'role_name', 'permissions']});
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener roles", error });
    }
};

// Obtener un rol por ID
exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ message: "Rol no encontrado" });

        res.json(role);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el rol", error });
    }
};

// Crear un nuevo rol
exports.createRole = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { role_name, permission } = req.body;
        const newRole = await Role.create({ role_name, permission });

        res.status(201).json({ message: "Rol creado correctamente", role: newRole });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el rol", error });
    }
};

// Actualizar un rol y sus permisos
exports.updateRole = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { role_name, permissions } = req.body;
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ message: "Rol no encontrado" });

        await role.update({ role_name, permissions });
        res.json({ message: "Rol actualizado correctamente", role });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el rol", error });
    }
};

// Eliminar un rol
exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ message: "Rol no encontrado" });

        await role.destroy();
        res.json({ message: "Rol eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el rol", error });
    }
};

// Buscar rol por nombre
exports.searchRole = async (req, res) => {
    try {
        const roles = await Role.findAll({ where: { role_name: req.params.role_name } });

        if (roles.length === 0) {
            return res.status(404).json({ message: "No se encontraron roles con ese nombre" });
        }

        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: "Error al buscar rol", error });
    }
};
