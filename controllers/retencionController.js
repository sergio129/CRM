const { validationResult } = require('express-validator');
const Ingreso = require('../models/Ingreso');
const CategoriaIngreso = require('../models/CategoriaIngreso');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const moment = require('moment');
const excel = require('exceljs');
const path = require('path');
const fs = require('fs');

// Configuración global de retenciones para la DIAN
let retencionConfig = {
  fechaLimiteEnvio: new Date(),
  ultimaActualizacion: new Date(),
  observaciones: ''
};

// Obtener todos los conceptos de retención (categorías con porcentaje de retención)
exports.getConceptosRetencion = async (req, res) => {
  try {
    const conceptos = await CategoriaIngreso.findAll({
      attributes: ['id', 'nombre', 'descripcion', 'porcentaje_retencion', 'es_activo'],
      order: [['nombre', 'ASC']],
    });

    res.json({
      success: true,
      data: conceptos
    });
  } catch (error) {
    console.error('Error al obtener conceptos de retención:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener conceptos de retención'
    });
  }
};

// Actualizar el porcentaje de retención de una categoría
exports.actualizarPorcentajeRetencion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { porcentaje_retencion } = req.body;
  const categoriaId = req.params.id;

  try {
    const categoria = await CategoriaIngreso.findByPk(categoriaId);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    await categoria.update({ porcentaje_retencion });

    res.json({
      success: true,
      data: categoria,
      message: 'Porcentaje de retención actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar porcentaje de retención:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar porcentaje de retención'
    });
  }
};

// Configurar la fecha límite de envío a la DIAN y otras configuraciones
exports.configurarRetencion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { fechaLimiteEnvio, observaciones } = req.body;

  try {
    retencionConfig = {
      fechaLimiteEnvio: new Date(fechaLimiteEnvio),
      ultimaActualizacion: new Date(),
      observaciones
    };

    // En una implementación real, guardaríamos esto en la base de datos
    // Aquí lo mantenemos en memoria por simplicidad

    res.json({
      success: true,
      data: retencionConfig,
      message: 'Configuración de retención actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al configurar retención:', error);
    res.status(500).json({
      success: false,
      error: 'Error al configurar retención'
    });
  }
};

