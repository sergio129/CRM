// Dashboard Controller
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Load dashboard data
    fetchDashboardData();
    
    // Initialize event handlers
    document.getElementById('sidebarCollapse').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });
    
    // Add event listener for period selector
    document.getElementById('periodSelector').addEventListener('change', function() {
        fetchDashboardData(this.value);
    });
});

// Fetch all dashboard data
async function fetchDashboardData(period = 'month') {
    try {
        const response = await fetch(`/api/dashboard?period=${period}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar datos del dashboard');
        }

        const data = await response.json();
        
        // Update dashboard counters
        updateDashboardCounters(data);
        
        // Initialize charts with the data
        initializeCharts(data);
        
        // Update financial summary
        updateFinancialSummary(data);
        
        // Update expenses by category visualization
        updateExpensesByCategory(data);
        
        // Update loan information
        updateLoanData(data);
        
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        showAlert('danger', `Error al cargar datos: ${error.message}`);
    }
}

// Update loan data in dashboard
function updateLoanData(data) {
    if (!data.loanData) return;
    
    // Update active loans count
    const activeLoansElement = document.getElementById('activeLoans');
    if (activeLoansElement) {
        activeLoansElement.textContent = data.loanData.activeLoans;
    }
    
    // Update total loan amount
    const totalLoanAmountElement = document.getElementById('totalLoanAmount');
    if (totalLoanAmountElement) {
        totalLoanAmountElement.textContent = new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(data.loanData.totalLoanAmount);
    }
    
    // Update pending payments
    const pendingPaymentsElement = document.getElementById('pendingPayments');
    if (pendingPaymentsElement) {
        pendingPaymentsElement.textContent = new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(data.loanData.pendingPayments);
    }
    
    // Update percentage changes in UI
    updatePercentageChange('activeLoans', data.loanData.changes.activeLoans);
    updatePercentageChange('totalLoanAmount', data.loanData.changes.totalLoanAmount);
    updatePercentageChange('pendingPayments', data.loanData.changes.pendingPayments);
    
    // Update progress bars
    if (data.loanData.totalLoanAmount > 0) {
        const progressElement = document.querySelector('.card:has(#totalLoanAmount) .progress-bar');
        if (progressElement) {
            const percentage = Math.min(100, (data.loanData.totalLoanAmount / (data.loanData.totalLoanAmount * 2)) * 100);
            progressElement.style.width = `${percentage}%`;
            progressElement.setAttribute('aria-valuenow', percentage);
        }
    }
    
    if (data.loanData.pendingPayments > 0 && data.loanData.totalLoanAmount > 0) {
        const progressElement = document.querySelector('.card:has(#pendingPayments) .progress-bar');
        if (progressElement) {
            const percentage = Math.min(100, (data.loanData.pendingPayments / data.loanData.totalLoanAmount) * 100);
            progressElement.style.width = `${percentage}%`;
            progressElement.setAttribute('aria-valuenow', percentage);
        }
    }
}

// Helper function to update percentage change indicators
function updatePercentageChange(elementId, changeValue) {
    const change = parseFloat(changeValue);
    const footerElement = document.querySelector(`.card:has(#${elementId}) .card-footer .badge`);
    
    if (footerElement) {
        // Update badge class based on value
        footerElement.classList.remove('bg-success', 'bg-danger', 'bg-warning');
        
        // Update icon and value
        if (change > 0) {
            footerElement.classList.add('bg-success');
            footerElement.innerHTML = `<i class="fas fa-arrow-up me-1"></i>${Math.abs(change)}%`;
        } else if (change < 0) {
            footerElement.classList.add('bg-danger');
            footerElement.innerHTML = `<i class="fas fa-arrow-down me-1"></i>${Math.abs(change)}%`;
        } else {
            footerElement.classList.add('bg-warning');
            footerElement.innerHTML = `<i class="fas fa-minus me-1"></i>${Math.abs(change)}%`;
        }
    }
}

// Update dashboard counters
function updateDashboardCounters(data) {
    // Update basic counters
    document.getElementById('totalClients').textContent = data.clientCount || 0;
    document.getElementById('totalEmployees').textContent = data.employeeCount || 0;
    document.getElementById('totalPayrolls').textContent = data.payrollCount || 0;
}

// Update financial summary
function updateFinancialSummary(data) {
    // Calculate total income from monthly data
    const totalIncome = data.monthlyIncome ? 
        data.monthlyIncome.reduce((sum, item) => sum + parseFloat(item.total || 0), 0) : 0;
    
    // Calculate total expenses from monthly data
    const totalExpenses = data.monthlyExpenses ? 
        data.monthlyExpenses.reduce((sum, item) => sum + parseFloat(item.total || 0), 0) : 0;
    
    // Calculate balance
    const balance = totalIncome - totalExpenses;
    
    // Format currency values
    const formatter = new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP',
        minimumFractionDigits: 0
    });
    
    // Update UI elements
    document.getElementById('totalIncome').textContent = formatter.format(totalIncome);
    document.getElementById('totalExpenses').textContent = formatter.format(totalExpenses);
    document.getElementById('totalBalance').textContent = formatter.format(balance);
    
    // Update balance card styling based on value
    const balanceCard = document.getElementById('balanceCard');
    const balanceProgress = document.getElementById('balanceProgress');
    
    if (balance > 0) {
        balanceCard.classList.add('border-success');
        document.getElementById('totalBalance').classList.add('text-success');
        balanceProgress.classList.add('bg-success');
        balanceProgress.style.width = Math.min((totalIncome / (totalExpenses || 1)) * 50, 100) + '%';
    } else if (balance < 0) {
        balanceCard.classList.add('border-danger');
        document.getElementById('totalBalance').classList.add('text-danger');
        balanceProgress.classList.add('bg-danger');
        balanceProgress.style.width = Math.min((totalExpenses / (totalIncome || 1)) * 50, 100) + '%';
    } else {
        balanceCard.classList.add('border-warning');
        document.getElementById('totalBalance').classList.add('text-warning');
        balanceProgress.classList.add('bg-warning');
        balanceProgress.style.width = '50%';
    }
}

// Update expenses by category visualization
function updateExpensesByCategory(data) {
    if (!data.expensesByCategory || data.expensesByCategory.length === 0) {
        return;
    }
    
    // Ordenar categorías por monto total (descendente)
    const sortedExpenses = [...data.expensesByCategory].sort((a, b) => b.total - a.total);
    
    // Calcular el total de todos los egresos
    const totalExpenses = sortedExpenses.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    
    // Obtener el top 5 de categorías
    const top5Expenses = sortedExpenses.slice(0, 5);
    
    // Si hay más de 5 categorías, agrupar el resto en "Otros"
    let chartData = [...top5Expenses];
    if (sortedExpenses.length > 5) {
        const otherExpensesTotal = sortedExpenses
            .slice(5)
            .reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
        
        chartData.push({
            categoryName: 'Otros',
            categoryId: 'others',
            total: otherExpensesTotal
        });
    }
    
    // Crear gráfico de distribución de egresos por categoría
    const ctx = document.getElementById('expensesByCategoryChart');
    if (ctx) {
        // Destroy existing chart if it exists and is a valid Chart object
        if (window.expensesByCategoryChart && typeof window.expensesByCategoryChart.destroy === 'function') {
            window.expensesByCategoryChart.destroy();
        }
        
        try {
            window.expensesByCategoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartData.map(item => item.categoryName),
                    datasets: [{
                        data: chartData.map(item => item.total),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(255, 159, 64, 0.6)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const percentage = ((value / totalExpenses) * 100).toFixed(2);
                                    return `${label}: ${new Intl.NumberFormat('es-CO', { 
                                        style: 'currency', 
                                        currency: 'COP',
                                        minimumFractionDigits: 0
                                    }).format(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Error al crear el gráfico de egresos por categoría:", error);
        }
    }
    
    // Actualizar tabla de top 5 categorías
    const tableBody = document.getElementById('topExpensesTable');
    if (tableBody) {
        // Formatear moneda
        const formatter = new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP',
            minimumFractionDigits: 0
        });
        
        // Generar filas de la tabla
        let tableContent = '';
        top5Expenses.forEach(item => {
            const percentage = ((item.total / totalExpenses) * 100).toFixed(2);
            tableContent += `
                <tr>
                    <td>${item.categoryName}</td>
                    <td class="text-end">${formatter.format(item.total)}</td>
                    <td class="text-end">${percentage}%</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableContent;
    }
}

// Initialize dashboard charts
function initializeCharts(data) {
    // Gráfico de egresos mensuales
    if (data.monthlyExpenses && data.monthlyExpenses.length > 0) {
        const monthLabels = data.monthlyExpenses.map(item => item.monthName);
        const expensesData = data.monthlyExpenses.map(item => item.total);
        
        // Destroy existing chart if it exists and is a valid Chart object
        if (window.monthlyExpensesChart && typeof window.monthlyExpensesChart.destroy === 'function') {
            window.monthlyExpensesChart.destroy();
        }
        
        const monthlyExpensesCtx = document.getElementById('monthlyExpensesChart');
        if (!monthlyExpensesCtx) {
            console.error("No se encontró el elemento canvas 'monthlyExpensesChart'");
            return;
        }
        
        try {
            window.monthlyExpensesChart = new Chart(monthlyExpensesCtx, {
                type: 'line',
                data: {
                    labels: monthLabels,
                    datasets: [{
                        label: 'Egresos Mensuales',
                        data: expensesData,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Egresos Mensuales'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('es-CO', { 
                                            style: 'currency', 
                                            currency: 'COP',
                                            minimumFractionDigits: 0
                                        }).format(context.parsed.y);
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
                                    return new Intl.NumberFormat('es-CO', { 
                                        style: 'currency', 
                                        currency: 'COP',
                                        minimumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Error al crear el gráfico de egresos mensuales:", error);
        }
    }
    
    // Gráfico de ingresos mensuales
    if (data.monthlyIncome && data.monthlyIncome.length > 0) {
        const monthLabels = data.monthlyIncome.map(item => item.monthName);
        const incomeData = data.monthlyIncome.map(item => item.total);
        
        // Destroy existing chart if it exists and is a valid Chart object
        if (window.monthlyIncomeChart && typeof window.monthlyIncomeChart.destroy === 'function') {
            window.monthlyIncomeChart.destroy();
        }
        
        const monthlyIncomeCtx = document.getElementById('monthlyIncomeChart');
        if (!monthlyIncomeCtx) {
            console.error("No se encontró el elemento canvas 'monthlyIncomeChart'");
            return;
        }
        
        try {
            window.monthlyIncomeChart = new Chart(monthlyIncomeCtx, {
                type: 'line',
                data: {
                    labels: monthLabels,
                    datasets: [{
                        label: 'Ingresos Mensuales',
                        data: incomeData,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Ingresos Mensuales'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('es-CO', { 
                                            style: 'currency', 
                                            currency: 'COP',
                                            minimumFractionDigits: 0
                                        }).format(context.parsed.y);
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
                                    return new Intl.NumberFormat('es-CO', { 
                                        style: 'currency', 
                                        currency: 'COP',
                                        minimumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Error al crear el gráfico de ingresos mensuales:", error);
        }
    }
    
    // Gráfico comparativo de ingresos vs egresos
    if (data.monthlyIncome && data.monthlyExpenses) {
        // Obtener solo los meses que tienen datos en ambos conjuntos
        const months = Array.from(new Set([
            ...data.monthlyIncome.map(item => item.month),
            ...data.monthlyExpenses.map(item => item.month)
        ])).sort((a, b) => a - b);
        
        // Crear etiquetas para los meses
        const monthLabels = months.map(monthNum => {
            return new Date(2025, monthNum - 1, 1).toLocaleString('es-ES', { month: 'long' });
        });
        
        // Crear arrays de datos
        const incomeData = months.map(month => {
            const incomeItem = data.monthlyIncome.find(item => item.month === month);
            return incomeItem ? incomeItem.total : 0;
        });
        
        const expensesData = months.map(month => {
            const expenseItem = data.monthlyExpenses.find(item => item.month === month);
            return expenseItem ? expenseItem.total : 0;
        });
        
        // Crear array de balance (ingresos - egresos)
        const balanceData = months.map((month, index) => {
            return incomeData[index] - expensesData[index];
        });
        
        // Destroy existing chart if it exists and is a valid Chart object
        if (window.incomeVsExpensesChart && typeof window.incomeVsExpensesChart.destroy === 'function') {
            window.incomeVsExpensesChart.destroy();
        }
        
        const incomeVsExpensesCtx = document.getElementById('incomeVsExpensesChart');
        if (!incomeVsExpensesCtx) {
            console.error("No se encontró el elemento canvas 'incomeVsExpensesChart'");
            return;
        }
        
        try {
            window.incomeVsExpensesChart = new Chart(incomeVsExpensesCtx, {
                type: 'bar',
                data: {
                    labels: monthLabels,
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
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Balance',
                            data: balanceData,
                            backgroundColor: balanceData.map(val => val >= 0 ? 'rgba(40, 167, 69, 0.6)' : 'rgba(220, 53, 69, 0.6)'),
                            borderColor: balanceData.map(val => val >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'),
                            borderWidth: 1,
                            type: 'bar'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Comparativa Mensual: Ingresos vs Egresos'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('es-CO', { 
                                            style: 'currency', 
                                            currency: 'COP',
                                            minimumFractionDigits: 0
                                        }).format(context.parsed.y);
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
                                    return new Intl.NumberFormat('es-CO', { 
                                        style: 'currency', 
                                        currency: 'COP',
                                        minimumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Error al crear el gráfico comparativo:", error);
        }
    }
}

// Search client by ID
async function searchClient() {
    const clientId = document.getElementById('clientId').value.trim();
    if (!clientId) {
        showAlert('warning', 'Por favor ingrese un número de identificación');
        return;
    }

    try {
        const response = await fetch(`/api/dashboard/client/${clientId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Cliente no encontrado');
        }

        const client = await response.json();
        
        // Mostrar resultado en un formato más elegante
        document.getElementById('clientResult').innerHTML = `
            <div class="card mt-3">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Información del Cliente</h5>
                </div>
                <div class="card-body">
                    <h5>${client.name} ${client.lastName}</h5>
                    <p><strong>ID:</strong> ${client.idNumber}</p>
                    <p><strong>Email:</strong> ${client.email}</p>
                    <p><strong>Teléfono:</strong> ${client.phone}</p>
                    <p><strong>Estado de pago:</strong> 
                        <span class="badge ${client.paymentStatus === 'Al día' ? 'bg-success' : 
                                         client.paymentStatus === 'En mora' ? 'bg-danger' : 
                                         'bg-warning'}">
                            ${client.paymentStatus}
                        </span>
                    </p>
                    <p><strong>Deuda total:</strong> ${new Intl.NumberFormat('es-CO', { 
                        style: 'currency', 
                        currency: 'COP' 
                    }).format(client.deudaTotal)}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        showAlert('danger', `Error: ${error.message}`);
        document.getElementById('clientResult').innerHTML = `
            <div class="alert alert-danger mt-3">
                No se encontró ningún cliente con esa identificación.
            </div>
        `;
    }
}

// Export dashboard report
function exportDashboardReport() {
    try {
        fetch('/api/dashboard/export', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al exportar reporte');
            }
            return response.blob();
        })
        .then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `dashboard_report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showAlert('success', 'Reporte exportado con éxito');
        });
    } catch (error) {
        console.error('Error al exportar reporte:', error);
        showAlert('danger', `Error al exportar reporte: ${error.message}`);
    }
}

// Utility function to show alerts
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Append to some container
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}
