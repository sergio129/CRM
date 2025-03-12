document.addEventListener("DOMContentLoaded", () => {
    loadEmployees(1); // Cargar la primera página de empleados
    loadRoles(); // Cargar roles al cargar la página
    loadIdTypes(); // Cargar tipos de identificación al cargar la página

    document.getElementById("createEmployeeButton").addEventListener("click", openEmployeeModal);
    document.getElementById("deleteSelectedButton").addEventListener("click", openDeleteModal);
    document.getElementById("selectAllCheckbox").addEventListener("change", toggleSelectAll);

    // Agregar manejo del sidebar
    document.getElementById("sidebarCollapse").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("active");
        document.getElementById("content").classList.toggle("active");
    });

    // Mostrar nombre del archivo seleccionado
    document.getElementById("excelFileInput").addEventListener("change", function() {
        const fileName = this.files[0]?.name;
        if (fileName) {
            showToast(`Archivo seleccionado: ${fileName}`);
        }
    });

    // Agregar event listener para búsqueda en tiempo real
    document.getElementById("tableSearch").addEventListener("keyup", filterTable);
});

async function loadEmployees(page = 1) {
    try {
        const response = await fetch(`/api/employees?page=${page}&limit=30`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al obtener empleados: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const { employees, totalPages } = await response.json();
        renderEmployees(employees);
        renderPagination(totalPages, page);
    } catch (error) {
        console.error("Error al obtener empleados:", error);
        alert("Error al obtener empleados: " + error.message);
    }
}

function renderEmployees(employees) {
    const html = employees.map(employee => `
        <tr>
            <td>${employee.id_number || 'No registrado'}</td>
            <td>${employee.full_name || 'No registrado'}</td>
            <td>${employee.email || 'No registrado'}</td>
            <td>${employee.phone || 'No registrado'}</td>
            <td>${employee.address || 'No registrada'}</td>
            <td>${employee.role || 'No asignado'}</td>
            <td>${formatMoney(employee.salario_base || 0)}</td>
            <td><span class="badge bg-${employee.status === 'Activo' ? 'success' : 'danger'}">${employee.status || 'No definido'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm action-btn" onclick="viewEmployeeDetails('${employee.id_number}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm action-btn" onclick="editEmployee('${employee.id_number}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm action-btn" onclick="deleteEmployee('${employee.id_number}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    document.getElementById('employeeTableBody').innerHTML = html;
}

// Agregar función para formatear moneda
function formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(amount);
}

function renderPagination(totalPages, currentPage) {
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadEmployees(${i})">${i}</a>
                 </li>`;
    }
    document.getElementById("pagination").innerHTML = html;
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const checkboxes = document.querySelectorAll('.employee-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = selectAllCheckbox.checked);
    
    // Solo abrir el modal si hay checkboxes seleccionados
    if (selectAllCheckbox.checked && checkboxes.length > 0) {
        openDeleteModal();
    }
}

function openDeleteModal() {
    const selectedIds = Array.from(document.querySelectorAll('.employee-checkbox:checked')).map(checkbox => checkbox.value);
    if (selectedIds.length === 0) {
        alert("Por favor, seleccione al menos un empleado para eliminar.");
        // Desmarcar el checkbox principal si no hay selecciones
        document.getElementById('selectAllCheckbox').checked = false;
        return;
    }
    new bootstrap.Modal(document.getElementById("deleteModal")).show();
}

// Agregar esta función para mostrar el toast
function showToast(message) {
    const toastElement = document.getElementById('successToast');
    const toast = new bootstrap.Toast(toastElement);
    toastElement.querySelector('.toast-body').textContent = message;
    toast.show();
}

async function deleteSelectedEmployees() {
    const selectedIds = Array.from(document.querySelectorAll('.employee-checkbox:checked')).map(checkbox => checkbox.value);

    try {
        const response = await fetch('/api/employees/bulk-delete', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ ids: selectedIds }),
        });

        if (!response.ok) {
            throw new Error("Error al eliminar los empleados seleccionados");
        }

        // Desmarcar todos los checkboxes después de eliminar
        document.getElementById('selectAllCheckbox').checked = false;
        document.querySelectorAll('.employee-checkbox').forEach(checkbox => checkbox.checked = false);
        
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById("deleteModal"));
        modal.hide();
        
        // Mostrar el toast en lugar del alert
        showToast("Empleados eliminados correctamente");
        loadEmployees();
    } catch (error) {
        console.error("Error al eliminar los empleados seleccionados:", error);
        alert("Error al eliminar los empleados seleccionados");
    }
}

