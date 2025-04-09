// Variables globales
let allPayrolls = [];
let allEmployees = [];
let currentFilters = {
    month: '',
    employee: '',
    status: ''
};

// Inicialización cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay un token de autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Inicializar los componentes de la página
    initializePage();
    
    // Configurar event listeners
    setupEventListeners();
});

// Función para inicializar la página
async function initializePage() {
    try {
        // Cargar datos del resumen de nómina para los cards
        await loadPayrollSummary();
        
        // Cargar lista de empleados para el selector de filtros y el formulario
        await loadEmployees();
        
        // Cargar la lista completa de nóminas
        await loadPayrolls();
        
        // Configurar los cálculos automáticos para el formulario
        setupFormCalculations();

    } catch (error) {
        console.error('Error al inicializar la página:', error);
        showToast('Error al cargar los datos de nómina', 'error');
    }
}

// Configurar event listeners para los elementos de la página
function setupEventListeners() {
    // Botón para crear nueva nómina
    document.getElementById('createPayrollButton').addEventListener('click', openCreatePayrollModal);
    
    // Botones del formulario de nómina
    document.getElementById('confirmDeleteBtn').addEventListener('click', deletePayroll);
    document.getElementById('confirmPaymentBtn').addEventListener('click', confirmPayrollPayment);
    
    // Botones para aplicar filtros
    document.querySelector('button[onclick="applyFilters()"]').onclick = applyFilters;
    
    // Botón para refrescar la tabla
    document.querySelector('button[onclick="refreshPayrollTable()"]').onclick = refreshPayrollTable;
    
    // Botón para exportar reporte
    document.querySelector('button[onclick="exportPayrollReport()"]').onclick = exportPayrollReport;
    
    // Botón para búsqueda
    document.querySelector('button[onclick="searchPayroll()"]').onclick = searchPayroll;
    
    // Sidebar toggler
    document.getElementById('sidebarCollapse')?.addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Configurar logout
    document.querySelector('button[onclick="logout()"]').onclick = logout;
}

// Función para cargar el resumen de nómina (datos para los cards)
async function loadPayrollSummary() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar el resumen de nómina');
        }

        const data = await response.json();
        
        // Actualizar los contadores
        document.getElementById('activePayrollsCount').textContent = data.activePayrolls || 0;
        document.getElementById('totalPaidAmount').textContent = formatCurrency(data.totalPaid || 0);
        document.getElementById('pendingPayrollsCount').textContent = data.pendingPayrolls || 0;
        document.getElementById('totalEmployeesCount').textContent = data.employeeCount || 0;

    } catch (error) {
        console.error('Error al cargar el resumen de nómina:', error);
        throw error;
    }
}

// Función para cargar la lista de empleados
async function loadEmployees() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/employees', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar la lista de empleados');
        }

        allEmployees = await response.json();
        
        // Llenar el selector de filtro de empleados
        const filterEmployeeSelect = document.getElementById('filterEmployee');
        filterEmployeeSelect.innerHTML = '<option value="">Todos</option>';
        
        // Llenar el selector de empleados en el formulario de nómina
        const employeeIdSelect = document.getElementById('employeeId');
        employeeIdSelect.innerHTML = '<option value="">Seleccione un empleado</option>';
        
        allEmployees.forEach(employee => {
            // Añadir al filtro
            const filterOption = document.createElement('option');
            filterOption.value = employee.id;
            filterOption.textContent = `${employee.full_name} (${employee.id_number})`;
            filterEmployeeSelect.appendChild(filterOption);
            
            // Añadir al formulario
            const formOption = document.createElement('option');
            formOption.value = employee.id;
            formOption.textContent = `${employee.full_name} (${employee.id_number})`;
            employeeIdSelect.appendChild(formOption);
        });

    } catch (error) {
        console.error('Error al cargar empleados:', error);
        throw error;
    }
}

// Función para cargar todas las nóminas
async function loadPayrolls() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/payrolls', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar las nóminas');
        }

        allPayrolls = await response.json();
        
        // Renderizar la tabla con todas las nóminas
        renderPayrollTable(allPayrolls);

    } catch (error) {
        console.error('Error al cargar nóminas:', error);
        throw error;
    }
}

