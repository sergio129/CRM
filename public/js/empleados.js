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
    new bootstrap.Modal(document.getElementById("employeeModal")).show();
}

async function saveEmployee() {
    const employeeId = document.getElementById("employeeId").value;
    const url = employeeId ? `/api/employees/${employeeId}` : "/api/employees";
    const method = employeeId ? "PUT" : "POST";

    const employeeData = {
        full_name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
        role: document.getElementById("role").value,
        salary: document.getElementById("salary").value,
        id_type_id: document.getElementById("idType").value,
        id_number: document.getElementById("idNumber").value,
        status: document.getElementById("status").value,
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
        document.getElementById("status").value = employee.status;

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
