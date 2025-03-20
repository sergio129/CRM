const Permission = require('../models/Permission');

exports.getPermissions = async (req, res) => {
    try {
        const permissions = await Permission.findAll({
            attributes: ['id', 'permission_name', 'description'] // Aseguramos que se devuelvan estos campos
        });
        res.json(permissions);
    } catch (error) {
        console.error("Error al obtener permisos:", error);
        res.status(500).json({ message: "Error al obtener permisos", error });
    }
};
