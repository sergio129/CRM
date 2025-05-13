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
        
        const response = await fetch('/api/users/verify-token', {
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
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Verificar autenticación
        if (!await refreshToken()) return;
        
        // Inicializar el date range picker
        initDateRangePicker();
        
        // Inicializar eventos
        initEvents();
        
        // Cargar datos iniciales
        fetchDashboardData();
        
    } catch (error) {
        console.error('Error al inicializar la página:', error);
        showToast('Error', `Error al inicializar la página: ${error.message}`, 'danger');
    }
});
