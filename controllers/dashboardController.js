const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const User = require('../models/User');

exports.getDashboardStats = async (req, res) => {
    try {
        // Obtener todas las estadísticas de una vez
        const [totalEmployees, totalPayrolls, totalUsers] = await Promise.all([
            Employee.count(),
            Payroll.count(),
            User.count()
        ]);

        // Enviar las estadísticas
        res.json({
            totalEmployees,
            totalPayrolls,
            totalUsers
        });
    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({ 
            message: 'Error al obtener estadísticas del dashboard', 
            error: error.message 
        });
    }
};