// Función para renderizar la tabla de nóminas
function renderPayrollTable(payrolls) {
    const tableBody = document.getElementById('payrollTableBody');
    tableBody.innerHTML = '';
    
    if (payrolls.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="10" class="text-center">No hay nóminas disponibles</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    payrolls.forEach(payroll => {
        const row = document.createElement('tr');
        
        // Encontrar el empleado relacionado con esta nómina
        const employee = payroll.employees ? payroll.employees[0] : { full_name: 'No especificado', id_number: '-' };
        
        row.innerHTML = `
            <td>${payroll.id}</td>
            <td>${employee.id_number || '-'}</td>
            <td>${employee.full_name || 'No especificado'}</td>
            <td>${payroll.periodo || '-'}</td>
            <td>${formatCurrency(payroll.salario_base)}</td>
            <td>${formatCurrency(payroll.total_ingresos)}</td>
            <td>${formatCurrency(payroll.total_deducciones)}</td>
            <td>${formatCurrency(payroll.neto_pagar)}</td>
            <td>
                <span class="payroll-status ${payroll.status === 'Pagado' ? 'status-paid' : 'status-pending'}">
                    ${payroll.status || 'Pendiente'}
                </span>
            </td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-info" onclick="viewPayroll(${payroll.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="editPayroll(${payroll.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="openConfirmPaymentModal(${payroll.id})">
                    <i class="fas fa-dollar-sign"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${payroll.id})">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="generatePDF(${payroll.id})">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Función para aplicar filtros
function applyFilters() {
    // Obtener valores de los filtros
    const filterMonth = document.getElementById('filterMonth').value;
    const filterEmployee = document.getElementById('filterEmployee').value;
    const filterStatus = document.getElementById('filterStatus').value;
    
    // Guardar filtros actuales
    currentFilters = {
        month: filterMonth,
        employee: filterEmployee,
        status: filterStatus
    };
    
    // Filtrar las nóminas
    let filteredPayrolls = [...allPayrolls];
    
    // Filtro por mes
    if (filterMonth) {
        filteredPayrolls = filteredPayrolls.filter(payroll => 
            payroll.periodo && payroll.periodo.startsWith(filterMonth)
        );
    }
    
    // Filtro por empleado
    if (filterEmployee) {
        filteredPayrolls = filteredPayrolls.filter(payroll => 
            payroll.employee_id == filterEmployee
        );
    }
    
    // Filtro por estado
    if (filterStatus) {
        filteredPayrolls = filteredPayrolls.filter(payroll => 
            payroll.status === filterStatus
        );
    }
    
    // Renderizar la tabla con las nóminas filtradas
    renderPayrollTable(filteredPayrolls);
}

// Función para refrescar la tabla de nóminas
async function refreshPayrollTable() {
    try {
        // Mostrar un spinner o indicador de carga
        const tableBody = document.getElementById('payrollTableBody');
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
        
        // Recargar las nóminas
        await loadPayrolls();
        
        // Aplicar los filtros actuales
        applyFilters();
        
        // Mostrar mensaje de éxito
        showToast('Nóminas actualizadas correctamente');
        
    } catch (error) {
        console.error('Error al refrescar la tabla:', error);
        showToast('Error al actualizar las nóminas', 'error');
    }
}

// Función para buscar nóminas
function searchPayroll() {
    const searchTerm = document.getElementById('searchPayroll').value.trim().toLowerCase();
    
    if (!searchTerm) {
        // Si no hay término de búsqueda, mostrar todas las nóminas (aplicando filtros actuales)
        applyFilters();
        return;
    }
    
    // Filtrar las nóminas por el término de búsqueda
    const searchResults = allPayrolls.filter(payroll => {
        // Buscar en período
        if (payroll.periodo && payroll.periodo.toLowerCase().includes(searchTerm)) {
            return true;
        }
        
        // Buscar en empleado
        const employee = payroll.employees && payroll.employees[0];
        if (employee) {
            if (employee.full_name && employee.full_name.toLowerCase().includes(searchTerm)) {
                return true;
            }
            if (employee.id_number && employee.id_number.toLowerCase().includes(searchTerm)) {
                return true;
            }
        }
        
        // Buscar en ID
        if (payroll.id.toString() === searchTerm) {
            return true;
        }
        
        return false;
    });
    
    // Renderizar la tabla con los resultados de la búsqueda
    renderPayrollTable(searchResults);
}

// Función para abrir el modal para crear una nueva nómina
function openCreatePayrollModal() {
    // Limpiar el formulario
    document.getElementById('payrollForm').reset();
    document.getElementById('payrollId').value = '';
    document.getElementById('estadoPago').checked = false;
    
    // Establecer la fecha de pago al día actual
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('fechaPago').value = formattedDate;
    
    // Actualizar el título del modal
    document.getElementById('payrollModalLabel').textContent = 'Crear Nueva Nómina';
    
    // Mostrar el modal
    const payrollModal = new bootstrap.Modal(document.getElementById('payrollModal'));
    payrollModal.show();
}

// Función para configurar los cálculos automáticos del formulario
function setupFormCalculations() {
    // Cálculo del aporte a salud y pensión cuando cambia el salario base
    document.getElementById('salarioBase').addEventListener('input', function() {
        calculateDeductions();
        calculateTotals();
    });
    
    // Lista de campos que afectan el total de ingresos
    const incomeFields = [
        'salarioBase', 'auxilio_transporte', 'horasExtras', 'valorHorasExtras',
        'horas_extras_nocturnas', 'valor_hora_extra_nocturna', 'bonificaciones',
        'comisiones', 'recargo_dominical'
    ];
    
    // Lista de campos que afectan el total de deducciones
    const deductionFields = [
        'deduccionSalud', 'deduccionPension', 'prestamos', 'embargos', 'otrosDescuentos'
    ];
    
    // Lista de campos que afectan el total de provisiones
    const provisionFields = [
        'provision_prima', 'provision_cesantias', 'provision_intereses_cesantias', 'provision_vacaciones'
    ];
    
    // Configurar event listeners para todos los campos que afectan los totales
    [...incomeFields, ...deductionFields, ...provisionFields].forEach(fieldId => {
        document.getElementById(fieldId)?.addEventListener('input', calculateTotals);
    });
}

// Calcular deducciones de ley (salud y pensión)
function calculateDeductions() {
    const salarioBase = parseFloat(document.getElementById('salarioBase').value) || 0;
    
    // Calcular aportes a salud y pensión (4% y 4% respectivamente)
    const aportesSalud = Math.round(salarioBase * 0.04);
    const aportesPension = Math.round(salarioBase * 0.04);
    
    // Actualizar los campos en el formulario
    document.getElementById('deduccionSalud').value = aportesSalud;
    document.getElementById('deduccionPension').value = aportesPension;
    
    // Calcular aportes del empleador
    document.getElementById('aporte_salud_empleador').value = Math.round(salarioBase * 0.085);
    document.getElementById('aporte_pension_empleador').value = Math.round(salarioBase * 0.12);
    document.getElementById('aporte_arl').value = Math.round(salarioBase * 0.00522);
    document.getElementById('aporte_caja_compensacion').value = Math.round(salarioBase * 0.04);
    document.getElementById('aporte_icbf').value = Math.round(salarioBase * 0.03);
    document.getElementById('aporte_sena').value = Math.round(salarioBase * 0.02);
    
    // Calcular provisiones
    document.getElementById('provision_prima').value = Math.round(salarioBase * 0.0833);
    document.getElementById('provision_cesantias').value = Math.round(salarioBase * 0.0833);
    document.getElementById('provision_intereses_cesantias').value = Math.round(salarioBase * 0.01);
    document.getElementById('provision_vacaciones').value = Math.round(salarioBase * 0.0417);
}

// Calcular totales (ingresos, deducciones, neto a pagar)
function calculateTotals() {
    // 1. Calcular total de ingresos
    const salarioBase = parseFloat(document.getElementById('salarioBase').value) || 0;
    const auxilioTransporte = parseFloat(document.getElementById('auxilio_transporte').value) || 0;
    
    // Calcular horas extras diurnas
    const horasExtras = parseFloat(document.getElementById('horasExtras').value) || 0;
    const valorHoraExtra = parseFloat(document.getElementById('valorHorasExtras').value) || 0;
    const totalHorasExtras = horasExtras * valorHoraExtra;
    
    // Calcular horas extras nocturnas
    const horasNocturnas = parseFloat(document.getElementById('horas_extras_nocturnas').value) || 0;
    const valorHoraNocturna = parseFloat(document.getElementById('valor_hora_extra_nocturna').value) || 0;
    const totalHorasNocturnas = horasNocturnas * valorHoraNocturna;
    
    // Otros ingresos
    const bonificaciones = parseFloat(document.getElementById('bonificaciones').value) || 0;
    const comisiones = parseFloat(document.getElementById('comisiones').value) || 0;
    const recargoDominical = parseFloat(document.getElementById('recargo_dominical').value) || 0;
    
    // Sumar todos los ingresos
    const totalIngresos = salarioBase + auxilioTransporte + totalHorasExtras + 
                          totalHorasNocturnas + bonificaciones + comisiones + recargoDominical;
    
    // 2. Calcular total de deducciones
    const aporteSalud = parseFloat(document.getElementById('deduccionSalud').value) || 0;
    const aportePension = parseFloat(document.getElementById('deduccionPension').value) || 0;
    const prestamos = parseFloat(document.getElementById('prestamos').value) || 0;
    const embargos = parseFloat(document.getElementById('embargos').value) || 0;
    const otrosDescuentos = parseFloat(document.getElementById('otrosDescuentos').value) || 0;
    
    // Sumar todas las deducciones
    const totalDeducciones = aporteSalud + aportePension + prestamos + embargos + otrosDescuentos;
    
    // 3. Calcular total de provisiones
    const provisionPrima = parseFloat(document.getElementById('provision_prima').value) || 0;
    const provisionCesantias = parseFloat(document.getElementById('provision_cesantias').value) || 0;
    const provisionIntereses = parseFloat(document.getElementById('provision_intereses_cesantias').value) || 0;
    const provisionVacaciones = parseFloat(document.getElementById('provision_vacaciones').value) || 0;
    
    // Sumar todas las provisiones
    const totalProvisiones = provisionPrima + provisionCesantias + provisionIntereses + provisionVacaciones;
    
    // 4. Calcular neto a pagar
    const netoPagar = totalIngresos - totalDeducciones;
    
    // Actualizar los campos en el formulario
    document.getElementById('totalIngresos').value = totalIngresos;
    document.getElementById('totalDeducciones').value = totalDeducciones;
    document.getElementById('total_provisiones').value = totalProvisiones;
    document.getElementById('netoPagar').value = netoPagar;
}

// Función para validar y guardar la nómina
async function validateAndSavePayroll() {
    try {
        // Verificar que el formulario sea válido
        const form = document.getElementById('payrollForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Obtener ID de nómina (si existe, es una edición)
        const payrollId = document.getElementById('payrollId').value;
        const isEdit = !!payrollId;
        
        // Recopilar los datos del formulario
        const empleadoId = document.getElementById('employeeId').value;
        const periodo = document.getElementById('periodo').value;
        const tipoPago = document.getElementById('tipoPago').value;
        const metodoPago = document.getElementById('metodo_pago').value;
        const salarioBase = parseFloat(document.getElementById('salarioBase').value) || 0;
        const fechaPago = document.getElementById('fechaPago').value;
        const diasTrabajados = parseInt(document.getElementById('diasTrabajados').value) || 30;
        
        // Totales calculados
        const totalIngresos = parseFloat(document.getElementById('totalIngresos').value) || 0;
        const totalDeducciones = parseFloat(document.getElementById('totalDeducciones').value) || 0;
        const totalProvisiones = parseFloat(document.getElementById('total_provisiones').value) || 0;
        const netoPagar = parseFloat(document.getElementById('netoPagar').value) || 0;
        
        // Estado de la nómina
        const status = document.getElementById('estadoPago').checked ? 'Pagado' : 'Pendiente';
        
        // Construir objeto del detalle de nómina
        const payrollDetail = {
            tipo_pago: tipoPago,
            metodo_pago: metodoPago,
            dias_trabajados: diasTrabajados,
            dias_vacaciones: parseInt(document.getElementById('dias_vacaciones').value) || 0,
            dias_incapacidad: parseInt(document.getElementById('dias_incapacidad').value) || 0,
            
            // Ingresos
            auxilio_transporte: parseFloat(document.getElementById('auxilio_transporte').value) || 0,
            horas_extras_diurnas: parseInt(document.getElementById('horasExtras').value) || 0,
            valor_hora_extra_diurna: parseFloat(document.getElementById('valorHorasExtras').value) || 0,
            horas_extras_nocturnas: parseInt(document.getElementById('horas_extras_nocturnas').value) || 0,
            valor_hora_extra_nocturna: parseFloat(document.getElementById('valor_hora_extra_nocturna').value) || 0,
            bonificaciones: parseFloat(document.getElementById('bonificaciones').value) || 0,
            comisiones: parseFloat(document.getElementById('comisiones').value) || 0,
            recargo_dominical: parseFloat(document.getElementById('recargo_dominical').value) || 0,
            
            // Deducciones
            aporte_salud_empleado: parseFloat(document.getElementById('deduccionSalud').value) || 0,
            aporte_pension_empleado: parseFloat(document.getElementById('deduccionPension').value) || 0,
            aporte_salud_empleador: parseFloat(document.getElementById('aporte_salud_empleador').value) || 0,
            aporte_pension_empleador: parseFloat(document.getElementById('aporte_pension_empleador').value) || 0,
            aporte_arl: parseFloat(document.getElementById('aporte_arl').value) || 0,
            aporte_caja_compensacion: parseFloat(document.getElementById('aporte_caja_compensacion').value) || 0,
            aporte_icbf: parseFloat(document.getElementById('aporte_icbf').value) || 0,
            aporte_sena: parseFloat(document.getElementById('aporte_sena').value) || 0,
            prestamos: parseFloat(document.getElementById('prestamos').value) || 0,
            embargos: parseFloat(document.getElementById('embargos').value) || 0,
            otros_descuentos: parseFloat(document.getElementById('otrosDescuentos').value) || 0,
            
            // Provisiones
            provision_prima: parseFloat(document.getElementById('provision_prima').value) || 0,
            provision_cesantias: parseFloat(document.getElementById('provision_cesantias').value) || 0,
            provision_intereses_cesantias: parseFloat(document.getElementById('provision_intereses_cesantias').value) || 0,
            provision_vacaciones: parseFloat(document.getElementById('provision_vacaciones').value) || 0,
            total_provisiones: totalProvisiones,
            
            // Observaciones
            observaciones: document.getElementById('observaciones').value
        };
        
        // Construir objeto de nómina completo
        const payrollData = {
            employee_id: empleadoId,
            periodo: periodo,
            tipo_pago: tipoPago,
            salario_base: salarioBase,
            payment_date: fechaPago,
            dias_trabajados: diasTrabajados,
            total_ingresos: totalIngresos,
            total_deducciones: totalDeducciones,
            neto_pagar: netoPagar,
            status: status,
            PayrollDetail: payrollDetail
        };
        
        // Guardar la nómina (crear nueva o actualizar)
        const token = localStorage.getItem('token');
        let response;
        
        if (isEdit) {
            // Actualizar nómina existente
            response = await fetch(`/api/payrolls/${payrollId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payrollData)
            });
        } else {
            // Crear nueva nómina
            response = await fetch('/api/payrolls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payrollData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al guardar la nómina');
        }
        
        // Cerrar el modal
        const payrollModal = bootstrap.Modal.getInstance(document.getElementById('payrollModal'));
        payrollModal.hide();
        
        // Recargar las nóminas y mostrar mensaje de éxito
        await loadPayrolls();
        applyFilters();
        showToast(`Nómina ${isEdit ? 'actualizada' : 'creada'} correctamente`);
        
    } catch (error) {
        console.error('Error al guardar la nómina:', error);
        showToast(`Error al ${payrollId ? 'actualizar' : 'crear'} la nómina: ${error.message}`, 'error');
    }
}

