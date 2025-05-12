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
const CategoriaEgreso = require('./CategoriaEgreso'); // Importar modelo de Categoría de Egresos
const Egreso = require('./Egreso'); // Importar modelo de Egresos
const EgresoRecurrente = require('./EgresoRecurrente'); // Importar modelo de Egresos Recurrentes
const Proveedor = require('./Proveedor'); // Importar modelo de Proveedores
const CategoriaIngreso = require('./CategoriaIngreso'); // Importar modelo de Categoría de Ingresos
const Ingreso = require('./Ingreso'); // Importar modelo de Ingresos

// Establecer relaciones
Payroll.belongsTo(Employee, { 
    foreignKey: 'employee_id',
    as: 'EmployeePayroll' // Cambiar el alias para evitar duplicados
});

Employee.hasMany(Payroll, { 
    foreignKey: 'employee_id',
    as: 'Payrolls' // Alias único para la relación inversa
});

// Agregar relación entre Payroll y PayrollDetail
Payroll.hasOne(PayrollDetail, {
    foreignKey: 'payroll_id',
    as: 'PayrollDetail'
});

PayrollDetail.belongsTo(Payroll, {
    foreignKey: 'payroll_id',
    as: 'Payroll'
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
    foreignKey: 'role', 
    as: 'Employees' // Relación entre Role y Employee
});

Employee.belongsTo(Role, { 
    foreignKey: 'role', 
    as: 'Role' // Relación inversa entre Employee y Role
});

Role.associate({ Permission });
Permission.associate({ Role });

// Registrar asociaciones
Client.associate({ Loan });
Loan.associate({ Client });
Egreso.associate({ CategoriaEgreso, EgresoRecurrente, User: require('./User') });
EgresoRecurrente.associate({ Egreso });

// Relaciones de CategoriaIngreso (jerarquía de categorías)
if (typeof CategoriaIngreso.associate === 'function') {
  CategoriaIngreso.associate({ CategoriaIngreso });
}

Ingreso.associate({ CategoriaIngreso, Client, Employee, Loan, User: require('./User') });

module.exports = {
    sequelize,
    Employee,
    Payroll,
    PayrollDetail,
    PayrollLoan,
    Client,
    Loan,
    Role, // Exportar el modelo Role
    Permission, // Exportar el modelo Permission
    CategoriaEgreso, // Exportar el modelo de Categoría de Egresos
    Egreso, // Exportar el modelo de Egresos
    EgresoRecurrente, // Exportar el modelo de Egresos Recurrentes
    Proveedor, // Exportar el modelo de Proveedores
    CategoriaIngreso, // Exportar el modelo de Categoría de Ingresos
    Ingreso // Exportar el modelo de Ingresos
};