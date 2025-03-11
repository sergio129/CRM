const Client = require('../models/Client');
const { validationResult } = require('express-validator');

exports.getClients = async (req, res) => {
    try {
        const clients = await Client.findAll({
            attributes: ['identification', 'full_name', 'email', 'phone', 'address', 'status', 'deuda_total', 'ultimo_pago', 'estado_financiero']
        });
        res.json(clients);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.status(500).json({ message: "Error al obtener clientes", error });
    }
};

exports.getClientById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const client = await Client.findOne({ 
            where: { identification: req.params.id },
            attributes: ['identification', 'full_name', 'email', 'phone', 'address', 'status', 'deuda_total', 'ultimo_pago', 'estado_financiero']
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

exports.createClient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { full_name, email, phone, address, identification, deuda_total, ultimo_pago, estado_financiero, status } = req.body;
        const newClient = await Client.create({
            full_name,
            email,
            phone,
            address,
            identification,
            deuda_total,
            ultimo_pago,
            estado_financiero,
            status
        });

        res.status(201).json({ message: "Cliente creado correctamente", client: newClient });
    } catch (error) {
        console.error("Error al crear el cliente:", error);
        res.status(500).json({ message: "Error al crear el cliente", error });
    }
};

exports.updateClient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { full_name, email, phone, address, identification, deuda_total, ultimo_pago, estado_financiero, status } = req.body;
        const client = await Client.findOne({ where: { identification: req.params.id } });

        if (!client) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        await client.update({
            full_name,
            email,
            phone,
            address,
            identification,
            deuda_total,
            ultimo_pago,
            estado_financiero,
            status
        });

        res.json({ message: "Cliente actualizado correctamente", client });
    } catch (error) {
        console.error("Error al actualizar el cliente:", error);
        res.status(500).json({ message: "Error al actualizar el cliente", error });
    }
};

exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findOne({ where: { identification: req.params.id } });

        if (!client) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        await client.destroy();
        res.json({ message: "Cliente eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar el cliente:", error);
        res.status(500).json({ message: "Error al eliminar el cliente", error });
    }
};
