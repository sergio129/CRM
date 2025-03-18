const axios = require('axios');

class PredictiveAnalysisService {
    static async analyzeCreditRisk(clientData) {
        try {
            // Simulación de análisis predictivo basado en datos locales
            const { verified_income, loan_amount } = clientData;

            // Calcular el porcentaje del ingreso mensual comprometido con el préstamo
            const incomeCommitment = loan_amount / verified_income;

            // Determinar el puntaje de riesgo (entre 0 y 1)
            let risk_score = 0;

            if (incomeCommitment < 0.3) {
                risk_score = 0.2; // Bajo riesgo
            } else if (incomeCommitment < 0.5) {
                risk_score = 0.5; // Riesgo moderado
            } else {
                risk_score = 0.8; // Alto riesgo
            }

            return { risk_score };
        } catch (error) {
            console.error('Error en el análisis predictivo local:', error.message);
            throw new Error('No se pudo realizar el análisis predictivo.');
        }
    }
}

module.exports = PredictiveAnalysisService;
