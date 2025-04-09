// Dashboard Controller
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
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
        
        const resultElement = document.getElementById('clientResult');
        
        if (!response.ok) {
            if (response.status === 404) {
                resultElement.innerHTML = `<div class="alert alert-warning">No se encontró cliente con identificación ${clientId}</div>`;
            } else {
                throw new Error('Error al buscar cliente');
            }
            return;
        }
        
        const client = await response.json();
        
        resultElement.innerHTML = `
            <div class="card mt-3">
                <div class="card-header bg-info text-white">
                    <strong>${client.name} ${client.lastName}</strong>
                </div>
                <div class="card-body">
                    <p><strong>Identificación:</strong> ${client.idNumber}</p>
                    <p><strong>Tipo:</strong> ${client.clientType || 'No especificado'}</p>
                    <p><strong>Email:</strong> ${client.email || 'No especificado'}</p>
                    <p><strong>Teléfono:</strong> ${client.phone || 'No especificado'}</p>
                    <a href="/clientes.html?id=${client.id}" class="btn btn-primary btn-sm">Ver detalles</a>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        showAlert('danger', `Error al buscar cliente: ${error.message}`);
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
