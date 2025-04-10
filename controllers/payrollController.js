const Payroll = require('../models/Payroll');
const PayrollDetail = require('../models/PayrollDetail');
const Employee = require('../models/Employee');
const { Op } = require('sequelize');
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

        // En este punto, forzamos la obtención de la nómina y el detalle con JSON.parse(JSON.stringify())
        // Esto nos asegura que tenemos objetos planos de JavaScript sin métodos de Sequelize
        
        // Obtenemos la nómina actualizada
        const updatedPayrollRaw = await Payroll.findByPk(req.params.id);
        const updatedPayroll = JSON.parse(JSON.stringify(updatedPayrollRaw));
        
        // Obtenemos el detalle actualizado
        let updatedPayrollDetail = null;
        const updatedDetailRaw = await PayrollDetail.findOne({
            where: { payroll_id: req.params.id }
        });
        
        if (updatedDetailRaw) {
            updatedPayrollDetail = JSON.parse(JSON.stringify(updatedDetailRaw));
        }
        
        // Construimos manualmente la respuesta para asegurar la estructura correcta
        return res.json({
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
        // Obtener la nómina con los datos del empleado
        const payroll = await Payroll.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: Employee,
                    as: 'Employee',
                    required: true,
                    attributes: ['full_name', 'id_number', 'position', 'department', 'hire_date']
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

        if (!payrollDetail) {
            return res.status(404).json({ message: "Detalle de nómina no encontrado" });
        }

        // Función para formatear valores monetarios
        const formatCurrency = (value) => {
            const num = parseFloat(value) || 0;
            return num.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        };

        // Crear nuevo documento PDF
        const doc = new PDFDocument({
            size: 'LETTER',
            margin: 30,
            info: {
                Title: `Desprendible de Nómina - ${payroll.Employee.full_name}`,
                Author: 'Sistema de Nómina CRM'
            }
        });

        // Configuración de respuesta HTTP
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Nomina_${payroll.Employee.id_number}_${payrollDetail.periodo}.pdf`);
        doc.pipe(res);

        // Colores del tema
        const colors = {
            primary: '#003366',     // Azul oscuro para títulos principales
            secondary: '#336699',   // Azul medio para subtítulos
            accent: '#6699CC',      // Azul claro para bordes y fondos
            text: '#333333',        // Gris oscuro para texto normal
            lightText: '#666666',   // Gris medio para texto secundario
            highlight: '#990000',   // Rojo oscuro para destacados (total a pagar)
            table: {
                header: '#E6E6E6',  // Gris claro para encabezados de tabla
                odd: '#FFFFFF',     // Blanco para filas impares
                even: '#F5F5F5'     // Gris muy claro para filas pares
            }
        };

        // Función para crear encabezado con logo (simulado con texto estilizado)
        const addHeader = () => {
            // Rectángulo de fondo para el encabezado
            doc.rect(30, 30, doc.page.width - 60, 80)
               .fillAndStroke(colors.primary, colors.primary);
            
            // Nombre de la empresa (en vez de logo)
            doc.fontSize(24)
               .fillColor('#FFFFFF')
               .font('Helvetica-Bold')
               .text('EMPRESA CRM S.A.S', 50, 45);
            
            // Información de la empresa
            doc.fontSize(10)
               .fillColor('#FFFFFF')
               .font('Helvetica')
               .text('NIT: 901.123.456-7', 50, 75)
               .text('Calle Principal #123, Bogotá D.C.', 50, 90)
               .text('Tel: (601) 123-4567', 50, 105);
            
            // Título del documento
            doc.fontSize(16)
               .fillColor('#FFFFFF')
               .font('Helvetica-Bold')
               .text('DESPRENDIBLE DE PAGO', doc.page.width - 230, 60, {
                   width: 180,
                   align: 'right'
               });

            // Periodo de la nómina
            doc.fontSize(12)
               .fillColor('#FFFFFF')
               .font('Helvetica')
               .text(`Periodo: ${payrollDetail.periodo}`, doc.page.width - 230, 85, {
                   width: 180,
                   align: 'right'
               });
        };

        // Función para agregar información del empleado
        const addEmployeeInfo = () => {
            const startY = 130;
            
            // Rectángulo de fondo para información del empleado
            doc.rect(30, startY, doc.page.width - 60, 100)
               .fillAndStroke('#F5F9FC', colors.accent);
            
            // Título de la sección
            doc.fontSize(12)
               .fillColor(colors.primary)
               .font('Helvetica-Bold')
               .text('INFORMACIÓN DEL EMPLEADO', 40, startY + 10);
            
            doc.fontSize(10)
               .fillColor(colors.text)
               .font('Helvetica');
            
            // Primera columna
            doc.text(`Nombre: ${payroll.Employee.full_name}`, 40, startY + 30)
               .text(`Documento: ${payroll.Employee.id_number}`, 40, startY + 45)
               .text(`Cargo: ${payroll.Employee.position || 'No especificado'}`, 40, startY + 60)
               .text(`Departamento: ${payroll.Employee.department || 'No especificado'}`, 40, startY + 75);
            
            // Segunda columna
            doc.text(`Salario Base: ${formatCurrency(payroll.salario_base)}`, 300, startY + 30)
               .text(`Fecha de Ingreso: ${payroll.Employee.hire_date ? new Date(payroll.Employee.hire_date).toLocaleDateString() : 'No especificada'}`, 300, startY + 45)
               .text(`Días Trabajados: ${payrollDetail.dias_trabajados || 30}`, 300, startY + 60)
               .text(`Fecha de Pago: ${new Date(payroll.payment_date).toLocaleDateString()}`, 300, startY + 75);
        };

        // Función para crear tabla de conceptos
        const createTableSection = (title, items, startY) => {
            // Título de la sección
            doc.fontSize(12)
               .fillColor(colors.primary)
               .font('Helvetica-Bold')
               .text(title, 40, startY);
            
            // Variables para la tabla
            const tableTop = startY + 20;
            const tableWidth = doc.page.width - 80;
            const colWidth1 = tableWidth * 0.7;  // 70% para descripción
            const colWidth2 = tableWidth * 0.3;  // 30% para valor
            
            // Encabezado de la tabla
            doc.rect(40, tableTop, tableWidth, 20)
               .fill(colors.table.header);
            
            doc.fontSize(10)
               .fillColor(colors.primary)
               .font('Helvetica-Bold')
               .text('CONCEPTO', 50, tableTop + 6)
               .text('VALOR', 40 + colWidth1 + 5, tableTop + 6, { width: colWidth2, align: 'right' });
            
            // Filas de datos
            let currentY = tableTop + 20;
            let rowIndex = 0;
            
            items.forEach(item => {
                // Fila alternada
                if (item.value) {
                    // Color de fondo para filas alternadas
                    const fillColor = rowIndex % 2 === 0 ? colors.table.odd : colors.table.even;
                    doc.rect(40, currentY, tableWidth, 20).fill(fillColor);
                    
                    // Contenido de la fila
                    doc.fontSize(10)
                       .fillColor(colors.text)
                       .font('Helvetica')
                       .text(item.label, 50, currentY + 6)
                       .font(item.highlight ? 'Helvetica-Bold' : 'Helvetica')
                       .fillColor(item.highlight ? colors.highlight : colors.text)
                       .text(formatCurrency(item.value), 40 + colWidth1 + 5, currentY + 6, { 
                           width: colWidth2,
                           align: 'right'
                       });
                    
                    currentY += 20;
                    rowIndex++;
                }
            });
            
            // Agregar línea al final de la tabla
            doc.moveTo(40, currentY)
               .lineTo(40 + tableWidth, currentY)
               .stroke(colors.accent);
            
            // Retornar la posición Y después de la tabla
            return currentY + 10;
        };

        // Función para crear pie de página
        const addFooter = () => {
            const footerTop = doc.page.height - 70;
            
            // Línea divisoria
            doc.moveTo(30, footerTop)
               .lineTo(doc.page.width - 30, footerTop)
               .stroke(colors.accent);
            
            // Texto del pie de página
            doc.fontSize(8)
               .fillColor(colors.lightText)
               .font('Helvetica')
               .text('Este documento fue generado electrónicamente por el sistema de nómina y no requiere firma.',
                     30, footerTop + 10, { align: 'center', width: doc.page.width - 60 })
               .text('Si tiene alguna duda sobre su liquidación, por favor diríjase al departamento de recursos humanos.',
                     30, footerTop + 25, { align: 'center', width: doc.page.width - 60 });
            
            // Fecha y hora de generación del documento
            doc.fontSize(8)
               .fillColor(colors.lightText)
               .text(`Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`,
                     30, footerTop + 40, { align: 'center', width: doc.page.width - 60 });
        };

        // Generar el PDF
        addHeader();
        addEmployeeInfo();

        // Crear la sección de ingresos
        let currentY = 250;
        const ingresos = [
            { label: 'Salario Base', value: payrollDetail.salario_base },
            { label: 'Auxilio de Transporte', value: payrollDetail.auxilio_transporte },
            { label: 'Horas Extras Diurnas', value: payrollDetail.horas_extras_diurnas > 0 ? 
                (payrollDetail.horas_extras_diurnas * payrollDetail.valor_hora_extra_diurna) : 0 },
            { label: 'Horas Extras Nocturnas', value: payrollDetail.horas_extras_nocturnas > 0 ?
                (payrollDetail.horas_extras_nocturnas * payrollDetail.valor_hora_extra_nocturna) : 0 },
            { label: 'Bonificaciones', value: payrollDetail.bonificaciones },
            { label: 'Comisiones', value: payrollDetail.comisiones },
            { label: 'Recargo Dominical', value: payrollDetail.recargo_dominical },
            { label: 'TOTAL INGRESOS', value: payrollDetail.total_ingresos, highlight: true }
        ];
        currentY = createTableSection('DEVENGADOS', ingresos, currentY);

        // Asegurar que hay suficiente espacio para la siguiente sección, de lo contrario, nueva página
        if (currentY + 150 > doc.page.height - 70) {
            doc.addPage();
            currentY = 40;
        }

        // Crear la sección de deducciones
        currentY += 20;
        const deducciones = [
            { label: 'Aporte a Salud', value: payrollDetail.aporte_salud_empleado },
            { label: 'Aporte a Pensión', value: payrollDetail.aporte_pension_empleado },
            { label: 'Préstamos', value: payrollDetail.prestamos },
            { label: 'Embargos', value: payrollDetail.embargos },
            { label: 'Otros Descuentos', value: payrollDetail.otros_descuentos },
            { label: 'TOTAL DEDUCCIONES', value: payrollDetail.total_deducciones, highlight: true }
        ];
        currentY = createTableSection('DEDUCCIONES', deducciones, currentY);

        // Sección total a pagar
        if (currentY + 100 > doc.page.height - 70) {
            doc.addPage();
            currentY = 40;
        } else {
            currentY += 20;
        }

        doc.rect(40, currentY, doc.page.width - 80, 50)
           .fillAndStroke('#F5F9FC', colors.accent);

        doc.fontSize(14)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('NETO A PAGAR:', 60, currentY + 18);

        doc.fontSize(14)
           .fillColor(colors.highlight)
           .font('Helvetica-Bold')
           .text(formatCurrency(payrollDetail.neto_pagar), 300, currentY + 18, {
                width: doc.page.width - 380,
                align: 'right'
           });

        // Espacio para firmas si hay espacio suficiente
        if (currentY + 150 < doc.page.height - 70) {
            currentY += 80;
            
            doc.moveTo(60, currentY)
               .lineTo(250, currentY)
               .stroke();
            
            doc.moveTo(340, currentY)
               .lineTo(530, currentY)
               .stroke();
            
            doc.fontSize(10)
               .fillColor(colors.text)
               .font('Helvetica')
               .text('FIRMA EMPLEADOR', 60, currentY + 5, { width: 190, align: 'center' })
               .text('FIRMA EMPLEADO', 340, currentY + 5, { width: 190, align: 'center' });
        }

        addFooter();
        doc.end();
    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).json({ 
            message: "Error al generar PDF", 
            error: error.message,
            stack: error.stack 
        });
    }
};

// Nueva función para marcar una nómina como pagada
exports.markPayrollAsPaid = async (req, res) => {
    try {
        // Verificar que la nómina existe
        const payroll = await Payroll.findByPk(req.params.id);
        if (!payroll) return res.status(404).json({ message: "Nómina no encontrada" });

        // Verificar si ya está marcada como pagada
        if (payroll.status === 'Pagado') {
            return res.status(400).json({ 
                message: "Esta nómina ya está marcada como pagada" 
            });
        }

        // Obtener la fecha de pago del cuerpo de la solicitud o usar la fecha actual
        const payment_date = req.body.payment_date || new Date().toISOString();

        // Actualizar la nómina principal
        await payroll.update({
            status: 'Pagado',
            payment_date
        });

        // Buscar el detalle de la nómina
        const payrollDetail = await PayrollDetail.findOne({
            where: { payroll_id: payroll.id }
        });

        // Si existe el detalle, actualizarlo también
        if (payrollDetail) {
            await payrollDetail.update({
                estado: 'Pagado',
                fecha_pago: payment_date
            });
        }

        // Obtener la nómina actualizada con su detalle y empleado para la respuesta
        const updatedPayroll = await Payroll.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: Employee,
                    as: 'Employee',
                    attributes: ['id', 'full_name', 'id_number']
                },
                {
                    model: PayrollDetail,
                    as: 'PayrollDetail',
                    required: false
                }
            ]
        });

        res.json({
            message: "Nómina marcada como pagada correctamente",
            payroll: updatedPayroll
        });
    } catch (error) {
        console.error("Error al marcar la nómina como pagada:", error);
        res.status(500).json({ 
            message: "Error al marcar la nómina como pagada", 
            error: error.message 
        });
    }
};

// Obtener resumen de nóminas para el dashboard
exports.getPayrollSummary = async (req, res) => {
    try {
        const { sequelize } = require('../config/database');
        
        // Obtener total pagado en nóminas
        const totalPagadoResult = await Payroll.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('neto_pagar')), 'totalPagado']
            ],
            where: {
                status: 'Pagado'
            }
        });
        
        // Obtener total pendiente en nóminas
        const totalPendienteResult = await Payroll.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('neto_pagar')), 'totalPendiente']
            ],
            where: {
                status: 'Pendiente'
            }
        });
        
        // Obtener cantidad de empleados con nómina activa
        const empleadosActivosCount = await Payroll.count({
            distinct: true,
            col: 'employee_id',
            where: {
                status: {
                    [Op.in]: ['Pagado', 'Pendiente']
                }
            }
        });
        
        // Calcular monto promedio de nómina por empleado
        let promedioNomina = 0;
        if (empleadosActivosCount > 0) {
            const totalNomina = parseFloat(totalPagadoResult.get('totalPagado') || 0) + 
                              parseFloat(totalPendienteResult.get('totalPendiente') || 0);
            promedioNomina = totalNomina / empleadosActivosCount;
        }
        
        // Armar respuesta
        const totalPagado = parseFloat(totalPagadoResult.get('totalPagado')) || 0;
        const totalPendiente = parseFloat(totalPendienteResult.get('totalPendiente')) || 0;
        
        res.json({
            totalPagado,
            totalPendiente,
            totalNomina: totalPagado + totalPendiente,
            empleadosActivos: empleadosActivosCount,
            promedioNomina
        });
    } catch (error) {
        console.error("Error al obtener resumen de nóminas:", error);
        res.status(500).json({ 
            message: "Error al obtener resumen de nóminas", 
            error: error.message 
        });
    }
};
