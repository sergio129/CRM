const { validationResult } = require('express-validator');
const Ingreso = require('../models/Ingreso');
const CategoriaIngreso = require('../models/CategoriaIngreso');
const User = require('../models/User');
const Client = require('../models/Client');
const Employee = require('../models/Employee');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Op = Sequelize.Op;
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Directorio de uploads
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'ingresos');

// Asegurarse de que el directorio de uploads exista
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Obtener todos los ingresos con filtros opcionales
exports.getIngresos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const where = {};
    
    // Filtro por fecha
    if (req.query.fechaInicio && req.query.fechaFin) {
      where.fecha = {
        [Op.between]: [
          new Date(req.query.fechaInicio + 'T00:00:00'),
          new Date(req.query.fechaFin + 'T23:59:59')
        ]
      };
    } else if (req.query.fechaInicio) {
      where.fecha = {
        [Op.gte]: new Date(req.query.fechaInicio + 'T00:00:00')
      };
    } else if (req.query.fechaFin) {
      where.fecha = {
        [Op.lte]: new Date(req.query.fechaFin + 'T23:59:59')
      };
    }
    
    // Filtro por categoría
    if (req.query.categoriaId) {
      where.categoria_id = req.query.categoriaId;
    }
    
    // Filtro por estado
    if (req.query.estado && ['pendiente', 'confirmado', 'anulado'].includes(req.query.estado)) {
      where.estado = req.query.estado;
    }
    
    // Filtro por método de pago
    if (req.query.metodoPago) {
      where.metodo_pago = req.query.metodoPago;
    }
    
    // Filtro por cliente
    if (req.query.clienteId) {
      where.cliente_id = req.query.clienteId;
    }
    
    // Filtro por asesor
    if (req.query.asesorId) {
      where.asesor_id = req.query.asesorId;
    }
    
    // Búsqueda por concepto o descripción
    if (req.query.busqueda) {
      where[Op.or] = [
        { concepto: { [Op.like]: `%${req.query.busqueda}%` } },
        { descripcion: { [Op.like]: `%${req.query.busqueda}%` } }
      ];
    }
    
    // Realizar la consulta con las asociaciones necesarias
    const { count, rows } = await Ingreso.findAndCountAll({
      where,
      order: [['fecha', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: CategoriaIngreso,
          as: 'Categoria',
          attributes: ['id', 'nombre']
        },
        {
          model: Client,
          as: 'Cliente',
          attributes: ['id', 'full_name', 'identification'] // Cliente usa full_name
        },
        {
          model: Employee,
          as: 'Asesor',
          attributes: ['id', 'full_name', 'id_number'] // Employee también usa full_name
        },
        {
          model: User,
          as: 'Usuario',
          attributes: ['id', 'full_name', 'username'] // User también usa full_name
        }
      ]
    });
    
    // Calcular totales
    const totales = await calcularTotales(where);
    
    // Calcular la paginación
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      success: true,
      data: rows,
      meta: {
        page,
        limit,
        total: count,
        totalPages,
        totales
      }
    });
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ingresos'
    });
  }
};

