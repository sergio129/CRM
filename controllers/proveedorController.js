const Proveedor = require('../models/Proveedor');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Obtener todos los proveedores
exports.getProveedores = async (req, res) => {
  try {
    const { busqueda, activos_only } = req.query;
    const where = {};

    // Filtrar por término de búsqueda
    if (busqueda) {
      where[Op.or] = [
        { razon_social: { [Op.like]: `%${busqueda}%` } },
        { nombre_comercial: { [Op.like]: `%${busqueda}%` } },
        { numero_documento: { [Op.like]: `%${busqueda}%` } },
        { persona_contacto: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    // Filtrar por estado (activo/inactivo)
    if (activos_only === 'true') {
      where.es_activo = true;
    }

    const proveedores = await Proveedor.findAll({
      where,
      order: [['razon_social', 'ASC']]
    });

    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ 
      message: 'Error al obtener proveedores',
      error: error.message 
    });
  }
};

// Obtener un proveedor por ID
exports.getProveedorById = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    res.json(proveedor);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ 
      message: 'Error al obtener proveedor',
      error: error.message 
    });
  }
};

// Crear un nuevo proveedor
exports.createProveedor = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { 
      tipo_documento, 
      numero_documento, 
      razon_social, 
      nombre_comercial,
      persona_contacto,
      telefono,
      celular,
      email,
      direccion,
      ciudad,
      departamento,
      pais,
      banco,
      tipo_cuenta,
      numero_cuenta,
      observaciones,
      es_activo 
    } = req.body;
    
    // Verificar si ya existe un proveedor con el mismo número de documento
    const proveedorExistente = await Proveedor.findOne({ 
      where: { numero_documento } 
    });
    
    if (proveedorExistente) {
      return res.status(400).json({ 
        message: 'Ya existe un proveedor registrado con este número de documento' 
      });
    }
    
    const nuevoProveedor = await Proveedor.create({
      tipo_documento,
      numero_documento,
      razon_social,
      nombre_comercial,
      persona_contacto,
      telefono,
      celular,
      email,
      direccion,
      ciudad,
      departamento,
      pais: pais || 'Colombia',
      banco,
      tipo_cuenta,
      numero_cuenta,
      observaciones,
      es_activo: es_activo !== undefined ? es_activo : true
    });
    
    res.status(201).json({
      message: 'Proveedor creado exitosamente',
      proveedor: nuevoProveedor
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ 
      message: 'Error al crear proveedor',
      error: error.message 
    });
  }
};

// Actualizar un proveedor
exports.updateProveedor = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const proveedorId = req.params.id;
    const proveedor = await Proveedor.findByPk(proveedorId);
    
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    const { 
      tipo_documento, 
      numero_documento, 
      razon_social, 
      nombre_comercial,
      persona_contacto,
      telefono,
      celular,
      email,
      direccion,
      ciudad,
      departamento,
      pais,
      banco,
      tipo_cuenta,
      numero_cuenta,
      observaciones,
      es_activo 
    } = req.body;
    
    // Verificar si ya existe otro proveedor con el mismo número de documento
    if (numero_documento && numero_documento !== proveedor.numero_documento) {
      const proveedorExistente = await Proveedor.findOne({ 
        where: { 
          numero_documento,
          id: { [Op.ne]: proveedorId } // Excluir el proveedor actual
        }
      });
      
      if (proveedorExistente) {
        return res.status(400).json({ 
          message: 'Ya existe otro proveedor registrado con este número de documento' 
        });
      }
    }
    
    // Actualizar el proveedor
    await proveedor.update({
      tipo_documento: tipo_documento || proveedor.tipo_documento,
      numero_documento: numero_documento || proveedor.numero_documento,
      razon_social: razon_social || proveedor.razon_social,
      nombre_comercial: nombre_comercial !== undefined ? nombre_comercial : proveedor.nombre_comercial,
      persona_contacto: persona_contacto !== undefined ? persona_contacto : proveedor.persona_contacto,
      telefono: telefono !== undefined ? telefono : proveedor.telefono,
      celular: celular !== undefined ? celular : proveedor.celular,
      email: email !== undefined ? email : proveedor.email,
      direccion: direccion !== undefined ? direccion : proveedor.direccion,
      ciudad: ciudad !== undefined ? ciudad : proveedor.ciudad,
      departamento: departamento !== undefined ? departamento : proveedor.departamento,
      pais: pais !== undefined ? pais : proveedor.pais,
      banco: banco !== undefined ? banco : proveedor.banco,
      tipo_cuenta: tipo_cuenta !== undefined ? tipo_cuenta : proveedor.tipo_cuenta,
      numero_cuenta: numero_cuenta !== undefined ? numero_cuenta : proveedor.numero_cuenta,
      observaciones: observaciones !== undefined ? observaciones : proveedor.observaciones,
      es_activo: es_activo !== undefined ? es_activo : proveedor.es_activo
    });
    
    res.json({
      message: 'Proveedor actualizado exitosamente',
      proveedor
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ 
      message: 'Error al actualizar proveedor',
      error: error.message 
    });
  }
};

// Eliminar un proveedor (desactivar)
exports.deleteProveedor = async (req, res) => {
  try {
    const proveedorId = req.params.id;
    const proveedor = await Proveedor.findByPk(proveedorId);
    
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    // En lugar de eliminar físicamente, marcar como inactivo
    await proveedor.update({ es_activo: false });
    
    res.json({
      message: 'Proveedor desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al desactivar proveedor:', error);
    res.status(500).json({ 
      message: 'Error al desactivar proveedor',
      error: error.message 
    });
  }
};

// Reactivar un proveedor
exports.reactivateProveedor = async (req, res) => {
  try {
    const proveedorId = req.params.id;
    const proveedor = await Proveedor.findByPk(proveedorId);
    
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    await proveedor.update({ es_activo: true });
    
    res.json({
      message: 'Proveedor reactivado exitosamente',
      proveedor
    });
  } catch (error) {
    console.error('Error al reactivar proveedor:', error);
    res.status(500).json({ 
      message: 'Error al reactivar proveedor',
      error: error.message 
    });
  }
};