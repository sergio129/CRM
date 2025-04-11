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
});

// Fetch all dashboard data
async function fetchDashboardData() {
    try {
        const response = await fetch('/api/dashboard', {
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
        
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        showAlert('danger', `Error al cargar datos: ${error.message}`);
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
        new Chart(ctx, {
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
    // Client distribution chart (bar chart)
    if (data.clientsByType && data.clientsByType.length > 0) {
        const clientLabels = data.clientsByType.map(item => item.type);
        const clientData = data.clientsByType.map(item => item.count);
        
        new Chart(document.getElementById('clientsChart'), {
            type: 'bar',
            data: {
                labels: clientLabels,
                datasets: [{
                    label: 'Clientes por Tipo',
                    data: clientData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Clientes por Tipo'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Client percentage chart (pie chart)
    if (data.clientsByType && data.clientsByType.length > 0) {
        const clientLabels = data.clientsByType.map(item => item.type);
        const clientData = data.clientsByType.map(item => item.count);
        
        new Chart(document.getElementById('clientsPercentageChart'), {
            type: 'pie',
            data: {
                labels: clientLabels,
                datasets: [{
                    data: clientData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Porcentaje de Clientes por Tipo'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Gráfico de egresos mensuales
    if (data.monthlyExpenses && data.monthlyExpenses.length > 0) {
        const monthLabels = data.monthlyExpenses.map(item => item.monthName);
        const expensesData = data.monthlyExpenses.map(item => item.total);
        
        new Chart(document.getElementById('monthlyExpensesChart'), {
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
    }
    
    // Gráfico de ingresos mensuales
    if (data.monthlyIncome && data.monthlyIncome.length > 0) {
        const monthLabels = data.monthlyIncome.map(item => item.monthName);
        const incomeData = data.monthlyIncome.map(item => item.total);
        
        new Chart(document.getElementById('monthlyIncomeChart'), {
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
        
        // Crear el gráfico
        new Chart(document.getElementById('incomeVsExpensesChart'), {
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
