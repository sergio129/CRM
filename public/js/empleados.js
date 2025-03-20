document.addEventListener("DOMContentLoaded", () => {
    loadEmployees();
    loadIdentificationTypes();

    // Event listener para crear empleado
    document.getElementById("createEmployeeButton").addEventListener("click", () => {
        openEmployeeModal();
    });

    // Event listener para búsqueda en tiempo real
    document.getElementById("tableSearch").addEventListener("keyup", filterTable);

    // Event listener para el sidebar
    document.getElementById("sidebarCollapse").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("active");
        document.getElementById("content").classList.toggle("active");
    });
});

function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer");

    if (!toastContainer) {
        console.error("No se encontró el contenedor de toasts.");
        return;
    }

    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${type} border-0 show`;
    toast.role = "alert";
    toast.ariaLive = "assertive";
    toast.ariaAtomic = "true";
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

async function loadEmployees() {
    try {
        const response = await fetch('/api/employees', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}` // Agregar token
            }
        });

        if (!response.ok) {
            throw new Error("Error al cargar empleados.");
        }

        const employees = await response.json();
        renderEmployees(employees.employees); // Asegurarse de acceder al array de empleados
    } catch (error) {
        console.error("Error al obtener empleados:", error);
        showToast("Error al obtener empleados.", "danger");
    }
}

function renderEmployees(employees) {
    const tbody = document.getElementById("employeeTableBody");

    if (!tbody) {
        console.error("No se encontró el elemento 'employeeTableBody'.");
        return;
    }

    // Generar el HTML para todos los empleados
    const html = employees.map(employee => `
        <tr>
            <td>${employee.id_number || 'No registrado'}</td>
            <td>${employee.full_name || 'No registrado'}</td>
            <td>${employee.email || 'No registrado'}</td>
            <td>${employee.phone || 'No registrado'}</td>
            <td>${employee.position || 'No registrado'}</td>
            <td>${formatCurrency(employee.salario_base || 0)}</td>
            <td><span class="badge bg-${employee.status === 'Activo' ? 'success' : employee.status === 'Suspendido' ? 'warning' : 'danger'}">${employee.status || 'No definido'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm action-btn" onclick="viewEmployeeDetails(${employee.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm action-btn" onclick="editEmployee(${employee.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm action-btn" onclick="deleteEmployee(${employee.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    tbody.innerHTML = html;
}

async function loadIdentificationTypes() {
    try {
        const response = await fetch('/api/identification-types', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}` // Agregar token
            }
        });

        if (!response.ok) {
            throw new Error("Error al cargar tipos de identificación.");
        }

        const types = await response.json();
        const select = document.getElementById("tipoDocumento");

        if (!select) {
            console.error("No se encontró el elemento 'tipoDocumento'.");
            return;
        }

        select.innerHTML = types.map(type => `<option value="${type.value}">${type.label}</option>`).join("");
    } catch (error) {
        console.error("Error al obtener tipos de identificación:", error);
        showToast("Error al obtener tipos de identificación.", "danger");
    }
}

function openEmployeeModal(employee = null, readOnly = false) {
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    const form = document.getElementById('employeeForm');

    if (!form) {
        console.error("Formulario 'employeeForm' no encontrado en el DOM.");
        return;
    }

    form.reset();

    document.getElementById('employeeModalLabel').textContent = 
        readOnly ? 'Detalles del Empleado' : 
        employee ? 'Editar Empleado' : 'Nuevo Empleado';

    if (employee) {
        const fields = {
            'fullName': employee.full_name,
            'idNumber': employee.identification,
            'fechaNacimiento': employee.fecha_nacimiento,
            'genero': employee.genero,
            'telefonoMovil': employee.phone,
            'email': employee.email,
            'cargo': employee.cargo,
            'salario': employee.salario,
            'status': employee.status
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
            }
        });
    }

    const inputs = form.getElementsByTagName('input');
    const selects = form.getElementsByTagName('select');

    [...inputs, ...selects].forEach(element => {
        element.readOnly = readOnly;
        if (element.tagName === 'SELECT') {
            element.disabled = readOnly;
        }
    });

    const saveButton = document.querySelector('.modal-footer .btn-primary');
    if (saveButton) {
        saveButton.style.display = readOnly ? 'none' : 'block';
    }

    modal.show();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
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
    try {
        const employeeData = {
            full_name: document.getElementById("fullName").value,
            idNumber: document.getElementById("idNumber").value,
            fechaNacimiento: document.getElementById("fechaNacimiento").value,
            genero: document.getElementById("genero").value,
            telefonoMovil: document.getElementById("telefonoMovil").value,
            email: document.getElementById("email").value,
            direccion: document.getElementById("direccion").value,
            cargo: document.getElementById("cargo").value,
            salario: document.getElementById("salario").value,
            status: document.getElementById("estado").value
        };

        // Validar campos requeridos
        const requiredFields = ['full_name', 'idNumber', 'telefonoMovil', 'email', 'cargo', 'salario'];
        for (const field of requiredFields) {
            if (!employeeData[field]) {
                throw new Error(`El campo ${field} es obligatorio`);
            }
        }

        let method = 'POST';
        let url = '/api/employees';

        // Verificar si el empleado ya existe
        const checkResponse = await fetch(`/api/employees/${employeeData.idNumber}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (checkResponse.ok) {
            // Si el empleado existe, cambiamos a método PUT
            const existingEmployee = await checkResponse.json();
            method = 'PUT';
            url = `/api/employees/${existingEmployee.id}`;
        }

        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(employeeData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar empleado');
        }

        showToast('Empleado guardado exitosamente', 'success');
        loadEmployees();

        // Cerrar la modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
        if (modal) {
            modal.hide();
        }
    } catch (error) {
        console.error("Error al guardar empleado:", error);
        showToast(error.message || "Error al guardar empleado", "danger");
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

async function viewEmployeeDetails(id) {
    try {
        const response = await fetch(`/api/employees/by-id/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error("Empleado no encontrado.");
        }

        const employee = await response.json();

        // Llenar los datos en la modal
        document.getElementById("employeeFullName").textContent = employee.full_name || "No registrado";
        document.getElementById("employeeEmail").textContent = employee.email || "No registrado";
        document.getElementById("employeePhone").textContent = employee.phone || "No registrado";
        document.getElementById("employeePosition").textContent = employee.position || "No registrado";
        document.getElementById("employeeDepartment").textContent = employee.department || "No registrado";
        document.getElementById("employeeHireDate").textContent = employee.hire_date || "No registrado";
        document.getElementById("employeeStatus").textContent = employee.status || "No definido";

        // Mostrar la modal
        const employeeModal = new bootstrap.Modal(document.getElementById("employeeModal"));
        employeeModal.show();
    } catch (error) {
        console.error("Error al obtener detalles del empleado:", error);
        showToast("Error al obtener detalles del empleado.", "danger");
    }
}

async function searchEmployeeByIdNumber(id) {
    try {
        const response = await fetch(`/api/employees/search?id=${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Empleado no encontrado.");
        }

        const employee = await response.json();
        console.log("Empleado encontrado:", employee);
        // Aquí puedes actualizar la UI con los datos del empleado
    } catch (error) {
        console.error("Error al buscar empleado:", error);
        alert("Error al buscar empleado.");
    }
}