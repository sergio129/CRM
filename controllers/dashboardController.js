const { Client, Employee, Payroll, PayrollDetail, Loan, sequelize } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

// Get dashboard summary data
exports.getDashboardData = async (req, res) => {
    try {
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

        console.log('Dashboard data calculated successfully:', {
            clientCount,
            employeeCount,
            payrollCount,
            activePayrolls,
            pendingPayrolls,
            totalPaid
        });

        // Send the dashboard data
        res.json({
            clientCount,
            employeeCount,
            payrollCount,
            activePayrolls,
            pendingPayrolls,
            totalPaid,
            clientsByType: formattedClientsByStatus // Keep the same key for frontend compatibility
        });
    } catch (error) {
        console.error('Error al obtener datos del dashboard:', error);
        res.status(500).json({ message: 'Error al obtener datos del dashboard' });
    }
};

// Find client by ID number
exports.findClientByIdNumber = async (req, res) => {
    try {
        const { idNumber } = req.params;
        
        const client = await Client.findOne({
            where: { idNumber }
        });
        
        if (!client) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        res.json(client);
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
            amount: loan.amount,
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
