const IdType = require('../models/IdType');

exports.getIdTypes = async (req, res) => {
    try {
        const idTypes = await IdType.findAll({
            attributes: ['id', 'type_name']
        });
        res.json(idTypes);
    } catch (error) {
        console.error("Error al obtener tipos de identificación:", error);
        res.status(500).json({ message: "Error al obtener tipos de identificación", error });
    }
};
