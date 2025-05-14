const Loan = require('../models/Loan');
const Client = require('../models/Client');
const CreditHistory = require('../models/CreditHistory');
const PredictiveAnalysisService = require('../services/predictiveAnalysisService');
const ExternalApiService = require('../services/externalApiService');
const { v4: uuidv4 } = require('uuid'); // Importar para generar un identificador único
const NotificationService = require('../services/notificationService');
const PaymentHistory = require('../models/PaymentHistory');
const { Op } = require('sequelize'); // Import Sequelize operators

exports.getLoans = async (req, res) => {
    try {
        const { periodo, estado } = req.query;
        
        // Construir las condiciones de filtrado
        let where = {};
        
        // Filtrar por estado si se especifica y no es 'todos'
        if (estado && estado !== 'todos') {
            // Mapear los estados de la UI a los valores exactos en la base de datos
            let estadoDb;
            switch(estado.toLowerCase()) {
                case 'activos':
                    estadoDb = 'Activo';
                    break;
                case 'completados':
                    estadoDb = 'Pagado';
                    break;
                case 'mora':
                    estadoDb = 'En Mora';
                    break;
                case 'cancelados':
                    estadoDb = 'Vencido';
                    break;
                default:
                    estadoDb = estado;
            }
            
            // Usar el valor exacto para loan_status
            where.loan_status = estadoDb;
        }
        
        // Filtrar por período si se especifica
        if (periodo) {
            const today = new Date();
            let startDate, endDate;
            
            if (periodo === 'semanal') {
                // Obtener el primer día de la semana actual (lunes)
                const dayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustar para que el lunes sea el primer día
                startDate = new Date(today);
                startDate.setDate(today.getDate() - diff);
                startDate.setHours(0, 0, 0, 0);
                
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);            } else if (periodo === 'mensual') {
                // Obtener el primer día del mes actual
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                // Obtener el último día del mes actual
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                
                // Log para depuración
                console.log(`Filtro mensual: Buscando préstamos entre ${startDate.toISOString()} y ${endDate.toISOString()}`);
            } else if (periodo === 'anual') {
                // Obtener el primer día del año actual
                startDate = new Date(today.getFullYear(), 0, 1);
                // Obtener el último día del año actual
                endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
                
                console.log(`Filtro anual: Buscando préstamos entre ${startDate.toISOString()} y ${endDate.toISOString()}`);
            }
            
            if (startDate && endDate) {
                where.createdAt = { [Op.between]: [startDate, endDate] };
            }
        }
        
        console.log('Filtros aplicados:', JSON.stringify(where, null, 2));
        
        const loans = await Loan.findAll({
            where,
            include: [
                { model: Client, as: 'Client', attributes: ['full_name', 'id_number'] },
                { model: Client, as: 'CoSigner', attributes: ['full_name', 'id_number'] }
            ]        });
        
        // Normalizar los datos de los préstamos para la visualización
        const normalizedLoans = loans.map(loan => {
            const loanObj = loan.toJSON();
            
            // Agregar campos adicionales para compatibilidad
            loanObj.estado = loanObj.loan_status;
            loanObj.status = loanObj.loan_status;
            
            return loanObj;
        });

        res.json(normalizedLoans);
    } catch (error) {
        console.error("Error al obtener préstamos:", error);
        res.status(500).json({ message: "Error al obtener préstamos", error });
    }
};

exports.createLoan = async (req, res) => {
  try {
    const {
      client_id,
      amount_requested,
      interest_rate,
      interest_type,
      payment_term,
      payment_frequency,
      guarantee_type,
      co_signer_id,
      additional_income
    } = req.body;

    // Obtener datos del cliente
    const client = await Client.findByPk(client_id);
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Usar ingresos mensuales del cliente
    const verifiedIncome = client.ingresos_mensuales + (additional_income || 0);

    // Realizar análisis predictivo
    const predictiveAnalysis = await PredictiveAnalysisService.analyzeCreditRisk({
            verified_income: verifiedIncome,
      loan_amount: amount_requested
    });

    // Validar si el cliente es elegible para el préstamo
    if (predictiveAnalysis.risk_score > 0.7) {
      return res.status(400).json({ message: "El cliente tiene un alto riesgo de impago." });
    }

    // Generar un número único para el préstamo
    const loanNumber = `LN-${client_id}-${uuidv4().slice(0, 8)}`;

    // Crear el préstamo
    const newLoan = await Loan.create({
      client_id,
      loan_number: loanNumber,
      amount_requested,
      interest_rate,
      interest_type,
      payment_term,
      payment_frequency,
      guarantee_type,
      co_signer_id,
      additional_income,
risk_score: predictiveAnalysis.risk_score, // Guardar el puntaje de riesgo
      total_due: amount_requested, // Inicializar el total adeudado con el monto solicitado
      remaining_installments: payment_term // Inicializar las cuotas restantes con el plazo
    });

    // Actualizar la deuda total del cliente
    client.deuda_total = parseFloat(client.deuda_total || 0) + parseFloat(amount_requested);
    await client.save();

    // Enviar notificación al cliente
    await NotificationService.sendEmail(
      client.email,
      'Préstamo aprobado',
      `Su préstamo con número ${loanNumber} ha sido aprobado.`
    );

    res.status(201).json({ message: "Préstamo guardado correctamente", loan: newLoan });
  } catch (error) {
    console.error("Error al crear el préstamo:", error);
    res.status(500).json({ message: "Error al crear el préstamo. Por favor, intente nuevamente." });
  }
};

exports.updateLoan = async (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = await Loan.findByPk(loanId);

    if (!loan) {
      return res.status(404).json({ message: "Préstamo no encontrado" });
    }

    await loan.update(req.body);
    res.json({ message: "Préstamo actualizado correctamente", loan });
  } catch (error) {
    console.error("Error al actualizar el préstamo:", error);
    res.status(500).json({ message: "Error al actualizar el préstamo", error });
  }
};

exports.deleteLoan = async (req, res) => {
  try {
    const loanId = req.params.id;

        // Verificar si el préstamo existe
    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Préstamo no encontrado" });
    }

// Eliminar los registros relacionados en payment_histories
        await PaymentHistory.destroy({ where: { loan_id: loanId } });

        // Eliminar el préstamo
    await loan.destroy();

    res.json({ message: "Préstamo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el préstamo:", error);
    res.status(500).json({ message: "Error al eliminar el préstamo", error });
  }
};

// Nuevo método para obtener préstamos por cliente
exports.getLoansByClientId = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    
    // Obtener el cliente para verificar que existe
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: "Cliente no encontrado" 
      });
    }
    
    // Verificar si se solicitan solo los activos
    const whereCondition = { client_id: clientId };
    
    // Si se solicitaron solo los préstamos activos
    if (req.query.active === 'true') {
      whereCondition.loan_status = { [Op.ne]: 'Pagado' }; // Usar loan_status en lugar de status
    }
    
    // Obtener los préstamos del cliente
    const loans = await Loan.findAll({
      where: whereCondition,
      include: [
        { 
          model: Client, 
          as: 'Client', 
          attributes: ['id', 'full_name', 'id_number', 'phone', 'email'] 
        }
      ],
      order: [['createdAt', 'DESC']] // Ordenar por fecha de creación descendente
    });
    
    // Devolver los préstamos encontrados
    return res.status(200).json({
      success: true,
      data: loans
    });
  } catch (error) {
    console.error("Error al obtener préstamos del cliente:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al obtener préstamos del cliente", 
      error: error.message 
    });
  }
};