// Obtener estadísticas de ingresos
exports.getEstadisticas = async (req, res) => {
  try {
    // Definir periodo de tiempo (por defecto, último mes)
    const fechaFin = req.query.fechaFin ? new Date(req.query.fechaFin + 'T23:59:59') : new Date();
    const fechaInicio = req.query.fechaInicio 
      ? new Date(req.query.fechaInicio + 'T00:00:00') 
      : new Date(fechaFin.getFullYear(), fechaFin.getMonth() - 1, fechaFin.getDate());
    
    // Condición base de tiempo para las estadísticas
    const whereBase = {
      fecha: {
        [Op.between]: [fechaInicio, fechaFin]
      },
      estado: {
        [Op.ne]: 'anulado'
      }
    };
    
    // Estadísticas por categoría
    const porCategoria = await Ingreso.findAll({
      attributes: [
        'categoria_id',
        [Sequelize.fn('SUM', Sequelize.col('valor_bruto')), 'total'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']
      ],
      where: whereBase,
      include: [
        {
          model: CategoriaIngreso,
          as: 'Categoria',
          attributes: ['nombre']
        }
      ],
      group: ['categoria_id', 'Categoria.id'],
      raw: true
    });
    
    // Estadísticas por método de pago
    const porMetodoPago = await Ingreso.findAll({
      attributes: [
        'metodo_pago',
        [Sequelize.fn('SUM', Sequelize.col('valor_bruto')), 'total'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']
      ],
      where: whereBase,
      group: ['metodo_pago'],
      raw: true
    });
    
    // Estadísticas mensuales (últimos 12 meses)
    const fechaDoceAnteriores = new Date(fechaFin);
    fechaDoceAnteriores.setMonth(fechaDoceAnteriores.getMonth() - 11);
    
    const porMes = await Ingreso.findAll({
      attributes: [
        [Sequelize.fn('YEAR', Sequelize.col('fecha')), 'anio'],
        [Sequelize.fn('MONTH', Sequelize.col('fecha')), 'mes'],
        [Sequelize.fn('SUM', Sequelize.col('valor_bruto')), 'total'],
        [Sequelize.fn('SUM', Sequelize.col('valor_neto')), 'neto'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']
      ],
      where: {
        fecha: {
          [Op.between]: [fechaDoceAnteriores, fechaFin]
        },
        estado: {
          [Op.ne]: 'anulado'
        }
      },
      group: [Sequelize.fn('YEAR', Sequelize.col('fecha')), Sequelize.fn('MONTH', Sequelize.col('fecha'))],
      order: [[Sequelize.fn('YEAR', Sequelize.col('fecha')), 'ASC'], [Sequelize.fn('MONTH', Sequelize.col('fecha')), 'ASC']],
      raw: true
    });
    
    // Totales para el periodo seleccionado
    const totales = await calcularTotales(whereBase);
    
    res.json({
      success: true,
      data: {
        periodo: {
          fechaInicio,
          fechaFin
        },
        porCategoria,
        porMetodoPago,
        porMes,
        totales
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de ingresos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de ingresos'
    });
  }
};

// Obtener un ingreso por ID
exports.getIngresoById = async (req, res) => {
  try {
    const ingreso = await Ingreso.findByPk(req.params.id, {
      include: [
        {
          model: CategoriaIngreso,
          as: 'Categoria',
          attributes: ['id', 'nombre']
        },
        {
          model: Client,
          as: 'Cliente',
          attributes: ['id', 'full_name', 'identification', 'phone'] // Cliente usa full_name
        },
        {
          model: Employee,
          as: 'Asesor',
          attributes: ['id', 'full_name', 'id_number'] // Employee también usa full_name
        },
        {
          model: User,
          as: 'Usuario',
          attributes: ['id', 'full_name', 'username'] // User también usa full_name
        }
      ]
    });
    
    if (!ingreso) {
      return res.status(404).json({
        success: false,
        error: 'Ingreso no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: ingreso
    });
  } catch (error) {
    console.error('Error al obtener ingreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ingreso'
    });
  }
};

// Crear un nuevo ingreso
exports.createIngreso = async (req, res) => {
  // Validar entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  // Extraer datos del request
  const {
    categoria_id,
    concepto,
    descripcion,
    fecha,
    valor_bruto,
    valor_neto,
    porcentaje_retencion,
    valor_retencion,
    metodo_pago,
    referencia_pago,
    estado
  } = req.body;
  
  // Extraer valores que pueden necesitar ser modificados usando let en lugar de const
  let {
    cliente_id,
    credito_id,
    asesor_id,
    porcentaje_comision,
    valor_comision
  } = req.body;
    try {
    // Verificar que la categoría exista
    const categoria = await CategoriaIngreso.findByPk(categoria_id);
    if (!categoria) {
      return res.status(400).json({
        success: false,
        error: 'La categoría de ingreso no existe'
      });
    }    // Si hay un crédito_id pero no cliente_id, intentar obtener el cliente del crédito directamente con SQL
    let clienteVerificado = cliente_id;
    if (credito_id && !cliente_id) {
      console.log('Buscando cliente asociado al crédito ID:', credito_id);
      try {
        // Usar una consulta SQL directa para evitar problemas con las relaciones
        const [resultados] = await sequelize.query(
          `SELECT client_id FROM loans WHERE id = ?`,
          { replacements: [credito_id] }
        );
        
        if (resultados && resultados.length > 0 && resultados[0].client_id) {
          clienteVerificado = resultados[0].client_id;
          console.log(`Cliente ID ${clienteVerificado} encontrado para el crédito ID ${credito_id}`);
        } else {
          console.log('No se encontró el cliente para el crédito ID:', credito_id);
        }
      } catch (loanError) {
        console.error('Error al buscar el crédito:', loanError);
      }
    }
    
    // Verificar si la categoría requiere cliente y si se proporcionó
    if (categoria.requiere_cliente && !clienteVerificado) {
      return res.status(400).json({
        success: false,
        error: 'Esta categoría requiere seleccionar un cliente'
      });
    }
    
    // Verificar cliente si se proporciona
    if (clienteVerificado) {
      const cliente = await Client.findByPk(clienteVerificado);
      if (!cliente) {
        return res.status(400).json({
          success: false,
          error: 'El cliente seleccionado no existe'
        });
      }
      // Actualizar cliente_id con el valor verificado para usarlo más adelante
      cliente_id = clienteVerificado;
    }
    
    // Verificar asesor si se proporciona
    if (asesor_id) {
      const asesor = await Employee.findByPk(asesor_id);
      if (!asesor) {
        return res.status(400).json({
          success: false,
          error: 'El asesor seleccionado no existe'
        });
      }
    }
    
    // Verificar coherencia en los cálculos
    const calculado_retencion = (valor_bruto * (porcentaje_retencion || 0)) / 100;
    const calculado_comision = (valor_bruto * (porcentaje_comision || 0)) / 100;
    const calculado_neto = valor_bruto - calculado_retencion - calculado_comision;
    
    // Si hay discrepancia significativa en los cálculos, notificar
    if (Math.abs(calculado_neto - valor_neto) > 0.1) {
      return res.status(400).json({
        success: false,
        error: 'Error en los cálculos del valor neto'
      });
    }
    
    // Manejo de archivos adjuntos
    let archivosAdjuntos = [];
    if (req.files && req.files.archivos) {
      // Convertir a array si es un solo archivo
      const archivos = Array.isArray(req.files.archivos) ? req.files.archivos : [req.files.archivos];
      
      for (const archivo of archivos) {
        const extension = path.extname(archivo.name);
        const nombreUnico = `${uuidv4()}${extension}`;
        const rutaArchivo = path.join(UPLOAD_DIR, nombreUnico);
        
        // Mover archivo
        await archivo.mv(rutaArchivo);
        
        // Guardar información del archivo
        archivosAdjuntos.push({
          nombre_original: archivo.name,
          nombre_sistema: nombreUnico,
          ruta: `/uploads/ingresos/${nombreUnico}`,
          tipo: archivo.mimetype,
          tamano: archivo.size
        });
      }
    }
    
    // Crear el ingreso
    const nuevoIngreso = await Ingreso.create({
      categoria_id,
      concepto,
      descripcion,
      fecha: new Date(fecha),
      valor_bruto,
      valor_retencion: valor_retencion || calculado_retencion,
      porcentaje_retencion: porcentaje_retencion || 0,
      valor_comision: valor_comision || calculado_comision,
      porcentaje_comision: porcentaje_comision || 0,
      valor_neto,
      cliente_id,
      credito_id,
      asesor_id,
      metodo_pago,
      referencia_pago,
      estado: estado || 'confirmado',
      archivos_adjuntos: archivosAdjuntos.length > 0 ? JSON.stringify(archivosAdjuntos) : null,
      usuario_id: req.usuario.id
    });
      // Si es un pago de crédito, actualizar el crédito
    if ((categoria.es_credito || categoria.nombre.toLowerCase().includes('crédito') || categoria.nombre.toLowerCase().includes('credito')) && credito_id) {
      try {
        console.log(`Actualizando crédito ID ${credito_id} con abono de ${valor_bruto}`);
        
        // Importar modelo Loan
        const Loan = require('../models/Loan');
        
        // Buscar el crédito
        const credito = await Loan.findByPk(credito_id);
        
        if (credito) {
          // Obtener valores actuales
          const saldoActual = parseFloat(credito.total_due) || 0;
          const nuevoSaldo = Math.max(0, saldoActual - valor_bruto);
          
          console.log(`Crédito encontrado: ${credito.loan_number}. Saldo actual: ${saldoActual}. Nuevo saldo: ${nuevoSaldo}`);
            // Actualizar saldo
          await credito.update({
            total_due: nuevoSaldo,
            // Si el saldo llega a cero, actualizar estado a "Pagado"
            loan_status: nuevoSaldo <= 0 ? 'Pagado' : credito.loan_status
          });
          
          // Registrar historial de pago si existe el modelo correspondiente
          try {
            const PaymentHistory = require('../models/PaymentHistory');
            await PaymentHistory.create({
              loan_id: credito_id,
              payment_date: new Date(fecha),
              amount_paid: valor_bruto,
              payment_method: metodo_pago,
              notes: `Ingreso #${nuevoIngreso.id} - ${referencia_pago || ''}`
            });
            console.log('Historial de pago registrado correctamente');
          } catch (historyError) {
            console.error('Error al registrar historial de pago:', historyError);
            // No interrumpimos el flujo por un error en el historial
          }
          
          console.log(`Crédito ID ${credito_id} actualizado correctamente`);
        } else {
          console.error(`No se encontró el crédito con ID ${credito_id}`);
        }
      } catch (creditoError) {
        console.error('Error al actualizar crédito:', creditoError);
        // No interrumpimos el flujo principal por un error en la actualización del crédito
      }
    }
    
    res.status(201).json({
      success: true,
      data: nuevoIngreso,
      message: 'Ingreso creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear ingreso:', error);
    
    // Eliminar archivos subidos en caso de error
    if (req.files && req.files.archivos) {
      try {
        const archivos = Array.isArray(req.files.archivos) ? req.files.archivos : [req.files.archivos];
        for (const archivo of archivos) {
          const extension = path.extname(archivo.name);
          const nombreUnico = `${uuidv4()}${extension}`;
          const rutaArchivo = path.join(UPLOAD_DIR, nombreUnico);
          if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
          }
        }
      } catch (err) {
        console.error('Error al eliminar archivos temporales:', err);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al crear ingreso'
    });
  }
};

// Actualizar un ingreso
exports.updateIngreso = async (req, res) => {
  // Validar entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  // Extraer datos del request
  const {
    categoria_id,
    concepto,
    descripcion,
    fecha,
    valor_bruto,
    valor_neto,
    porcentaje_retencion,
    valor_retencion,
    metodo_pago,
    referencia_pago,
    estado
  } = req.body;
  
  // Extraer valores que pueden necesitar ser modificados usando let en lugar de const
  let {
    cliente_id,
    credito_id,
    asesor_id,
    porcentaje_comision,
    valor_comision
  } = req.body;
  
  // Registrar los datos recibidos para depuración
  console.log('Datos de ingreso recibidos:', { 
    categoria_id, 
    concepto, 
    fecha,
    valor_bruto,
    valor_neto,
    cliente_id,
    credito_id,
    metodo_pago
  });
  
  try {
    // Buscar el ingreso
    const ingreso = await Ingreso.findByPk(req.params.id);
    if (!ingreso) {
      return res.status(404).json({
        success: false,
        error: 'Ingreso no encontrado'
      });
    }
    
    // Verificar si el ingreso está anulado
    if (ingreso.estado === 'anulado') {
      return res.status(400).json({
        success: false,
        error: 'No se puede modificar un ingreso anulado'
      });
    }
      // Verificar que la categoría exista
    const categoria = await CategoriaIngreso.findByPk(categoria_id);
    if (!categoria) {
      return res.status(400).json({
        success: false,
        error: 'La categoría de ingreso no existe'
      });
    }
      // Si hay un crédito_id pero no cliente_id, intentar obtener el cliente del crédito directamente con SQL
    let clienteVerificado = cliente_id;
    if (credito_id && !cliente_id) {
      console.log('Actualizando ingreso: Buscando cliente asociado al crédito ID:', credito_id);
      try {
        // Usar una consulta SQL directa para evitar problemas con las relaciones
        const [resultados] = await sequelize.query(
          `SELECT client_id FROM loans WHERE id = ?`,
          { replacements: [credito_id] }
        );
        
        if (resultados && resultados.length > 0 && resultados[0].client_id) {
          clienteVerificado = resultados[0].client_id;
          console.log(`Cliente ID ${clienteVerificado} encontrado para el crédito ID ${credito_id}`);
        } else {
          console.log('No se encontró el cliente para el crédito ID:', credito_id);
        }
      } catch (loanError) {
        console.error('Error al buscar el crédito:', loanError);
      }
    }
    
    // Verificar si la categoría requiere cliente y si se proporcionó
    if (categoria.requiere_cliente && !clienteVerificado) {
      return res.status(400).json({
        success: false,
        error: 'Esta categoría requiere seleccionar un cliente'
      });
    }
    
    // Verificar cliente si se proporciona
    if (clienteVerificado) {
      const cliente = await Client.findByPk(clienteVerificado);
      if (!cliente) {
        return res.status(400).json({
          success: false,
          error: 'El cliente seleccionado no existe'
        });
      }
      // Actualizar cliente_id con el valor verificado para usarlo más adelante
      cliente_id = clienteVerificado;
    }
    
    // Verificar asesor si se proporciona
    if (asesor_id) {
      const asesor = await Employee.findByPk(asesor_id);
      if (!asesor) {
        return res.status(400).json({
          success: false,
          error: 'El asesor seleccionado no existe'
        });
      }
    }
    
    // Verificar coherencia en los cálculos
    const calculado_retencion = (valor_bruto * (porcentaje_retencion || 0)) / 100;
    const calculado_comision = (valor_bruto * (porcentaje_comision || 0)) / 100;
    const calculado_neto = valor_bruto - calculado_retencion - calculado_comision;
    
    // Si hay discrepancia significativa en los cálculos, notificar
    if (Math.abs(calculado_neto - valor_neto) > 0.1) {
      return res.status(400).json({
        success: false,
        error: 'Error en los cálculos del valor neto'
      });
    }
    
    // Manejo de archivos adjuntos
    let archivosAdjuntos = ingreso.archivos_adjuntos ? JSON.parse(ingreso.archivos_adjuntos) : [];
    
    if (req.files && req.files.archivos) {
      // Convertir a array si es un solo archivo
      const archivos = Array.isArray(req.files.archivos) ? req.files.archivos : [req.files.archivos];
      
      for (const archivo of archivos) {
        const extension = path.extname(archivo.name);
        const nombreUnico = `${uuidv4()}${extension}`;
        const rutaArchivo = path.join(UPLOAD_DIR, nombreUnico);
        
        // Mover archivo
        await archivo.mv(rutaArchivo);
        
        // Guardar información del archivo
        archivosAdjuntos.push({
          nombre_original: archivo.name,
          nombre_sistema: nombreUnico,
          ruta: `/uploads/ingresos/${nombreUnico}`,
          tipo: archivo.mimetype,
          tamano: archivo.size
        });
      }
    }
    
    // Actualizar el ingreso
    await ingreso.update({
      categoria_id,
      concepto,
      descripcion,
      fecha: fecha ? new Date(fecha) : ingreso.fecha,
      valor_bruto,
      valor_retencion: valor_retencion || calculado_retencion,
      porcentaje_retencion: porcentaje_retencion || 0,
      valor_comision: valor_comision || calculado_comision,
      porcentaje_comision: porcentaje_comision || 0,
      valor_neto,
      cliente_id,
      credito_id,
      asesor_id,
      metodo_pago,
      referencia_pago,
      estado: estado || ingreso.estado,
      archivos_adjuntos: archivosAdjuntos.length > 0 ? JSON.stringify(archivosAdjuntos) : null
    });
      // Si es un pago de crédito, actualizar el crédito si es necesario
    if ((categoria.es_credito || categoria.nombre.toLowerCase().includes('crédito') || categoria.nombre.toLowerCase().includes('credito')) && credito_id) {
      try {
        console.log(`Actualizando crédito ID ${credito_id} con abono de ${valor_bruto} (actualización de ingreso)`);
        
        // Obtener los valores originales del ingreso para calcular la diferencia
        const ingresoAnterior = await Ingreso.findByPk(req.params.id);
        const valorAnterior = ingresoAnterior ? parseFloat(ingresoAnterior.valor_bruto) || 0 : 0;
        
        // Calcular diferencia (podría ser positiva o negativa)
        const diferencia = valor_bruto - valorAnterior;
        
        if (diferencia !== 0) {
          // Importar modelo Loan
          const Loan = require('../models/Loan');
          
          // Buscar el crédito
          const credito = await Loan.findByPk(credito_id);
          
          if (credito) {
            // Obtener valores actuales
            const saldoActual = parseFloat(credito.total_due) || 0;
            const nuevoSaldo = Math.max(0, saldoActual - diferencia);
            
            console.log(`Actualización: Crédito ${credito.loan_number}. Saldo actual: ${saldoActual}. Diferencia: ${diferencia}. Nuevo saldo: ${nuevoSaldo}`);
              // Actualizar saldo
            await credito.update({
              total_due: nuevoSaldo,
              loan_status: nuevoSaldo <= 0 ? 'Pagado' : credito.loan_status
            });
            
            // Registrar actualización en historial
            try {
                const PaymentHistory = require('../models/PaymentHistory');
                await PaymentHistory.create({
                  loan_id: credito_id,
                  payment_date: new Date(),
                  amount_paid: diferencia,
                  payment_method: 'Ajuste',
                  notes: `Actualización de ingreso #${ingresoAnterior.id}`
                });
              } catch (historyError) {
                console.error('Error al registrar historial de ajuste:', historyError);
              }
            
            console.log(`Crédito ID ${credito_id} actualizado correctamente`);
          } else {
            console.error(`No se encontró el crédito con ID ${credito_id}`);
          }
        } else {
          console.log('No hay cambios en el valor del pago, no se actualiza el crédito');
        }
      } catch (creditoError) {
        console.error('Error al actualizar crédito:', creditoError);
      }
    }
    
    res.json({
      success: true,
      data: ingreso,
      message: 'Ingreso actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar ingreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar ingreso'
    });
  }
};

// Anular un ingreso
exports.anularIngreso = async (req, res) => {
  try {
    const ingreso = await Ingreso.findByPk(req.params.id);
    
    if (!ingreso) {
      return res.status(404).json({
        success: false,
        error: 'Ingreso no encontrado'
      });
    }
    
    // Verificar si ya está anulado
    if (ingreso.estado === 'anulado') {
      return res.status(400).json({
        success: false,
        error: 'Este ingreso ya está anulado'
      });
    }
    
    // Anular el ingreso
    await ingreso.update({
      estado: 'anulado'
    });
    
    // Si es un pago de crédito, revertir el pago en el crédito
    if (ingreso.credito_id) {
      // Aquí iría la lógica para revertir el pago del crédito
    }
    
    res.json({
      success: true,
      data: ingreso,
      message: 'Ingreso anulado exitosamente'
    });
  } catch (error) {
    console.error('Error al anular ingreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al anular ingreso'
    });
  }
};

// Cambiar estado de un ingreso (pendiente/confirmado)
exports.cambiarEstado = async (req, res) => {
  // Validar entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  const { estado } = req.body;
  
  try {
    const ingreso = await Ingreso.findByPk(req.params.id);
    
    if (!ingreso) {
      return res.status(404).json({
        success: false,
        error: 'Ingreso no encontrado'
      });
    }
    
    // Verificar si ya está anulado
    if (ingreso.estado === 'anulado') {
      return res.status(400).json({
        success: false,
        error: 'No se puede cambiar el estado de un ingreso anulado'
      });
    }
    
    // Si ya tiene ese estado, no hacer nada
    if (ingreso.estado === estado) {
      return res.json({
        success: true,
        data: ingreso,
        message: `El ingreso ya está en estado ${estado}`
      });
    }
    
    // Cambiar el estado
    await ingreso.update({
      estado
    });
    
    // Si es un pago de crédito y cambia a confirmado, actualizar el crédito
    if (estado === 'confirmado' && ingreso.credito_id) {
      // Aquí iría la lógica para aplicar el pago al crédito
    }
    
    res.json({
      success: true,
      data: ingreso,
      message: `Estado del ingreso cambiado a ${estado} exitosamente`
    });
  } catch (error) {
    console.error('Error al cambiar estado del ingreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado del ingreso'
    });
  }
};

// Eliminar un archivo adjunto de un ingreso
exports.eliminarArchivo = async (req, res) => {
  try {
    const ingreso = await Ingreso.findByPk(req.params.id);
    
    if (!ingreso) {
      return res.status(404).json({
        success: false,
        error: 'Ingreso no encontrado'
      });
    }
    
    // Verificar si ya está anulado
    if (ingreso.estado === 'anulado') {
      return res.status(400).json({
        success: false,
        error: 'No se pueden modificar archivos de un ingreso anulado'
      });
    }
    
    // Verificar si hay archivos adjuntos
    if (!ingreso.archivos_adjuntos) {
      return res.status(404).json({
        success: false,
        error: 'Este ingreso no tiene archivos adjuntos'
      });
    }
    
    const archivosAdjuntos = JSON.parse(ingreso.archivos_adjuntos);
    const nombreArchivo = req.params.nombreArchivo;
    
    // Buscar el archivo en la lista
    const indiceArchivo = archivosAdjuntos.findIndex(a => a.nombre_sistema === nombreArchivo);
    
    if (indiceArchivo === -1) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado'
      });
    }
    
    // Eliminar el archivo físicamente
    const rutaCompleta = path.join(UPLOAD_DIR, nombreArchivo);
    if (fs.existsSync(rutaCompleta)) {
      fs.unlinkSync(rutaCompleta);
    }
    
    // Eliminar el archivo de la lista
    archivosAdjuntos.splice(indiceArchivo, 1);
    
    // Actualizar el ingreso
    await ingreso.update({
      archivos_adjuntos: archivosAdjuntos.length > 0 ? JSON.stringify(archivosAdjuntos) : null
    });
    
    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar archivo adjunto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar archivo adjunto'
    });
  }
};