// Función para editar una nómina existente
async function editPayroll(id) {
    try {
        // Mostrar indicador de carga
        showToast('Cargando datos de la nómina...', 'info');
        
        // Obtener los detalles de la nómina
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/payrolls/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener los detalles de la nómina');
        }
        
        const payroll = await response.json();
        
        // Llenar el formulario con los datos de la nómina
        document.getElementById('payrollId').value = payroll.id;
        document.getElementById('employeeId').value = payroll.employee_id;
        document.getElementById('periodo').value = payroll.periodo;
        document.getElementById('salarioBase').value = payroll.salario_base;
        document.getElementById('fechaPago').value = payroll.payment_date ? new Date(payroll.payment_date).toISOString().split('T')[0] : '';
        document.getElementById('estadoPago').checked = payroll.status === 'Pagado';
        
        // Si hay detalles de nómina
        if (payroll.PayrollDetail) {
            const detail = payroll.PayrollDetail;
            
            // Información básica
            document.getElementById('tipoPago').value = detail.tipo_pago || 'Mensual';
            document.getElementById('metodo_pago').value = detail.metodo_pago || 'Transferencia';
            document.getElementById('diasTrabajados').value = detail.dias_trabajados || 30;
            document.getElementById('dias_vacaciones').value = detail.dias_vacaciones || 0;
            document.getElementById('dias_incapacidad').value = detail.dias_incapacidad || 0;
            
            // Ingresos
            document.getElementById('auxilio_transporte').value = detail.auxilio_transporte || 0;
            document.getElementById('horasExtras').value = detail.horas_extras_diurnas || 0;
            document.getElementById('valorHorasExtras').value = detail.valor_hora_extra_diurna || 0;
            document.getElementById('horas_extras_nocturnas').value = detail.horas_extras_nocturnas || 0;
            document.getElementById('valor_hora_extra_nocturna').value = detail.valor_hora_extra_nocturna || 0;
            document.getElementById('bonificaciones').value = detail.bonificaciones || 0;
            document.getElementById('comisiones').value = detail.comisiones || 0;
            document.getElementById('recargo_dominical').value = detail.recargo_dominical || 0;
            
            // Deducciones
            document.getElementById('deduccionSalud').value = detail.aporte_salud_empleado || 0;
            document.getElementById('deduccionPension').value = detail.aporte_pension_empleado || 0;
            document.getElementById('aporte_salud_empleador').value = detail.aporte_salud_empleador || 0;
            document.getElementById('aporte_pension_empleador').value = detail.aporte_pension_empleador || 0;
            document.getElementById('aporte_arl').value = detail.aporte_arl || 0;
            document.getElementById('aporte_caja_compensacion').value = detail.aporte_caja_compensacion || 0;
            document.getElementById('aporte_icbf').value = detail.aporte_icbf || 0;
            document.getElementById('aporte_sena').value = detail.aporte_sena || 0;
            document.getElementById('prestamos').value = detail.prestamos || 0;
            document.getElementById('embargos').value = detail.embargos || 0;
            document.getElementById('otrosDescuentos').value = detail.otros_descuentos || 0;
            
            // Provisiones
            document.getElementById('provision_prima').value = detail.provision_prima || 0;
            document.getElementById('provision_cesantias').value = detail.provision_cesantias || 0;
            document.getElementById('provision_intereses_cesantias').value = detail.provision_intereses_cesantias || 0;
            document.getElementById('provision_vacaciones').value = detail.provision_vacaciones || 0;
            document.getElementById('observaciones').value = detail.observaciones || '';
            
            // Totales
            document.getElementById('totalIngresos').value = payroll.total_ingresos || 0;
            document.getElementById('totalDeducciones').value = payroll.total_deducciones || 0;
            document.getElementById('total_provisiones').value = detail.total_provisiones || 0;
            document.getElementById('netoPagar').value = payroll.neto_pagar || 0;
        }
        
        // Actualizar el título del modal
        document.getElementById('payrollModalLabel').textContent = `Editar Nómina #${payroll.id}`;
        
        // Mostrar el modal
        const payrollModal = new bootstrap.Modal(document.getElementById('payrollModal'));
        payrollModal.show();
        
    } catch (error) {
        console.error('Error al cargar los detalles de la nómina:', error);
        showToast('Error al cargar los detalles de la nómina', 'error');
    }
}

