document.addEventListener("DOMContentLoaded", () => {
    loadClients();

    // Event listener para crear cliente
    document.getElementById("createClientButton").addEventListener("click", () => {
        openClientModal();
    });

    // Event listener para búsqueda en tiempo real
    document.getElementById("tableSearch").addEventListener("keyup", filterTable);

    // Event listener para el sidebar
    document.getElementById("sidebarCollapse").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("active");
        document.getElementById("content").classList.toggle("active");
    });
});

function filterTable() {
    const searchText = document.getElementById("tableSearch").value.toLowerCase();
    const tbody = document.getElementById("clientTableBody");
    const rows = tbody.getElementsByTagName("tr");

    for (let row of rows) {
        const cells = row.getElementsByTagName("td");
        let found = false;
        
        for (let cell of cells) {
            if (cell.textContent.toLowerCase().includes(searchText)) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? "" : "none";
    }
}

async function loadClients() {
    try {
        const response = await fetch('/api/clients', {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar clientes');
        }

        const clients = await response.json();
        renderClients(clients);
    } catch (error) {
        console.error("Error:", error);
        showMessage("Error al cargar clientes", "error");
    }
}

function renderClients(clients) {
    const html = clients.map(client => `
        <tr>
            <td>${client.identification || 'No registrado'}</td>
            <td>${client.full_name || 'No registrado'}</td>
            <td>${client.email || 'No registrado'}</td>
            <td>${client.phone || 'No registrado'}</td>
            <td>${client.empresa || 'No registrada'}</td>
            <td>${formatMoney(client.deuda_total || 0)}</td>
            <td><span class="badge bg-${getStatusColor(client.estado_financiero)}">${client.estado_financiero || 'No definido'}</span></td>
            <td><span class="badge bg-${client.status === 'Activo' ? 'success' : 'danger'}">${client.status || 'No definido'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm action-btn" onclick="viewClientDetails('${client.identification}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm action-btn" onclick="editClient('${client.identification}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm action-btn" onclick="deleteClient('${client.identification}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    document.getElementById("clientTableBody").innerHTML = html;
}

function getStatusColor(status) {
    const colors = {
        'Al día': 'success',
        'En mora': 'warning',
        'Bloqueado': 'danger',
        'default': 'secondary'
    };
    return colors[status] || colors.default;
}

async function viewClientDetails(identification) {
    try {
        const response = await fetch(`/api/clients/by-identification/${identification}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al obtener detalles del cliente');
        }

        const client = await response.json();
        console.log('Cliente encontrado:', client); // Para debugging
        openClientModal(client, true); // true para modo lectura
    } catch (error) {
        console.error("Error:", error);
        showMessage(error.message, "error");
    }
}

function formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(amount);
}

