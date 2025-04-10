const CategoriaEgreso = require('../models/CategoriaEgreso');
const { validationResult } = require('express-validator');

// Obtener todas las categorías de egresos
exports.getCategorias = async (req, res) => {
  try {
    const categorias = await CategoriaEgreso.findAll({
      order: [['nombre', 'ASC']],
      where: req.query.incluirInactivas !== 'true' ? { es_activo: true } : {}
    });
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías de egresos:', error);
    res.status(500).json({ 
      message: 'Error al obtener categorías de egresos',
      error: error.message 
    });
  }
};

// Obtener una categoría de egresos por ID
exports.getCategoriaById = async (req, res) => {
  try {
    const categoria = await CategoriaEgreso.findByPk(req.params.id);
    
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría de egreso no encontrada' });
    }
    
    res.json(categoria);
  } catch (error) {
    console.error('Error al obtener categoría de egreso:', error);
    res.status(500).json({ 
      message: 'Error al obtener categoría de egreso',
      error: error.message 
    });
  }
};

// Crear una nueva categoría de egreso
exports.createCategoria = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { nombre, descripcion, es_activo, activa } = req.body;
    
    // Verificar si ya existe una categoría con el mismo nombre
    const categoriaExistente = await CategoriaEgreso.findOne({ 
      where: { nombre } 
    });
    
    if (categoriaExistente) {
      return res.status(400).json({ message: 'Ya existe una categoría con este nombre' });
    }
    
    // Convertir explícitamente es_activo a booleano, aceptando tanto 'es_activo' como 'activa'
    const esActivoBoolean = (es_activo === true || es_activo === 'true' || es_activo === '1' || 
                              activa === true || activa === 'true' || activa === '1') ? true : false;
    
    const nuevaCategoria = await CategoriaEgreso.create({
      nombre,
      descripcion,
      es_activo: esActivoBoolean
    });
    
    res.status(201).json({
      message: 'Categoría de egreso creada exitosamente',
      categoria: nuevaCategoria
    });
  } catch (error) {
    console.error('Error al crear categoría de egreso:', error);
    res.status(500).json({ 
      message: 'Error al crear categoría de egreso',
      error: error.message 
    });
  }
};

// Actualizar una categoría de egreso
exports.updateCategoria = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { nombre, descripcion, es_activo, activa } = req.body;
    const categoriaId = req.params.id;
    
    const categoria = await CategoriaEgreso.findByPk(categoriaId);
    
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría de egreso no encontrada' });
    }
    
    // Verificar si ya existe otra categoría con el mismo nombre (excepto esta misma)
    if (nombre && nombre !== categoria.nombre) {
      const categoriaExistente = await CategoriaEgreso.findOne({ 
        where: { nombre } 
      });
      
      if (categoriaExistente) {
        return res.status(400).json({ message: 'Ya existe otra categoría con este nombre' });
      }
    }
    
    // Convertir explícitamente es_activo a booleano si se proporciona, aceptando tanto 'es_activo' como 'activa'
    let esActivoBoolean = categoria.es_activo;
    if (es_activo !== undefined || activa !== undefined) {
      esActivoBoolean = (es_activo === true || es_activo === 'true' || es_activo === '1' || 
                          activa === true || activa === 'true' || activa === '1') ? true : false;
    }
    
    // Actualizar la categoría
    await categoria.update({
      nombre: nombre || categoria.nombre,
      descripcion: descripcion !== undefined ? descripcion : categoria.descripcion,
      es_activo: esActivoBoolean
    });
    
    res.json({
      message: 'Categoría de egreso actualizada exitosamente',
      categoria
    });
  } catch (error) {
    console.error('Error al actualizar categoría de egreso:', error);
    res.status(500).json({ 
      message: 'Error al actualizar categoría de egreso',
      error: error.message 
    });
  }
};

// Eliminar una categoría de egreso
exports.deleteCategoria = async (req, res) => {
  try {
    const categoriaId = req.params.id;
    const categoria = await CategoriaEgreso.findByPk(categoriaId);
    
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría de egreso no encontrada' });
    }
    
    // En lugar de eliminar físicamente, marcar como inactiva
    await categoria.update({ es_activo: false });
    
    res.json({
      message: 'Categoría de egreso desactivada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar categoría de egreso:', error);
    res.status(500).json({ 
      message: 'Error al eliminar categoría de egreso',
      error: error.message 
    });
  }
};