async function loadRoles() {
    try {
        const response = await fetch('/api/roles', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener roles.");
        }

        const roles = await response.json();
        const roleSelect = document.getElementById("role");
        roles.forEach(role => {
            const option = document.createElement("option");
            option.value = role.role_name;
            option.textContent = role.role_name;
            roleSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error al obtener roles:", error);
        alert("Error al obtener roles.");
    }
}

async function loadIdTypes() {
    try {
        const response = await fetch('/api/id_types', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener tipos de identificación.");
        }

        const idTypes = await response.json();
        const idTypeSelect = document.getElementById("idType");
        idTypes.forEach(idType => {
            const option = document.createElement("option");
            option.value = idType.id;
            option.textContent = idType.type_name;
            idTypeSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error al obtener tipos de identificación:", error);
        alert("Error al obtener tipos de identificación.");
    }
}

function openEmployeeModal(employee = null, readOnly = false) {
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    const form = document.getElementById('employeeForm');
    form.reset();

    // Configurar título del modal
    document.getElementById('employeeModalLabel').textContent = 
        readOnly ? 'Detalles del Empleado' : 
        employee ? 'Editar Empleado' : 'Nuevo Empleado';

    if (employee) {
        // Mapeo de campos del empleado a los IDs del formulario
        const fieldMapping = {
            id_number: 'idNumber',
            full_name: 'fullName',
            email: 'email',
            phone: 'phone',
            address: 'address',
            role: 'role',
            department: 'department',
            position: 'position',
            hire_date: 'hireDate',
            tipo_contrato: 'tipoContrato',
            salario_base: 'salarioBase',
            eps: 'eps',
            banco: 'banco',
            tipo_cuenta: 'tipoCuenta',
            cuenta_bancaria: 'cuentaBancaria',
            fondo_pension: 'fondoPension',
            fondo_cesantias: 'fondoCesantias',
            caja_compensacion: 'cajaCompensacion',
            status: 'status'
        };

        // Llenar los campos del formulario
        Object.entries(fieldMapping).forEach(([apiField, formId]) => {
            const input = document.getElementById(formId);
            if (input && employee[apiField] !== undefined) {
                // Formatear fechas
                if (input.type === 'date' && employee[apiField]) {
                    input.value = new Date(employee[apiField]).toISOString().split('T')[0];
                }
                // Formatear valores numéricos
                else if (input.type === 'number' && employee[apiField]) {
                    input.value = parseFloat(employee[apiField]);
                }
                // Resto de campos
                else {
                    input.value = employee[apiField] || '';
                }
            }
        });
    }

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

    if (employee) {
        // Establecer los valores en el formulario
        document.getElementById("fullName").value = employee.full_name;
        document.getElementById("email").value = employee.email;
        document.getElementById("phone").value = employee.phone;
        document.getElementById("address").value = employee.address;
        document.getElementById("role").value = employee.role;
        document.getElementById("idType").value = employee.id_type_id;
        document.getElementById("idNumber").value = employee.id_number;
        document.getElementById("department").value = employee.department;
        document.getElementById("position").value = employee.position;
        document.getElementById("hireDate").value = employee.hire_date;
        document.getElementById("tipo_contrato").value = employee.tipo_contrato || 'Indefinido';
        document.getElementById("salario_base").value = employee.salario_base || employee.salary || 0;
        document.getElementById("riesgo_arl").value = employee.riesgo_arl || '1';
        document.getElementById("eps").value = employee.eps;
        document.getElementById("fondo_pension").value = employee.fondo_pension;
        document.getElementById("fondo_cesantias").value = employee.fondo_cesantias;
        document.getElementById("caja_compensacion").value = employee.caja_compensacion;
        document.getElementById("status").value = employee.status || 'Activo';
    }

    new bootstrap.Modal(document.getElementById("employeeModal")).show();
}

function openBankInfoModal() {
    new bootstrap.Modal(document.getElementById("bankInfoModal")).show();
}

function validateAndSaveEmployee() {
    const form = document.getElementById("employeeForm");
    const inputs = form.querySelectorAll("input, select");
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
        saveEmployee();
    }
}

async function saveEmployee() {
    const employeeId = document.getElementById("employeeId").value;
    const url = employeeId ? `/api/employees/${employeeId}` : "/api/employees";
    const method = employeeId ? "PUT" : "POST";

    // Agregar console.log para debuggear
    console.log("Valores de los campos:", {
        hire_date: document.getElementById("hireDate").value,
        eps: document.getElementById("eps").value,
        fondo_pension: document.getElementById("fondo_pension").value,
        fondo_cesantias: document.getElementById("fondo_cesantias").value,
        caja_compensacion: document.getElementById("caja_compensacion").value
    });

    const salarioBase = parseFloat(document.getElementById("salario_base").value) || 0;
    // Leer explícitamente los demás campos, usando trim() para evitar espacios en blanco
    const employeeData = {
        full_name: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        role: document.getElementById("role").value,
        id_type_id: document.getElementById("idType").value,
        id_number: document.getElementById("idNumber").value.trim(),
        department: document.getElementById("department").value.trim(),
        position: document.getElementById("position").value.trim(),
        hire_date: document.getElementById("hireDate").value, // Fecha de Ingreso con formato YYYY-MM-DD
        tipo_contrato: document.getElementById("tipo_contrato").value,
        salario_base: salarioBase,
        riesgo_arl: document.getElementById("riesgo_arl").value,
        eps: document.getElementById("eps").value.trim(),
        fondo_pension: document.getElementById("fondo_pension").value.trim(),
        fondo_cesantias: document.getElementById("fondo_cesantias").value.trim(),
        caja_compensacion: document.getElementById("caja_compensacion").value.trim(),
        status: document.getElementById("status").value
    };

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(employeeData),
        });

        // Agregar console.log para ver la respuesta del servidor
        const responseData = await response.json();
        console.log("Respuesta del servidor:", responseData);

        if (!response.ok) {
            throw new Error("Error al guardar el empleado: " + responseData.message);
        }

        showToast(`Empleado ${employeeId ? "actualizado" : "creado"} correctamente`);
        
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById("employeeModal"));
        modal.hide();
        
        // Recargar la lista de empleados
        loadEmployees();
    } catch (error) {
        console.error("Error al guardar el empleado:", error);
        showToast("Error al guardar el empleado: " + error.message);
    }
}

