document.addEventListener('DOMContentLoaded', function() {
    // Check for authentication token
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load dashboard data
    loadDashboardData();
    
    // Set up event listeners
    document.getElementById('exportReportBtn')?.addEventListener('click', exportDashboardReport);
    document.getElementById('searchClientForm')?.addEventListener('submit', searchClientById);
});

// Function to load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar los datos del dashboard');
        }

        const data = await response.json();
        
        // Update dashboard counters
        document.getElementById('totalClientsCount').textContent = data.clientCount || 0;
        document.getElementById('totalEmployeesCount').textContent = data.employeeCount || 0;
        document.getElementById('totalPayrollsCount').textContent = data.payrollCount || 0;
        
        // Update client type chart if it exists
        if(data.clientsByType && data.clientsByType.length > 0) {
            createClientTypeChart(data.clientsByType);
        }
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showAlert('Error al cargar los datos del dashboard', 'error');
    }
}

// Function to create client type chart
function createClientTypeChart(clientsByType) {
    const chartContainer = document.getElementById('clientTypeChart');
    if(!chartContainer) return;
    
    // Prepare data for chart
    const labels = clientsByType.map(item => item.type);
    const counts = clientsByType.map(item => item.count);
    
    // Create chart
    new Chart(chartContainer, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: [
                    '#4e73df',
                    '#1cc88a',
                    '#36b9cc',
                    '#f6c23e',
                    '#e74a3b'
                ],
                hoverBackgroundColor: [
                    '#2e59d9',
                    '#17a673',
                    '#2c9faf',
                    '#dda20a',
                    '#be2617'
                ],
                hoverBorderColor: "rgba(234, 236, 244, 1)"
            }]
        },
        options: {
            maintainAspectRatio: false,
            tooltips: {
                backgroundColor: "rgb(255,255,255)",
                bodyFontColor: "#858796",
                borderColor: '#dddfeb',
                borderWidth: 1,
                xPadding: 15,
                yPadding: 15,
                displayColors: false,
                caretPadding: 10
            },
            legend: {
                display: false
            },
            cutoutPercentage: 80
        }
    });
}

// Function to export dashboard report
async function exportDashboardReport(e) {
    e.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard/export', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al exportar el reporte');
        }

        // Convert response to blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Reporte exportado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error exportando reporte:', error);
        showAlert('Error al exportar el reporte', 'error');
    }
}

// Function to search client by ID
async function searchClientById(e) {
    e.preventDefault();
    
    const idNumber = document.getElementById('clientIdNumber').value.trim();
    if (!idNumber) {
        showAlert('Por favor ingrese un número de identificación', 'warning');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/dashboard/client/${idNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 404) {
            showAlert('Cliente no encontrado', 'warning');
            document.getElementById('clientInfo').style.display = 'none';
            return;
        }

        if (!response.ok) {
            throw new Error('Error al buscar el cliente');
        }

        const client = await response.json();
        
        // Display client info
        document.getElementById('clientName').textContent = `${client.name} ${client.lastName || ''}`;
        document.getElementById('clientEmail').textContent = client.email || 'No especificado';
        document.getElementById('clientPhone').textContent = client.phone || 'No especificado';
        document.getElementById('clientType').textContent = client.clientType || 'No especificado';
        
        // Show client info section
        document.getElementById('clientInfo').style.display = 'block';
        
    } catch (error) {
        console.error('Error buscando cliente:', error);
        showAlert('Error al buscar el cliente', 'error');
    }
}

// Helper function to show alerts
function showAlert(message, type = 'info') {
    // Check if we have a notifications container
    let container = document.getElementById('alertsContainer');
    
    // If no container exists, create one
    if (!container) {
        container = document.createElement('div');
        container.id = 'alertsContainer';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    // Add to container
    container.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            container.removeChild(alert);
        }, 300);
    }, 5000);
}