// Generar reporte de retenciones para la DIAN
exports.generarReporteRetenciones = async (req, res) => {
  try {
    // Parámetros para filtrar
    const { fechaInicio, fechaFin, formato } = req.query;
    const inicio = fechaInicio ? new Date(fechaInicio) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fin = fechaFin ? new Date(fechaFin) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Validar fechas
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Fechas inválidas'
      });
    }

    // Buscar ingresos con retención en el período seleccionado
    const retenciones = await Ingreso.findAll({
      where: {
        fecha: {
          [Op.between]: [inicio, fin]
        },
        valor_retencion: {
          [Op.gt]: 0
        },
        estado: {
          [Op.ne]: 'anulado'
        }
      },
      attributes: [
        'id', 'numero_comprobante', 'fecha', 'concepto', 
        'valor_bruto', 'porcentaje_retencion', 'valor_retencion',
        'estado', 'cliente_id'
      ],
      include: [
        {
          model: CategoriaIngreso,
          as: 'Categoria',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['fecha', 'ASC']]
    });

    // Calcular totales
    const totalBruto = retenciones.reduce((sum, item) => sum + parseFloat(item.valor_bruto), 0);
    const totalRetencion = retenciones.reduce((sum, item) => sum + parseFloat(item.valor_retencion), 0);
    
    // Resumen por concepto
    const resumenPorConcepto = {};
    retenciones.forEach(item => {
      const conceptoId = item.Categoria?.id;
      const conceptoNombre = item.Categoria?.nombre || 'Sin categoría';
      
      if (!resumenPorConcepto[conceptoId]) {
        resumenPorConcepto[conceptoId] = {
          nombre: conceptoNombre,
          totalBruto: 0,
          totalRetencion: 0,
          cantidad: 0
        };
      }
      
      resumenPorConcepto[conceptoId].totalBruto += parseFloat(item.valor_bruto);
      resumenPorConcepto[conceptoId].totalRetencion += parseFloat(item.valor_retencion);
      resumenPorConcepto[conceptoId].cantidad += 1;
    });

    // Si el formato es "excel", generar archivo Excel
    if (formato === 'excel') {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Retenciones');
      
      // Estilos
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
      
      // Encabezados
      worksheet.columns = [
        { header: 'Comprobante', key: 'comprobante', width: 15 },
        { header: 'Fecha', key: 'fecha', width: 12 },
        { header: 'Concepto', key: 'concepto', width: 25 },
        { header: 'Categoría', key: 'categoria', width: 25 },
        { header: 'Valor Bruto', key: 'valorBruto', width: 15 },
        { header: '% Retención', key: 'porcentajeRetencion', width: 15 },
        { header: 'Valor Retenido', key: 'valorRetencion', width: 15 },
        { header: 'Estado', key: 'estado', width: 12 }
      ];
      
      // Aplicar estilo a los encabezados
      worksheet.getRow(1).eachCell(cell => {
        cell.style = headerStyle;
      });
      
      // Añadir datos
      retenciones.forEach(item => {
        worksheet.addRow({
          comprobante: item.numero_comprobante || `RET-${item.id}`,
          fecha: moment(item.fecha).format('YYYY-MM-DD'),
          concepto: item.concepto,
          categoria: item.Categoria?.nombre || 'Sin categoría',
          valorBruto: item.valor_bruto,
          porcentajeRetencion: `${item.porcentaje_retencion}%`,
          valorRetencion: item.valor_retencion,
          estado: item.estado
        });
      });
      
      // Agregar resumen
      worksheet.addRow([]);
      worksheet.addRow(['', '', '', 'TOTALES', totalBruto, '', totalRetencion, '']);
      
      // Formatear celdas numéricas
      worksheet.getColumn('valorBruto').numFmt = '$#,##0.00';
      worksheet.getColumn('valorRetencion').numFmt = '$#,##0.00';
      
      // Agregar hoja de resumen por concepto
      const resumenSheet = workbook.addWorksheet('Resumen por Concepto');
      
      resumenSheet.columns = [
        { header: 'Concepto', key: 'concepto', width: 30 },
        { header: 'Cantidad', key: 'cantidad', width: 10 },
        { header: 'Valor Bruto', key: 'valorBruto', width: 15 },
        { header: 'Valor Retenido', key: 'valorRetencion', width: 15 },
        { header: '% Promedio', key: 'porcentaje', width: 15 }
      ];
      
      // Aplicar estilo a los encabezados de resumen
      resumenSheet.getRow(1).eachCell(cell => {
        cell.style = headerStyle;
      });
      
      // Añadir datos al resumen
      Object.values(resumenPorConcepto).forEach(item => {
        resumenSheet.addRow({
          concepto: item.nombre,
          cantidad: item.cantidad,
          valorBruto: item.totalBruto,
          valorRetencion: item.totalRetencion,
          porcentaje: item.totalBruto > 0 ? `${((item.totalRetencion / item.totalBruto) * 100).toFixed(2)}%` : '0%'
        });
      });
      
      // Formatear celdas numéricas en resumen
      resumenSheet.getColumn('valorBruto').numFmt = '$#,##0.00';
      resumenSheet.getColumn('valorRetencion').numFmt = '$#,##0.00';
      
      // Generar archivo
      const fileName = `Retenciones_${moment(inicio).format('YYYYMMDD')}_${moment(fin).format('YYYYMMDD')}.xlsx`;
      const filePath = path.join(__dirname, '..', 'uploads', 'reportes', fileName);
      
      // Asegurarse de que el directorio existe
      if (!fs.existsSync(path.join(__dirname, '..', 'uploads', 'reportes'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'uploads', 'reportes'), { recursive: true });
      }
      
      await workbook.xlsx.writeFile(filePath);
      
      // Enviar el archivo
      res.download(filePath, fileName, err => {
        if (err) {
          console.error('Error al descargar archivo:', err);
          return res.status(500).json({
            success: false,
            error: 'Error al generar archivo de Excel'
          });
        }
        
        // Opcional: eliminar el archivo después de enviarlo
        fs.unlinkSync(filePath);
      });
      
      return;
    }
    
    // Si no es Excel, devolver los datos en formato JSON
    res.json({
      success: true,
      data: {
        retenciones,
        resumen: {
          totalBruto,
          totalRetencion,
          cantidadRegistros: retenciones.length,
          porConcepto: Object.values(resumenPorConcepto)
        },
        config: retencionConfig,
        periodo: {
          inicio: moment(inicio).format('YYYY-MM-DD'),
          fin: moment(fin).format('YYYY-MM-DD')
        }
      }
    });
  } catch (error) {
    console.error('Error al generar reporte de retenciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de retenciones'
    });
  }
};

module.exports = exports;