// Función para abrir el modal de confirmación de eliminación
function openDeleteModal(id) {
    document.getElementById('deletePayrollId').value = id;
    const deleteModal = new bootstrap.Modal(document.getElementById('deletePayrollModal'));
    deleteModal.show();
}

// Función para eliminar una nómina
async function deletePayroll() {
    try {
        const payrollId = document.getElementById('deletePayrollId').value;
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/payrolls/${payrollId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar la nómina');
        }
        
        // Cerrar el modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deletePayrollModal'));
        deleteModal.hide();
        
        // Recargar las nóminas y mostrar mensaje de éxito
        await loadPayrolls();
        applyFilters();
        showToast('Nómina eliminada correctamente');
        
    } catch (error) {
        console.error('Error al eliminar la nómina:', error);
        showToast('Error al eliminar la nómina', 'error');
    }
}

// Función para abrir el modal de confirmación de pago
async function openConfirmPaymentModal(id) {
    try {
        // Obtener los detalles de la nómina
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/payrolls/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener los detalles de la nómina');
        }
        
        const payroll = await response.json();
        
        // Verificar si la nómina ya está pagada
        if (payroll.status === 'Pagado') {
            showToast('Esta nómina ya se encuentra pagada', 'warning');
            return;
        }
        
        // Obtener el empleado relacionado con esta nómina
        const employee = payroll.Employee || { full_name: 'No especificado', id_number: '-' };
        
        // Llenar los campos de previsualización
        document.getElementById('previewEmployeeName').textContent = employee.full_name;
        document.getElementById('previewEmployeeDocument').textContent = employee.id_number;
        document.getElementById('previewSalarioBase').textContent = formatCurrency(payroll.salario_base);
        document.getElementById('previewPeriodo').textContent = payroll.periodo;
        document.getElementById('previewTipoPago').textContent = payroll.PayrollDetail?.tipo_pago || 'Mensual';
        document.getElementById('previewMetodoPago').textContent = payroll.PayrollDetail?.metodo_pago || 'Transferencia';
        document.getElementById('previewTotalIngresos').textContent = formatCurrency(payroll.total_ingresos);
        document.getElementById('previewTotalDeducciones').textContent = formatCurrency(payroll.total_deducciones);
        document.getElementById('previewNetoPagar').textContent = formatCurrency(payroll.neto_pagar);
        
        // Establecer la fecha de pago por defecto
        const today = new Date();
        document.getElementById('fechaPagoConfirmacion').value = today.toISOString().split('T')[0];
        
        // Guardar el ID de la nómina
        document.getElementById('confirmPayrollId').value = payroll.id;
        
        // Mostrar el modal
        const confirmModal = new bootstrap.Modal(document.getElementById('confirmPaymentModal'));
        confirmModal.show();
        
    } catch (error) {
        console.error('Error al preparar la confirmación de pago:', error);
        showToast('Error al preparar la confirmación de pago', 'error');
    }
}

