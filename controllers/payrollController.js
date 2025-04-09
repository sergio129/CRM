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
                as: 'employees', // Alias definido en la asociación
                attributes: ['id', 'full_name', 'id_number', 'email']
            }]
        });

        res.json(payrolls);
    } catch (error) {
        console.error("Error al obtener nóminas:", error);
        res.status(500).json({ message: "Error al obtener nóminas", error });
    }
};

exports.getPayrollById = async (req, res) => {
    try {
        const payroll = await Payroll.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: Employee,
                    as: 'Employee', // Alias definido en la asociación
                    attributes: ['id', 'full_name', 'id_number']
                },
                {
                    model: PayrollDetail,
                    as: 'PayrollDetail', // Alias definido en models/index.js
                    required: false
                }
            ]
        });

        if (!payroll) {
            return res.status(404).json({ message: "Nómina no encontrada" });
        }

        res.json(payroll);
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
            total_ingresos,
            total_deducciones,
            neto_pagar,
            status,
            PayrollDetail: payrollDetailData
        } = req.body;

        // Validar campos requeridos
        if (!employee_id || !periodo || !salario_base) {
            return res.status(400).json({
                message: "Faltan campos requeridos",
                required: ["employee_id", "periodo", "salario_base"]
            });
        }

        // Crear primero el registro en la tabla principal de nómina
        const payroll = await Payroll.create({
            employee_id,
            periodo,
            salario_base,
            total_ingresos: total_ingresos || 0,
            total_deducciones: total_deducciones || 0,
            neto_pagar: neto_pagar || 0,
            payment_date: new Date(),
            status: status || 'Pendiente'
        });

        // Crear el objeto para el detalle de nómina
        const detailData = {
            employee_id,
            payroll_id: payroll.id,
            periodo: periodo,
            tipo_pago: tipo_pago || 'Mensual',
            fecha_pago: new Date(),
            dias_trabajados: dias_trabajados || 30,
            salario_base,
            total_ingresos: total_ingresos || 0,
            total_deducciones: total_deducciones || 0,
            neto_pagar: neto_pagar || 0,
            estado: status || 'Pendiente'
        };

        // Si hay datos de detalle, añadirlos al objeto
        if (payrollDetailData) {
            // Dias
            if (payrollDetailData.dias_trabajados !== undefined) 
                detailData.dias_trabajados = payrollDetailData.dias_trabajados;
            
            if (payrollDetailData.dias_vacaciones !== undefined) 
                detailData.dias_vacaciones = payrollDetailData.dias_vacaciones;
            
            if (payrollDetailData.dias_incapacidad !== undefined) 
                detailData.dias_incapacidad = payrollDetailData.dias_incapacidad;
            
            // Ingresos
            if (payrollDetailData.auxilio_transporte !== undefined) 
                detailData.auxilio_transporte = payrollDetailData.auxilio_transporte;
            
            if (payrollDetailData.horas_extras_diurnas !== undefined) 
                detailData.horas_extras_diurnas = payrollDetailData.horas_extras_diurnas;
            
            if (payrollDetailData.valor_hora_extra_diurna !== undefined) 
                detailData.valor_hora_extra_diurna = payrollDetailData.valor_hora_extra_diurna;
            
            if (payrollDetailData.horas_extras_nocturnas !== undefined) 
                detailData.horas_extras_nocturnas = payrollDetailData.horas_extras_nocturnas;
            
            if (payrollDetailData.valor_hora_extra_nocturna !== undefined) 
                detailData.valor_hora_extra_nocturna = payrollDetailData.valor_hora_extra_nocturna;
            
            if (payrollDetailData.bonificaciones !== undefined) 
                detailData.bonificaciones = payrollDetailData.bonificaciones;
            
            if (payrollDetailData.comisiones !== undefined) 
                detailData.comisiones = payrollDetailData.comisiones;
            
            if (payrollDetailData.recargo_dominical !== undefined) 
                detailData.recargo_dominical = payrollDetailData.recargo_dominical;
            
            // Deducciones
            if (payrollDetailData.aporte_salud_empleado !== undefined) 
                detailData.aporte_salud_empleado = payrollDetailData.aporte_salud_empleado;
            
            if (payrollDetailData.aporte_pension_empleado !== undefined) 
                detailData.aporte_pension_empleado = payrollDetailData.aporte_pension_empleado;
            
            if (payrollDetailData.aporte_salud_empleador !== undefined) 
                detailData.aporte_salud_empleador = payrollDetailData.aporte_salud_empleador;
            
            if (payrollDetailData.aporte_pension_empleador !== undefined) 
                detailData.aporte_pension_empleador = payrollDetailData.aporte_pension_empleador;
            
            if (payrollDetailData.aporte_arl !== undefined) 
                detailData.aporte_arl = payrollDetailData.aporte_arl;
            
            if (payrollDetailData.aporte_caja_compensacion !== undefined) 
                detailData.aporte_caja_compensacion = payrollDetailData.aporte_caja_compensacion;
            
            if (payrollDetailData.aporte_icbf !== undefined) 
                detailData.aporte_icbf = payrollDetailData.aporte_icbf;
            
            if (payrollDetailData.aporte_sena !== undefined) 
                detailData.aporte_sena = payrollDetailData.aporte_sena;
            
            if (payrollDetailData.prestamos !== undefined) 
                detailData.prestamos = payrollDetailData.prestamos;
            
            if (payrollDetailData.embargos !== undefined) 
                detailData.embargos = payrollDetailData.embargos;
            
            if (payrollDetailData.otros_descuentos !== undefined) 
                detailData.otros_descuentos = payrollDetailData.otros_descuentos;
            
            // Provisiones
            if (payrollDetailData.provision_prima !== undefined) 
                detailData.provision_prima = payrollDetailData.provision_prima;
            
            if (payrollDetailData.provision_cesantias !== undefined) 
                detailData.provision_cesantias = payrollDetailData.provision_cesantias;
            
            if (payrollDetailData.provision_intereses_cesantias !== undefined) 
                detailData.provision_intereses_cesantias = payrollDetailData.provision_intereses_cesantias;
            
            if (payrollDetailData.provision_vacaciones !== undefined) 
                detailData.provision_vacaciones = payrollDetailData.provision_vacaciones;
            
            if (payrollDetailData.total_provisiones !== undefined) 
                detailData.total_provisiones = payrollDetailData.total_provisiones;
            
            // Método de pago
            if (payrollDetailData.metodo_pago !== undefined) 
                detailData.metodo_pago = payrollDetailData.metodo_pago;
            
            if (payrollDetailData.observaciones !== undefined) 
                detailData.observaciones = payrollDetailData.observaciones;
        }

        // Crear el detalle de la nómina
        const payrollDetail = await PayrollDetail.create(detailData);

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
        console.log("Datos recibidos para actualización:", req.body); // Para depuración
        
        // Extraer todos los datos de la solicitud
        const { 
            employee_id, 
            periodo,
            salario_base, 
            payment_date, 
            status,
            total_ingresos,
            total_deducciones,
            neto_pagar,
            PayrollDetail: payrollDetailData
        } = req.body;
        
        // Verificar que la nómina existe
        const payroll = await Payroll.findByPk(req.params.id);
        if (!payroll) return res.status(404).json({ message: "Nómina no encontrada" });

        // Actualizar la nómina principal
        await payroll.update({
            employee_id,
            periodo,
            salario_base,
            payment_date,
            total_ingresos,
            total_deducciones,
            neto_pagar,
            status: status || 'Pendiente'
        });

        // Buscar el detalle de la nómina
        let payrollDetail = await PayrollDetail.findOne({
            where: { payroll_id: payroll.id }
        });

        // Si no existe el detalle pero nos envían datos, lo creamos
        if (!payrollDetail && payrollDetailData) {
            payrollDetail = await PayrollDetail.create({
                employee_id,
                payroll_id: payroll.id,
                periodo,
                fecha_pago: new Date(),
                tipo_pago: payrollDetailData.tipo_pago || 'Mensual',
                dias_trabajados: payrollDetailData.dias_trabajados || 30,
                dias_vacaciones: payrollDetailData.dias_vacaciones || 0,
                dias_incapacidad: payrollDetailData.dias_incapacidad || 0,
                salario_base,
                auxilio_transporte: payrollDetailData.auxilio_transporte || 0,
                horas_extras_diurnas: payrollDetailData.horas_extras_diurnas || 0,
                valor_hora_extra_diurna: payrollDetailData.valor_hora_extra_diurna || 0,
                horas_extras_nocturnas: payrollDetailData.horas_extras_nocturnas || 0,
                valor_hora_extra_nocturna: payrollDetailData.valor_hora_extra_nocturna || 0,
                bonificaciones: payrollDetailData.bonificaciones || 0,
                comisiones: payrollDetailData.comisiones || 0,
                recargo_dominical: payrollDetailData.recargo_dominical || 0,
                aporte_salud_empleado: payrollDetailData.aporte_salud_empleado || 0,
                aporte_pension_empleado: payrollDetailData.aporte_pension_empleado || 0,
                aporte_salud_empleador: payrollDetailData.aporte_salud_empleador || 0,
                aporte_pension_empleador: payrollDetailData.aporte_pension_empleador || 0,
                aporte_arl: payrollDetailData.aporte_arl || 0,
                aporte_caja_compensacion: payrollDetailData.aporte_caja_compensacion || 0,
                aporte_icbf: payrollDetailData.aporte_icbf || 0,
                aporte_sena: payrollDetailData.aporte_sena || 0,
                prestamos: payrollDetailData.prestamos || 0,
                embargos: payrollDetailData.embargos || 0,
                otros_descuentos: payrollDetailData.otros_descuentos || 0,
                provision_prima: payrollDetailData.provision_prima || 0,
                provision_cesantias: payrollDetailData.provision_cesantias || 0,
                provision_intereses_cesantias: payrollDetailData.provision_intereses_cesantias || 0,
                provision_vacaciones: payrollDetailData.provision_vacaciones || 0,
                total_provisiones: payrollDetailData.total_provisiones || 0,
                total_ingresos,
                total_deducciones,
                neto_pagar,
                estado: status || 'Pendiente',
                metodo_pago: payrollDetailData.metodo_pago || 'Transferencia',
                observaciones: payrollDetailData.observaciones || ''
            });
            console.log('PayrollDetail creado correctamente:', payrollDetail.id);
        } 
        // Si existe el detalle y nos envían datos, lo actualizamos
        else if (payrollDetail && payrollDetailData) {
            // Crear un objeto con todos los campos a actualizar
            const updateData = {
                periodo: payrollDetailData.periodo || periodo,
                tipo_pago: payrollDetailData.tipo_pago || 'Mensual',
                dias_trabajados: payrollDetailData.dias_trabajados !== undefined ? payrollDetailData.dias_trabajados : 30,
                dias_vacaciones: payrollDetailData.dias_vacaciones !== undefined ? payrollDetailData.dias_vacaciones : 0,
                dias_incapacidad: payrollDetailData.dias_incapacidad !== undefined ? payrollDetailData.dias_incapacidad : 0,
                salario_base: salario_base,
                auxilio_transporte: payrollDetailData.auxilio_transporte !== undefined ? payrollDetailData.auxilio_transporte : 0,
                horas_extras_diurnas: payrollDetailData.horas_extras_diurnas !== undefined ? payrollDetailData.horas_extras_diurnas : 0,
                valor_hora_extra_diurna: payrollDetailData.valor_hora_extra_diurna !== undefined ? payrollDetailData.valor_hora_extra_diurna : 0,
                horas_extras_nocturnas: payrollDetailData.horas_extras_nocturnas !== undefined ? payrollDetailData.horas_extras_nocturnas : 0,
                valor_hora_extra_nocturna: payrollDetailData.valor_hora_extra_nocturna !== undefined ? payrollDetailData.valor_hora_extra_nocturna : 0,
                bonificaciones: payrollDetailData.bonificaciones !== undefined ? payrollDetailData.bonificaciones : 0,
                comisiones: payrollDetailData.comisiones !== undefined ? payrollDetailData.comisiones : 0,
                recargo_dominical: payrollDetailData.recargo_dominical !== undefined ? payrollDetailData.recargo_dominical : 0,
                aporte_salud_empleado: payrollDetailData.aporte_salud_empleado !== undefined ? payrollDetailData.aporte_salud_empleado : 0,
                aporte_pension_empleado: payrollDetailData.aporte_pension_empleado !== undefined ? payrollDetailData.aporte_pension_empleado : 0,
                aporte_salud_empleador: payrollDetailData.aporte_salud_empleador !== undefined ? payrollDetailData.aporte_salud_empleador : 0,
                aporte_pension_empleador: payrollDetailData.aporte_pension_empleador !== undefined ? payrollDetailData.aporte_pension_empleador : 0,
                aporte_arl: payrollDetailData.aporte_arl !== undefined ? payrollDetailData.aporte_arl : 0,
                aporte_caja_compensacion: payrollDetailData.aporte_caja_compensacion !== undefined ? payrollDetailData.aporte_caja_compensacion : 0,
                aporte_icbf: payrollDetailData.aporte_icbf !== undefined ? payrollDetailData.aporte_icbf : 0,
                aporte_sena: payrollDetailData.aporte_sena !== undefined ? payrollDetailData.aporte_sena : 0,
                prestamos: payrollDetailData.prestamos !== undefined ? payrollDetailData.prestamos : 0,
                embargos: payrollDetailData.embargos !== undefined ? payrollDetailData.embargos : 0,
                otros_descuentos: payrollDetailData.otros_descuentos !== undefined ? payrollDetailData.otros_descuentos : 0,
                provision_prima: payrollDetailData.provision_prima !== undefined ? payrollDetailData.provision_prima : 0,
                provision_cesantias: payrollDetailData.provision_cesantias !== undefined ? payrollDetailData.provision_cesantias : 0,
                provision_intereses_cesantias: payrollDetailData.provision_intereses_cesantias !== undefined ? payrollDetailData.provision_intereses_cesantias : 0,
                provision_vacaciones: payrollDetailData.provision_vacaciones !== undefined ? payrollDetailData.provision_vacaciones : 0,
                total_provisiones: payrollDetailData.total_provisiones !== undefined ? payrollDetailData.total_provisiones : 0,
                total_ingresos,
                total_deducciones,
                neto_pagar,
                estado: status || 'Pendiente',
                metodo_pago: payrollDetailData.metodo_pago !== undefined ? payrollDetailData.metodo_pago : 'Transferencia',
                observaciones: payrollDetailData.observaciones !== undefined ? payrollDetailData.observaciones : ''
            };
            
            // Actualizar el detalle de nómina con todos los campos
            await payrollDetail.update(updateData);
            
            console.log('PayrollDetail actualizado correctamente:', {
                id: payrollDetail.id,
                data: updateData
            });
        } else {
            console.warn('No se encontró detalle de nómina para actualizar o no se proporcionaron datos de detalle');
        }

        // Obtener nómina actualizada con todos sus datos para la respuesta
        const updatedPayroll = await Payroll.findOne({ 
            where: { id: payroll.id },
            include: [
                {
                    model: Employee,
                    as: 'Employee'
                }
            ]
        });

        // Obtener el detalle actualizado de forma separada
        const updatedPayrollDetail = await PayrollDetail.findOne({
            where: { payroll_id: payroll.id }
        });

        // Responder con los datos completos
        res.json({ 
            message: "Nómina actualizada correctamente", 
            payroll: updatedPayroll,
            payrollDetail: updatedPayrollDetail 
        });
    } catch (error) {
        console.error("Error al actualizar la nómina:", error);
        res.status(500).json({ 
            message: "Error al actualizar la nómina", 
            error: error.message,
            stack: error.stack 
        });
    }
};