async function editEmployee(id_number) {
    try {
        const response = await fetch(`/api/employees/by-id-number/${id_number}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener empleado');
        }

        const employee = await response.json();
        openEmployeeModal(employee, false); // false para modo edición
    } catch (error) {
        console.error("Error:", error);
        showMessage(error.message, "error");
    }
}

async function deleteEmployee(employeeId) {
    try {
        // Primero obtener el empleado por número de identificación
        const searchResponse = await fetch(`/api/employees/by-id-number/${employeeId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!searchResponse.ok) {
            throw new Error("No se encontró el empleado");
        }

        const employee = await searchResponse.json();

        if (!confirm("¿Estás seguro de eliminar este empleado?")) return;

        const deleteResponse = await fetch(`/api/employees/${employee.id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (!deleteResponse.ok) {
            throw new Error("Error al eliminar el empleado");
        }

        showToast("Empleado eliminado correctamente");
        loadEmployees();
    } catch (error) {
        console.error("Error al eliminar el empleado:", error);
        showToast("Error al eliminar el empleado: " + error.message);
    }
}

async function saveBankInfo() {
    const employeeId = document.getElementById("employeeId").value;
    const bankInfoData = {
        employee_id: employeeId,
        bank_account_number: document.getElementById("bankAccountNumber").value,
        bank_account_type: document.getElementById("bankAccountType").value,
        bank_name: document.getElementById("bankName").value
    };

    try {
        const response = await fetch('/api/bank_info', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(bankInfoData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al guardar la información bancaria: ${response.status} ${response.statusText} - ${errorText}`);
        }

        showToast("Información bancaria guardada correctamente");
        const modal = bootstrap.Modal.getInstance(document.getElementById("bankInfoModal"));
        modal.hide();
    } catch (error) {
        console.error("Error al guardar la información bancaria:", error);
        showToast("Error al guardar la información bancaria: " + error.message);
    }
}