// Generar número de comprobante para un ingreso
exports.generarComprobante = async (req, res) => {
  try {
    const ingreso = await Ingreso.findByPk(req.params.id);
    
    if (!ingreso) {
      return res.status(404).json({
        success: false,
        error: 'Ingreso no encontrado'
      });
    }
    
    // Verificar si ya tiene número de comprobante
    if (ingreso.numero_comprobante) {
      return res.json({
        success: true,
        data: {
          numero_comprobante: ingreso.numero_comprobante
        },
        message: 'Este ingreso ya tiene número de comprobante'
      });
    }
    
    // Generar número de comprobante
    const fecha = new Date(ingreso.fecha);
    const anio = fecha.getFullYear().toString().substr(-2);
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    
    // Obtener el último número de comprobante para este mes y año
    const ultimoIngreso = await Ingreso.findOne({
      where: {
        numero_comprobante: {
          [Op.like]: `ING-${anio}${mes}-%`
        }
      },
      order: [['numero_comprobante', 'DESC']]
    });
    
    let numeroSecuencial = 1;
    if (ultimoIngreso && ultimoIngreso.numero_comprobante) {
      const partes = ultimoIngreso.numero_comprobante.split('-');
      if (partes.length === 3) {
        numeroSecuencial = parseInt(partes[2]) + 1;
      }
    }
    
    const numeroComprobante = `ING-${anio}${mes}-${String(numeroSecuencial).padStart(4, '0')}`;
    
    // Actualizar el ingreso con el número de comprobante
    await ingreso.update({
      numero_comprobante: numeroComprobante
    });
    
    res.json({
      success: true,
      data: {
        numero_comprobante: numeroComprobante
      },
      message: 'Número de comprobante generado exitosamente'
    });
  } catch (error) {
    console.error('Error al generar número de comprobante:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar número de comprobante'
    });
  }
};

