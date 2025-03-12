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
            attributes: ['id', 'employee_id', 'salario_base', 'payment_date', 'status'] // 'salary' reemplazado
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
            salario_base, // ya es salario_base
            horas_extras,
            valor_horas_extras,
            bonificaciones,
            comisiones,
            prestamos,
            otros_descuentos,
            total_ingresos,
            total_deducciones,
            neto_pagar,
            status
        } = req.body;

        // Crear primero el registro en la tabla principal de nómina
        const payroll = await Payroll.create({
            employee_id,
            salario_base, // Asignar salario_base
            payment_date: new Date(),
            status: status // Usar el estado recibido del frontend
        });

        // Crear el detalle de la nómina
        const payrollDetail = await PayrollDetail.create({
            employee_id,
            payroll_id: payroll.id,
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
            neto_pagar,
            estado: status // Usar el mismo estado en el detalle
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
        const { employee_id, salario_base, payment_date, status } = req.body;
        const payroll = await Payroll.findByPk(req.params.id);
        if (!payroll) return res.status(404).json({ message: "Nómina no encontrada" });

        // Actualizar la nómina
        await payroll.update({
            employee_id,
            salario_base, // Actualizado
            payment_date,
            status: status || 'Pendiente'  // Asegurarse de actualizar el estado
        });

        // Actualizar también el estado en el detalle de la nómina
        const payrollDetail = await PayrollDetail.findOne({
            where: { payroll_id: payroll.id }
        });

        if (payrollDetail) {
            await payrollDetail.update({
                estado: status || 'Pendiente'
            });
        }

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
            const num = parseFloat(value) || 0;
            return num.toFixed(2);
        };

        // Función para calcular aportes basado en el tipo de pago
        const calcularAportes = (salario, tipoPago) => {
            const porcentaje = tipoPago === 'Quincenal' ? 0.04 : 0.08;
            const salud = parseFloat(salario) * porcentaje;
            const pension = parseFloat(salario) * porcentaje;
            return { salud, pension };
        };

        // Calcular aportes
        const aportes = calcularAportes(payroll.salario_base, payrollDetail?.tipo_pago || 'Mensual');

        // Calcular totales
        const totalIngresos = parseFloat(payroll.salario_base) +
            parseFloat(payrollDetail?.valor_hora_extra_diurna || 0) +
            parseFloat(payrollDetail?.bonificaciones || 0) +
            parseFloat(payrollDetail?.comisiones || 0);

        const totalDeducciones = aportes.salud +
            aportes.pension +
            parseFloat(payrollDetail?.prestamos || 0) +
            parseFloat(payrollDetail?.otros_descuentos || 0);

        const netoPagar = totalIngresos - totalDeducciones;

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
               .text(`Salario Base: $${formatNumber(payroll.salario_base)}`)
               .text(`Horas Extras: $${formatNumber(payrollDetail.valor_hora_extra_diurna)}`)
               .text(`Bonificaciones: $${formatNumber(payrollDetail.bonificaciones)}`)
               .text(`Comisiones: $${formatNumber(payrollDetail.comisiones)}`)
               .text(`Total Ingresos: $${formatNumber(payrollDetail.total_ingresos)}`);
            doc.moveDown();

            // Deducciones
            doc.fontSize(14).text('Deducciones', { underline: true });
            doc.fontSize(12)
               .text(`Salud: $${formatNumber(aportes.salud)}`)
               .text(`Pensión: $${formatNumber(aportes.pension)}`)
               .text(`Préstamos: $${formatNumber(payrollDetail?.prestamos || 0)}`)
               .text(`Otros Descuentos: $${formatNumber(payrollDetail?.otros_descuentos || 0)}`)
               .text(`Total Deducciones: $${formatNumber(totalDeducciones)}`);
            doc.moveDown();

            // Neto a Pagar
            doc.fontSize(16).text(`Neto a Pagar: $${formatNumber(netoPagar)}`, { underline: true });
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
