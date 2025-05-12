const { validationResult } = require('express-validator');
const CategoriaIngreso = require('../models/CategoriaIngreso');
const Ingreso = require('../models/Ingreso');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

// Obtener todas las categorías de ingresos
exports.getCategorias = async (req, res) => {
  try {
    // Filtrar por estado activo si se especifica en la consulta
    const where = {};
    if (req.query.activo !== undefined) {
      where.es_activo = req.query.activo === 'true';
    }
    
    // Filtrar solo categorías principales si se solicita
    if (req.query.soloCategoriasRaiz === 'true') {
      where.categoria_padre_id = null;
    }
    
    // Configuración básica para la consulta
    const options = {
      where,
      order: [['nombre', 'ASC']]
    };
    
    // Incluir subcategorías solo si se solicita explícitamente
    if (req.query.incluirSubcategorias === 'true') {
      try {
        // Verificar si la columna categoria_padre_id existe en la tabla
        const columns = await sequelize.getQueryInterface().describeTable('categorias_ingresos');
        const hasSubcategoriesSupport = 'categoria_padre_id' in columns;
        
        if (hasSubcategoriesSupport) {
          options.include = [{
            model: CategoriaIngreso,
            as: 'Subcategorias',
            where: req.query.activo !== undefined ? { es_activo: req.query.activo === 'true' } : undefined,
            required: false
          }];
          
          // Añadir ordenamiento por subcategorías
          options.order.push([{ model: CategoriaIngreso, as: 'Subcategorias' }, 'nombre', 'ASC']);
        } else {
          console.warn('La columna categoria_padre_id no existe aún. Ignorando solicitud de subcategorías.');
        }
      } catch (error) {
        console.warn('Error al verificar estructura de tabla:', error);
        // Continuar sin incluir subcategorías en caso de error
      }
    }

    const categorias = await CategoriaIngreso.findAll(options);

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
    }    res.json({
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

// Obtener las subcategorías de una categoría
exports.getSubcategorias = async (req, res) => {
  try {
    const categoriaId = req.params.id;
    
    // Verificar que la categoría exista
    const categoria = await CategoriaIngreso.findByPk(categoriaId);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoría de ingreso no encontrada'
      });
    }
    
    // Buscar todas las subcategorías
    const subcategorias = await CategoriaIngreso.findAll({
      where: {
        categoria_padre_id: categoriaId,
        ...(req.query.activo !== undefined ? { es_activo: req.query.activo === 'true' } : {})
      },
      order: [['nombre', 'ASC']]
    });
    
    res.json({
      success: true,
      data: subcategorias
    });
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener subcategorías'
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

    // Si se especifica una categoría padre, verificar que exista
    if (req.body.categoria_padre_id) {
      const categoriaPadre = await CategoriaIngreso.findByPk(req.body.categoria_padre_id);
      if (!categoriaPadre) {
        return res.status(400).json({
          success: false,
          error: 'La categoría padre especificada no existe'
        });
      }
    }

    const nuevaCategoria = await CategoriaIngreso.create({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      porcentaje_retencion: req.body.porcentaje_retencion || 0,
      requiere_cliente: req.body.requiere_cliente || false,
      permite_comision: req.body.permite_comision || false,
      es_credito: req.body.es_credito || false,
      es_activo: req.body.es_activo !== undefined ? req.body.es_activo : true,
      categoria_padre_id: req.body.categoria_padre_id || null
    });

    res.status(201).json({
      success: true,
      data: nuevaCategoria,      message: 'Categoría de ingreso creada exitosamente'
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

    // Si se especifica una categoría padre, verificar que exista y que no sea la misma categoría
    if (req.body.categoria_padre_id) {
      // Evitar crear ciclos (una categoría no puede ser su propia subcategoría)
      if (req.body.categoria_padre_id == req.params.id) {
        return res.status(400).json({
          success: false,
          error: 'Una categoría no puede ser subcategoría de sí misma'
        });
      }

      const categoriaPadre = await CategoriaIngreso.findByPk(req.body.categoria_padre_id);
      if (!categoriaPadre) {
        return res.status(400).json({
          success: false,
          error: 'La categoría padre especificada no existe'
        });
      }
    }

    // Actualizar los campos
    await categoria.update({
      nombre: req.body.nombre || categoria.nombre,
      descripcion: req.body.descripcion !== undefined ? req.body.descripcion : categoria.descripcion,      porcentaje_retencion: req.body.porcentaje_retencion !== undefined ? req.body.porcentaje_retencion : categoria.porcentaje_retencion,
      requiere_cliente: req.body.requiere_cliente !== undefined ? req.body.requiere_cliente : categoria.requiere_cliente,
      permite_comision: req.body.permite_comision !== undefined ? req.body.permite_comision : categoria.permite_comision,
      es_credito: req.body.es_credito !== undefined ? req.body.es_credito : categoria.es_credito,
      es_activo: req.body.es_activo !== undefined ? req.body.es_activo : categoria.es_activo,
      categoria_padre_id: req.body.categoria_padre_id !== undefined ? req.body.categoria_padre_id : categoria.categoria_padre_id
    });

    // Obtener la categoría actualizada con la información de la categoría padre
    const categoriaActualizada = await CategoriaIngreso.findByPk(req.params.id, {
      include: [
        {
          model: CategoriaIngreso,
          as: 'CategoriaPadre',
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.json({
      success: true,
      data: categoriaActualizada,
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