document.addEventListener("DOMContentLoaded", () => {
    loadEmployees();
    loadRoles(); // Cargar roles al cargar la página
    loadIdTypes(); // Cargar tipos de identificación al cargar la página

    document.getElementById("createEmployeeButton").addEventListener("click", openEmployeeModal);
});

async function loadEmployees() {
    try {
        const response = await fetch('/api/employees', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener empleados.");
        }

        const employees = await response.json();
        renderEmployees(employees);
    } catch (error) {
        console.error("Error al obtener empleados:", error);
        alert("Error al obtener empleados.");
    }
}

function renderEmployees(employees) {
    const html = employees.map(employee => `
        <tr>
            <td>${employee.id}</td>
            <td>${employee.full_name}</td>
            <td>${employee.email}</td>
            <td>${employee.phone}</td>
            <td>${employee.address}</td>
            <td>${employee.role}</td>
            <td>${employee.salary}</td>
            <td>${employee.status}</td>
            <td>
                <div class="d-flex justify-content-between">
                    <button class="btn btn-warning btn-sm me-2" onclick="editEmployee('${employee.id}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEmployee('${employee.id}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join("");

    document.getElementById("employeeTableBody").innerHTML = html;
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
        status: document.getElementById("status").value,
        bank_account_number: document.getElementById("bankAccountNumber").value,
        bank_account_type: document.getElementById("bankAccountType").value,
        bank_name: document.getElementById("bankName").value
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
        alert(`Empleado ${employeeId ? "actualizado" : "creado"} correctamente`);
        loadEmployees();
        const modal = bootstrap.Modal.getInstance(document.getElementById("employeeModal"));
        modal.hide();
    } catch (error) {
        console.error("Error al guardar el empleado:", error);
        alert("Error al guardar el empleado");
    }
}

async function editEmployee(employeeId) {
    try {
        const response = await fetch(`/api/employees/${employeeId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener el empleado");
        }

        const employee = await response.json();

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
        document.getElementById("hireDate").value = employee.hire_date ? employee.hire_date.split('T')[0] : ''; // Formatear la fecha
        document.getElementById("contractType").value = employee.contract_type;
        document.getElementById("workSchedule").value = employee.work_schedule;
        document.getElementById("status").value = employee.status;
        document.getElementById("bankInfoButton").style.display = "block"; // Mostrar botón de información bancaria

        // Cargar información bancaria
        loadBankInfo(employee.id);

        new bootstrap.Modal(document.getElementById("employeeModal")).show();
    } catch (error) {
        console.error("Error al editar el empleado:", error);
        alert("Error al editar el empleado");
    }
}

async function deleteEmployee(employeeId) {
    if (!confirm("¿Estás seguro de eliminar este empleado?")) return;

    try {
        const response = await fetch(`/api/employees/${employeeId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (!response.ok) {
            throw new Error("Error al eliminar el empleado");
        }

        alert("Empleado eliminado correctamente");
        loadEmployees();
    } catch (error) {
        console.error("Error al eliminar el empleado:", error);
        alert("Error al eliminar el empleado");
    }
}

async function saveBankInfo(employeeId) {
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
            throw new Error("Error al guardar la información bancaria");
        }

        const data = await response.json();
        alert("Información bancaria guardada correctamente");
        const modal = bootstrap.Modal.getInstance(document.getElementById("bankInfoModal"));
        modal.hide();
    } catch (error) {
        console.error("Error al guardar la información bancaria:", error);
        alert("Error al guardar la información bancaria");
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
        alert("Error al obtener la información bancaria");
    }
}

function uploadExcel() {
    const fileInput = document.getElementById('excelFileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Por favor, seleccione un archivo Excel.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        jsonData.forEach(async (employee) => {
            const employeeData = {
                full_name: employee["Nombre Completo"],
                id_type_id: await getIdTypeId(employee["Tipo de Identificación"]),
                id_number: employee["Número de Identificación"],
                email: employee["Email"],
                phone: employee["Teléfono"],
                address: employee["Dirección"],
                role: employee["Rol"],
                salary: employee["Salario"],
                department: employee["Departamento"],
                position: employee["Puesto"],
                hire_date: employee["Fecha de Ingreso"],
                contract_type: employee["Tipo de Contrato"],
                work_schedule: employee["Horario de Trabajo"],
                status: employee["Estado"],
                bank_account_number: employee["Número de cuenta bancaria"],
                bank_account_type: employee["Tipo de cuenta"],
                bank_name: employee["Banco"]
            };

            try {
                const response = await fetch('/api/employees', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(employeeData),
                });

                if (!response.ok) {
                    throw new Error("Error al guardar el empleado desde Excel");
                }

                const savedEmployee = await response.json();

                // Guardar información bancaria
                const bankInfoData = {
                    employee_id: savedEmployee.id,
                    bank_account_number: employee["Número de cuenta bancaria"],
                    bank_account_type: employee["Tipo de cuenta"],
                    bank_name: employee["Banco"]
                };

                await fetch('/api/bank_info', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(bankInfoData),
                });

                console.log(`Empleado ${employeeData.full_name} guardado correctamente`);
            } catch (error) {
                console.error(`Error al guardar el empleado ${employeeData.full_name}:`, error);
            }
        });

        alert("Carga de empleados desde Excel completada.");
        loadEmployees();
    };

    reader.readAsArrayBuffer(file);
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