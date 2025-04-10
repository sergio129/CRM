document.addEventListener("DOMContentLoaded", () => {
    // Verificar si hay un token de autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Inicializar la página
    initializePayrollPage();
    
    // Configurar event listeners
    setupEventListeners();
});

// Función para inicializar la página de nóminas
async function initializePayrollPage() {
    try {
        // Cargar datos del resumen para los cards
        await loadPayrollSummary();
        
        // Cargar empleados para el filtro y el formulario
        await loadEmployeesForFilter();
        
        // Cargar la lista de nóminas
        await loadPayrolls();
        
        // Configurar los cálculos automáticos
        setupFormCalculations();
    } catch (error) {
        console.error("Error al inicializar la página:", error);
        showToast("Error al inicializar la página: " + error.message, "danger");
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Agregar el event listener para el botón de crear nómina
    document.getElementById("createPayrollButton").addEventListener("click", openCreatePayrollModal);
    
    // Agregar el event listener para cuando se selecciona un empleado
    document.getElementById("employeeId").addEventListener("change", updateSalary);
    
    // Agregar event listener para el cambio en tipo de pago
    document.getElementById("tipoPago").addEventListener("change", calculateTotals);
    
    // Agregar event listener para el cambio en salario base
    document.getElementById("salarioBase").addEventListener("input", calculateTotals);

    // Agregar manejo del sidebar
    document.getElementById("sidebarCollapse").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("active");
        document.getElementById("content").classList.toggle("active");
    });

    // Agregar búsqueda en tiempo real
    document.getElementById("searchPayroll").addEventListener("input", function(e) {
        if (this.value === "") {
            loadPayrolls(); // Cargar todas las nóminas si el campo está vacío
        }
    });

    // Configurar botón de búsqueda
    document.querySelector('button[onclick="searchPayroll()"]').onclick = searchPayroll;
    
    // Configurar botón de aplicar filtros
    document.querySelector('button[onclick="applyFilters()"]').onclick = applyFilters;
    
    // Configurar botón de actualizar tabla
    document.querySelector('button[onclick="refreshPayrollTable()"]').onclick = refreshPayrollTable;
    
    // Agregar event listener para el botón de confirmación de eliminación
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeletePayroll);
    
    // Agregar event listener para exportar reporte
    document.querySelector('button[onclick="exportPayrollReport()"]').onclick = exportPayrollReport;
}

// Función para cargar el resumen de nóminas (actualizar contadores)
async function loadPayrollSummary() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/payrolls/summary', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar el resumen de nómina');
        }

        const data = await response.json();
        
        // Actualizar los contadores
        document.getElementById('activePayrollsCount').textContent = data.empleadosActivos || 0;
        document.getElementById('totalPaidAmount').textContent = formatMoney(data.totalPagado || 0);
        document.getElementById('pendingPayrollsCount').textContent = data.totalPendiente ? 
            Math.round(data.totalPendiente / (data.promedioNomina || 1)) : 0;
        document.getElementById('totalEmployeesCount').textContent = data.empleadosActivos || 0;

        console.log("Contadores actualizados con datos:", data);

    } catch (error) {
        console.error('Error al cargar el resumen de nómina:', error);
        throw error;
    }
}

