const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Importar modelos
const Employee = require('./Employee');
const Payroll = require('./Payroll');
const PayrollDetail = require('./PayrollDetail');
const PayrollLoan = require('./PayrollLoan');

// Establecer relaciones
Payroll.belongsTo(Employee, { 
    foreignKey: 'employee_id',
    as: 'Employee'
});

Employee.hasMany(Payroll, { 
    foreignKey: 'employee_id'
});

Employee.hasMany(PayrollDetail, { foreignKey: 'employee_id' });
PayrollDetail.belongsTo(Employee, { foreignKey: 'employee_id' });

Employee.hasMany(PayrollLoan, { foreignKey: 'employee_id' });
PayrollLoan.belongsTo(Employee, { foreignKey: 'employee_id' });

module.exports = {
    sequelize,
    Employee,
    Payroll,
    PayrollDetail,
    PayrollLoan
};