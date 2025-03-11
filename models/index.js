const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Importar modelos
const Employee = require('./Employee');
const Payroll = require('./Payroll');
const PayrollDetail = require('./PayrollDetail');
const PayrollLoan = require('./PayrollLoan');

// Establecer relaciones
// IMPORTANTE: Las asociaciones deben definirse antes de exportar los modelos
Employee.hasMany(Payroll, { foreignKey: 'employee_id' });
Payroll.belongsTo(Employee, { foreignKey: 'employee_id' });

// Exportar modelos
module.exports = {
    sequelize,
    Employee,
    Payroll,
    PayrollDetail,
    PayrollLoan
};