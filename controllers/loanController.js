const Loan = require('../models/Loan');
const Client = require('../models/Client');
const CreditHistory = require('../models/CreditHistory');
const PredictiveAnalysisService = require('../services/predictiveAnalysisService');
const ExternalApiService = require('../services/externalApiService');
const { v4: uuidv4 } = require('uuid'); // Importar para generar un identificador único

exports.getLoans = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      include: [
        { model: Client, as: 'Client', attributes: ['full_name', 'id_number'] },
        { model: Client, as: 'CoSigner', attributes: ['full_name', 'id_number'] }
      ]
    });
    res.json(loans);
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
      id_number: client.id_number,
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
      additional_income
    });

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
    const loan = await Loan.findByPk(loanId);

    if (!loan) {
      return res.status(404).json({ message: "Préstamo no encontrado" });
    }

    await loan.destroy();
    res.json({ message: "Préstamo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el préstamo:", error);
    res.status(500).json({ message: "Error al eliminar el préstamo", error });
  }
};
