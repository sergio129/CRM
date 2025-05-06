const { validationResult } = require('express-validator');
const CategoriaIngreso = require('../models/CategoriaIngreso');
const Ingreso = require('../models/Ingreso');
const Sequelize = require('sequelize');

// Obtener todas las categorías de ingresos
exports.getCategorias = async (req, res) => {
  try {
    // Filtrar por estado activo si se especifica en la consulta
    const where = {};
    if (req.query.activo !== undefined) {
      where.es_activo = req.query.activo === 'true';
    }

    const categorias = await CategoriaIngreso.findAll({
      where,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    console.error('Error al obtener categorías de ingresos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener categorías de ingresos'
    });
  }
};

// Obtener una categoría de ingreso por ID
exports.getCategoriaById = async (req, res) => {
  try {
    const categoria = await CategoriaIngreso.findByPk(req.params.id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoría de ingreso no encontrada'
      });
    }

    res.json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Error al obtener categoría de ingreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener categoría de ingreso'
    });
  }
};

// Crear una nueva categoría de ingreso
exports.createCategoria = async (req, res) => {
  // Validar entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    // Verificar si ya existe una categoría con el mismo nombre
    const existingCategoria = await CategoriaIngreso.findOne({
      where: {
        nombre: req.body.nombre
      }
    });

    if (existingCategoria) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una categoría con ese nombre'
      });
    }

    const nuevaCategoria = await CategoriaIngreso.create({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      porcentaje_retencion: req.body.porcentaje_retencion || 0,
      requiere_cliente: req.body.requiere_cliente || false,
      permite_comision: req.body.permite_comision || false,
      es_credito: req.body.es_credito || false,
      es_activo: req.body.es_activo !== undefined ? req.body.es_activo : true
    });

    res.status(201).json({
      success: true,
      data: nuevaCategoria,
      message: 'Categoría de ingreso creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear categoría de ingreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear categoría de ingreso'
    });
  }
};

// Actualizar una categoría de ingreso
exports.updateCategoria = async (req, res) => {
  // Validar entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const categoria = await CategoriaIngreso.findByPk(req.params.id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoría de ingreso no encontrada'
      });
    }

    // Verificar si ya existe otra categoría con el mismo nombre
    if (req.body.nombre && req.body.nombre !== categoria.nombre) {
      const existingCategoria = await CategoriaIngreso.findOne({
        where: {
          nombre: req.body.nombre,
          id: { [Sequelize.Op.ne]: req.params.id }
        }
      });

      if (existingCategoria) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe otra categoría con ese nombre'
        });
      }
    }

    // Actualizar los campos
    await categoria.update({
      nombre: req.body.nombre || categoria.nombre,
      descripcion: req.body.descripcion !== undefined ? req.body.descripcion : categoria.descripcion,
      porcentaje_retencion: req.body.porcentaje_retencion !== undefined ? req.body.porcentaje_retencion : categoria.porcentaje_retencion,
      requiere_cliente: req.body.requiere_cliente !== undefined ? req.body.requiere_cliente : categoria.requiere_cliente,
      permite_comision: req.body.permite_comision !== undefined ? req.body.permite_comision : categoria.permite_comision,
      es_credito: req.body.es_credito !== undefined ? req.body.es_credito : categoria.es_credito,
      es_activo: req.body.es_activo !== undefined ? req.body.es_activo : categoria.es_activo
    });

    res.json({
      success: true,
      data: categoria,
      message: 'Categoría de ingreso actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar categoría de ingreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar categoría de ingreso'
    });
  }
};

// Eliminar una categoría de ingreso (desactivar)
exports.deleteCategoria = async (req, res) => {
  try {
    const categoria = await CategoriaIngreso.findByPk(req.params.id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoría de ingreso no encontrada'
      });
    }

    // Verificar si hay ingresos asociados a esta categoría
    const ingresosAsociados = await Ingreso.count({
      where: {
        categoria_id: req.params.id
      }
    });

    if (ingresosAsociados > 0) {
      // Si hay ingresos asociados, solo desactivamos la categoría
      await categoria.update({ es_activo: false });
      
      return res.json({
        success: true,
        message: 'La categoría tiene ingresos asociados. Ha sido desactivada en lugar de eliminada.',
        data: categoria
      });
    }

    // Si no hay ingresos asociados, se puede eliminar completamente
    await categoria.destroy();
    
    res.json({
      success: true,
      message: 'Categoría de ingreso eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar categoría de ingreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar categoría de ingreso'
    });
  }
};