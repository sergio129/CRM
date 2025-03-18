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
    try {
        const clientData = {
            // Mapear campos que vienen del frontend a los campos de la base de datos
            phone: req.body.phone,
            address: req.body.address,
            identification: req.body.identification,
            ultimo_pago: req.body.ultimo_pago,
            full_name: req.body.full_name,
            tipo_documento: req.body.tipo_documento,
            fecha_nacimiento: req.body.fecha_nacimiento || null,
            genero: req.body.genero,
            estado_civil: req.body.estado_civil,
            nacionalidad: req.body.nacionalidad,
            telefono_movil: req.body.phone, // Usar el mismo valor que phone
            telefono_fijo: req.body.telefono_fijo,
            email: req.body.email,
            ciudad: req.body.address, // Usar el mismo valor que address
            codigo_postal: req.body.codigo_postal,
            pais: req.body.pais,
            numero_cuenta: req.body.numero_cuenta,
            tipo_cuenta: req.body.tipo_cuenta,
            moneda: req.body.moneda,
            limite_credito: req.body.limite_credito || 0,
            ocupacion: req.body.ocupacion,
            empresa: req.body.empresa,
            sector_economico: req.body.sector_economico,
            ingresos_mensuales: req.body.ingresos_mensuales || 0,
            tipo_contrato: req.body.tipo_contrato,
            antiguedad_trabajo: req.body.antiguedad_trabajo,
            scoring_crediticio: req.body.scoring_crediticio,
            deudas_actuales: req.body.deudas_actuales || 0,
            creditos_vigentes: req.body.creditos_vigentes || 0,
            deuda_total: req.body.deuda_total || 0,
            estado_financiero: req.body.estado_financiero || 'Al día',
            status: req.body.status || 'Activo'
        };

        const client = await Client.create(clientData);
        res.status(201).json(client);
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({
            message: 'Error al crear cliente',
            error: error.message
        });
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
             // Mapear campos que vienen del frontend a los campos de la base de datos
             phone: req.body.phone,
             address: req.body.address,
             identification: req.body.identification,
             ultimo_pago: req.body.ultimo_pago,
             full_name: req.body.full_name,
             tipo_documento: req.body.tipo_documento,
             fecha_nacimiento: req.body.fecha_nacimiento || null,
             genero: req.body.genero,
             estado_civil: req.body.estado_civil,
             nacionalidad: req.body.nacionalidad,
             telefono_movil: req.body.phone, // Usar el mismo valor que phone
             telefono_fijo: req.body.telefono_fijo,
             email: req.body.email,
             ciudad: req.body.address, // Usar el mismo valor que address
             codigo_postal: req.body.codigo_postal,
             pais: req.body.pais,
             numero_cuenta: req.body.numero_cuenta,
             tipo_cuenta: req.body.tipo_cuenta,
             moneda: req.body.moneda,
             limite_credito: req.body.limite_credito || 0,
             ocupacion: req.body.ocupacion,
             empresa: req.body.empresa,
             sector_economico: req.body.sector_economico,
             ingresos_mensuales: req.body.ingresos_mensuales || 0,
             tipo_contrato: req.body.tipo_contrato,
             antiguedad_trabajo: req.body.antiguedad_trabajo,
             scoring_crediticio: req.body.scoring_crediticio,
             deudas_actuales: req.body.deudas_actuales || 0,
             creditos_vigentes: req.body.creditos_vigentes || 0,
             deuda_total: req.body.deuda_total || 0,
             estado_financiero: req.body.estado_financiero || 'Al día',
             status: req.body.status || 'Activo'
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

exports.getClientByIdNumber = async (req, res) => {
    try {
        const { id_number } = req.params;

        // Buscar cliente por número de documento (identification)
        const client = await Client.findOne({
            where: { identification: id_number }, // Cambiar a 'identification'
            attributes: ['id', 'full_name', 'identification', 'phone', 'address', 'email']
        });

        if (!client) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        res.json(client);
    } catch (error) {
        console.error("Error al buscar cliente por número de documento:", error);
        res.status(500).json({ message: "Error al buscar cliente", error });
    }
};
