/**
 * Gestión de Inventarios y Reportes Financieros
 * 
 * Este módulo maneja la lógica para la página de inventarios y reportes financieros,
 * incluyendo el dashboard financiero, gráficos y manejo de datos.
 */

// Variables globales
let currentPeriod = 'semanal'; // Valores posibles: 'semanal', 'mensual', 'anual'
let selectedDateRange = null;
let ingresosMensualesChart = null;
let egresosMensualesChart = null;
let comparativoFinancieroChart = null;
let dashboardData = null;

// Variables para préstamos
let prestamosChart = null;
let currentPrestamoPeriod = 'semanal';
let currentPrestamoEstado = 'todos';
let prestamosData = null;

// Función para formatear moneda
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(value);
}

// Función para mostrar notificaciones
function showToast(title, message, type = 'info') {
    const toastId = `toast-${Date.now()}`;
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center border-0 text-white bg-${type}`;
    toastElement.role = 'alert';
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    toastElement.id = toastId;
    
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${title}</strong>: ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    const toastContainer = document.getElementById('toastContainer');
    toastContainer.appendChild(toastElement);
    
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
    
    // Auto-remove after hide
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Función para verificar el token de autenticación
function checkToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Redireccionar a la página de login si no hay token
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Función para refrescar el token si es necesario
async function refreshToken() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return false;
        }
        
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            // Si el token no es válido, redireccionar a login
            window.location.href = '/login.html';
            return false;
        }
        
        const data = await response.json();
        
        // Si el token está por expirar, actualizarlo
        if (data.refreshToken) {
            localStorage.setItem('token', data.refreshToken);
        }
        
        return true;
    } catch (error) {
        console.error('Error al verificar el token:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Inicialización del DateRangePicker
function initDateRangePicker() {
    const fechaActual = moment();
    let fechaInicio, fechaFin;
    
    // Configurar fechas según el período seleccionado
    if (currentPeriod === 'semanal') {
        fechaInicio = moment().startOf('week');
        fechaFin = moment().endOf('week');
    } else if (currentPeriod === 'mensual') {
        fechaInicio = moment().startOf('month');
        fechaFin = moment().endOf('month');
    } else if (currentPeriod === 'anual') {
        fechaInicio = moment().startOf('year');
        fechaFin = moment().endOf('year');
    }
    
    $('#periodoDateRange').daterangepicker({
        startDate: fechaInicio,
        endDate: fechaFin,
        ranges: {
            'Hoy': [moment(), moment()],
            'Ayer': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Últimos 7 días': [moment().subtract(6, 'days'), moment()],
            'Últimos 30 días': [moment().subtract(29, 'days'), moment()],
            'Este mes': [moment().startOf('month'), moment().endOf('month')],
            'Mes pasado': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
            'Este año': [moment().startOf('year'), moment().endOf('year')]
        },
        locale: {
            format: 'DD/MM/YYYY',
            separator: ' - ',
            applyLabel: 'Aplicar',
            cancelLabel: 'Cancelar',
            fromLabel: 'Desde',
            toLabel: 'Hasta',
            customRangeLabel: 'Personalizado',
            weekLabel: 'S',
            daysOfWeek: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
            monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            firstDay: 1
        }
    });
    
    // Guardar el rango seleccionado
    selectedDateRange = {
        startDate: fechaInicio.toDate(),
        endDate: fechaFin.toDate()
    };
}

// Cargar datos del dashboard según el período seleccionado
async function fetchDashboardData() {
    try {
        if (!checkToken()) return;
        
        // Determinar periodo para la API
        let apiPeriod = 'month'; // Por defecto
        if (currentPeriod === 'semanal') {
            apiPeriod = 'week';
        } else if (currentPeriod === 'mensual') {
            apiPeriod = 'month';
        } else if (currentPeriod === 'anual') {
            apiPeriod = 'year';
        }
        
        showToast('Información', 'Cargando datos...', 'info');
        
        const response = await fetch(`/api/dashboard?period=${apiPeriod}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar datos del dashboard');
        }

        dashboardData = await response.json();
        
        // Actualizar los elementos del UI con los datos
        updateDashboardUI(dashboardData);
        
        showToast('Éxito', 'Datos cargados correctamente', 'success');
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        showToast('Error', `No se pudieron cargar los datos: ${error.message}`, 'danger');
    }
}