// Función para cargar empleados específicamente para el filtro
async function loadEmployeesForFilter() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token no encontrado');
        }

        // Mostrar mensaje de carga
        const filterEmployeeSelect = document.getElementById('filterEmployee');
        if (!filterEmployeeSelect) {
            throw new Error('Elemento filterEmployee no encontrado');
        }
        
        // Indicador visual de carga
        filterEmployeeSelect.innerHTML = '<option value="">Cargando empleados...</option>';

        console.log('Solicitando empleados al servidor...');
        const response = await fetch('/api/employees', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error en la respuesta: ${response.status} - ${errorData.message || 'Error desconocido'}`);
        }

        const data = await response.json();
        console.log('Datos recibidos del servidor:', data);
        
        // Determinar la estructura de los datos
        let employees = data;
        if (Array.isArray(data.employees)) {
            employees = data.employees; // Si los empleados vienen dentro de un objeto {employees: [...]}
        } else if (!Array.isArray(data) && data.data && Array.isArray(data.data)) {
            employees = data.data; // Otra estructura posible {data: [...]}
        }
        
        console.log(`Se encontraron ${employees ? employees.length : 0} empleados`);
        
        // Resetear el selector
        filterEmployeeSelect.innerHTML = '<option value="">Todos</option>';
        
        if (employees && employees.length > 0) {
            employees.forEach(employee => {
                // Añadir al filtro - verificar los nombres de propiedades
                const employeeName = employee.full_name || employee.nombre || employee.fullName || employee.name || 'Nombre no disponible';
                const employeeId = employee.id || employee._id || '';
                const employeeDocument = employee.id_number || employee.numero_identificacion || employee.document || '';
                
                const filterOption = document.createElement('option');
                filterOption.value = employeeId;
                filterOption.textContent = `${employeeName} (${employeeDocument || 'Sin documento'})`;
                filterEmployeeSelect.appendChild(filterOption);
                
                console.log(`Empleado añadido al selector: ${employeeName} (${employeeDocument})`);
            });
            console.log('Selector de empleados actualizado correctamente');
        } else {
            console.warn('No se encontraron empleados o el formato de respuesta es incorrecto');
            // Añadir una opción indicando que no hay empleados
            const noDataOption = document.createElement('option');
            noDataOption.value = "";
            noDataOption.textContent = "No hay empleados disponibles";
            noDataOption.disabled = true;
            filterEmployeeSelect.appendChild(noDataOption);
        }

    } catch (error) {
        console.error('Error al cargar empleados para filtro:', error);
        
        // Mostrar el error en el selector
        const filterEmployeeSelect = document.getElementById('filterEmployee');
        if (filterEmployeeSelect) {
            filterEmployeeSelect.innerHTML = '<option value="">Error al cargar empleados</option>';
        }
        
        showToast(`Error al cargar la lista de empleados: ${error.message}`, 'danger');
    }
}

// Variables globales para filtros
let currentFilters = {
    month: '',
    employee: '',
    status: ''
};

// Función para aplicar filtros
function applyFilters(event) {
    // Si viene de un evento, prevenir el comportamiento por defecto
    if (event) {
        event.preventDefault();
    }
    
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
    
    // Aplicar filtros y recargar nóminas
    filterAndLoadPayrolls();
}

// Función para filtrar y cargar las nóminas según los filtros actuales
async function filterAndLoadPayrolls() {
    try {
        // Mostrar indicador de carga
        document.getElementById('payrollTableBody').innerHTML = `
            <tr>
                <td colspan="10" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        const token = localStorage.getItem('token');
        
        // Construir parámetros de consulta según filtros
        const queryParams = new URLSearchParams();
        
        if (currentFilters.month) {
            queryParams.append('month', currentFilters.month);
        }
        
        if (currentFilters.employee) {
            queryParams.append('employee_id', currentFilters.employee);
        }
        
        if (currentFilters.status) {
            queryParams.append('status', currentFilters.status);
        }
        
        // URL para la solicitud con filtros
        const url = `/api/payrolls${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al filtrar nóminas');
        }

        const payrolls = await response.json();
        renderPayrolls(payrolls);
        
        showToast('Filtros aplicados correctamente', 'success');
        
    } catch (error) {
        console.error('Error al aplicar filtros:', error);
        showToast('Error al aplicar filtros: ' + error.message, 'danger');
    }
}

// Función para refrescar la tabla
async function refreshPayrollTable() {
    try {
        // Mostrar un spinner o indicador de carga
        const tableBody = document.getElementById('payrollTableBody');
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></td></tr>';
        
        // Recargar las nóminas
        await loadPayrolls();
        
        // Recargar el resumen para actualizar contadores
        await loadPayrollSummary();
        
        // Aplicar los filtros actuales si hay alguno
        if (currentFilters.month || currentFilters.employee || currentFilters.status) {
            await filterAndLoadPayrolls();
        }
        
        // Mostrar mensaje de éxito
        showToast('Datos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('Error al refrescar la tabla:', error);
        showToast('Error al actualizar las nóminas: ' + error.message, 'danger');
    }
}

async function loadPayrolls() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/payrolls', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            throw new Error("Error al obtener nóminas");
        }

        const payrolls = await response.json();
        renderPayrolls(payrolls);
    } catch (error) {
        console.error("Error al obtener nóminas:", error);
        showToast("Error al obtener nóminas: " + error.message);
    }
}

// Reemplazar loadEmployees por esta versión actualizada
async function loadEmployeesForPayroll() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/employees/active', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Error al cargar empleados');
        }

        const { employees } = await response.json();
        const employeeSelect = document.getElementById('employeeId');
        employeeSelect.innerHTML = '<option value="">Seleccione un empleado</option>';
        
        if (employees && employees.length > 0) {
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = `${employee.full_name} - ${employee.id_number}`;
                option.dataset.salary = employee.salario_base || 0;
                employeeSelect.appendChild(option);
            });
        } else {
            showToast("No se encontraron empleados activos");
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar la lista de empleados: ' + error.message);
    }
}

function updateSalary() {
    const employeeSelect = document.getElementById("employeeId");
    const selectedOption = employeeSelect.options[employeeSelect.selectedIndex];
    
    // Obtener el salario del dataset del option seleccionado
    const salarioBase = selectedOption.dataset.salary || 0;
    console.log("Salario base del empleado:", salarioBase); // Para debugging
    
    // Actualizar el campo de salario base
    document.getElementById("salarioBase").value = salarioBase;
    
    // Recalcular totales cuando cambia el salario
    calculateTotals();
}

function openCreatePayrollModal() {
    document.getElementById('payrollForm').reset();
    loadEmployeesForPayroll();
    const modal = new bootstrap.Modal(document.getElementById('payrollModal'));
    modal.show();
}

function validateAndSavePayroll() {
    const form = document.getElementById("payrollForm");
    const inputs = form.querySelectorAll("input[required], select[required]");
    let isValid = true;

    inputs.forEach(input => {
        if (!input.checkValidity()) {
            input.classList.add("is-invalid");
            isValid = false;
        } else {
            input.classList.remove("is-invalid");
        }
    });

    if (isValid) {
        savePayroll();
    } else {
        showToast("Por favor, complete todos los campos requeridos");
    }
}

async function savePayroll() {
    try {
        // Mostrar indicador de carga
        showToast('Guardando datos de la nómina...', 'info');

        // --- RECOPILAR DATOS BÁSICOS ---
        const employee_id = document.getElementById('employeeId').value;
        const periodo = document.getElementById('periodo').value;
        const tipoPago = document.getElementById('tipoPago').value;
        const metodoPago = document.getElementById('metodo_pago').value;
        
        // --- RECOPILAR DATOS DE SALARIO Y DÍAS ---
        const salario_base = parseFloat(document.getElementById('salarioBase').value) || 0;
        const dias_trabajados = parseInt(document.getElementById('diasTrabajados').value) || 30;
        const dias_vacaciones = parseInt(document.getElementById('dias_vacaciones').value) || 0;
        const dias_incapacidad = parseInt(document.getElementById('dias_incapacidad').value) || 0;
        
        // --- RECOPILAR DATOS DE INGRESOS ---
        const auxilio_transporte = parseFloat(document.getElementById('auxilio_transporte').value) || 0;
        const horas_extras_diurnas = parseInt(document.getElementById('horasExtras').value) || 0;
        const valor_hora_extra_diurna = parseFloat(document.getElementById('valorHorasExtras').value) || 0;
        const horas_extras_nocturnas = parseInt(document.getElementById('horas_extras_nocturnas').value) || 0;
        const valor_hora_extra_nocturna = parseFloat(document.getElementById('valor_hora_extra_nocturna').value) || 0;
        const bonificaciones = parseFloat(document.getElementById('bonificaciones').value) || 0;
        const comisiones = parseFloat(document.getElementById('comisiones').value) || 0;
        const recargo_dominical = parseFloat(document.getElementById('recargo_dominical').value) || 0;
        
        // --- RECOPILAR DATOS DE DEDUCCIONES ---
        const aporte_salud_empleado = parseFloat(document.getElementById('deduccionSalud').value) || 0;
        const aporte_pension_empleado = parseFloat(document.getElementById('deduccionPension').value) || 0;
        const aporte_salud_empleador = parseFloat(document.getElementById('aporte_salud_empleador').value) || 0;
        const aporte_pension_empleador = parseFloat(document.getElementById('aporte_pension_empleador').value) || 0;
        const aporte_arl = parseFloat(document.getElementById('aporte_arl').value) || 0;
        const aporte_caja_compensacion = parseFloat(document.getElementById('aporte_caja_compensacion').value) || 0;
        const aporte_icbf = parseFloat(document.getElementById('aporte_icbf').value) || 0;
        const aporte_sena = parseFloat(document.getElementById('aporte_sena').value) || 0;
        const prestamos = parseFloat(document.getElementById('prestamos').value) || 0;
        const embargos = parseFloat(document.getElementById('embargos').value) || 0;
        const otros_descuentos = parseFloat(document.getElementById('otrosDescuentos').value) || 0;
        
        // --- RECOPILAR DATOS DE PROVISIONES ---
        const provision_prima = parseFloat(document.getElementById('provision_prima').value) || 0;
        const provision_cesantias = parseFloat(document.getElementById('provision_cesantias').value) || 0;
        const provision_intereses_cesantias = parseFloat(document.getElementById('provision_intereses_cesantias').value) || 0;
        const provision_vacaciones = parseFloat(document.getElementById('provision_vacaciones').value) || 0;
        const observaciones = document.getElementById('observaciones').value || '';
        
        // --- RECOPILAR TOTALES ---
        const total_ingresos = parseFloat(document.getElementById('totalIngresos').value) || 0;
        const total_deducciones = parseFloat(document.getElementById('totalDeducciones').value) || 0;
        const total_provisiones = parseFloat(document.getElementById('total_provisiones').value) || 0;
        const neto_pagar = parseFloat(document.getElementById('netoPagar').value) || 0;
        
        // Estado de pago
        const status = document.getElementById('estadoPago').checked ? 'Pagado' : 'Pendiente';

        // Construir el objeto de datos completo
        const payrollData = {
            employee_id,
            periodo,
            salario_base,
            total_ingresos,
            total_deducciones,
            neto_pagar,
            payment_date: new Date().toISOString(),
            status,
            // Incluir todos los datos del detalle de nómina
            PayrollDetail: {
                periodo,
                tipo_pago: tipoPago,
                dias_trabajados,
                dias_vacaciones,
                dias_incapacidad,
                salario_base, // Asegurar que el salario base sea consistente
                auxilio_transporte,
                // Horas extras
                horas_extras_diurnas,
                valor_hora_extra_diurna,
                horas_extras_nocturnas,
                valor_hora_extra_nocturna,
                // Bonificaciones y comisiones
                bonificaciones,
                comisiones,
                recargo_dominical,
                // Deducciones de ley
                aporte_salud_empleado,
                aporte_pension_empleado,
                aporte_salud_empleador,
                aporte_pension_empleador,
                aporte_arl,
                aporte_caja_compensacion,
                aporte_icbf,
                aporte_sena,
                // Otras deducciones
                prestamos,
                embargos,
                otros_descuentos,
                // Provisiones
                provision_prima,
                provision_cesantias,
                provision_intereses_cesantias,
                provision_vacaciones,
                // Totales
                total_ingresos,
                total_deducciones,
                total_provisiones,
                neto_pagar,
                // Otros datos
                estado: status,
                metodo_pago: metodoPago,
                observaciones
            }
        };

        // Validar campos requeridos
        if (!payrollData.employee_id || !payrollData.periodo) {
            throw new Error('Los campos Empleado y Período son obligatorios');
        }

        // Verificar si es edición o nueva nómina
        const payrollId = document.getElementById('payrollId')?.value;
        const method = payrollId ? 'PUT' : 'POST';
        const url = payrollId ? `/api/payrolls/${payrollId}` : '/api/payrolls';

        console.log('Enviando datos de nómina:', payrollData); // Para depuración

        const response = await fetch(url, {
            method: method,
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payrollData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al guardar nómina');
        }

        const responseData = await response.json();
        console.log('Respuesta del servidor:', responseData); // Para depuración

        showMessage('Nómina guardada exitosamente', 'success');
        await loadPayrolls();

        const modal = bootstrap.Modal.getInstance(document.getElementById('payrollModal'));
        if (modal) {
            modal.hide();
        }
    } catch (error) {
        console.error("Error al guardar nómina:", error);
        showMessage(error.message || "Error al guardar nómina", "error");
    }
}

// Agregar función para actualizar campos calculados en tiempo real
function updateCalculatedFields() {
    const salarioBase = parseFloat(document.getElementById('salarioBase').value) || 0;
    const horasExtras = parseFloat(document.getElementById('horasExtras').value) || 0;
    const bonificaciones = parseFloat(document.getElementById('bonificaciones').value) || 0;
    const comisiones = parseFloat(document.getElementById('comisiones').value) || 0;
    const prestamos = parseFloat(document.getElementById('prestamos').value) || 0;
    const otrosDescuentos = parseFloat(document.getElementById('otrosDescuentos').value) || 0;

    const totalIngresos = salarioBase + horasExtras + bonificaciones + comisiones;
    const totalDeducciones = prestamos + otrosDescuentos;
    const netoPagar = totalIngresos - totalDeducciones;

    document.getElementById('totalIngresos').value = totalIngresos.toFixed(2);
    document.getElementById('totalDeducciones').value = totalDeducciones.toFixed(2);
    document.getElementById('netoPagar').value = netoPagar.toFixed(2);
}

// Agregar event listeners para actualización en tiempo real
document.addEventListener('DOMContentLoaded', function() {
    const inputIds = ['salarioBase', 'horasExtras', 'bonificaciones', 'comisiones', 
                      'prestamos', 'otrosDescuentos'];
    
    inputIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateCalculatedFields);
        }
    });
});

async function generatePayrollPDF(payrollId) {
    try {
        // Mostrar indicador de carga
        const loadingToast = showToast('Generando PDF, por favor espere...');
        
        const response = await fetch(`/api/payrolls/${payrollId}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al generar el PDF');
        }

        // Verificar que el tipo de contenido sea PDF
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('La respuesta no es un PDF válido');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Crear un enlace invisible y simular clic
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `nomina-${payrollId}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Limpieza
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('PDF generado correctamente', 'success');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showToast('Error al generar PDF: ' + error.message, 'error');
    }
}

async function editPayroll(payrollId) {
    try {
        // Mostrar indicador de carga
        showToast('Cargando datos de la nómina...', 'info');
        
        // 1. Obtener datos de la nómina
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/payrolls/${payrollId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener la nómina");
        }

        const payroll = await response.json();
        console.log('Datos recibidos para editar nómina:', payroll); // Para depuración

        if (payroll.status === 'Pagado') {
            showToast("No se puede editar una nómina que ya ha sido pagada.", "warning");
            return;
        }

        // 2. Cargar lista de empleados primero (IMPORTANTE: Esto debe ir antes de establecer el valor)
        await loadEmployeesForPayroll();
        
        // 3. Cargar datos en el formulario
        const form = document.getElementById("payrollForm");
        
        // Limpiar el formulario antes de cargar los nuevos datos
        form.reset();

        // Establecer el título del modal
        document.getElementById("payrollModalLabel").textContent = "Editar Nómina";

        // Cargar datos básicos
        document.getElementById("payrollId").value = payroll.id;
        
        // Ahora que hemos cargado los empleados, podemos establecer el valor seleccionado
        document.getElementById("employeeId").value = payroll.employee_id;
        
        document.getElementById("periodo").value = payroll.periodo || payroll.PayrollDetail?.periodo || '';
        document.getElementById("tipoPago").value = payroll.PayrollDetail?.tipo_pago || 'Mensual';
        document.getElementById("metodo_pago").value = payroll.PayrollDetail?.metodo_pago || 'Transferencia';
        
        // Cargar días
        document.getElementById("diasTrabajados").value = payroll.PayrollDetail?.dias_trabajados || 30;
        document.getElementById("dias_vacaciones").value = payroll.PayrollDetail?.dias_vacaciones || 0;
        document.getElementById("dias_incapacidad").value = payroll.PayrollDetail?.dias_incapacidad || 0;
        
        // Cargar salario base
        document.getElementById("salarioBase").value = payroll.salario_base || 0;

        // --- CARGAR INGRESOS ---
        // Auxilio de transporte
        document.getElementById("auxilio_transporte").value = payroll.PayrollDetail?.auxilio_transporte || 0;
        
        // Cargar datos de extras y bonificaciones
        document.getElementById("horasExtras").value = payroll.PayrollDetail?.horas_extras_diurnas || 0;
        document.getElementById("valorHorasExtras").value = payroll.PayrollDetail?.valor_hora_extra_diurna || 0;
        document.getElementById("horas_extras_nocturnas").value = payroll.PayrollDetail?.horas_extras_nocturnas || 0;
        document.getElementById("valor_hora_extra_nocturna").value = payroll.PayrollDetail?.valor_hora_extra_nocturna || 0;
        
        // Bonificaciones y comisiones
        document.getElementById("bonificaciones").value = payroll.PayrollDetail?.bonificaciones || 0;
        document.getElementById("comisiones").value = payroll.PayrollDetail?.comisiones || 0;
        document.getElementById("recargo_dominical").value = payroll.PayrollDetail?.recargo_dominical || 0;

        // --- CARGAR DEDUCCIONES ---
        // Deducciones de salud y pensión
        document.getElementById("deduccionSalud").value = payroll.PayrollDetail?.aporte_salud_empleado || 0;
        document.getElementById("deduccionPension").value = payroll.PayrollDetail?.aporte_pension_empleado || 0;
        
        // Aportes del empleador
        document.getElementById("aporte_salud_empleador").value = payroll.PayrollDetail?.aporte_salud_empleador || 0;
        document.getElementById("aporte_pension_empleador").value = payroll.PayrollDetail?.aporte_pension_empleador || 0;
        
        // Parafiscales
        document.getElementById("aporte_arl").value = payroll.PayrollDetail?.aporte_arl || 0;
        document.getElementById("aporte_caja_compensacion").value = payroll.PayrollDetail?.aporte_caja_compensacion || 0;
        document.getElementById("aporte_icbf").value = payroll.PayrollDetail?.aporte_icbf || 0;
        document.getElementById("aporte_sena").value = payroll.PayrollDetail?.aporte_sena || 0;
        
        // Otras deducciones
        document.getElementById("prestamos").value = payroll.PayrollDetail?.prestamos || 0;
        document.getElementById("embargos").value = payroll.PayrollDetail?.embargos || 0;
        document.getElementById("otrosDescuentos").value = payroll.PayrollDetail?.otros_descuentos || 0;

        // --- CARGAR PROVISIONES ---
        document.getElementById("provision_prima").value = payroll.PayrollDetail?.provision_prima || 0;
        document.getElementById("provision_cesantias").value = payroll.PayrollDetail?.provision_cesantias || 0;
        document.getElementById("provision_intereses_cesantias").value = payroll.PayrollDetail?.provision_intereses_cesantias || 0;
        document.getElementById("provision_vacaciones").value = payroll.PayrollDetail?.provision_vacaciones || 0;
        document.getElementById("total_provisiones").value = payroll.PayrollDetail?.total_provisiones || 0;
        document.getElementById("observaciones").value = payroll.PayrollDetail?.observaciones || '';

        // --- CARGAR TOTALES ---
        document.getElementById("totalIngresos").value = payroll.total_ingresos || payroll.PayrollDetail?.total_ingresos || 0;
        document.getElementById("totalDeducciones").value = payroll.total_deducciones || payroll.PayrollDetail?.total_deducciones || 0;
        document.getElementById("netoPagar").value = payroll.neto_pagar || payroll.PayrollDetail?.neto_pagar || 0;

        // Calcular y mostrar totales
        calculateTotals();
        
        // Actualizar el estado del checkbox según el estado de la nómina
        const estadoPagoCheckbox = document.getElementById("estadoPago");
        estadoPagoCheckbox.checked = payroll.status === 'Pagado' || payroll.PayrollDetail?.estado === 'Pagado';
        estadoPagoCheckbox.disabled = payroll.status === 'Pagado' || payroll.PayrollDetail?.estado === 'Pagado';

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById("payrollModal"));
        modal.show();
    } catch (error) {
        console.error("Error al editar la nómina:", error);
        showToast("Error al editar la nómina: " + error.message, "danger");
    }
}

function deletePayroll(payrollId) {
    // Guardar el ID de la nómina en el modal
    document.getElementById('deletePayrollId').value = payrollId;
    
    // Mostrar el modal de confirmación
    const deleteModal = new bootstrap.Modal(document.getElementById('deletePayrollModal'));
    deleteModal.show();
}

// Función que realiza la eliminación real después de la confirmación
async function confirmDeletePayroll() {
    try {
        // Obtener el ID de la nómina a eliminar del modal
        const payrollId = document.getElementById('deletePayrollId').value;
        
        // Mostrar indicador de carga 
        showToast('Eliminando nómina...', 'info');
        
        // Cerrar el modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deletePayrollModal'));
        deleteModal.hide();
        
        const response = await fetch(`/api/payrolls/${payrollId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al eliminar la nómina");
        }

        showToast("Nómina eliminada correctamente", "success");
        loadPayrolls();
    } catch (error) {
        console.error("Error al eliminar la nómina:", error);
        showToast("Error al eliminar la nómina: " + error.message, "danger");
    }
}