function openClientModal(client = null, readOnly = false) {
    const modal = new bootstrap.Modal(document.getElementById('clientModal'));
    const form = document.getElementById('clientForm');
    form.reset();

    // Configurar título del modal
    document.getElementById('clientModalLabel').textContent = 
        readOnly ? 'Detalles del Cliente' : 
        client ? 'Editar Cliente' : 'Nuevo Cliente';

    if (client) {
        // Mapeo directo de campos
        const fields = {
            'fullName': client.full_name,
            'tipoDocumento': client.tipo_documento,
            'idNumber': client.identification,
            'fechaNacimiento': client.fecha_nacimiento,
            'genero': client.genero,
            'estadoCivil': client.estado_civil,
            'nacionalidad': client.nacionalidad,
            'telefonoMovil': client.phone,
            'telefonoFijo': client.telefono_fijo,
            'email': client.email,
            'ciudad': client.address,
            'codigoPostal': client.codigo_postal,
            'pais': client.pais,
            'numeroCuenta': client.numero_cuenta,
            'tipoCuenta': client.tipo_cuenta,
            'moneda': client.moneda,
            'limiteCredito': client.limite_credito,
            'ocupacion': client.ocupacion,
            'empresa': client.empresa,
            'sectorEconomico': client.sector_economico,
            'ingresosMensuales': client.ingresos_mensuales,
            'deudaTotal': client.deuda_total,
            'estadoFinanciero': client.estado_financiero,
            'status': client.status,
            'ultimo_pago': client.ultimo_pago
        };

        // Llenar cada campo del formulario
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'date' && value) {
                    // Formatear fechas
                    element.value = new Date(value).toISOString().split('T')[0];
                } else {
                    element.value = value || '';
                }
            }
        });
    }

    // Habilitar/deshabilitar campos según modo
    const inputs = form.getElementsByTagName('input');
    const selects = form.getElementsByTagName('select');
    const textareas = form.getElementsByTagName('textarea');
    
    [...inputs, ...selects, ...textareas].forEach(element => {
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

    modal.show();
}

async function saveClient() {
    try {
        const clientData = {
            // Asegurarnos de que los campos obligatorios estén presentes
            phone: document.getElementById('telefonoMovil').value,
            address: document.getElementById('ciudad').value,
            identification: document.getElementById('idNumber').value,
            ultimo_pago: document.getElementById('ultimo_pago').value,
            telefono_movil: document.getElementById('telefonoMovil').value, // Añadir este campo
            ciudad: document.getElementById('ciudad').value, // Añadir este campo

            // Resto de campos
            full_name: document.getElementById('fullName').value,
            tipo_documento: document.getElementById('tipoDocumento').value,
            fecha_nacimiento: document.getElementById('fechaNacimiento').value || null,
            genero: document.getElementById('genero').value,
            estado_civil: document.getElementById('estadoCivil').value,
            nacionalidad: document.getElementById('nacionalidad').value,
            telefono_fijo: document.getElementById('telefonoFijo').value,
            email: document.getElementById('email').value,
            codigo_postal: document.getElementById('codigoPostal').value,
            pais: document.getElementById('pais').value,
            numero_cuenta: document.getElementById('numeroCuenta').value,
            tipo_cuenta: document.getElementById('tipoCuenta').value,
            moneda: document.getElementById('moneda').value,
            limite_credito: document.getElementById('limiteCredito').value || 0,
            ocupacion: document.getElementById('ocupacion').value,
            empresa: document.getElementById('empresa').value,
            sector_economico: document.getElementById('sectorEconomico').value,
            ingresos_mensuales: document.getElementById('ingresosMensuales').value || 0,
            deuda_total: document.getElementById('deudaTotal').value || 0,
            estado_financiero: document.getElementById('estadoFinanciero').value || 'Al día',
            status: document.getElementById('status').value || 'Activo'
        };

        // Validar campos requeridos
        const requiredFields = ['phone', 'address', 'identification', 'ultimo_pago'];
        for (const field of requiredFields) {
            if (!clientData[field]) {
                throw new Error(`El campo ${field} es obligatorio`);
            }
        }

        // Primero verificar si el cliente ya existe
        const identification = clientData.identification;
        let method = 'POST';
        let url = '/api/clients';

        // Buscar si existe el cliente con esa identificación
        const checkResponse = await fetch(`/api/clients/by-identification/${identification}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (checkResponse.ok) {
            // Si el cliente existe, cambiamos a método PUT
            const existingClient = await checkResponse.json();
            method = 'PUT';
            url = `/api/clients/${existingClient.identification}`;
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(clientData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar cliente');
        }

        showMessage('Cliente guardado exitosamente', 'success');
        await loadClients();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('clientModal'));
        if (modal) {
            modal.hide();
        }
        
    } catch (error) {
        console.error("Error:", error);
        showMessage(error.message || "Error al guardar cliente", "error");
    }
}

async function editClient(identification) {
    try {
        const response = await fetch(`/api/clients/by-identification/${identification}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al obtener cliente');
        }

        const client = await response.json();
        openClientModal(client, false);
    } catch (error) {
        console.error("Error:", error);
        showMessage(error.message, "error");
    }
}

async function deleteClient(identification) {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;

    try {
        const response = await fetch(`/api/clients/by-identification/${identification}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar cliente');
        }

        showMessage('Cliente eliminado exitosamente', 'success');
        loadClients();
    } catch (error) {
        console.error("Error:", error);
        showMessage(error.message, "error");
    }
}

// Mejorar la función showMessage para usar notificaciones Bootstrap
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