// Actualizar la interfaz con los datos del dashboard
function updateDashboardUI(data) {
    if (!data) return;
    
    // Actualizar totales en las tarjetas
    document.getElementById('totalIngresos').textContent = formatCurrency(getTotalIngresos(data));
    document.getElementById('totalEgresos').textContent = formatCurrency(getTotalEgresos(data));
    document.getElementById('totalPrestamos').textContent = formatCurrency(data.loanData?.totalLoanAmount || 0);
    
    // Actualizar las tablas de préstamos
    updateLoanTable(data);
    
    // Inicializar los gráficos
    initializeCharts(data);
}

// Obtener el total de ingresos del período actual
function getTotalIngresos(data) {
    if (!data || !data.monthlyIncome) return 0;
    
    return data.monthlyIncome.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
}

// Obtener el total de egresos del período actual
function getTotalEgresos(data) {
    if (!data || !data.monthlyExpenses) return 0;
    
    return data.monthlyExpenses.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
}

// Actualizar la tabla de préstamos
function updateLoanTable(data) {
    if (!data || !data.loanData) return;
    
    // Aquí se implementará la lógica para obtener y mostrar los datos
    // de préstamos en la tabla. Como no tenemos la API específica para
    // listar préstamos, mostramos un mensaje informativo
    
    const tableBody = document.getElementById('tablaPrestamos');
    
    // Si no hay préstamos activos
    if (!data.loanData.activeLoans || data.loanData.activeLoans === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No hay préstamos activos en este momento</td>
            </tr>
        `;
        return;
    }
    
    // Mostrar mensaje informativo en tabla
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                Hay ${data.loanData.activeLoans} préstamos activos por un total de ${formatCurrency(data.loanData.totalLoanAmount || 0)}.<br>
                Consulte el módulo de préstamos para ver el detalle completo.
            </td>
        </tr>
    `;
}

// Inicializar los gráficos
function initializeCharts(data) {
    if (!data) return;
    
    // Inicializar gráfico de ingresos mensuales
    initIngresosMensualesChart(data);
    
    // Inicializar gráfico de egresos mensuales
    initEgresosMensualesChart(data);
    
    // Inicializar gráfico comparativo
    initComparativoFinancieroChart(data);
}

// Inicializar gráfico de ingresos mensuales
function initIngresosMensualesChart(data) {
    if (!data.monthlyIncome) return;
    
    const ctx = document.getElementById('ingresosMensuales');
    
    // Destruir el gráfico existente si lo hay
    if (ingresosMensualesChart) {
        ingresosMensualesChart.destroy();
    }
    
    const labels = data.monthlyIncome.map(item => item.monthName);
    const values = data.monthlyIncome.map(item => item.total);
    
    ingresosMensualesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos',
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ingresos ' + currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1),
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Inicializar gráfico de egresos mensuales
function initEgresosMensualesChart(data) {
    if (!data.monthlyExpenses) return;
    
    const ctx = document.getElementById('egresosMensuales');
    
    // Destruir el gráfico existente si lo hay
    if (egresosMensualesChart) {
        egresosMensualesChart.destroy();
    }
    
    const labels = data.monthlyExpenses.map(item => item.monthName);
    const values = data.monthlyExpenses.map(item => item.total);
    
    egresosMensualesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Egresos',
                data: values,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Egresos ' + currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1),
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Inicializar gráfico comparativo financiero
function initComparativoFinancieroChart(data) {
    if (!data.monthlyIncome || !data.monthlyExpenses) return;
    
    const ctx = document.getElementById('comparativoFinanciero');
    
    // Destruir el gráfico existente si lo hay
    if (comparativoFinancieroChart) {
        comparativoFinancieroChart.destroy();
    }
    
    // Obtener todos los meses que aparecen en cualquiera de los dos conjuntos de datos
    const allMonths = Array.from(new Set([
        ...data.monthlyIncome.map(item => item.month),
        ...data.monthlyExpenses.map(item => item.month)
    ])).sort((a, b) => a - b);
    
    // Crear etiquetas para los meses
    const labels = allMonths.map(monthNum => {
        return new Date(2025, monthNum - 1, 1).toLocaleString('es-ES', { month: 'long' });
    });
    
    // Crear arrays de datos
    const incomeData = allMonths.map(month => {
        const incomeItem = data.monthlyIncome.find(item => item.month === month);
        return incomeItem ? incomeItem.total : 0;
    });
    
    const expensesData = allMonths.map(month => {
        const expenseItem = data.monthlyExpenses.find(item => item.month === month);
        return expenseItem ? expenseItem.total : 0;
    });
    
    // Calcular balance (ingresos - egresos)
    const balanceData = allMonths.map((month, index) => {
        return incomeData[index] - expensesData[index];
    });
    
    comparativoFinancieroChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: incomeData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Egresos',
                    data: expensesData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Balance',
                    data: balanceData,
                    backgroundColor: balanceData.map(val => val >= 0 ? 'rgba(40, 167, 69, 0.6)' : 'rgba(220, 53, 69, 0.6)'),
                    borderColor: balanceData.map(val => val >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'),
                    borderWidth: 1,
                    type: 'line'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparativa: Ingresos vs Egresos',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Función para cambiar el periodo actual
function changePeriod(period) {
    currentPeriod = period;
    
    // Actualizar la UI
    document.querySelectorAll('.periodo-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.periodo-btn[data-periodo="${period}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Reinicializar el date range picker
    initDateRangePicker();
    
    // Refrescar los datos
    fetchDashboardData();
}

// Exportar reporte en Excel
async function exportToExcel() {
    try {
        if (!checkToken()) return;
        
        showToast('Información', 'Generando reporte de Excel...', 'info');
        
        const response = await fetch('/api/dashboard/export', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al exportar el reporte');
        }
        
        // Convertir la respuesta a blob
        const blob = await response.blob();
        
        // Crear un link para descargar
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_financiero_${moment().format('YYYYMMDD')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Éxito', 'Reporte exportado correctamente', 'success');
    } catch (error) {
        console.error('Error al exportar reporte:', error);
        showToast('Error', `No se pudo exportar el reporte: ${error.message}`, 'danger');
    }
}

// Exportar reporte en PDF
async function exportToPDF() {
    try {
        showToast('Información', 'Generando reporte PDF...', 'info');
        
        // Se utilizará la biblioteca html2pdf para generar el PDF
        // Primero debemos crear un elemento que contenga lo que queremos exportar
        const reportContent = document.createElement('div');
        reportContent.className = 'container p-4';
        
        // Agregar encabezado
        reportContent.innerHTML = `
            <div class="text-center mb-4">
                <h2>Reporte Financiero - GESCOOP</h2>
                <p>Período: ${$('#periodoDateRange').val()}</p>
                <p>Fecha de generación: ${moment().format('DD/MM/YYYY HH:mm')}</p>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5>Total Ingresos</h5>
                            <h3>${document.getElementById('totalIngresos').textContent}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5>Total Egresos</h5>
                            <h3>${document.getElementById('totalEgresos').textContent}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5>Total Préstamos</h5>
                            <h3>${document.getElementById('totalPrestamos').textContent}</h3>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Capturar los gráficos como imágenes (utilizando toDataURL)
        if (ingresosMensualesChart) {
            const ingresoImg = ingresosMensualesChart.toBase64Image();
            reportContent.innerHTML += `
                <div class="mb-4">
                    <h4>Ingresos ${currentPeriod}</h4>
                    <img src="${ingresoImg}" class="img-fluid" alt="Gráfico de Ingresos">
                </div>
            `;
        }
        
        if (egresosMensualesChart) {
            const egresosImg = egresosMensualesChart.toBase64Image();
            reportContent.innerHTML += `
                <div class="mb-4">
                    <h4>Egresos ${currentPeriod}</h4>
                    <img src="${egresosImg}" class="img-fluid" alt="Gráfico de Egresos">
                </div>
            `;
        }
        
        if (comparativoFinancieroChart) {
            const comparativoImg = comparativoFinancieroChart.toBase64Image();
            reportContent.innerHTML += `
                <div class="mb-4">
                    <h4>Comparativa: Ingresos vs Egresos</h4>
                    <img src="${comparativoImg}" class="img-fluid" alt="Gráfico Comparativo">
                </div>
            `;
        }
        
        // Agregar sección de préstamos al reporte
        if (prestamosChart) {
            const prestamosImg = prestamosChart.toBase64Image();
            reportContent.innerHTML += `
                <div class="mb-4">
                    <h4>Préstamos por Período</h4>
                    <img src="${prestamosImg}" class="img-fluid" alt="Gráfico de Préstamos">
                </div>
            `;
        }
        
        // Agregar el elemento al cuerpo del documento temporalmente
        document.body.appendChild(reportContent);
        
        // Configuración para html2pdf
        const options = {
            margin: 10,
            filename: `reporte_financiero_${moment().format('YYYYMMDD')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Generar el PDF
        html2pdf().from(reportContent).set(options).save();
        
        // Eliminar el elemento temporal
        setTimeout(() => {
            document.body.removeChild(reportContent);
        }, 1000);
        
        showToast('Éxito', 'Reporte PDF generado correctamente', 'success');
    } catch (error) {
        console.error('Error al exportar PDF:', error);
        showToast('Error', `No se pudo generar el PDF: ${error.message}`, 'danger');
    }
}

// Función para inicializar todos los eventos
function initEvents() {
    // Eventos para selección de período
    document.querySelectorAll('.periodo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            changePeriod(this.getAttribute('data-periodo'));
        });
    });
    
    // Evento para aplicar filtro de fecha
    document.getElementById('aplicarFiltro').addEventListener('click', function() {
        const dateRange = $('#periodoDateRange').data('daterangepicker');
        selectedDateRange = {
            startDate: dateRange.startDate.toDate(),
            endDate: dateRange.endDate.toDate()
        };
        fetchDashboardData();
    });
    
    // Evento para reiniciar filtro
    document.getElementById('reiniciarFiltro').addEventListener('click', function() {
        initDateRangePicker();
        fetchDashboardData();
    });
    
    // Eventos para exportación
    document.getElementById('exportExcel').addEventListener('click', function(e) {
        e.preventDefault();
        exportToExcel();
    });
    
    document.getElementById('exportPDF').addEventListener('click', function(e) {
        e.preventDefault();
        exportToPDF();
    });
    
    // Evento para ver detalle de préstamos
    document.getElementById('verDetallePrestamoBtn').addEventListener('click', function() {
        window.location.href = '/loans.html';
    });
}

// Inicialización cuando el documento esté listo
// Función para cargar los datos de préstamos según los filtros seleccionados
async function fetchPrestamosData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return null;
        }
        
        // Mostrar indicador de carga
        const tableBody = document.getElementById('tablaPrestamos');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin me-2"></i>Cargando préstamos...</td></tr>';
        }
          // Construir los parámetros de filtrado
        let params = new URLSearchParams();
        params.append('periodo', currentPrestamoPeriod);
        
        // Añadir el estado al filtro
        // Si es "todos", igualmente lo enviamos para que el backend lo procese
        params.append('estado', currentPrestamoEstado);
        
        console.log('Filtros aplicados:', {
            periodo: currentPrestamoPeriod,
            estado: currentPrestamoEstado
        });
        
        const response = await fetch(`/api/loans?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        // Obtener datos de la API
        const rawData = await response.json();
        
        // Transformar los datos al formato esperado
        const data = {
            loans: Array.isArray(rawData) ? rawData : (rawData.loans || []),
            chartData: prepareChartData(Array.isArray(rawData) ? rawData : (rawData.loans || []))
        };
        
        prestamosData = data;
        
        // Actualizar la tabla y el gráfico
        updatePrestamosTable(data);
        updatePrestamosChart(data);
        
        return data;
    } catch (error) {
        console.error('Error al cargar datos de préstamos:', error);
        showToast('Error', `No se pudieron cargar los préstamos: ${error.message}`, 'danger');
        
        // Mostrar mensaje de error en la tabla
        const tableBody = document.getElementById('tablaPrestamos');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>Error al cargar datos: ${error.message}
            </td></tr>`;
        }
        
        return null;
    }
}

// Función para preparar los datos del gráfico basado en los préstamos recibidos
function prepareChartData(loans) {
    // Verificar si hay préstamos
    if (!loans || !Array.isArray(loans) || loans.length === 0) {
        return {
            labels: [],
            activos: [],
            completados: [],
            cancelados: [],
            mora: []
        };
    }
    
    // Inicializar contadores según el período
    let labels = [];
    let activos = [];
    let completados = [];
    let cancelados = [];
    let mora = [];
    
    if (currentPrestamoPeriod === 'semanal') {
        labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        activos = new Array(7).fill(0);
        completados = new Array(7).fill(0);
        cancelados = new Array(7).fill(0);
        mora = new Array(7).fill(0);
        
        // Procesar los préstamos para el período semanal
        loans.forEach(loan => {
            const loanDate = new Date(loan.createdAt || loan.fecha || loan.date);
            const dayIndex = loanDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
            const dayMapped = dayIndex === 0 ? 6 : dayIndex - 1; // Convertir a 0 = Lunes, ..., 6 = Domingo
            
            const amount = parseFloat(loan.amount_requested || loan.monto_total || loan.amount || 0);            // Normalizar el estado y tener en cuenta posibles variaciones
            const status = (loan.estado || loan.status || loan.loan_status || '').toLowerCase();
            
            if (status.includes('activ')) {
                activos[dayMapped] += amount;
            } else if (status.includes('complet') || status.includes('pagad')) {
                completados[dayMapped] += amount;
            } else if (status.includes('cancel')) {
                cancelados[dayMapped] += amount;
            } else if (status.includes('mora') || status.includes('vencid')) {
                mora[dayMapped] += amount;
            } else {
                // Si no se puede determinar un estado específico, 
                // asignar al estado activo por defecto
                activos[dayMapped] += amount;
            }
        });
        
    } else if (currentPrestamoPeriod === 'mensual') {
        labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        activos = new Array(12).fill(0);
        completados = new Array(12).fill(0);
        cancelados = new Array(12).fill(0);
        mora = new Array(12).fill(0);
        
        // Procesar los préstamos para el período mensual
        loans.forEach(loan => {
            const loanDate = new Date(loan.createdAt || loan.fecha || loan.date);
            const monthIndex = loanDate.getMonth(); // 0 = Enero, ..., 11 = Diciembre
            
            const amount = parseFloat(loan.amount_requested || loan.monto_total || loan.amount || 0);            // Normalizar el estado y tener en cuenta posibles variaciones
            const status = (loan.estado || loan.status || loan.loan_status || '').toLowerCase();
            
            if (status.includes('activ')) {
                activos[monthIndex] += amount;
            } else if (status.includes('complet') || status.includes('pagad')) {
                completados[monthIndex] += amount;
            } else if (status.includes('cancel')) {
                cancelados[monthIndex] += amount;
            } else if (status.includes('mora') || status.includes('vencid')) {
                mora[monthIndex] += amount;
            } else {
                // Si no se puede determinar un estado específico, 
                // asignar al estado activo por defecto
                activos[monthIndex] += amount;
            }
        });
        
    } else { // anual
        const currentYear = new Date().getFullYear();
        labels = [currentYear-2, currentYear-1, currentYear, currentYear+1, currentYear+2];
        activos = new Array(5).fill(0);
        completados = new Array(5).fill(0);
        cancelados = new Array(5).fill(0);
        mora = new Array(5).fill(0);
        
        // Procesar los préstamos para el período anual
        loans.forEach(loan => {
            const loanDate = new Date(loan.createdAt || loan.fecha || loan.date);
            const year = loanDate.getFullYear();
            const yearIndex = labels.indexOf(year);
            
            if (yearIndex !== -1) {                const amount = parseFloat(loan.amount_requested || loan.monto_total || loan.amount || 0);
                // Normalizar el estado y tener en cuenta posibles variaciones
                const status = (loan.estado || loan.status || loan.loan_status || '').toLowerCase();
                
                if (status.includes('activ')) {
                    activos[yearIndex] += amount;
                } else if (status.includes('complet') || status.includes('pagad')) {
                    completados[yearIndex] += amount;
                } else if (status.includes('cancel')) {
                    cancelados[yearIndex] += amount;
                } else if (status.includes('mora') || status.includes('vencid')) {
                    mora[yearIndex] += amount;
                } else {
                    // Si no se puede determinar un estado específico, 
                    // asignar al estado activo por defecto
                    activos[yearIndex] += amount;
                }
            }
        });
    }
    
    return {
        labels,
        activos,
        completados,
        cancelados,
        mora
    };
}

// Función para validar si hay datos de préstamos para mostrar
function hayDatosParaMostrar(chartData) {
    if (!chartData) return false;
    
    const { activos, completados, cancelados, mora } = chartData;
    
    // Verificar si alguna de las series tiene datos mayores a 0
    const tieneActivos = Array.isArray(activos) && activos.some(v => v > 0);
    const tieneCompletados = Array.isArray(completados) && completados.some(v => v > 0);
    const tieneCancelados = Array.isArray(cancelados) && cancelados.some(v => v > 0);
    const tieneMora = Array.isArray(mora) && mora.some(v => v > 0);
    
    return tieneActivos || tieneCompletados || tieneCancelados || tieneMora;
}

// Función para actualizar la tabla de préstamos
function updatePrestamosTable(data) {
    const tableBody = document.getElementById('tablaPrestamos');
    const loans = data?.loans || [];
    
    if (!tableBody || loans.length === 0) {
        let messageText = 'No hay préstamos';
        
        if (currentPrestamoEstado !== 'todos') {
            messageText += ` en estado "${currentPrestamoEstado}"`;
        }
        
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">${messageText} en este momento</td></tr>`;
        return;
    }
    
    let html = '';
    
    // Filtrar los préstamos según el estado si es necesario
    const loansToShow = loans.filter(loan => {
        if (currentPrestamoEstado === 'todos') return true;
        
        const loanStatus = (loan.estado || loan.status || loan.loan_status || '').toLowerCase();
        
        if (currentPrestamoEstado === 'activos' && loanStatus.includes('activ')) return true;
        if (currentPrestamoEstado === 'completados' && (loanStatus.includes('complet') || loanStatus.includes('pagad'))) return true;
        if (currentPrestamoEstado === 'cancelados' && loanStatus.includes('cancel')) return true;
        if (currentPrestamoEstado === 'mora' && (loanStatus.includes('mora') || loanStatus.includes('vencid'))) return true;
        
        return false;
    });
    
    // Verificar si después del filtrado todavía hay préstamos
    if (loansToShow.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay préstamos en estado "${currentPrestamoEstado}" en este momento</td></tr>`;
        return;
    }
    
    // Limitar a un máximo de 10 préstamos para mantener la tabla manejable
    const maxToShow = Math.min(loansToShow.length, 10);
    
    for (let i = 0; i < maxToShow; i++) {
        const loan = loansToShow[i];
        
        // Normalizar datos del préstamo para manejar diferentes formatos de API
        const loanNumber = loan.loan_number || loan.numero || loan.id || '';
        const clientName = loan.client?.full_name || loan.Client?.full_name || loan.cliente_nombre || 'Cliente';
        const loanAmount = loan.amount_requested || loan.monto_total || loan.amount || 0;
        const loanDate = loan.fecha || loan.createdAt || loan.date || new Date();
        const loanStatus = loan.estado || loan.status || loan.loan_status || 'Activo';
        
        // Calcular progreso de pago
        let pagado = loan.pagado || loan.paid_amount || 0;
        let progreso = loanAmount > 0 ? (pagado / loanAmount) * 100 : 0;
        // Si no hay información de pago pero hay dato de cuotas
        if (progreso === 0 && loan.total_installments && loan.remaining_installments) {
            progreso = ((loan.total_installments - loan.remaining_installments) / loan.total_installments) * 100;
        }
        
        const estadoClass = getEstadoClass(loanStatus);
        
        html += `
            <tr>
                <td>${loanNumber}</td>
                <td>${clientName}</td>
                <td>${formatCurrency(loanAmount)}</td>
                <td>${formatDate(loanDate)}</td>
                <td><span class="badge ${estadoClass}">${loanStatus}</span></td>
                <td>
                    <div class="progress">
                        <div class="progress-bar bg-success" role="progressbar" 
                            style="width: ${progreso}%" 
                            aria-valuenow="${progreso}" 
                            aria-valuemin="0" 
                            aria-valuemax="100">
                            ${Math.round(progreso)}%
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Si hay más préstamos de los que mostramos, añadir una fila informativa
    if (loansToShow.length > maxToShow) {
        const remaining = loansToShow.length - maxToShow;
        html += `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    <i class="fas fa-info-circle me-2"></i>Y ${remaining} préstamo(s) más. Ver detalle completo para más información.
                </td>
            </tr>
        `;
    }
    
    tableBody.innerHTML = html;
}

// Función para obtener la clase CSS según el estado del préstamo
function getEstadoClass(estado) {
    const estadoLower = estado.toLowerCase();
    
    if (estadoLower.includes('activ')) {
        return 'bg-primary';
    } else if (estadoLower.includes('complet') || estadoLower.includes('pagad')) {
        return 'bg-success';
    } else if (estadoLower.includes('cancel')) {
        return 'bg-danger';
    } else if (estadoLower.includes('mora') || estadoLower.includes('vencid')) {
        return 'bg-warning';
    } else {
        return 'bg-secondary';
    }
}

// Función para actualizar el gráfico de préstamos
function updatePrestamosChart(data) {
    const ctx = document.getElementById('prestamosChart').getContext('2d');
    
    if (prestamosChart) {
        prestamosChart.destroy();
    }    if (!data || !data.chartData || !hayDatosParaMostrar(data.chartData)) {
        console.error('No hay datos para el gráfico de préstamos');
        // Mostrar un mensaje en el canvas cuando no hay datos
        const canvas = document.getElementById('prestamosChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No hay datos para el período y estado seleccionados', canvas.width / 2, canvas.height / 2);
            
            // Mensaje adicional con el estado y período actual
            ctx.font = '14px Arial';
            ctx.fillText(`Estado: ${currentPrestamoEstado} - Período: ${currentPrestamoPeriod}`, canvas.width / 2, (canvas.height / 2) + 30);
        }
        return;
    }
    
    console.log('Datos para el gráfico:', data.chartData);
    
    // Preparar los datos según el periodo seleccionado
    let labels;
    
    if (currentPrestamoPeriod === 'semanal') {
        labels = data.chartData.labels || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    } else if (currentPrestamoPeriod === 'mensual') {
        labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    } else { // anual
        labels = data.chartData.labels || Array.from({length: 5}, (_, i) => (new Date().getFullYear() - 2 + i).toString());
    }
    
    // Verificar si hay datos en los arrays
    const tieneActivos = Array.isArray(data.chartData.activos) && data.chartData.activos.some(v => v > 0);
    const tieneCompletados = Array.isArray(data.chartData.completados) && data.chartData.completados.some(v => v > 0);
    const tieneMora = Array.isArray(data.chartData.mora) && data.chartData.mora.some(v => v > 0);
    const tieneCancelados = Array.isArray(data.chartData.cancelados) && data.chartData.cancelados.some(v => v > 0);
    
    console.log('Tiene datos:', {tieneActivos, tieneCompletados, tieneMora, tieneCancelados});
    
    // Determinar qué conjuntos de datos mostrar según el filtro de estado
    const allDatasets = [
        {
            label: 'Préstamos Activos',
            data: data.chartData.activos || Array(labels.length).fill(0),
            backgroundColor: 'rgba(13, 110, 253, 0.5)',
            borderColor: 'rgba(13, 110, 253, 1)',
            borderWidth: 1
        },
        {
            label: 'Préstamos Completados',
            data: data.chartData.completados || Array(labels.length).fill(0),
            backgroundColor: 'rgba(25, 135, 84, 0.5)',
            borderColor: 'rgba(25, 135, 84, 1)',
            borderWidth: 1
        },
        {
            label: 'Préstamos en Mora',
            data: data.chartData.mora || Array(labels.length).fill(0),
            backgroundColor: 'rgba(255, 193, 7, 0.5)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 1
        },
        {
            label: 'Préstamos Cancelados',
            data: data.chartData.cancelados || Array(labels.length).fill(0),
            backgroundColor: 'rgba(220, 53, 69, 0.5)',
            borderColor: 'rgba(220, 53, 69, 1)',
            borderWidth: 1
        }
    ];
    
    // Filtrar los datasets según el estado seleccionado
    let datasets;
    if (currentPrestamoEstado === 'todos') {
        datasets = allDatasets;
    } else if (currentPrestamoEstado === 'activos') {
        datasets = [allDatasets[0]];
    } else if (currentPrestamoEstado === 'completados') {
        datasets = [allDatasets[1]];
    } else if (currentPrestamoEstado === 'mora') {
        datasets = [allDatasets[2]];
    } else if (currentPrestamoEstado === 'cancelados') {
        datasets = [allDatasets[3]];
    } else {
        datasets = allDatasets;
    }
    
    // Crear el gráfico    // Determinar el tipo adecuado de gráfico según el período
    let chartType = 'bar';
    if (currentPrestamoPeriod === 'anual') {
        // Para datos anuales es mejor usar líneas que barras
        chartType = datasets.length > 1 ? 'bar' : 'line';
    }
    
    // Título dinámico según el filtro seleccionado
    let titulo = 'Estadísticas de Préstamos';
    if (currentPrestamoEstado !== 'todos') {
        titulo += ` - ${currentPrestamoEstado.charAt(0).toUpperCase() + currentPrestamoEstado.slice(1)}`;
    }
    titulo += ` (${currentPrestamoPeriod})`;
    
    prestamosChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: titulo,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.raw);
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Monto (COP)',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: currentPrestamoPeriod === 'semanal' ? 'Día' : 
                             (currentPrestamoPeriod === 'mensual' ? 'Mes' : 'Año'),
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

// Función para inicializar los eventos relacionados con préstamos
function initPrestamoEvents() {
    // Botones de filtro de estado de préstamos
    document.querySelectorAll('.prestamo-estado-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.prestamo-estado-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPrestamoEstado = this.dataset.estado;
            
            // Aplicar filtro inmediatamente
            showToast('Información', 'Actualizando visualización...', 'info');
            fetchPrestamosData();
        });
    });
    
    // Botones de filtro de período de préstamos
    document.querySelectorAll('.prestamo-periodo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.prestamo-periodo-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPrestamoPeriod = this.dataset.periodo;
            
            // Aplicar filtro inmediatamente
            showToast('Información', 'Actualizando visualización...', 'info');
            fetchPrestamosData();
        });
    });
    
    // Botón aplicar filtros de préstamos
    const aplicarBtn = document.getElementById('aplicarFiltroPrestamos');
    if (aplicarBtn) {
        aplicarBtn.addEventListener('click', function() {
            showToast('Información', 'Actualizando datos de préstamos...', 'info');
            fetchPrestamosData();
        });
    }
    
    // Botón reiniciar filtros de préstamos
    const reiniciarBtn = document.getElementById('reiniciarFiltroPrestamos');
    if (reiniciarBtn) {
        reiniciarBtn.addEventListener('click', function() {
            // Resetear a los valores por defecto
            currentPrestamoPeriod = 'semanal';
            currentPrestamoEstado = 'todos';
            
            // Actualizar UI para reflejar estos cambios
            document.querySelectorAll('.prestamo-periodo-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.periodo === 'semanal') {
                    btn.classList.add('active');
                }
            });
            
            document.querySelectorAll('.prestamo-estado-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.estado === 'todos') {
                    btn.classList.add('active');
                }
            });
            
            showToast('Información', 'Filtros reiniciados', 'info');
            fetchPrestamosData();
        });
    }
    
    // Botón de detalle completo
    const detalleBtn = document.getElementById('verDetallePrestamoBtn');
    if (detalleBtn) {
        detalleBtn.addEventListener('click', function() {
            window.location.href = '/loans.html';
        });
    }
}

// Función para formatear fechas
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Verificar autenticación
        if (!await refreshToken()) return;
        
        // Inicializar el date range picker
        initDateRangePicker();
        
        // Inicializar eventos
        initEvents();
        initPrestamoEvents();
        
        // Cargar datos iniciales
        fetchDashboardData();
        fetchPrestamosData();
        
    } catch (error) {
        console.error('Error al inicializar la página:', error);
        showToast('Error', `Error al inicializar la página: ${error.message}`, 'danger');
    }
});
