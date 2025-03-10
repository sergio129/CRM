const Client = require('../models/Client');

exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findOne({ 
            where: { identification: req.params.id },
            attributes: ['full_name', 'identification', 'email', 'phone', 'address', 'status', 'deuda_total', 'ultimo_pago', 'estado_financiero']
        });

        if (!client) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        res.json(client);
    } catch (error) {
        console.error("Error al buscar cliente:", error);
        res.status(500).json({ message: "Error al buscar cliente", error });
    }
};