exports.deletePayroll = async (req, res) => {
    try {
        // Verificar que la nómina existe
        const payroll = await Payroll.findByPk(req.params.id);
        if (!payroll) return res.status(404).json({ message: "Nómina no encontrada" });

        // Eliminar primero los detalles de la nómina (registros en payroll_details)
        await PayrollDetail.destroy({
            where: { payroll_id: payroll.id }
        });

        // Luego eliminar la nómina principal
        await payroll.destroy();
        
        res.json({ message: "Nómina eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar la nómina:", error);
        res.status(500).json({ 
            message: "Error al eliminar la nómina", 
            error: error.message 
        });
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
            where: { payroll_id: payroll.id }
        });

        // Función auxiliar para formatear números
        const formatNumber = (value) => {
            const num = parseFloat(value) || 0;
            return num.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 2
            });
        };

        // Crear PDF
        const doc = new PDFDocument({ margin: 40 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Nomina_CRM_${payroll.id}.pdf`);
        doc.pipe(res);

        // Encabezado
        doc
            .fontSize(20)
            .fillColor('#2c3e50')
            .text('Nómina CRM', { align: 'center' })
            .moveDown(0.5)
            .fontSize(12)
            .fillColor('#7f8c8d')
            .text(`Fecha de Generación: ${new Date().toLocaleDateString()}`, { align: 'center' })
            .moveDown(1);

        // Información del empleado
        doc
            .fontSize(14)
            .fillColor('#34495e')
            .text('Información del Empleado', { underline: true })
            .moveDown(0.5)
            .fontSize(12)
            .text(`Nombre: ${payroll.Employee.full_name}`)
            .text(`Documento: ${payroll.Employee.id_number}`)
            .text(`Fecha de Pago: ${new Date(payroll.payment_date).toLocaleDateString()}`)
            .text(`Período: ${payrollDetail?.periodo || 'No especificado'}`)
            .moveDown(1);

        // Ingresos
        doc
            .fontSize(14)
            .fillColor('#34495e')
            .text('Ingresos', { underline: true })
            .moveDown(0.5)
            .fontSize(12)
            .fillColor('#2c3e50')
            .text(`Salario Base: ${formatNumber(payroll.salario_base)}`)
            .text(`Horas Extras: ${formatNumber(payrollDetail?.valor_hora_extra_diurna || 0)}`)
            .text(`Bonificaciones: ${formatNumber(payrollDetail?.bonificaciones || 0)}`)
            .text(`Comisiones: ${formatNumber(payrollDetail?.comisiones || 0)}`)
            .text(`Total Ingresos: ${formatNumber(payrollDetail?.total_ingresos || 0)}`)
            .moveDown(1);

        // Deducciones
        doc
            .fontSize(14)
            .fillColor('#34495e')
            .text('Deducciones', { underline: true })
            .moveDown(0.5)
            .fontSize(12)
            .fillColor('#e74c3c')
            .text(`Salud: ${formatNumber(payrollDetail?.deduccion_salud || 0)}`)
            .text(`Pensión: ${formatNumber(payrollDetail?.deduccion_pension || 0)}`)
            .text(`Préstamos: ${formatNumber(payrollDetail?.prestamos || 0)}`)
            .text(`Otros Descuentos: ${formatNumber(payrollDetail?.otros_descuentos || 0)}`)
            .text(`Total Deducciones: ${formatNumber(payrollDetail?.total_deducciones || 0)}`)
            .moveDown(1);

        // Neto a Pagar
        doc
            .fontSize(16)
            .fillColor('#27ae60')
            .text(`Neto a Pagar: ${formatNumber(payrollDetail?.neto_pagar || 0)}`, { underline: true })
            .moveDown(2);

        // Firmas
        doc
            .fontSize(12)
            .fillColor('#2c3e50')
            .text('_______________________', { align: 'left' })
            .text('Firma Empleador', { align: 'left' })
            .moveDown()
            .text('_______________________', { align: 'right' })
            .text('Firma Empleado', { align: 'right' });

        // Pie de página
        doc
            .moveDown(2)
            .fontSize(10)
            .fillColor('#7f8c8d')
            .text('Este documento fue generado automáticamente por el sistema Nómina CRM.', { align: 'center' });

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