// Función para confirmar el pago de una nómina
async function confirmPayrollPayment() {
    try {
        const payrollId = document.getElementById('confirmPayrollId').value;
        const fechaPago = document.getElementById('fechaPagoConfirmacion').value;
        
        const token = localStorage.getItem('token');
        
        // Primero obtener los datos actuales de la nómina
        const getResponse = await fetch(`/api/payrolls/${payrollId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!getResponse.ok) {
            throw new Error('Error al obtener los datos de la nómina');
        }
        
        const payroll = await getResponse.json();
        
        // Actualizar el estado y la fecha de pago
        payroll.status = 'Pagado';
        payroll.payment_date = fechaPago;
        
        // Si hay detalle de nómina, actualizar también su estado
        if (payroll.PayrollDetail) {
            payroll.PayrollDetail.estado = 'Pagado';
            payroll.PayrollDetail.fecha_pago = fechaPago;
        }
        
        // Enviar la actualización
        const updateResponse = await fetch(`/api/payrolls/${payrollId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payroll)
        });
        
        if (!updateResponse.ok) {
            throw new Error('Error al actualizar el estado de la nómina');
        }
        
        // Cerrar el modal
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById('confirmPaymentModal'));
        confirmModal.hide();
        
        // Recargar las nóminas y mostrar mensaje de éxito
        await loadPayrollSummary(); // Actualizar los contadores
        await loadPayrolls();
        applyFilters();
        showToast('Nómina pagada correctamente');
        
    } catch (error) {
        console.error('Error al confirmar el pago de la nómina:', error);
        showToast('Error al confirmar el pago de la nómina', 'error');
    }
}