async function loadBankInfo(employeeId) {
    try {
        const response = await fetch(`/api/bank_info/${employeeId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener la información bancaria");
        }

        const bankInfo = await response.json();

        document.getElementById("bankAccountNumber").value = bankInfo.bank_account_number;
        document.getElementById("bankAccountType").value = bankInfo.bank_account_type;
        document.getElementById("bankName").value = bankInfo.bank_name;
    } catch (error) {
        console.error("Error al obtener la información bancaria:", error);
        showToast("Error al obtener la información bancaria");
    }
}

async function uploadExcel() {
    const fileInput = document.getElementById('excelFileInput');
    const file = fileInput.files[0];

    if (!file) {
        showToast("Por favor, seleccione un archivo Excel.");
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            console.log("Iniciando lectura del archivo Excel");
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            for (const row of jsonData) {
                console.log("Procesando fila:", row);
                try {
                    const hireDate = row["Fecha de Ingreso"];
                    let formattedHireDate = null;
                    
                    if (hireDate) {
                        if (typeof hireDate === 'number') {
                            formattedHireDate = new Date((hireDate - 25569) * 86400 * 1000).toISOString().split('T')[0];
                        } else {
                            const date = new Date(hireDate);
                            formattedHireDate = date.toISOString().split('T')[0];
                        }
                    }

                    const employeeData = {
                        full_name: row["Nombre Completo"],
                        id_type_id: await getIdTypeId(row["Tipo de Identificación"]),
                        id_number: row["Número de Identificación"].toString(),
                        email: row["Email"],
                        phone: row["Teléfono"]?.toString(),
                        address: row["Dirección"],
                        role: row["Rol"],
                        department: row["Departamento"],
                        position: row["Cargo"],
                        hire_date: formattedHireDate,
                        tipo_contrato: row["Tipo de Contrato"],
                        salario_base: parseFloat(row["Salario Base"]) || 0,
                        riesgo_arl: parseInt(row["Nivel de Riesgo ARL"]) || 1,
                        eps: row["EPS"],
                        fondo_pension: row["Fondo de Pensión"],
                        fondo_cesantias: row["Fondo de Cesantías"],
                        caja_compensacion: row["Caja de Compensación"],
                        status: row["Estado"] || 'Activo'
                    };

                    console.log("Datos del empleado a guardar:", employeeData);

                    const employeeResponse = await createOrUpdateEmployee(employeeData);
                    
                    if (employeeResponse && employeeResponse.employee) {
                        const bankData = {
                            employee_id: employeeResponse.employee.id,
                            bank_account_number: row["Número de Cuenta"]?.toString(),
                            bank_account_type: row["Tipo de Cuenta"],
                            bank_name: row["Banco"]
                        };
                        
                        if (bankData.bank_account_number && bankData.bank_name) {
                            await createOrUpdateBankInfo(bankData);
                        }
                        
                        console.log(`Procesado exitosamente: ${employeeData.full_name}`);
                    }
                } catch (error) {
                    console.error(`Error procesando fila: ${error.message}`);
                    showToast(`Error procesando empleado: ${error.message}`);
                }
            }
            
            showToast("Carga de empleados desde Excel completada.");
            loadEmployees();
        };

        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error("Error en la carga del archivo:", error);
        showToast("Error en la carga del archivo: " + error.message);
    }
}

async function createOrUpdateEmployee(employeeData) {
    try {
        // Buscar si existe el empleado por número de identificación
        const searchResponse = await fetch(`/api/employees/search?id_number=${employeeData.id_number}`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        const existingEmployees = await searchResponse.json();

        if (existingEmployees && existingEmployees.length > 0) {
            // Actualizar empleado existente
            const updateResponse = await fetch(`/api/employees/${existingEmployees[0].id}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(employeeData)
            });
            return await updateResponse.json();
        } else {
            // Crear nuevo empleado
            const createResponse = await fetch('/api/employees', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(employeeData)
            });
            return await createResponse.json();
        }
    } catch (error) {
        console.error("Error en createOrUpdateEmployee:", error);
        throw error;
    }
}

