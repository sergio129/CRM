document.addEventListener("DOMContentLoaded", () => {
    loadEmployees(1); // Cargar la primera página de empleados
    loadRoles(); // Cargar roles al cargar la página
    loadIdTypes(); // Cargar tipos de identificación al cargar la página

    document.getElementById("createEmployeeButton").addEventListener("click", openEmployeeModal);
    document.getElementById("deleteSelectedButton").addEventListener("click", openDeleteModal);
    document.getElementById("selectAllCheckbox").addEventListener("change", toggleSelectAll);
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
            <td><input type="checkbox" class="employee-checkbox" value="${employee.id}"></td>
            <td>${employee.id_number}</td> <!-- Mostrar número de identificación -->
            <td>${employee.full_name}</td>
            <td>${employee.email}</td>
            <td>${employee.phone}</td>
            <td>${employee.address}</td>
            <td>${employee.role}</td>
            <td>${employee.salary}</td>
            <td>${employee.status}</td>
            <td>
                <div class="d-flex justify-content-between">
                    <button class="btn btn-warning btn-sm me-2" onclick="editEmployee('${employee.id_number}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEmployee('${employee.id_number}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join("");

    document.getElementById("employeeTableBody").innerHTML = html;
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

function openEmployeeModal() {
    document.getElementById("employeeModalLabel").textContent = "Crear Empleado";
    document.getElementById("employeeForm").reset();
    document.getElementById("employeeId").value = "";
    document.getElementById("bankInfoButton").style.display = "none"; // Ocultar botón de información bancaria
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

    const hireDate = document.getElementById("hireDate").value;
    const formattedHireDate = hireDate ? new Date(hireDate).toISOString().split('T')[0] : null;

    const employeeData = {
        full_name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
        role: document.getElementById("role").value,
        salary: document.getElementById("salary").value,
        id_type_id: document.getElementById("idType").value,
        id_number: document.getElementById("idNumber").value,
        department: document.getElementById("department").value,
        position: document.getElementById("position").value,
        hire_date: formattedHireDate,
        contract_type: document.getElementById("contractType").value,
        work_schedule: document.getElementById("workSchedule").value,
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

        if (!response.ok) {
            throw new Error("Error al guardar el empleado");
        }

        const data = await response.json();
        showToast(`Empleado ${employeeId ? "actualizado" : "creado"} correctamente`);
        loadEmployees();
        const modal = bootstrap.Modal.getInstance(document.getElementById("employeeModal"));
        modal.hide();
    } catch (error) {
        console.error("Error al guardar el empleado:", error);
        showToast("Error al guardar el empleado");
    }
}

async function editEmployee(employeeId) {
    try {
        const response = await fetch(`/api/employees/by-id-number/${employeeId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener el empleado");
        }

        const employee = await response.json();

        // Rellenar el formulario con los datos del empleado
        document.getElementById("employeeModalLabel").textContent = "Editar Empleado";
        document.getElementById("employeeId").value = employee.id;
        document.getElementById("fullName").value = employee.full_name;
        document.getElementById("email").value = employee.email;
        document.getElementById("phone").value = employee.phone;
        document.getElementById("address").value = employee.address;
        document.getElementById("role").value = employee.role;
        document.getElementById("salary").value = employee.salary;
        document.getElementById("idType").value = employee.id_type_id;
        document.getElementById("idNumber").value = employee.id_number;
        document.getElementById("department").value = employee.department;
        document.getElementById("position").value = employee.position;
        document.getElementById("hireDate").value = employee.hire_date ? employee.hire_date.split('T')[0] : '';
        document.getElementById("contractType").value = employee.contract_type;
        document.getElementById("workSchedule").value = employee.work_schedule;
        document.getElementById("status").value = employee.status;
        document.getElementById("bankInfoButton").style.display = "block";

        // Cargar información bancaria
        loadBankInfo(employee.id);

        new bootstrap.Modal(document.getElementById("employeeModal")).show();
    } catch (error) {
        console.error("Error al editar el empleado:", error);
        showToast("Error al editar el empleado: " + error.message);
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
                    // Formatear la fecha correctamente
                    const hireDate = row["Fecha de Ingreso"];
                    let formattedHireDate = null;
                    
                    if (hireDate) {
                        // Si es un número de serie de Excel
                        if (typeof hireDate === 'number') {
                            formattedHireDate = new Date((hireDate - 25569) * 86400 * 1000).toISOString().split('T')[0];
                        } else {
                            // Si es una cadena de texto, intentar convertirla
                            const date = new Date(hireDate);
                            formattedHireDate = date.toISOString().split('T')[0];
                        }
                    }

                    const employeeData = {
                        full_name: row["Nombre Completo"],
                        id_type_id: await getIdTypeId(row["Tipo de Identificación"]),
                        id_number: row["Número de Identificación"],
                        email: row["Email"],
                        phone: row["Teléfono"],
                        address: row["Dirección"],
                        role: row["Rol"],
                        salary: row["Salario"],
                        department: row["Departamento"],
                        position: row["Puesto"],
                        hire_date: formattedHireDate,
                        contract_type: row["Tipo de Contrato"],
                        work_schedule: row["Horario de Trabajo"],
                        status: row["Estado"]
                    };

                    console.log("Datos del empleado a guardar:", employeeData);

                    // Primero crear o actualizar el empleado
                    const employeeResponse = await createOrUpdateEmployee(employeeData);
                    
                    if (employeeResponse && employeeResponse.employee) {
                        // Si el empleado se creó/actualizó correctamente, proceder con la información bancaria
                        const bankData = {
                            employee_id: employeeResponse.employee.id,
                            bank_account_number: row["Número de cuenta bancaria"],
                            bank_account_type: row["Tipo de cuenta"],
                            bank_name: row["Banco"]
                        };
                        
                        await createOrUpdateBankInfo(bankData);
                        console.log(`Procesado exitosamente: ${employeeData.full_name}`);
                    }
                } catch (error) {
                    console.error(`Error procesando fila: ${error.message}`);
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