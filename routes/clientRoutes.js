const express = require('express');
const { Op } = require('sequelize');
const Client = require('../models/Client');
const { getClients, getClientById, createClient, updateClient, deleteClient, getClientByIdNumber } = require('../controllers/clientController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

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

router.put('/:id', authenticate, async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        
        if (!client) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        await client.update(req.body);
        
        res.json({ message: 'Cliente actualizado correctamente', client });
    } catch (error) {
        console.error("Error al actualizar cliente:", error);
        res.status(500).json({ 
            message: 'Error al actualizar cliente',
            error: error.message 
        });
    }
});

// Ruta para buscar cliente por número de documento
router.get('/by-id-number/:id_number', getClientByIdNumber);

module.exports = router;
