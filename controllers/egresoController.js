const Egreso = require('../models/Egreso');
const CategoriaEgreso = require('../models/CategoriaEgreso');
const EgresoRecurrente = require('../models/EgresoRecurrente');
const Proveedor = require('../models/Proveedor');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

// Obtener todos los egresos con filtros
exports.getEgresos = async (req, res) => {
  try {
    const {
      desde, 
      hasta, 
      categoria, 
      estado, 
      metodo_pago,
      min_monto,
      max_monto,
      busqueda,
      page = 1, 
      limit = 10
    } = req.query;

    // Construir el objeto de condiciones de búsqueda
    const where = {};

    if (desde && hasta) {
      where.fecha = {
        [Op.between]: [new Date(desde), new Date(hasta)]
      };
    } else if (desde) {
      where.fecha = { [Op.gte]: new Date(desde) };
    } else if (hasta) {
      where.fecha = { [Op.lte]: new Date(hasta) };
    }

    if (categoria) {
      where.categoria_id = categoria;
    }

    if (estado) {
      where.estado = estado;
    }

    if (metodo_pago) {
      where.metodo_pago = metodo_pago;
    }

    if (min_monto && max_monto) {
      where.monto = {
        [Op.between]: [parseFloat(min_monto), parseFloat(max_monto)]
      };
    } else if (min_monto) {
      where.monto = { [Op.gte]: parseFloat(min_monto) };
    } else if (max_monto) {
      where.monto = { [Op.lte]: parseFloat(max_monto) };
    }

    // Búsqueda por texto en varios campos
    if (busqueda) {
      where[Op.or] = [
        { concepto: { [Op.like]: `%${busqueda}%` } },
        { descripcion: { [Op.like]: `%${busqueda}%` } },
        { numero_comprobante: { [Op.like]: `%${busqueda}%` } },
        { beneficiario: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    
    const { count, rows } = await Egreso.findAndCountAll({
      where,
      include: [
        { model: CategoriaEgreso, as: 'categoria' },
        { model: EgresoRecurrente, as: 'recurrencia', required: false }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    // Calcular el total de páginas
    const totalPages = Math.ceil(count / limit);
    
    // Calcular estadísticas
    const totalEgresos = await Egreso.sum('monto', { 
      where: { 
        ...where,
        estado: { [Op.in]: ['pagado', 'pendiente'] }
      } 
    });
    
    const totalPagado = await Egreso.sum('monto', { 
      where: { 
        ...where,
        estado: 'pagado'
      } 
    });
    
    const totalPendiente = await Egreso.sum('monto', { 
      where: { 
        ...where,
        estado: 'pendiente'
      } 
    });
    
    res.json({
      egresos: rows,
      totalItems: count,
      currentPage: parseInt(page),
      pageSize: parseInt(limit),
      totalPages,
      stats: {
        totalEgresos: totalEgresos || 0,
        totalPagado: totalPagado || 0,
        totalPendiente: totalPendiente || 0
      }
    });
  } catch (error) {
    console.error('Error al obtener egresos:', error);
    res.status(500).json({ 
      message: 'Error al obtener egresos',
      error: error.message 
    });
  }
};

// Obtener un egreso por ID
exports.getEgresoById = async (req, res) => {
  try {
    const egreso = await Egreso.findByPk(req.params.id, {
      include: [
        { model: CategoriaEgreso, as: 'categoria' },
        { model: EgresoRecurrente, as: 'recurrencia', required: false }
      ]
    });
    
    if (!egreso) {
      return res.status(404).json({ message: 'Egreso no encontrado' });
    }
    
    res.json(egreso);
  } catch (error) {
    console.error('Error al obtener egreso:', error);
    res.status(500).json({ 
      message: 'Error al obtener egreso',
      error: error.message 
    });
  }
};

// Crear un nuevo egreso
exports.createEgreso = async (req, res) => {
  // Mapear categoriaId a categoria_id si existe
  if (req.body.categoriaId && !req.body.categoria_id) {
    req.body.categoria_id = req.body.categoriaId;
  }
  
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let transaction;

  try {
    transaction = await sequelize.transaction();
    
    const { 
      fecha, 
      categoria_id, 
      concepto, 
      descripcion, 
      monto,
      metodo_pago,
      referencia_pago,
      beneficiario,
      estado,
      es_recurrente,
      frecuencia_recurrencia,
      datos_recurrencia,
      archivos_adjuntos
    } = req.body;
    
    // El usuario_id debe venir del token de autenticación
    const usuario_id = req.user.id;
    
    const nuevoEgreso = await Egreso.create({
      fecha: fecha || new Date(),
      categoria_id,
      concepto,
      descripcion,
      monto,
      metodo_pago,
      referencia_pago,
      beneficiario,
      usuario_id,
      estado: estado || 'pagado',
      es_recurrente: es_recurrente || false,
      frecuencia_recurrencia,
      archivos_adjuntos: Array.isArray(archivos_adjuntos) ? archivos_adjuntos.join(',') : archivos_adjuntos
    }, { transaction });
    
    // Si es recurrente, crear el registro de recurrencia
    if (es_recurrente && datos_recurrencia) {
      const {
        fecha_inicio,
        fecha_fin,
        frecuencia,
        dia_mes,
        dia_semana,
        cantidad_repeticiones
      } = datos_recurrencia;
      
      // Calcular la próxima fecha de ejecución
      const fechaInicio = new Date(fecha_inicio);
      let proximaEjecucion = new Date(fechaInicio);
      
      await EgresoRecurrente.create({
        egreso_id: nuevoEgreso.id,
        fecha_inicio: fechaInicio,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        frecuencia,
        dia_mes,
        dia_semana,
        cantidad_repeticiones,
        proxima_ejecucion: proximaEjecucion
      }, { transaction });
      
      // Actualizar el campo de fecha_proximo_pago en el egreso
      await nuevoEgreso.update({
        fecha_proximo_pago: proximaEjecucion
      }, { transaction });
    }
    
    await transaction.commit();
    
    res.status(201).json({
      message: 'Egreso creado exitosamente',
      egreso: nuevoEgreso
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error al crear egreso:', error);
    res.status(500).json({ 
      message: 'Error al crear egreso',
      error: error.message 
    });
  }
};

// Actualizar un egreso
exports.updateEgreso = async (req, res) => {
  // Mapear categoriaId a categoria_id si existe
  if (req.body.categoriaId && !req.body.categoria_id) {
    req.body.categoria_id = req.body.categoriaId;
  }
  
  // Mapear metodoPago a metodo_pago si existe
  if (req.body.metodoPago && !req.body.metodo_pago) {
    req.body.metodo_pago = req.body.metodoPago;
  }
  
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let transaction;

  try {
    transaction = await sequelize.transaction();
    
    const egresoId = req.params.id;
    const egreso = await Egreso.findByPk(egresoId, {
      include: [{ model: EgresoRecurrente, as: 'recurrencia' }]
    });
    
    if (!egreso) {
      return res.status(404).json({ message: 'Egreso no encontrado' });
    }
    
    const { 
      fecha, 
      categoria_id, 
      concepto, 
      descripcion, 
      monto,
      metodo_pago,
      referencia_pago,
      beneficiario,
      estado,
      es_recurrente,
      frecuencia_recurrencia,
      datos_recurrencia,
      archivos_adjuntos
    } = req.body;
    
    console.log('Método de pago recibido:', metodo_pago || 'No especificado'); // Log para depuración
    
    // Actualizar el egreso
    await egreso.update({
      fecha: fecha || egreso.fecha,
      categoria_id: categoria_id || egreso.categoria_id,
      concepto: concepto || egreso.concepto,
      descripcion: descripcion !== undefined ? descripcion : egreso.descripcion,
      monto: monto || egreso.monto,
      metodo_pago: metodo_pago || egreso.metodo_pago,
      referencia_pago: referencia_pago !== undefined ? referencia_pago : egreso.referencia_pago,
      beneficiario: beneficiario !== undefined ? beneficiario : egreso.beneficiario,
      estado: estado || egreso.estado,
      es_recurrente: es_recurrente !== undefined ? es_recurrente : egreso.es_recurrente,
      frecuencia_recurrencia: frecuencia_recurrencia || egreso.frecuencia_recurrencia,
      archivos_adjuntos: archivos_adjuntos !== undefined ? 
        (Array.isArray(archivos_adjuntos) ? archivos_adjuntos.join(',') : archivos_adjuntos) : 
        egreso.archivos_adjuntos
    }, { transaction });
    
    // Manejar la recurrencia si es necesario
    if (es_recurrente) {
      if (datos_recurrencia) {
        const {
          fecha_inicio,
          fecha_fin,
          frecuencia,
          dia_mes,
          dia_semana,
          cantidad_repeticiones,
          es_activo
        } = datos_recurrencia;
        
        // Si ya existe una recurrencia, actualizarla
        if (egreso.recurrencia) {
          await egreso.recurrencia.update({
            fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : egreso.recurrencia.fecha_inicio,
            fecha_fin: fecha_fin ? new Date(fecha_fin) : egreso.recurrencia.fecha_fin,
            frecuencia: frecuencia || egreso.recurrencia.frecuencia,
            dia_mes: dia_mes !== undefined ? dia_mes : egreso.recurrencia.dia_mes,
            dia_semana: dia_semana !== undefined ? dia_semana : egreso.recurrencia.dia_semana,
            cantidad_repeticiones: cantidad_repeticiones !== undefined ? 
              cantidad_repeticiones : egreso.recurrencia.cantidad_repeticiones,
            es_activo: es_activo !== undefined ? es_activo : egreso.recurrencia.es_activo
          }, { transaction });
        } else {
          // Si no existe, crear una nueva recurrencia
          const fechaInicio = new Date(fecha_inicio);
          
          await EgresoRecurrente.create({
            egreso_id: egreso.id,
            fecha_inicio: fechaInicio,
            fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
            frecuencia: frecuencia || 'mensual',
            dia_mes,
            dia_semana,
            cantidad_repeticiones,
            proxima_ejecucion: fechaInicio
          }, { transaction });
          
          // Actualizar el campo de fecha_proximo_pago en el egreso
          await egreso.update({
            fecha_proximo_pago: fechaInicio
          }, { transaction });
        }
      }
    } else if (egreso.recurrencia) {
      // Si deja de ser recurrente, desactivar la recurrencia
      await egreso.recurrencia.update({
        es_activo: false
      }, { transaction });
      
      await egreso.update({
        fecha_proximo_pago: null
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Obtener el egreso actualizado con sus relaciones
    const egresoActualizado = await Egreso.findByPk(egresoId, {
      include: [
        { model: CategoriaEgreso, as: 'categoria' },
        { model: EgresoRecurrente, as: 'recurrencia' }
      ]
    });
    
    res.json({
      message: 'Egreso actualizado exitosamente',
      egreso: egresoActualizado
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error al actualizar egreso:', error);
    res.status(500).json({ 
      message: 'Error al actualizar egreso',
      error: error.message 
    });
  }
};

// Cancelar (anular) un egreso
exports.cancelarEgreso = async (req, res) => {
  try {
    const egresoId = req.params.id;
    const egreso = await Egreso.findByPk(egresoId, {
      include: [{ model: EgresoRecurrente, as: 'recurrencia' }]
    });
    
    if (!egreso) {
      return res.status(404).json({ message: 'Egreso no encontrado' });
    }
    
    // Si el egreso ya está anulado
    if (egreso.estado === 'anulado') {
      return res.status(400).json({ message: 'El egreso ya se encuentra anulado' });
    }
    
    // Anular el egreso
    await egreso.update({ estado: 'anulado' });
    
    // Si tiene recurrencia, desactivarla
    if (egreso.recurrencia) {
      await egreso.recurrencia.update({ es_activo: false });
    }
    
    res.json({
      message: 'Egreso anulado exitosamente',
      egreso
    });
  } catch (error) {
    console.error('Error al anular egreso:', error);
    res.status(500).json({ 
      message: 'Error al anular egreso',
      error: error.message 
    });
  }
};

// Obtener estadísticas de egresos
exports.getEstadisticasEgresos = async (req, res) => {
  try {
    const { desde, hasta, categoria_id } = req.query;
    
    // Construir condiciones de fecha
    const whereCondition = {};
    if (desde && hasta) {
      whereCondition.fecha = {
        [Op.between]: [new Date(desde), new Date(hasta)]
      };
    } else if (desde) {
      whereCondition.fecha = { [Op.gte]: new Date(desde) };
    } else if (hasta) {
      whereCondition.fecha = { [Op.lte]: new Date(hasta) };
    }
    
    // Filtrar por categoría si se especifica
    if (categoria_id) {
      whereCondition.categoria_id = categoria_id;
    }
    
    // Solo incluir egresos pagados o pendientes (no anulados)
    whereCondition.estado = { [Op.in]: ['pagado', 'pendiente'] };
    
    // Total de egresos en el período
    const totalEgresos = await Egreso.sum('monto', { where: whereCondition });
    
    // Egresos agrupados por categoría
    const egresosPorCategoria = await Egreso.findAll({
      attributes: [
        'categoria_id',
        [sequelize.fn('SUM', sequelize.col('monto')), 'total']
      ],
      include: [
        {
          model: CategoriaEgreso,
          as: 'categoria',
          attributes: ['nombre']
        }
      ],
      where: whereCondition,
      group: ['categoria_id', 'categoria.id'],
      order: [[sequelize.fn('SUM', sequelize.col('monto')), 'DESC']]
    });
    
    // Egresos agrupados por método de pago
    const egresosPorMetodoPago = await Egreso.findAll({
      attributes: [
        'metodo_pago',
        [sequelize.fn('SUM', sequelize.col('monto')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      where: whereCondition,
      group: ['metodo_pago'],
      order: [[sequelize.fn('SUM', sequelize.col('monto')), 'DESC']]
    });
    
    // Egresos por mes (para gráficos de tendencia)
    const egresosPorMes = await Egreso.findAll({
      attributes: [
        [sequelize.fn('YEAR', sequelize.col('fecha')), 'año'],
        [sequelize.fn('MONTH', sequelize.col('fecha')), 'mes'],
        [sequelize.fn('SUM', sequelize.col('monto')), 'total']
      ],
      where: whereCondition,
      group: [
        sequelize.fn('YEAR', sequelize.col('fecha')),
        sequelize.fn('MONTH', sequelize.col('fecha'))
      ],
      order: [
        [sequelize.fn('YEAR', sequelize.col('fecha')), 'ASC'],
        [sequelize.fn('MONTH', sequelize.col('fecha')), 'ASC']
      ]
    });
    
    res.json({
      totalEgresos: totalEgresos || 0,
      egresosPorCategoria,
      egresosPorMetodoPago,
      egresosPorMes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de egresos:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas de egresos',
      error: error.message 
    });
  }
};

// Subir archivo adjunto para un egreso
exports.uploadArchivoAdjunto = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No se han subido archivos' });
    }
    
    const egresoId = req.params.id;
    const egreso = await Egreso.findByPk(egresoId);
    
    if (!egreso) {
      return res.status(404).json({ message: 'Egreso no encontrado' });
    }
    
    const archivosSubidos = [];
    const directorioDestino = path.join(__dirname, '../uploads/egresos', egresoId.toString());
    
    // Crear directorio si no existe
    if (!fs.existsSync(directorioDestino)) {
      fs.mkdirSync(directorioDestino, { recursive: true });
    }
    
    // Manejar múltiples archivos
    const archivos = Array.isArray(req.files.archivos) ? req.files.archivos : [req.files.archivos];
    
    for (const archivo of archivos) {
      const nombreArchivoUnico = `${Date.now()}-${archivo.name.replace(/\s+/g, '_')}`;
      const rutaArchivo = path.join(directorioDestino, nombreArchivoUnico);
      
      // Mover archivo al directorio de destino
      await archivo.mv(rutaArchivo);
      
      // Guardar ruta relativa para guardar en la base de datos
      const rutaRelativa = `/uploads/egresos/${egresoId}/${nombreArchivoUnico}`;
      archivosSubidos.push(rutaRelativa);
    }
    
    // Actualizar el campo archivos_adjuntos del egreso
    const archivosActuales = egreso.archivos_adjuntos ? egreso.archivos_adjuntos.split(',') : [];
    const archivosActualizados = [...archivosActuales, ...archivosSubidos];
    
    await egreso.update({ archivos_adjuntos: archivosActualizados.join(',') });
    
    res.json({
      message: 'Archivos subidos correctamente',
      archivos: archivosSubidos
    });
  } catch (error) {
    console.error('Error al subir archivos:', error);
    res.status(500).json({ 
      message: 'Error al subir archivos',
      error: error.message 
    });
  }
};

// Eliminar archivo adjunto de un egreso
exports.deleteArchivoAdjunto = async (req, res) => {
  try {
    const egresoId = req.params.id;
    const { rutaArchivo } = req.body;
    
    if (!rutaArchivo) {
      return res.status(400).json({ message: 'Debe especificar la ruta del archivo a eliminar' });
    }
    
    const egreso = await Egreso.findByPk(egresoId);
    
    if (!egreso) {
      return res.status(404).json({ message: 'Egreso no encontrado' });
    }
    
    // Verificar si el archivo está asociado al egreso
    const archivosActuales = egreso.archivos_adjuntos ? egreso.archivos_adjuntos.split(',') : [];
    
    if (!archivosActuales.includes(rutaArchivo)) {
      return res.status(404).json({ message: 'Archivo no encontrado en este egreso' });
    }
    
    // Eliminar archivo físicamente
    const rutaCompleta = path.join(__dirname, '..', rutaArchivo);
    
    if (fs.existsSync(rutaCompleta)) {
      fs.unlinkSync(rutaCompleta);
    }
    
    // Actualizar la lista de archivos adjuntos
    const archivosActualizados = archivosActuales.filter(archivo => archivo !== rutaArchivo);
    await egreso.update({ archivos_adjuntos: archivosActualizados.join(',') });
    
    res.json({
      message: 'Archivo eliminado correctamente',
      archivos: archivosActualizados
    });
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    res.status(500).json({ 
      message: 'Error al eliminar archivo',
      error: error.message 
    });
  }
};

// Eliminar un egreso
exports.deleteEgreso = async (req, res) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    
    const egresoId = req.params.id;
    const egreso = await Egreso.findByPk(egresoId, {
      include: [{ model: EgresoRecurrente, as: 'recurrencia' }]
    });
    
    if (!egreso) {
      return res.status(404).json({ message: 'Egreso no encontrado' });
    }
    
    // Si tiene recurrencia, eliminarla primero
    if (egreso.recurrencia) {
      await egreso.recurrencia.destroy({ transaction });
    }
    
    // Eliminar el egreso
    await egreso.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({
      message: 'Egreso eliminado exitosamente'
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error al eliminar egreso:', error);
    res.status(500).json({ 
      message: 'Error al eliminar egreso',
      error: error.message 
    });
  }
};