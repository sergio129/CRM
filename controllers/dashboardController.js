const { Client, Employee, Payroll, PayrollDetail, Loan, sequelize, Egreso } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const moment = require('moment');

// Get dashboard summary data
exports.getDashboardData = async (req, res) => {
    try {
        // Get period parameter (default to month)
        const period = req.query.period || 'month';
        
        // Calculate date ranges based on period
        const dateRange = getDateRangeByPeriod(period);
        
        // Get total client count
        const clientCount = await Client.count();
        
        // Get total employee count
        const employeeCount = await Employee.count();
        
        // Get total payroll count
        const payrollCount = await Payroll.count();
        
        // Get active payrolls (status = 'Pagado' or 'Pendiente', assuming active means not cancelled)
        const activePayrolls = await Payroll.count({
            where: {
                status: {
                    [Op.or]: ['Pendiente', 'Pagado']
                }
            }
        });

        // Get pending payrolls (status = 'Pendiente')
        const pendingPayrolls = await Payroll.count({
            where: {
                status: 'Pendiente'
            }
        });

        // Calculate total paid amount
        const totalPaid = await PayrollDetail.sum('neto_pagar', {
            where: {
                estado: 'Pagado'
            }
        }) || 0;

        // Get clients grouped by status instead of clientType (which doesn't exist)
        const clientsByStatus = await Client.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status']
        });
        
        // Format client status data
        const formattedClientsByStatus = clientsByStatus.map(item => {
            return {
                type: item.status || 'No especificado',
                count: parseInt(item.dataValues.count)
            };
        });

        // Obtener egresos mensuales para el gráfico
        const currentYear = new Date().getFullYear();
        const monthlyExpenses = await getMonthlyExpenses(currentYear);

        // Obtener ingresos mensuales
        const monthlyIncome = await getMonthlyIncome(currentYear);
        
        // Obtener distribución de egresos por categoría
        const expensesByCategory = await getExpensesByCategory(dateRange);
        
        // Obtener datos de préstamos
        const loanData = await getLoanSummary(dateRange);

        console.log('Dashboard data calculated successfully with period:', period);

        // Send the dashboard data
        res.json({
            clientCount,
            employeeCount,
            payrollCount,
            activePayrolls,
            pendingPayrolls,
            totalPaid,
            clientsByType: formattedClientsByStatus, // Keep the same key for frontend compatibility
            monthlyExpenses,
            monthlyIncome,
            expensesByCategory,
            loanData
        });
    } catch (error) {
        console.error('Error al obtener datos del dashboard:', error);
        res.status(500).json({ message: 'Error al obtener datos del dashboard' });
    }
};

// Helper function to get date range by period
function getDateRangeByPeriod(period) {
    const now = new Date();
    let startDate, endDate;
    
    switch(period) {
        case 'week':
            // Start of current week (Monday)
            startDate = moment().startOf('week').toDate();
            endDate = now;
            break;
        case 'month':
            // Start of current month
            startDate = moment().startOf('month').toDate();
            endDate = now;
            break;
        case 'year':
            // Start of current year
            startDate = moment().startOf('year').toDate();
            endDate = now;
            break;
        case 'all':
            // All time - use null for no restriction
            startDate = null;
            endDate = now;
            break;
        default:
            // Default to month
            startDate = moment().startOf('month').toDate();
            endDate = now;
    }
    
    return { startDate, endDate };
}

