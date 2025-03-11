const Payroll = require('../models/Payroll');
const PayrollDetail = require('../models/PayrollDetail');
const Employee = require('../models/Employee');
const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');

exports.getPayrolls = async (req, res) => {
    try {
        const payrolls = await Payroll.findAll({
            include: [{
                model: Employee,
                as: 'Employee',
                attributes: ['full_name', 'id_number'],
                required: true
            }],
            attributes: ['id', 'employee_id', 'salary', 'payment_date', 'status']
        });
        res.json(payrolls);
    } catch (error) {
        console.error("Error al obtener nóminas:", error);
        res.status(500).json({ 
            message: "Error al obtener nóminas", 
            error: error.message 
        });
    }
};

exports.getPayrollById = async (req, res) => {
    try {
        const payroll = await Payroll.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: Employee,
                    as: 'Employee', // Agregar el alias aquí
                    attributes: ['id', 'full_name', 'id_number']
                }
            ]
        });

        if (!payroll) {
            return res.status(404).json({ message: "Nómina no encontrada" });
        }

        // Buscar el detalle de la nómina por separado
        const payrollDetail = await PayrollDetail.findOne({
            where: { employee_id: payroll.employee_id }
        });

        // Combinar la información
        const fullPayrollData = {
            ...payroll.toJSON(),
            PayrollDetail: payrollDetail
        };

        res.json(fullPayrollData);
    } catch (error) {
        console.error("Error al obtener la nómina:", error);
        res.status(500).json({ 
            message: "Error al obtener la nómina", 
            error: error.message 
        });
    }
};

exports.createPayroll = async (req, res) => {
    try {
        const {
            employee_id,
            periodo,
            tipo_pago,
            dias_trabajados,
            salario_base,
            horas_extras,
            valor_horas_extras,
            bonificaciones,
            comisiones,
            prestamos,
            otros_descuentos,
            total_ingresos,
            total_deducciones,
            neto_pagar
        } = req.body;

        // Crear primero el registro en la tabla principal de nómina
        const payroll = await Payroll.create({
            employee_id,
            salary: salario_base,
            payment_date: new Date(),
            status: 'Pendiente'
        });

        // Crear el detalle de la nómina con el payroll_id
        const payrollDetail = await PayrollDetail.create({
            employee_id,
            payroll_id: payroll.id, // Agregar esta línea
            periodo,
            fecha_pago: new Date(),
            dias_trabajados,
            salario_base,
            horas_extras_diurnas: horas_extras,
            valor_hora_extra_diurna: valor_horas_extras,
            bonificaciones,
            comisiones,
            prestamos,
            otros_descuentos,
            total_ingresos,
            total_deducciones,
            neto_pagar
        });

        res.status(201).json({
            message: "Nómina creada correctamente",
            payroll,
            payrollDetail
        });
    } catch (error) {
        console.error("Error al crear la nómina:", error);
        res.status(500).json({
            message: "Error al crear la nómina",
            error: error.message
        });
    }
};

exports.updatePayroll = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { employee_id, salary, payment_date, status } = req.body;
        const payroll = await Payroll.findByPk(req.params.id);
        if (!payroll) return res.status(404).json({ message: "Nómina no encontrada" });

        await payroll.update({
            employee_id,
            salary,
            payment_date,
            status
        });

        res.json({ message: "Nómina actualizada correctamente", payroll });
    } catch (error) {
        console.error("Error al actualizar la nómina:", error);
        res.status(500).json({ message: "Error al actualizar la nómina", error });
    }
};

exports.deletePayroll = async (req, res) => {
    try {
        const payroll = await Payroll.findByPk(req.params.id);
        if (!payroll) return res.status(404).json({ message: "Nómina no encontrada" });

        await payroll.destroy();
        res.json({ message: "Nómina eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar la nómina:", error);
        res.status(500).json({ message: "Error al eliminar la nómina", error });
    }
};

exports.generatePayrollPDF = async (req, res) => {
    try {
        const payroll = await Payroll.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: Employee,
                    as: 'Employee',
                    required: true,
                    attributes: ['full_name', 'id_number']
                }
            ]
        });

        if (!payroll) {
            return res.status(404).json({ message: "Nómina no encontrada" });
        }

        // Buscar el detalle de la nómina
        const payrollDetail = await PayrollDetail.findOne({
            where: { employee_id: payroll.employee_id }
        });

        // Función auxiliar para formatear números
        const formatNumber = (value) => {
            return Number(value || 0).toFixed(2);
        };

        // Crear PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=nomina-${payroll.id}.pdf`);
        doc.pipe(res);

        // Diseño del PDF
        doc.fontSize(20).text('Comprobante de Nómina', { align: 'center' });
        doc.moveDown();

        // Información del empleado
        doc.fontSize(12)
           .text(`Empleado: ${payroll.Employee.full_name}`)
           .text(`Documento: ${payroll.Employee.id_number}`)
           .text(`Fecha de Pago: ${new Date(payroll.payment_date).toLocaleDateString()}`);

        if (payrollDetail) {
            doc.text(`Período: ${payrollDetail.periodo || 'N/A'}`);
            doc.moveDown();

            // Ingresos
            doc.fontSize(14).text('Ingresos', { underline: true });
            doc.fontSize(12)
               .text(`Salario Base: $${formatNumber(payroll.salary)}`)
               .text(`Horas Extras: $${formatNumber(payrollDetail.valor_hora_extra_diurna)}`)
               .text(`Bonificaciones: $${formatNumber(payrollDetail.bonificaciones)}`)
               .text(`Comisiones: $${formatNumber(payrollDetail.comisiones)}`)
               .text(`Total Ingresos: $${formatNumber(payrollDetail.total_ingresos)}`);
            doc.moveDown();

            // Deducciones
            doc.fontSize(14).text('Deducciones', { underline: true });
            doc.fontSize(12)
               .text(`Salud: $${formatNumber(payrollDetail.aporte_salud_empleado)}`)
               .text(`Pensión: $${formatNumber(payrollDetail.aporte_pension_empleado)}`)
               .text(`Préstamos: $${formatNumber(payrollDetail.prestamos)}`)
               .text(`Otros Descuentos: $${formatNumber(payrollDetail.otros_descuentos)}`)
               .text(`Total Deducciones: $${formatNumber(payrollDetail.total_deducciones)}`);
            doc.moveDown();

            // Neto a Pagar
            doc.fontSize(16).text(`Neto a Pagar: $${formatNumber(payrollDetail.neto_pagar)}`, { underline: true });
        }

        // Firmas
        doc.moveDown(4);
        doc.fontSize(12)
           .text('_______________________', { align: 'left' })
           .text('Firma Empleador', { align: 'left' })
           .moveDown()
           .text('_______________________', { align: 'right' })
           .text('Firma Empleado', { align: 'right' });

        // Finalizar PDF
        doc.end();
    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).json({ 
            message: "Error al generar PDF", 
            error: error.message 
        });
    }
};
