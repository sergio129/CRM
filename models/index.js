const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Importar modelos
const Employee = require('./Employee');
const Payroll = require('./Payroll');
const PayrollDetail = require('./PayrollDetail');
const PayrollLoan = require('./PayrollLoan');
const Client = require('./Client');
const Loan = require('./Loan');
const Role = require('./Role'); // Importar el modelo Role
const Permission = require('./Permission'); // Importar el modelo Permission

// Establecer relaciones
Payroll.belongsTo(Employee, { 
    foreignKey: 'employee_id',
    as: 'EmployeePayroll' // Cambiar el alias para evitar duplicados
});

Employee.hasMany(Payroll, { 
    foreignKey: 'employee_id',
    as: 'Payrolls' // Alias único para la relación inversa
});

Employee.hasMany(PayrollDetail, { 
    foreignKey: 'employee_id',
    as: 'PayrollDetails' // Alias único
});

PayrollDetail.belongsTo(Employee, { 
    foreignKey: 'employee_id',
    as: 'EmployeeDetail' // Alias único
});

Employee.hasMany(PayrollLoan, { 
    foreignKey: 'employee_id',
    as: 'PayrollLoans' // Alias único
});

PayrollLoan.belongsTo(Employee, { 
    foreignKey: 'employee_id',
    as: 'EmployeeLoan' // Alias único
});

// Asociaciones para Role
Role.hasMany(Employee, { 
    foreignKey: 'roleId', 
    as: 'Employees' // Relación entre Role y Employee
});

Employee.belongsTo(Role, { 
    foreignKey: 'roleId', 
    as: 'Role' // Relación inversa entre Employee y Role
});


Role.associate({ Permission });
Permission.associate({ Role });



// Registrar asociaciones
Client.associate({ Loan });
Loan.associate({ Client });

module.exports = {
    sequelize,
    Employee,
    Payroll,
    PayrollDetail,
    PayrollLoan,
    Client,
    Loan,
    Role, // Exportar el modelo Role
    Permission // Exportar el modelo Permission
};