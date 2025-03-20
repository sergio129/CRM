const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { validationResult } = require('express-validator');

// Obtener todos los roles
exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({
            include: [{
                model: Permission,
                as: 'permissions', // Alias debe coincidir con el definido en la asociación
                attributes: ['id', 'permission_name', 'description'] // Especificar columnas explícitamente
            }]
        });

        // Formatear los roles para incluir los permisos como una lista de nombres
        const formattedRoles = roles.map(role => ({
            id: role.id,
            role_name: role.role_name,
            permissions: role.permissions.map(permission => permission.permission_name).join(', '), // Convertir a string
            description: role.description || 'Sin descripción'
        }));

        res.json(formattedRoles);
    } catch (error) {
        console.error("Error al obtener roles:", error);
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
        return res.status(400).json({ message: "Error de validación", errors: errors.array() });
    }

    try {
        const { role_name, description, permissions } = req.body;

        const role = await Role.create({ role_name, description });

        if (permissions && permissions.length > 0) {
            const permissionInstances = await Permission.findAll({
                where: { id: permissions },
                attributes: ['id', 'permission_name', 'description'] // Especificar columnas explícitamente
            });
            await role.addPermissions(permissionInstances);
        }

        res.status(201).json({ message: "Rol creado correctamente", role });
    } catch (error) {
        console.error("Error al crear rol:", error);
        res.status(500).json({ message: "Error al crear rol", error });
    }
};

// Actualizar un rol y sus permisos
exports.updateRole = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { role_name, description, permissions } = req.body;
        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ message: "Rol no encontrado" });

        await role.update({ role_name, description });

        if (permissions) {
            const permissionInstances = await Permission.findAll({ where: { id: permissions } });
            await role.setPermissions(permissionInstances);
        }

        res.json({ message: "Rol actualizado correctamente", role });
    } catch (error) {
        console.error("Error al actualizar rol:", error);
        res.status(500).json({ message: "Error al actualizar rol", error });
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
        console.error("Error al eliminar rol:", error);
        res.status(500).json({ message: "Error al eliminar rol", error });
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