// Agregar función showToast si no existe
function showToast(message, type = 'info') {
    try {
        const toastElement = document.getElementById('successToast');
        if (!toastElement) {
            console.error('Elemento toast no encontrado');
            return;
        }
        
        // Actualizar clases según el tipo de mensaje
        toastElement.className = `toast align-items-center text-white bg-${type} border-0`;
        
        const toastBody = toastElement.querySelector('.toast-body');
        if (!toastBody) {
            console.error('Elemento toast-body no encontrado');
            return;
        }
        
        toastBody.textContent = message;
        const toast = new bootstrap.Toast(toastElement, {
            delay: 3000
        });
        toast.show();
        
        return toast;
    } catch (error) {
        console.error('Error al mostrar el toast:', error);
    }
}

function calculateTotals() {
    try {
        // 1. Obtener todos los valores base
        const salarioBase = parseFloat(document.getElementById('salarioBase').value) || 0;
        const horasExtras = parseFloat(document.getElementById('horasExtras').value) || 0;
        const valorHorasExtras = parseFloat(document.getElementById('valorHorasExtras').value) || 0;
        const bonificaciones = parseFloat(document.getElementById('bonificaciones').value) || 0;
        const comisiones = parseFloat(document.getElementById('comisiones').value) || 0;
        const prestamos = parseFloat(document.getElementById('prestamos').value) || 0;
        const otrosDescuentos = parseFloat(document.getElementById('otrosDescuentos').value) || 0;
        const tipoPago = document.getElementById('tipoPago').value;

        // 2. Calcular total de ingresos
        const totalIngresos = salarioBase + valorHorasExtras + bonificaciones + comisiones;

        // 3. Calcular porcentaje según tipo de pago
        let porcentaje;
        switch (tipoPago) {
            case 'Mensual':
                porcentaje = 0.08;
                break;
            case 'Quincenal':
                porcentaje = 0.04;
                break;
            case 'Semanal':
                porcentaje = 0.02;
                break;
            default:
                porcentaje = 0.08;
        }

        // 4. Calcular deducciones de ley (salud y pensión)
        const deduccionSalud = salarioBase * porcentaje;
        const deduccionPension = salarioBase * porcentaje;

        // 5. Mostrar deducciones de ley en sus campos respectivos
        document.getElementById('deduccionSalud').value = deduccionSalud.toFixed(2);
        document.getElementById('deduccionPension').value = deduccionPension.toFixed(2);

        // 6. Calcular total de todas las deducciones
        const totalDeducciones = deduccionSalud + deduccionPension + prestamos + otrosDescuentos;

        // 7. Calcular neto a pagar
        const netoPagar = totalIngresos - totalDeducciones;

        // 8. Actualizar campos finales
        document.getElementById('totalIngresos').value = totalIngresos.toFixed(2);
        document.getElementById('totalDeducciones').value = totalDeducciones.toFixed(2);
        document.getElementById('netoPagar').value = netoPagar.toFixed(2);

        // 9. Para debugging
        console.log('Cálculo de deducciones:', {
            deduccionSalud,
            deduccionPension,
            prestamos,
            otrosDescuentos,
            totalDeducciones
        });

    } catch (error) {
        console.error('Error en calculateTotals:', error);
        showToast('Error al calcular totales: ' + error.message);
    }
}

