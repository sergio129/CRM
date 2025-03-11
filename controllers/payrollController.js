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
                required: true,
                attributes: ['full_name', 'id_number']
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

        // Crear el detalle de la nómina
        const payrollDetail = await PayrollDetail.create({
            employee_id,
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
        const payroll = await Payroll.findByPk(req.params.id, {
            include: [
                {
                    model: Employee,
                    attributes: ['full_name', 'id_number']
                },
                {
                    model: PayrollDetail,
                    required: false
                }
            ]
        });

        if (!payroll) {
            return res.status(404).json({ message: "Nómina no encontrada" });
        }

        // Crear PDF
        const doc = new PDFDocument();
        
        // Configurar respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=nomina-${payroll.id}.pdf`);
        doc.pipe(res);

        // Diseño del PDF
        doc.fontSize(20).text('Comprobante de Nómina', { align: 'center' });
        doc.moveDown();

        // Información del empleado
        doc.fontSize(12).text(`Empleado: ${payroll.Employee.full_name}`);
        doc.text(`Documento: ${payroll.Employee.id_number}`);
        doc.text(`Período: ${payroll.PayrollDetail.periodo}`);
        doc.moveDown();

        // Ingresos
        doc.fontSize(14).text('Ingresos', { underline: true });
        doc.fontSize(12).text(`Salario Base: $${payroll.PayrollDetail.salario_base}`);
        doc.text(`Horas Extras: $${payroll.PayrollDetail.valor_hora_extra_diurna}`);
        doc.text(`Bonificaciones: $${payroll.PayrollDetail.bonificaciones}`);
        doc.text(`Comisiones: $${payroll.PayrollDetail.comisiones}`);
        doc.text(`Total Ingresos: $${payroll.PayrollDetail.total_ingresos}`);
        doc.moveDown();

        // Deducciones
        doc.fontSize(14).text('Deducciones', { underline: true });
        doc.fontSize(12).text(`Salud: $${payroll.PayrollDetail.aporte_salud_empleado}`);
        doc.text(`Pensión: $${payroll.PayrollDetail.aporte_pension_empleado}`);
        doc.text(`Préstamos: $${payroll.PayrollDetail.prestamos}`);
        doc.text(`Otros Descuentos: $${payroll.PayrollDetail.otros_descuentos}`);
        doc.text(`Total Deducciones: $${payroll.PayrollDetail.total_deducciones}`);
        doc.moveDown();

        // Neto a Pagar
        doc.fontSize(16).text(`Neto a Pagar: $${payroll.PayrollDetail.neto_pagar}`, { underline: true });

        // Firmas
        doc.moveDown(4);
        doc.fontSize(12).text('_______________________', { align: 'left' });
        doc.text('Firma Empleador', { align: 'left' });
        doc.text('_______________________', { align: 'right' });
        doc.text('Firma Empleado', { align: 'right' });

        doc.end();
    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).json({ message: "Error al generar PDF", error: error.message });
    }
};