async function createOrUpdateBankInfo(bankData) {
    try {
        const response = await fetch('/api/bank_info', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(bankData)
        });

        if (!response.ok) {
            throw new Error(`Error al guardar información bancaria: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error en createOrUpdateBankInfo:", error);
        throw error;
    }
}

async function getIdTypeId(typeName) {
    try {
        const response = await fetch('/api/id_types', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener tipos de identificación.");
        }

        const idTypes = await response.json();
        const idType = idTypes.find(idType => idType.type_name === typeName);
        return idType ? idType.id : null;
    } catch (error) {
        console.error("Error al obtener tipos de identificación:", error);
        return null;
    }
}

async function searchEmployeeByIdNumber() {
    const idNumber = document.getElementById("searchIdNumber").value.trim();
    if (!idNumber) {
        showToast("Por favor, ingrese un número de identificación");
        return;
    }

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch(`/api/employees/search?id_number=${encodeURIComponent(idNumber)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 404) {
                showToast(data.message || "No se encontró el empleado");
                return;
            }
            throw new Error(data.message || "Error al buscar empleado");
        }

        if (Array.isArray(data) && data.length > 0) {
            renderEmployees(data);
            document.getElementById("pagination").innerHTML = '';
        } else {
            showToast("No se encontraron resultados");
            loadEmployees(1); // Volver a cargar todos los empleados si no hay resultados
        }
    } catch (error) {
        console.error("Error al buscar empleado:", error);
        showToast(error.message);
    }
}

// Add event listener for Enter key in search input
document.getElementById("searchIdNumber").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchEmployeeByIdNumber();
    }
});

// Add event listener to clear search and show all employees
document.getElementById("searchIdNumber").addEventListener("input", function(event) {
    if (this.value === "") {
        loadEmployees(1);
    }
});

// Agregar la función de filtrado
function filterTable() {
    const searchText = document.getElementById("tableSearch").value.toLowerCase();
    const tbody = document.getElementById("employeeTableBody");
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

async function viewEmployeeDetails(idNumber) {
    try {
        console.log("Buscando empleado con ID:", idNumber); // Debug

        const response = await fetch(`/api/employees/search?id_number=${idNumber}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener detalles del empleado');
        }

        const data = await response.json();
        console.log("Datos recibidos:", data); // Debug

        // Si la respuesta viene en un array, tomar el primer elemento
        const employee = Array.isArray(data) ? data[0] : data;

        if (!employee) {
            throw new Error('Empleado no encontrado');
        }

        openEmployeeModal(employee, true); // true para modo lectura
    } catch (error) {
        console.error("Error:", error);
        showMessage(error.message, "error");
    }
}