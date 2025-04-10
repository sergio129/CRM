const Client = require('../models/Client');
const { validationResult } = require('express-validator');
const Loan = require('../models/Loan');
const { Op } = require('sequelize');

exports.getClients = async (req, res) => {
    try {
        const clients = await Client.findAll({
            attributes: ['id', 'identification', 'full_name', 'email', 'phone', 'address', 'status', 'deuda_total', 'ultimo_pago', 'estado_financiero'],
            include: [
                {
                    model: Loan,
                    as: 'Loans', // Asegúrate de que el alias coincida con el definido en las asociaciones
                    attributes: ['total_due'],
                    where: { loan_status: 'Activo' },
                    required: false // Permitir clientes sin préstamos activos
                }
            ]
        });

        // Recalcular la deuda total para cada cliente
        const updatedClients = clients.map(client => {
            const totalDebt = client.Loans.reduce((sum, loan) => sum + parseFloat(loan.total_due || 0), 0);
            client.deuda_total = totalDebt; // Actualizar la deuda total
            return client;
        });

        res.json(updatedClients);
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
            attributes: [
                'id', 'phone', 'address', 'identification', 'ultimo_pago', 'full_name', 
                'tipo_documento', 'fecha_nacimiento', 'genero', 'estado_civil', 'nacionalidad', 
                'telefono_movil', 'telefono_fijo', 'email', 'ciudad', 'codigo_postal', 'pais', 
                'numero_cuenta', 'tipo_cuenta', 'moneda', 'saldo_disponible', 'limite_credito', 
                'ocupacion', 'empresa', 'sector_economico', 'ingresos_mensuales', 'tipo_contrato', 
                'antiguedad_trabajo', 'scoring_crediticio', 'deudas_actuales', 'creditos_vigentes', 
                'estado_financiero', 'status', 'id_number'
            ]
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
        // Extraer los datos que necesitamos validar
        const { email, identification, phone, numero_cuenta } = req.body;
        
        // Verificar si existe un cliente con el mismo correo electrónico
        if (email) {
            const existingEmail = await Client.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({
                    message: 'Error al crear cliente',
                    error: 'El correo electrónico ya está registrado',
                    field: 'email'
                });
            }
        }
        
        // Verificar si existe un cliente con el mismo número de documento
        const existingIdNumber = await Client.findOne({ where: { identification } });
        if (existingIdNumber) {
            return res.status(400).json({
                message: 'Error al crear cliente',
                error: 'El número de documento ya está registrado',
                field: 'identification'
            });
        }
        
        // Verificar si existe un cliente con el mismo número de teléfono
        if (phone) {
            const existingPhone = await Client.findOne({ where: { phone } });
            if (existingPhone) {
                return res.status(400).json({
                    message: 'Error al crear cliente',
                    error: 'El número de teléfono ya está registrado',
                    field: 'phone'
                });
            }
        }
        
        // Verificar si existe un cliente con el mismo número de cuenta
        if (numero_cuenta) {
            const existingAccount = await Client.findOne({ where: { numero_cuenta } });
            if (existingAccount) {
                return res.status(400).json({
                    message: 'Error al crear cliente',
                    error: 'El número de cuenta ya está registrado',
                    field: 'numero_cuenta'
                });
            }
        }
        
        const clientData = {
            // Mapear campos que vienen del frontend a los campos de la base de datos
            phone: req.body.phone,
            address: req.body.address,
            identification: req.body.identification,
            id_number: req.body.identification, // Asignar identification a id_number
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
        
        // Si es un error de Sequelize por unicidad (duplicado)
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.fields ? Object.keys(error.fields)[0] : null;
            let errorMessage = 'Ya existe un registro con estos datos';
            
            switch (field) {
                case 'email':
                    errorMessage = 'El correo electrónico ya está registrado';
                    break;
                case 'identification':
                case 'id_number':
                    errorMessage = 'El número de documento ya está registrado';
                    break;
                case 'phone':
                case 'telefono_movil':
                    errorMessage = 'El número de teléfono ya está registrado';
                    break;
                case 'numero_cuenta':
                    errorMessage = 'El número de cuenta ya está registrado';
                    break;
            }
            
            return res.status(400).json({
                message: 'Error al crear cliente',
                error: errorMessage,
                field: field
            });
        }
        
        res.status(500).json({
            message: 'Error al crear cliente',
            error: error.message,
            errors: error.errors
        });
    }
};

exports.updateClient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const client = await Client.findOne({ where: { identification: req.params.id } });

        if (!client) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        // Extraer los datos que necesitamos validar
        const { email, identification, phone, numero_cuenta } = req.body;
        
        // Verificar correo electrónico duplicado (excepto el del propio cliente)
        if (email && email !== client.email) {
            const existingEmail = await Client.findOne({ 
                where: { 
                    email,
                    id: { [Op.ne]: client.id } // No incluir el cliente actual
                } 
            });
            if (existingEmail) {
                return res.status(400).json({
                    message: 'Error al actualizar cliente',
                    error: 'El correo electrónico ya está registrado',
                    field: 'email'
                });
            }
        }
        
        // Verificar número de documento duplicado
        if (identification && identification !== client.identification) {
            const existingIdNumber = await Client.findOne({ 
                where: { 
                    identification,
                    id: { [Op.ne]: client.id }
                } 
            });
            if (existingIdNumber) {
                return res.status(400).json({
                    message: 'Error al actualizar cliente',
                    error: 'El número de documento ya está registrado',
                    field: 'identification'
                });
            }
        }
        
        // Verificar teléfono duplicado
        if (phone && phone !== client.phone) {
            const existingPhone = await Client.findOne({ 
                where: { 
                    phone,
                    id: { [Op.ne]: client.id }
                } 
            });
            if (existingPhone) {
                return res.status(400).json({
                    message: 'Error al actualizar cliente',
                    error: 'El número de teléfono ya está registrado',
                    field: 'phone'
                });
            }
        }
        
        // Verificar número de cuenta duplicado
        if (numero_cuenta && numero_cuenta !== client.numero_cuenta) {
            const existingAccount = await Client.findOne({ 
                where: { 
                    numero_cuenta,
                    id: { [Op.ne]: client.id }
                } 
            });
            if (existingAccount) {
                return res.status(400).json({
                    message: 'Error al actualizar cliente',
                    error: 'El número de cuenta ya está registrado',
                    field: 'numero_cuenta'
                });
            }
        }

        await client.update({
             // Mapear campos que vienen del frontend a los campos de la base de datos
             phone: req.body.phone,
             address: req.body.address,
             identification: req.body.identification,
             id_number: req.body.identification, // Asignar identification a id_number
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
        
        // Si es un error de Sequelize por unicidad (duplicado)
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.fields ? Object.keys(error.fields)[0] : null;
            let errorMessage = 'Ya existe un registro con estos datos';
            
            switch (field) {
                case 'email':
                    errorMessage = 'El correo electrónico ya está registrado';
                    break;
                case 'identification':
                case 'id_number':
                    errorMessage = 'El número de documento ya está registrado';
                    break;
                case 'phone':
                case 'telefono_movil':
                    errorMessage = 'El número de teléfono ya está registrado';
                    break;
                case 'numero_cuenta':
                    errorMessage = 'El número de cuenta ya está registrado';
                    break;
            }
            
            return res.status(400).json({
                message: 'Error al actualizar cliente',
                error: errorMessage,
                field: field
            });
        }
        
        res.status(500).json({ 
            message: "Error al actualizar el cliente", 
            error: error.message,
            errors: error.errors // Mostrar detalles de la validación
        });
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