// Get loan summary data based on period
async function getLoanSummary(dateRange) {
    try {
        // Build where clause based on date range
        const whereClause = {};
        if (dateRange.startDate) {
            whereClause.createdAt = {
                [Op.between]: [dateRange.startDate, dateRange.endDate]
            };
        }
        
        // Get active loans count
        const activeLoans = await Loan.count({
            where: {
                ...whereClause,
                loan_status: 'Activo'
            }
        });
        
        // Get total loan amount for active loans - Corregido: amount_requested en lugar de amount
        const totalLoanAmount = await Loan.sum('amount_requested', {
            where: {
                ...whereClause,
                loan_status: 'Activo'
            }
        }) || 0;
        
        // Get pending payments amount
        const pendingPayments = await Loan.sum('total_due', {
            where: {
                ...whereClause,
                loan_status: 'Activo'
            }
        }) || 0;
        
        // Get previous period data for comparison
        const previousPeriod = {};
        if (dateRange.startDate) {
            const periodLength = dateRange.endDate - dateRange.startDate;
            const previousStartDate = new Date(dateRange.startDate.getTime() - periodLength);
            const previousEndDate = new Date(dateRange.endDate.getTime() - periodLength);
            
            previousPeriod.activeLoans = await Loan.count({
                where: {
                    createdAt: {
                        [Op.between]: [previousStartDate, previousEndDate]
                    },
                    loan_status: 'Activo'
                }
            });
            
            // Corregido: amount_requested en lugar de amount
            previousPeriod.totalLoanAmount = await Loan.sum('amount_requested', {
                where: {
                    createdAt: {
                        [Op.between]: [previousStartDate, previousEndDate]
                    },
                    loan_status: 'Activo'
                }
            }) || 0;
            
            previousPeriod.pendingPayments = await Loan.sum('total_due', {
                where: {
                    createdAt: {
                        [Op.between]: [previousStartDate, previousEndDate]
                    },
                    loan_status: 'Activo'
                }
            }) || 0;
        }
        
        // Calculate percentage changes
        let activeLoanChange = 0;
        let totalAmountChange = 0;
        let pendingPaymentsChange = 0;
        
        if (previousPeriod.activeLoans) {
            activeLoanChange = ((activeLoans - previousPeriod.activeLoans) / previousPeriod.activeLoans) * 100;
        }
        
        if (previousPeriod.totalLoanAmount) {
            totalAmountChange = ((totalLoanAmount - previousPeriod.totalLoanAmount) / previousPeriod.totalLoanAmount) * 100;
        }
        
        if (previousPeriod.pendingPayments) {
            pendingPaymentsChange = ((pendingPayments - previousPeriod.pendingPayments) / previousPeriod.pendingPayments) * 100;
        }
        
        return {
            activeLoans,
            totalLoanAmount,
            pendingPayments,
            changes: {
                activeLoans: activeLoanChange.toFixed(2),
                totalLoanAmount: totalAmountChange.toFixed(2),
                pendingPayments: pendingPaymentsChange.toFixed(2)
            }
        };
    } catch (error) {
        console.error('Error al obtener resumen de préstamos:', error);
        return {
            activeLoans: 0,
            totalLoanAmount: 0,
            pendingPayments: 0,
            changes: {
                activeLoans: "0.00",
                totalLoanAmount: "0.00",
                pendingPayments: "0.00"
            }
        };
    }
}

// Función auxiliar para obtener egresos mensuales
async function getMonthlyExpenses(year) {
    try {
        // Crear array para almacenar los datos de los 12 meses
        const monthlyData = [];
        
        // Para cada mes del año
        for (let month = 0; month < 12; month++) {
            // Fechas de inicio y fin del mes
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            
            // Consultar la suma de egresos para este mes
            const totalAmount = await Egreso.sum('monto', {
                where: {
                    fecha: {
                        [Op.between]: [startDate, endDate]
                    },
                    estado: 'pagado'
                }
            }) || 0;
            
            // Añadir al array de resultados
            monthlyData.push({
                month: month + 1, // 1-12
                monthName: new Date(year, month, 1).toLocaleString('es-ES', { month: 'long' }),
                total: totalAmount
            });
        }
        
        return monthlyData;
    } catch (error) {
        console.error('Error al obtener egresos mensuales:', error);
        return [];
    }
}

