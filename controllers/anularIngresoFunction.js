// Exportar función anularIngreso
exports.anularIngreso = async (req, res) => {
  // Validación mínima: solo necesitamos el motivo de anulación
  const { motivo_anulacion } = req.body;
  
  if (!motivo_anulacion) {
    return res.status(400).json({
      success: false,
      error: 'El motivo de anulación es obligatorio'
    });
  }
  
  const ingresoId = req.params.id;
  const userId = req.user.id; // Usuario que realiza la anulación (del token JWT)
  
  try {
    // Iniciar transacción
    const t = await sequelize.transaction();
    
    try {
      // 1. Buscar el ingreso
      const ingreso = await Ingreso.findByPk(ingresoId, { transaction: t });
      
      if (!ingreso) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          error: 'Ingreso no encontrado'
        });
      }
      
      // 2. Verificar que no esté ya anulado
      if (ingreso.estado === 'anulado') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: 'El ingreso ya está anulado'
        });
      }
      
      // 3. Guardar los datos del ingreso antes de anularlo
      const datosIngresoAnulado = JSON.stringify(ingreso.toJSON());
      
      // 4. Registrar la anulación en la tabla de anulaciones
      const AnulacionIngreso = require('../models/AnulacionIngreso');
      await AnulacionIngreso.create({
        ingreso_id: ingresoId,
        usuario_id: userId,
        motivo_anulacion,
        datos_ingreso_anulado: datosIngresoAnulado,
        ip_usuario: req.ip || 'No disponible',
        navegador_usuario: req.get('User-Agent') || 'No disponible'
      }, { transaction: t });
      
      // 5. Actualizar el estado del ingreso a 'anulado'
      await ingreso.update({ 
        estado: 'anulado'
      }, { transaction: t });
      
      // Confirmar la transacción
      await t.commit();
      
      return res.json({
        success: true,
        message: 'Ingreso anulado correctamente',
        data: {
          id: ingreso.id,
          estado: 'anulado',
          motivo_anulacion
        }
      });
      
    } catch (error) {
      // Si hay un error, hacer rollback
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error al anular ingreso:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al anular ingreso: ' + error.message
    });
  }
};