// Asegurar que todos los campos relevantes tengan event listeners
document.addEventListener('DOMContentLoaded', function() {
    const camposAMonitorear = [
        'salarioBase',
        'horasExtras',
        'valorHorasExtras',
        'bonificaciones',
        'comisiones',
        'prestamos',
        'otrosDescuentos',
        'tipoPago'
    ];
    
    camposAMonitorear.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            elemento.addEventListener('input', calculateTotals);
            elemento.addEventListener('change', calculateTotals);
        }
    });
});

// Reemplazar el event listener del checkbox y agregar manejo del modal
document.getElementById("estadoPago").addEventListener("change", function(e) {
    if (this.checked) {
        // Prevenir el cambio inmediato del checkbox
        e.preventDefault();
        this.checked = false;
        
        // Obtener el ID de la nómina del formulario
        const payrollId = document.getElementById('payrollId').value;
        
        // Si hay un ID, abrir el modal de confirmación de pago
        if (payrollId) {
            openConfirmPaymentModal(payrollId);
        } else {
            showToast('Error: No se encontró el ID de la nómina', 'danger');
        }
    }
});

// Función para abrir y poblar el modal de confirmación de pago
async function openConfirmPaymentModal(payrollId) {
    try {
        // Obtener los datos actuales del formulario
        const employeeSelect = document.getElementById('employeeId');
        const selectedOption = employeeSelect.options[employeeSelect.selectedIndex];
        
        // Verificar si hay un empleado seleccionado
        if (!selectedOption || !selectedOption.value) {
            throw new Error('No se ha seleccionado un empleado válido');
        }
        
        // Obtener textos y valores necesarios del formulario
        const employeeName = selectedOption.textContent || 'No disponible';
        const salarioBase = document.getElementById('salarioBase').value || '0';
        const periodo = document.getElementById('periodo').value || 'No especificado';
        const tipoPago = document.getElementById('tipoPago').options[document.getElementById('tipoPago').selectedIndex].text || 'No especificado';
        const metodoPago = document.getElementById('metodo_pago').options[document.getElementById('metodo_pago').selectedIndex].text || 'No especificado';
        
        // Obtener totales
        const totalIngresos = document.getElementById('totalIngresos').value || '0';
        const totalDeducciones = document.getElementById('totalDeducciones').value || '0';
        const netoPagar = document.getElementById('netoPagar').value || '0';
        
        // Obtener documento del empleado (hacer una solicitud al servidor)
        const token = localStorage.getItem('token');
        const employeeId = selectedOption.value;
        
        const response = await fetch(`/api/employees/${employeeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('No se pudo obtener la información del empleado');
        }
        
        const employeeData = await response.json();
        const employeeDocument = employeeData.id_number || 'No disponible';
        
        // Establecer los valores en el modal
        document.getElementById('previewEmployeeName').textContent = employeeName;
        document.getElementById('previewEmployeeDocument').textContent = employeeDocument;
        document.getElementById('previewSalarioBase').textContent = formatMoney(parseFloat(salarioBase));
        document.getElementById('previewPeriodo').textContent = periodo;
        document.getElementById('previewTipoPago').textContent = tipoPago;
        document.getElementById('previewMetodoPago').textContent = metodoPago;
        
        // Establecer los valores financieros
        document.getElementById('previewTotalIngresos').textContent = formatNumber(parseFloat(totalIngresos));
        document.getElementById('previewTotalDeducciones').textContent = formatNumber(parseFloat(totalDeducciones));
        document.getElementById('previewNetoPagar').textContent = formatNumber(parseFloat(netoPagar));
        
        // Establecer fecha actual por defecto
        document.getElementById('fechaPagoConfirmacion').valueAsDate = new Date();
        
        // Guardar el ID de la nómina en el campo oculto
        document.getElementById('confirmPayrollId').value = payrollId;
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('confirmPaymentModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error al abrir el modal de confirmación:', error);
        showToast('Error: ' + error.message, 'danger');
    }
}

// Función para formatear números con separadores de miles
function formatNumber(number) {
    return number.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Agregar event listeners para el modal de confirmación
document.addEventListener('DOMContentLoaded', function() {
    // Obtener botón de confirmar pago
    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
    
    // Verificar que el botón existe
    if (confirmPaymentBtn) {
        // Añadir escuchador de eventos al botón de confirmación
        confirmPaymentBtn.addEventListener('click', async function() {
            try {
                // Obtener el ID de la nómina desde el campo oculto
                const payrollId = document.getElementById('confirmPayrollId').value;
                
                if (!payrollId) {
                    throw new Error('No se encontró el ID de la nómina');
                }
                
                // Mostrar un mensaje de carga
                showToast('Procesando pago...', 'info');
                
                // Obtener la fecha de pago elegida (o usar la fecha actual si no se especificó)
                const fechaPago = document.getElementById('fechaPagoConfirmacion').value || new Date().toISOString().split('T')[0];
                
                // Hacer la petición al servidor para actualizar la nómina
                const response = await fetch(`/api/payrolls/${payrollId}/pay`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        status: 'Pagado',
                        payment_date: fechaPago
                    })
                });
                
                // Verificar la respuesta
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al procesar el pago');
                }
                
                // Cerrar el modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('confirmPaymentModal'));
                modal.hide();
                
                // Marcar el checkbox como pagado en el formulario principal
                document.getElementById('estadoPago').checked = true;
                document.getElementById('estadoPago').disabled = true;
                
                // Mensaje de éxito
                showToast('Nómina marcada como pagada correctamente', 'success');
                
                // Actualizar la tabla de nóminas y los contadores
                await loadPayrolls();
                await loadPayrollSummary();
                
                // Si estaba editando, cerrar el modal principal también
                const payrollModal = bootstrap.Modal.getInstance(document.getElementById('payrollModal'));
                if (payrollModal) {
                    payrollModal.hide();
                }
                
            } catch (error) {
                console.error('Error al confirmar el pago:', error);
                showToast(`Error: ${error.message}`, 'danger');
            }
        });
    }

    // Configurar botones de cancelar
    const cancelButtons = document.querySelectorAll('#confirmPaymentModal button[data-bs-dismiss="modal"]');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Desmarcar el checkbox cuando se cancela la acción
            document.getElementById('estadoPago').checked = false;
        });
    });
});

// Agregar función de exportación
async function exportPayrollReport() {
    try {
        const response = await fetch('/api/payrolls/export', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al exportar reporte');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-nomina-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Reporte exportado correctamente');
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al exportar el reporte: ' + error.message);
    }
}

// Agregar función de búsqueda
async function searchPayroll() {
    const searchTerm = document.getElementById("searchPayroll").value.trim();
    if (!searchTerm) {
        loadPayrolls();
        return;
    }

    try {
        const response = await fetch(`/api/payrolls/search?term=${encodeURIComponent(searchTerm)}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error("Error en la búsqueda");
        }

        const payrolls = await response.json();
        renderPayrolls(payrolls);
    } catch (error) {
        console.error("Error:", error);
        showToast("Error en la búsqueda: " + error.message);
    }
}