// Función para ver los detalles de una nómina
async function viewPayroll(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/payrolls/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener los detalles de la nómina');
        }
        
        const payroll = await response.json();
        const employee = payroll.Employee || { full_name: 'No especificado', id_number: '-' };
        const payrollDetail = payroll.PayrollDetail || {};
        
        // Construir el HTML para mostrar los detalles
        let detailsHTML = `
            <div class="payroll-details">
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información General</h5>
                            <span class="badge ${payroll.status === 'Pagado' ? 'bg-success' : 'bg-warning text-dark'} fs-6">
                                ${payroll.status}
                            </span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>ID de Nómina:</strong> ${payroll.id}</p>
                                <p><strong>Empleado:</strong> ${employee.full_name}</p>
                                <p><strong>Documento:</strong> ${employee.id_number}</p>
                                <p><strong>Período:</strong> ${payroll.periodo}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Tipo de Pago:</strong> ${payrollDetail.tipo_pago || 'No especificado'}</p>
                                <p><strong>Método de Pago:</strong> ${payrollDetail.metodo_pago || 'No especificado'}</p>
                                <p><strong>Fecha de Pago:</strong> ${payroll.payment_date ? new Date(payroll.payment_date).toLocaleDateString() : 'No especificado'}</p>
                                <p><strong>Días Trabajados:</strong> ${payrollDetail.dias_trabajados || 30}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm mb-4">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Ingresos</h5>
                            </div>
                            <div class="card-body">
                                <table class="table">
                                    <tbody>
                                        <tr>
                                            <td>Salario Base</td>
                                            <td class="text-end">${formatCurrency(payroll.salario_base)}</td>
                                        </tr>
                                        ${payrollDetail.auxilio_transporte ? `
                                        <tr>
                                            <td>Auxilio de Transporte</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.auxilio_transporte)}</td>
                                        </tr>
                                        ` : ''}
                                        ${(payrollDetail.horas_extras_diurnas && payrollDetail.valor_hora_extra_diurna) ? `
                                        <tr>
                                            <td>Horas Extras Diurnas (${payrollDetail.horas_extras_diurnas})</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.horas_extras_diurnas * payrollDetail.valor_hora_extra_diurna)}</td>
                                        </tr>
                                        ` : ''}
                                        ${(payrollDetail.horas_extras_nocturnas && payrollDetail.valor_hora_extra_nocturna) ? `
                                        <tr>
                                            <td>Horas Extras Nocturnas (${payrollDetail.horas_extras_nocturnas})</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.horas_extras_nocturnas * payrollDetail.valor_hora_extra_nocturna)}</td>
                                        </tr>
                                        ` : ''}
                                        ${payrollDetail.bonificaciones ? `
                                        <tr>
                                            <td>Bonificaciones</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.bonificaciones)}</td>
                                        </tr>
                                        ` : ''}
                                        ${payrollDetail.comisiones ? `
                                        <tr>
                                            <td>Comisiones</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.comisiones)}</td>
                                        </tr>
                                        ` : ''}
                                        ${payrollDetail.recargo_dominical ? `
                                        <tr>
                                            <td>Recargo Dominical</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.recargo_dominical)}</td>
                                        </tr>
                                        ` : ''}
                                        <tr class="table-active">
                                            <th>Total Ingresos</th>
                                            <th class="text-end">${formatCurrency(payroll.total_ingresos)}</th>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm mb-4">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Deducciones</h5>
                            </div>
                            <div class="card-body">
                                <table class="table">
                                    <tbody>
                                        ${payrollDetail.aporte_salud_empleado ? `
                                        <tr>
                                            <td>Aporte Salud Empleado</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.aporte_salud_empleado)}</td>
                                        </tr>
                                        ` : ''}
                                        ${payrollDetail.aporte_pension_empleado ? `
                                        <tr>
                                            <td>Aporte Pensión Empleado</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.aporte_pension_empleado)}</td>
                                        </tr>
                                        ` : ''}
                                        ${payrollDetail.prestamos ? `
                                        <tr>
                                            <td>Préstamos</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.prestamos)}</td>
                                        </tr>
                                        ` : ''}
                                        ${payrollDetail.embargos ? `
                                        <tr>
                                            <td>Embargos</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.embargos)}</td>
                                        </tr>
                                        ` : ''}
                                        ${payrollDetail.otros_descuentos ? `
                                        <tr>
                                            <td>Otros Descuentos</td>
                                            <td class="text-end">${formatCurrency(payrollDetail.otros_descuentos)}</td>
                                        </tr>
                                        ` : ''}
                                        <tr class="table-active">
                                            <th>Total Deducciones</th>
                                            <th class="text-end">${formatCurrency(payroll.total_deducciones)}</th>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Neto a Pagar</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-12">
                                <h2 class="text-center text-success">${formatCurrency(payroll.neto_pagar)}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${payrollDetail.observaciones ? `
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Observaciones</h5>
                    </div>
                    <div class="card-body">
                        <p>${payrollDetail.observaciones}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Mostrar los detalles en el modal
        document.getElementById('payrollDetailsContent').innerHTML = detailsHTML;
        
        // Mostrar el modal
        const viewModal = new bootstrap.Modal(document.getElementById('viewPayrollModal'));
        viewModal.show();
        
    } catch (error) {
        console.error('Error al cargar los detalles de la nómina:', error);
        showToast('Error al cargar los detalles de la nómina', 'error');
    }
}