// Función auxiliar para calcular totales
async function calcularTotales(where) {
  try {
    const totales = await Ingreso.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('valor_bruto')), 'total_bruto'],
        [Sequelize.fn('SUM', Sequelize.col('valor_neto')), 'total_neto'],
        [Sequelize.fn('SUM', Sequelize.col('valor_retencion')), 'total_retencion'],
        [Sequelize.fn('SUM', Sequelize.col('valor_comision')), 'total_comision'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']
      ],
      where,
      raw: true
    });
    
    // Totales por estado
    const porEstado = await Ingreso.findAll({
      attributes: [
        'estado',
        [Sequelize.fn('SUM', Sequelize.col('valor_bruto')), 'total'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']
      ],
      where,
      group: ['estado'],
      raw: true
    });
    
    return {
      total_bruto: parseFloat(totales[0].total_bruto || 0),
      total_neto: parseFloat(totales[0].total_neto || 0),
      total_retencion: parseFloat(totales[0].total_retencion || 0),
      total_comision: parseFloat(totales[0].total_comision || 0),
      cantidad: parseInt(totales[0].cantidad || 0),
      por_estado: porEstado
    };
  } catch (error) {
    console.error('Error al calcular totales:', error);
    return {
      total_bruto: 0,
      total_neto: 0,
      total_retencion: 0,
      total_comision: 0,
      cantidad: 0,
      por_estado: []
    };
  }
}