async function viewPayrollDetails(id) {
    try {
        const response = await fetch(`/api/payrolls/${id}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener detalles de la nómina');
        }

        const payroll = await response.json();
        console.log("Datos de la nómina:", payroll); // Para depuración
        
        // Limpiar el formulario antes de mostrar los detalles
        const form = document.getElementById("payrollForm");
        form.reset();

        // Establecer el título del modal
        document.getElementById("payrollModalLabel").textContent = "Detalles de Nómina";

        // Cargar datos básicos
        document.getElementById("payrollId").value = payroll.id;
        document.getElementById("employeeId").value = payroll.employee_id;
        document.getElementById("periodo").value = payroll.periodo || payroll.PayrollDetail?.periodo || '';
        document.getElementById("tipoPago").value = payroll.PayrollDetail?.tipo_pago || 'Mensual';
        document.getElementById("metodo_pago").value = payroll.PayrollDetail?.metodo_pago || 'Transferencia';
        
        // Cargar días
        document.getElementById("diasTrabajados").value = payroll.PayrollDetail?.dias_trabajados || 30;
        document.getElementById("dias_vacaciones").value = payroll.PayrollDetail?.dias_vacaciones || 0;
        document.getElementById("dias_incapacidad").value = payroll.PayrollDetail?.dias_incapacidad || 0;
        
        // Cargar salario base
        document.getElementById("salarioBase").value = payroll.salario_base || 0;

        // --- CARGAR INGRESOS ---
        // Auxilio de transporte
        document.getElementById("auxilio_transporte").value = payroll.PayrollDetail?.auxilio_transporte || 0;
        
        // Cargar datos de extras y bonificaciones
        document.getElementById("horasExtras").value = payroll.PayrollDetail?.horas_extras_diurnas || 0;
        document.getElementById("valorHorasExtras").value = payroll.PayrollDetail?.valor_hora_extra_diurna || 0;
        document.getElementById("horas_extras_nocturnas").value = payroll.PayrollDetail?.horas_extras_nocturnas || 0;
        document.getElementById("valor_hora_extra_nocturna").value = payroll.PayrollDetail?.valor_hora_extra_nocturna || 0;
        
        // Bonificaciones y comisiones
        document.getElementById("bonificaciones").value = payroll.PayrollDetail?.bonificaciones || 0;
        document.getElementById("comisiones").value = payroll.PayrollDetail?.comisiones || 0;
        document.getElementById("recargo_dominical").value = payroll.PayrollDetail?.recargo_dominical || 0;

        // --- CARGAR DEDUCCIONES ---
        // Deducciones de salud y pensión
        document.getElementById("deduccionSalud").value = payroll.PayrollDetail?.aporte_salud_empleado || 0;
        document.getElementById("deduccionPension").value = payroll.PayrollDetail?.aporte_pension_empleado || 0;
        
        // Aportes del empleador
        document.getElementById("aporte_salud_empleador").value = payroll.PayrollDetail?.aporte_salud_empleador || 0;
        document.getElementById("aporte_pension_empleador").value = payroll.PayrollDetail?.aporte_pension_empleador || 0;
        
        // Parafiscales
        document.getElementById("aporte_arl").value = payroll.PayrollDetail?.aporte_arl || 0;
        document.getElementById("aporte_caja_compensacion").value = payroll.PayrollDetail?.aporte_caja_compensacion || 0;
        document.getElementById("aporte_icbf").value = payroll.PayrollDetail?.aporte_icbf || 0;
        document.getElementById("aporte_sena").value = payroll.PayrollDetail?.aporte_sena || 0;
        
        // Otras deducciones
        document.getElementById("prestamos").value = payroll.PayrollDetail?.prestamos || 0;
        document.getElementById("embargos").value = payroll.PayrollDetail?.embargos || 0;
        document.getElementById("otrosDescuentos").value = payroll.PayrollDetail?.otros_descuentos || 0;

        // --- CARGAR PROVISIONES ---
        document.getElementById("provision_prima").value = payroll.PayrollDetail?.provision_prima || 0;
        document.getElementById("provision_cesantias").value = payroll.PayrollDetail?.provision_cesantias || 0;
        document.getElementById("provision_intereses_cesantias").value = payroll.PayrollDetail?.provision_intereses_cesantias || 0;
        document.getElementById("provision_vacaciones").value = payroll.PayrollDetail?.provision_vacaciones || 0;
        document.getElementById("observaciones").value = payroll.PayrollDetail?.observaciones || '';
        document.getElementById("total_provisiones").value = payroll.PayrollDetail?.total_provisiones || 0;

        // --- CARGAR TOTALES ---
        document.getElementById("totalIngresos").value = payroll.total_ingresos || payroll.PayrollDetail?.total_ingresos || 0;
        document.getElementById("totalDeducciones").value = payroll.total_deducciones || payroll.PayrollDetail?.total_deducciones || 0;
        document.getElementById("netoPagar").value = payroll.neto_pagar || payroll.PayrollDetail?.neto_pagar || 0;

        // Estado de pago
        const estadoPagoCheckbox = document.getElementById("estadoPago");
        estadoPagoCheckbox.checked = payroll.status === 'Pagado' || payroll.PayrollDetail?.estado === 'Pagado';
        estadoPagoCheckbox.disabled = true;

        // Deshabilitar todos los campos del formulario
        const allInputs = form.getElementsByTagName('input');
        const allSelects = form.getElementsByTagName('select');
        
        [...allInputs, ...allSelects].forEach(element => {
            element.disabled = true;
        });

        // Ocultar botón de guardar
        const saveButton = document.querySelector('.modal-footer .btn-primary');
        if (saveButton) {
            saveButton.style.display = 'none';
        }

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById("payrollModal"));
        modal.show();

    } catch (error) {
        console.error("Error:", error);
        showToast(error.message, "danger");
    }
}

// Modificar la función openPayrollModal para aceptar el parámetro readOnly
function openPayrollModal(payroll = null, readOnly = false) {
    // ...existing code...
    
    // Habilitar/deshabilitar campos según modo
    const inputs = form.getElementsByTagName('input');
    const selects = form.getElementsByTagName('select');
    
    [...inputs, ...selects].forEach(element => {
        element.readOnly = readOnly;
        if (element.tagName === 'SELECT') {
            element.disabled = readOnly;
        }
    });

    // Mostrar/ocultar botón de guardar según modo
    const saveButton = document.querySelector('.modal-footer .btn-primary');
    if (saveButton) {
        saveButton.style.display = readOnly ? 'none' : 'block';
    }
    
    // ...existing code...
}

function formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(amount);
}

function getStatusBadge(status) {
    const statusMap = {
        'Pendiente': 'badge-warning',
        'Pagado': 'badge-success',
        'Anulado': 'badge-danger'
    };
    return `<span class="badge ${statusMap[status] || 'badge-secondary'}">${status}</span>`;
}

function showMessage(message, type = "error") {
    const alertPlaceholder = document.createElement('div');
    alertPlaceholder.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertPlaceholder.style.zIndex = '9999';
    
    alertPlaceholder.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertPlaceholder);
    
    // Remover la alerta después de 3 segundos
    setTimeout(() => {
        alertPlaceholder.remove();
    }, 3000);
}

async function renderPayrolls(payrolls) {
    try {
        const html = payrolls.map(payroll => `
            <tr data-payroll-id="${payroll.id}">
                <td>${payroll.id || ''}</td>
                <td>${payroll.Employee ? payroll.Employee.id_number : ''}</td>
                <td>${payroll.Employee ? payroll.Employee.full_name : ''}</td>
                <td>${payroll.periodo || ''}</td>
                <td>${formatMoney(payroll.salario_base || 0)}</td>
                <td>${formatMoney(payroll.total_ingresos || 0)}</td>
                <td>${formatMoney(payroll.total_deducciones || 0)}</td>
                <td>${formatMoney(payroll.neto_pagar || 0)}</td>
                <td>
                    <span class="badge bg-${payroll.status === 'Pagado' ? 'success' : 
                                        payroll.status === 'Pendiente' ? 'warning' : 'danger'}">
                        ${payroll.status || 'Pendiente'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info btn-sm action-btn" onclick="viewPayrollDetails(${payroll.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning btn-sm action-btn" onclick="editPayroll(${payroll.id})" 
                            ${payroll.status === 'Pagado' ? 'disabled' : ''} title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm action-btn" onclick="deletePayroll(${payroll.id})" 
                            ${payroll.status === 'Pagado' ? 'disabled' : ''} title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm action-btn" onclick="generatePayrollPDF(${payroll.id})" title="Generar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        document.getElementById('payrollTableBody').innerHTML = html;
    } catch (error) {
        console.error("Error al renderizar nóminas:", error);
        showMessage("Error al mostrar las nóminas", "error");
    }
}

// ...existing code...

async function saveEmployee() {
    try {
        const form = document.getElementById('employeeForm');
        if (!form) {
            throw new Error('No se encontró el formulario');
        }

        // Objeto para almacenar los valores del formulario
        const formData = {};
        const fields = [
            'employeeId',
            'periodo',
            'salarioBase',
            'totalIngresos',
            'totalDeducciones',
            'netoPagar',
            'status'
        ];

        // Verificar cada campo antes de obtener su valor
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (!element) {
                console.warn(`Campo no encontrado: ${fieldId}`);
                return;
            }
            formData[fieldId] = element.value;
        });

        // Validar campos requeridos
        if (!formData.employeeId || !formData.periodo) {
            throw new Error('Por favor complete todos los campos requeridos');
        }

        const payrollData = {
            employee_id: formData.employeeId,
            periodo: formData.periodo,
            salario_base: parseFloat(formData.salarioBase) || 0,
            total_ingresos: parseFloat(formData.totalIngresos) || 0,
            total_deducciones: parseFloat(formData.totalDeducciones) || 0,
            neto_pagar: parseFloat(formData.netoPagar) || 0,
            status: formData.status || 'Pendiente'
        };

        const response = await fetch('/api/payrolls', {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payrollData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al guardar nómina');
        }

        showMessage('Nómina guardada exitosamente', 'success');
        await loadPayrolls();

        const modal = bootstrap.Modal.getInstance(document.getElementById('payrollModal'));
        if (modal) {
            modal.hide();
        }
    } catch (error) {
        console.error("Error:", error);
        showMessage(error.message || "Error al guardar nómina", "error");
    }
}

// Agregar esta nueva función para manejar el estado de pago
async function handlePaymentStatus(payrollId) {
    const estadoPagoCheckbox = document.getElementById("estadoPago");
    
    if (estadoPagoCheckbox.checked) {
        try {
            const confirmResult = await Swal.fire({
                title: '¿Confirmar pago?',
                text: "Esta acción no se puede deshacer",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, confirmar',
                cancelButtonText: 'Cancelar'
            });

            if (confirmResult.isConfirmed) {
                const response = await fetch(`/api/payrolls/${payrollId}`, {
                    method: 'PUT',
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ status: 'Pagado' })
                });

                if (!response.ok) {
                    throw new Error('Error al actualizar el estado de la nómina');
                }

                // Deshabilitar el checkbox y mantenerlo marcado
                estadoPagoCheckbox.checked = true;
                estadoPagoCheckbox.disabled = true;

                // Deshabilitar botones de edición y eliminación
                const editButton = document.querySelector(`tr[data-payroll-id="${payrollId}"] .btn-warning`);
                const deleteButton = document.querySelector(`tr[data-payroll-id="${payrollId}"] .btn-danger`);
                if (editButton) editButton.disabled = true;
                if (deleteButton) deleteButton.disabled = true;

                showToast('Nómina marcada como pagada correctamente');
                await loadPayrolls(); // Recargar la lista de nóminas
            } else {
                // Si el usuario cancela, desmarcar el checkbox
                estadoPagoCheckbox.checked = false;
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al actualizar el estado: ' + error.message);
            estadoPagoCheckbox.checked = false;
        }
    }
}

// Modificar el event listener existente del checkbox para usar la nueva función
document.getElementById("estadoPago").addEventListener("change", function(e) {
    const payrollId = document.getElementById('payrollId').value;
    if (payrollId) {
        handlePaymentStatus(payrollId);
    } else {
        this.checked = false;
        showToast('Error: No se encontró el ID de la nómina');
    }
});

// Configurar campos para cálculos automáticos
function setupFormCalculations() {
    // Configurar event listeners para los campos que afectan los cálculos
    const camposAMonitorear = [
        'salarioBase',
        'horasExtras',
        'valorHorasExtras',
        'horas_extras_nocturnas',
        'valor_hora_extra_nocturna',
        'bonificaciones',
        'comisiones',
        'recargo_dominical',
        'auxilio_transporte',
        'prestamos',
        'embargos',
        'otrosDescuentos',
        'tipoPago'
    ];
    
    camposAMonitorear.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            elemento.addEventListener('input', calculateTotals);
            elemento.addEventListener('change', calculateTotals);
        }
    });
}
setupFormCalculations(); // Llamar a la función al cargar el script
document.addEventListener('DOMContentLoaded', setupFormCalculations); // Asegurarse de que se ejecute al cargar el DOM