// Función auxiliar para obtener ingresos mensuales (de nóminas pagadas)
async function getMonthlyIncome(year) {
    try {
        // Crear array para almacenar los datos de los 12 meses
        const monthlyData = [];
        
        // Para cada mes del año
        for (let month = 0; month < 12; month++) {
            // Fechas de inicio y fin del mes
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            
            // Consultar la suma de pagos de préstamos para este mes
            const totalLoanPayments = await sequelize.query(
                `SELECT SUM(amount_paid) as total FROM payment_histories 
                 WHERE payment_date BETWEEN :startDate AND :endDate`,
                {
                    replacements: { startDate, endDate },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            const totalAmount = totalLoanPayments[0]?.total || 0;
            
            // Añadir al array de resultados
            monthlyData.push({
                month: month + 1, // 1-12
                monthName: new Date(year, month, 1).toLocaleString('es-ES', { month: 'long' }),
                total: parseFloat(totalAmount)
            });
        }
        
        return monthlyData;
    } catch (error) {
        console.error('Error al obtener ingresos mensuales:', error);
        return [];
    }
}

// Función auxiliar para obtener egresos por categoría
async function getExpensesByCategory(dateRange = null) {
    try {
        // Build where clause based on date range
        const whereClause = { estado: 'pagado' };
        if (dateRange && dateRange.startDate) {
            whereClause.fecha = {
                [Op.between]: [dateRange.startDate, dateRange.endDate]
            };
        }
        
        const expensesByCategory = await Egreso.findAll({
            attributes: [
                'categoria_id', 
                [sequelize.fn('SUM', sequelize.col('monto')), 'total']
            ],
            where: whereClause,
            group: ['categoria_id'],
            include: [{
                model: sequelize.models.CategoriaEgreso,
                as: 'categoria',
                attributes: ['nombre'],
                required: false
            }]
        });
        
        // Formatear los datos de egresos por categoría
        return expensesByCategory.map(item => {
            const categoryName = item.categoria ? item.categoria.nombre : `Categoría ${item.categoria_id || 'Sin categoría'}`;
            return {
                categoryId: item.categoria_id,
                categoryName: categoryName,
                total: parseFloat(item.dataValues.total || 0)
            };
        });
    } catch (error) {
        console.error('Error al obtener egresos por categoría:', error);
        return [];
    }
}

// Find client by ID number
exports.findClientByIdNumber = async (req, res) => {
    try {
        const { idNumber } = req.params;
        
        console.log('Searching for client with ID number:', idNumber);
        
        // Try to find the client using either id_number or identification field
        const client = await Client.findOne({
            where: {
                [Op.or]: [
                    { id_number: idNumber },
                    { identification: idNumber }
                ]
            },
            include: [
                {
                    model: Loan,
                    as: 'Loans', // Asegúrate de que el alias coincida con el definido en las asociaciones
                    attributes: ['total_due'],
                    where: { loan_status: 'Activo' },
                    required: false // Permitir clientes sin préstamos activos
                }
            ]
        });
        
        if (!client) {
            console.log('Client not found with ID number:', idNumber);
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        console.log('Client found:', client.id);
        
        // For debugging - log the actual client data from the database
        console.log('Raw client data:', JSON.stringify(client, null, 2));
        
        // Calcular la deuda total del cliente sumando los total_due de sus préstamos activos
        let deudaTotal = 0;
        if (client.Loans && client.Loans.length > 0) {
            deudaTotal = client.Loans.reduce((sum, loan) => sum + parseFloat(loan.total_due || 0), 0);
        } else {
            // Si no hay préstamos activos, usar el valor almacenado en el cliente
            deudaTotal = client.deuda_total || 0;
        }
        
        // Determine payment status based on client data
        let paymentStatus;
        
        // Usar estado_financiero si está disponible
        if (client.estado_financiero) {
            paymentStatus = client.estado_financiero;
        } else {
            // Lógica de respaldo con un umbral mínimo para considerar "En mora"
            const DEUDA_MINIMA = 1.00; // Umbral mínimo de $1.00 para considerar "En mora"
            
            if (client.status === 'Bloqueado') {
                paymentStatus = 'Bloqueado';
            } else if (deudaTotal > DEUDA_MINIMA) {
                paymentStatus = 'En mora';
            } else {
                paymentStatus = 'Al día';
            }
        }
        
        // Extract name parts from full_name if available
        let firstName = '';
        let lastName = '';
        
        if (client.full_name) {
            const nameParts = client.full_name.split(' ');
            if (nameParts.length >= 2) {
                firstName = nameParts[0];
                lastName = nameParts.slice(1).join(' ');
            } else {
                firstName = client.full_name;
            }
        }
        
        // Format the response to match what the frontend expects
        const formattedClient = {
            id: client.id,
            firstName: firstName || '',
            lastName: lastName || '',
            name: firstName || '',
            // Use all possible identification fields to ensure we have a value
            identification: client.identification || client.id_number || '',
            idNumber: client.id_number || client.identification || '',
            email: client.email || '',
            phone: client.phone || client.telefono_movil || '',
            address: client.address || '',
            clientType: client.tipo_documento || 'No especificado',
            deudaTotal: deudaTotal,
            status: client.status || 'Activo',
            paymentStatus: paymentStatus
        };
        
        // Log the formatted client data we're sending to the frontend
        console.log('Formatted client data:', formattedClient);
        
        res.json(formattedClient);
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        res.status(500).json({ message: 'Error al buscar cliente' });
    }
};

// Export dashboard data as Excel report
exports.exportDashboardReport = async (req, res) => {
    try {
        // Collect all necessary data for the report
        const [
            clientCount, 
            employeeCount, 
            payrollCount, 
            clients,
            employees,
            payrolls,
            loans
        ] = await Promise.all([
            Client.count(),
            Employee.count(),
            Payroll.count(),
            Client.findAll({ limit: 100 }),
            Employee.findAll({ limit: 100 }),
            Payroll.findAll({
                include: [{
                    model: PayrollDetail,
                    as: 'details'
                }],
                limit: 50
            }),
            Loan.findAll({ limit: 100 })
        ]);
        
        // Create a new Excel workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'GESCOOP';
        workbook.lastModifiedBy = 'System';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        // Add summary worksheet
        const summarySheet = workbook.addWorksheet('Resumen');
        summarySheet.columns = [
            { header: 'Métrica', key: 'metric', width: 30 },
            { header: 'Valor', key: 'value', width: 20 }
        ];
        
        // Add summary data
        summarySheet.addRows([
            { metric: 'Total Clientes', value: clientCount },
            { metric: 'Total Empleados', value: employeeCount },
            { metric: 'Total Nóminas', value: payrollCount },
            { metric: 'Fecha del Reporte', value: new Date().toLocaleDateString() }
        ]);
        
        // Add clients worksheet
        const clientsSheet = workbook.addWorksheet('Clientes');
        clientsSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombre', key: 'name', width: 20 },
            { header: 'Apellido', key: 'lastName', width: 20 },
            { header: 'Tipo', key: 'clientType', width: 15 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Teléfono', key: 'phone', width: 15 }
        ];
        
        // Add client data
        clientsSheet.addRows(clients.map(client => ({
            id: client.id,
            name: client.name,
            lastName: client.lastName,
            clientType: client.clientType,
            email: client.email,
            phone: client.phone
        })));
        
        // Add employees worksheet
        const employeesSheet = workbook.addWorksheet('Empleados');
        employeesSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombre', key: 'firstName', width: 20 },
            { header: 'Apellido', key: 'lastName', width: 20 },
            { header: 'Cargo', key: 'position', width: 20 },
            { header: 'Salario Base', key: 'baseSalary', width: 15 }
        ];
        
        // Add employee data
        employeesSheet.addRows(employees.map(employee => ({
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            position: employee.position,
            baseSalary: employee.baseSalary
        })));
        
        // Add payrolls worksheet
        const payrollsSheet = workbook.addWorksheet('Nóminas');
        payrollsSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Fecha', key: 'date', width: 20 },
            { header: 'Período', key: 'period', width: 20 },
            { header: '# Empleados', key: 'employeeCount', width: 15 },
            { header: 'Total', key: 'total', width: 15 }
        ];
        
        // Add payroll data
        payrollsSheet.addRows(payrolls.map(payroll => ({
            id: payroll.id,
            date: payroll.date ? new Date(payroll.date).toLocaleDateString() : 'N/A',
            period: payroll.period,
            employeeCount: payroll.details ? payroll.details.length : 0,
            total: payroll.details ? payroll.details.reduce((sum, detail) => sum + (detail.totalAmount || 0), 0) : 0
        })));
        
        // Add loans worksheet
        const loansSheet = workbook.addWorksheet('Préstamos');
        loansSheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Cliente', key: 'clientId', width: 15 },
            { header: 'Monto', key: 'amount', width: 15 },
            { header: 'Interés', key: 'interestRate', width: 15 },
            { header: 'Plazo', key: 'term', width: 15 },
            { header: 'Estado', key: 'status', width: 15 }
        ];
        
        // Add loan data
        loansSheet.addRows(loans.map(loan => ({
            id: loan.id,
            clientId: loan.clientId,
            amount: loan.amount_requested, // Corregido amount por amount_requested
            interestRate: loan.interestRate,
            term: loan.term,
            status: loan.status
        })));
        
        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=dashboard_report_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        // Send the buffer
        res.send(buffer);
        
    } catch (error) {
        console.error('Error al exportar reporte:', error);
        res.status(500).json({ message: 'Error al exportar reporte' });
    }
};
