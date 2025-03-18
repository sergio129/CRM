const axios = require('axios');
const CreditHistory = require('../models/CreditHistory');

class ExternalApiService {
    static async fetchCreditHistory(clientIdNumber) {
        try {
            const response = await axios.get(`https://api.credit-bureau.com/history/${clientIdNumber}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.CREDIT_BUREAU_API_KEY}`
                }
            });

            return response.data; // Retorna el historial crediticio
        } catch (error) {
            console.error('Error al obtener historial crediticio:', error.message);

            // Intentar obtener el historial local
            const localHistory = await CreditHistory.findOne({
                where: { client_id: clientIdNumber },
                order: [['report_date', 'DESC']]
            });

            if (localHistory) {
                console.log('Usando historial crediticio local.');
                return {
                    credit_score: localHistory.credit_score,
                    details: localHistory.details
                };
            }

            // Retornar un historial predeterminado si no se encuentra
            console.warn('Advertencia: No se pudo obtener el historial crediticio. Usando valores predeterminados.');
            return {
                credit_score: 0, // Valor predeterminado
                details: "Historial crediticio no disponible"
            };
        }
    }

    static async verifyIncome(clientIdNumber) {
        try {
            const response = await axios.get(`https://api.income-verification.com/verify/${clientIdNumber}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.INCOME_API_KEY}`
                }
            });

            return response.data; // Retorna los ingresos verificados
        } catch (error) {
            console.error('Error al verificar ingresos:', error.message);
            throw new Error('No se pudo verificar los ingresos.');
        }
    }
}

module.exports = ExternalApiService;