// Función para generar PDF de una nómina
async function generatePDF(id) {
    try {
        const token = localStorage.getItem('token');
        
        // Mostrar indicador de carga
        showToast('Generando PDF...', 'info');
        
        // Hacer la solicitud para generar el PDF
        const response = await fetch(`/api/payrolls/${id}/pdf`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al generar el PDF');
        }
        
        // Convertir la respuesta a blob
        const blob = await response.blob();
        
        // Crear un enlace para descargar el PDF
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nomina_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('PDF generado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al generar el PDF:', error);
        showToast('Error al generar el PDF', 'error');
    }
}

// Función para exportar reporte de nóminas
async function exportPayrollReport() {
    try {
        const token = localStorage.getItem('token');
        
        // Aplicar los filtros actuales para la exportación
        let url = '/api/payrolls/export';
        const queryParams = [];
        
        if (currentFilters.month) {
            queryParams.push(`month=${currentFilters.month}`);
        }
        
        if (currentFilters.employee) {
            queryParams.push(`employee=${currentFilters.employee}`);
        }
        
        if (currentFilters.status) {
            queryParams.push(`status=${currentFilters.status}`);
        }
        
        if (queryParams.length > 0) {
            url = `${url}?${queryParams.join('&')}`;
        }
        
        // Mostrar indicador de carga
        showToast('Generando reporte...', 'info');
        
        // Hacer la solicitud para generar el reporte
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al generar el reporte');
        }
        
        // Convertir la respuesta a blob
        const blob = await response.blob();
        
        // Crear un enlace para descargar el archivo
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `reporte_nomina_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        
        showToast('Reporte exportado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al exportar el reporte:', error);
        showToast('Error al exportar el reporte', 'error');
    }
}

// Función para imprimir los detalles de una nómina
function printPayrollDetails() {
    const content = document.getElementById('payrollDetailsContent').innerHTML;
    
    // Crear un nuevo documento para la impresión
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Detalles de Nómina</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
            <style>
                body {
                    padding: 20px;
                    font-family: Arial, sans-serif;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 12px;
                    color: #777;
                }
                @media print {
                    @page {
                        margin: 1cm;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>GESCOOP</h1>
                <h3>Detalle de Nómina</h3>
                <p>Fecha de impresión: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>Este documento es generado automáticamente por el sistema GESCOOP.</p>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Función para formatear valores monetarios
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Función para mostrar notificaciones toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastBody = toast.querySelector('.toast-body');
    
    // Configurar el tipo de toast
    toast.className = toast.className.replace(/bg-\w+/g, '');
    toast.classList.add(`bg-${type === 'error' ? 'danger' : type}`);
    
    // Establecer el mensaje
    toastBody.textContent = message;
    
    // Crear una instancia de Toast y mostrarla
    const toastInstance = new bootstrap.Toast(toast, { delay: 3000 });
    toastInstance.show();
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}