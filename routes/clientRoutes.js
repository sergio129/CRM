const express = require('express');
const { Op } = require('sequelize');
const Client = require('../models/Client');
const { getClients, getClientById, createClient, updateClient, deleteClient, getClientByIdNumber } = require('../controllers/clientController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas específicas primero
router.get('/document/:tipo/:numero', authenticate, async (req, res) => {
    try {
        const { tipo, numero } = req.params;
        
        console.log(`Buscando cliente con tipo: ${tipo}, numero: ${numero}`);
        
        // Buscar cliente solo por el número de documento (identification)
        const client = await Client.findOne({
            where: { 
                identification: numero
            }
        });

        if (!client) {
            console.log(`No se encontró cliente con identification: ${numero}`);
            return res.status(404).json({ 
                success: false,
                error: 'Cliente no encontrado' 
            });
        }

        console.log(`Cliente encontrado: ${client.full_name}, ID: ${client.id}`);

        // Enviar respuesta exitosa con los datos del cliente
        res.json({ 
            success: true,
            data: client 
        });
    } catch (error) {
        console.error("Error al buscar cliente por documento:", error);
        res.status(500).json({ 
            success: false,
            error: 'Error al buscar cliente: ' + error.message 
        });
    }
});

router.get('/by-identification/:identification', authenticate, async (req, res) => {
    try {
        const client = await Client.findOne({
            where: { 
                identification: req.params.identification
            }
        });

        if (!client) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Asegurarse de que todos los campos estén incluidos en la respuesta
        const clientData = client.toJSON();
        
        // Log para debugging
        console.log('Cliente encontrado:', clientData);

        res.json(clientData);
    } catch (error) {
        console.error("Error al buscar cliente:", error);
        res.status(500).json({ 
            message: 'Error al buscar cliente',
            error: error.message 
        });
    }
});

// Ruta para buscar cliente por número de documento
router.get('/by-id-number/:id_number', getClientByIdNumber);

// Rutas genéricas después
router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
