document.addEventListener("DOMContentLoaded", () => {
    loadPayrolls();
    loadEmployees(); // Cargar empleados al cargar la página

    document.getElementById("createPayrollButton").addEventListener("click", openPayrollModal);
});

async function loadPayrolls() {
    try {
        const response = await fetch('/api/payrolls', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener nóminas.");
        }

        const payrolls = await response.json();
        renderPayrolls(payrolls);
    } catch (error) {
        console.error("Error al obtener nóminas:", error);
        alert("Error al obtener nóminas.");
    }
}

function renderPayrolls(payrolls) {
    const html = payrolls.map(payroll => `
        <tr>
            <td>${payroll.id}</td>
            <td>${payroll.Employee.full_name}</td>
            <td>${payroll.salary}</td>
            <td>${payroll.payment_date}</td>
            <td>${payroll.status}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editPayroll('${payroll.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deletePayroll('${payroll.id}')">Eliminar</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("payrollTableBody").innerHTML = html;
}

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
        const employeeSelect = document.getElementById("employeeId");
        employees.forEach(employee => {
            const option = document.createElement("option");
            option.value = employee.id;
            option.textContent = employee.full_name;
            option.dataset.salary = employee.salary; // Guardar el salario en el dataset
            employeeSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error al obtener empleados:", error);
        alert("Error al obtener empleados.");
    }
}

function updateSalary() {
    const employeeSelect = document.getElementById("employeeId");
    const selectedOption = employeeSelect.options[employeeSelect.selectedIndex];
    const salary = selectedOption.dataset.salary;
    document.getElementById("salary").value = salary;
}

function openPayrollModal() {
    document.getElementById("payrollModalLabel").textContent = "Crear Nómina";
    document.getElementById("payrollForm").reset();
    document.getElementById("payrollId").value = "";
    new bootstrap.Modal(document.getElementById("payrollModal")).show();
}

async function savePayroll() {
    const payrollId = document.getElementById("payrollId").value;
    const url = payrollId ? `/api/payrolls/${payrollId}` : "/api/payrolls";
    const method = payrollId ? "PUT" : "POST";

    const payrollData = {
        employee_id: document.getElementById("employeeId").value,
        salary: document.getElementById("salary").value,
        payment_date: document.getElementById("paymentDate").value,
        status: document.getElementById("status").value,
    };

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(payrollData),
        });

        if (!response.ok) {
            throw new Error("Error al guardar la nómina");
        }

        const data = await response.json();
        alert(`Nómina ${payrollId ? "actualizada" : "creada"} correctamente`);
        loadPayrolls();
        const modal = bootstrap.Modal.getInstance(document.getElementById("payrollModal"));
        modal.hide();
    } catch (error) {
        console.error("Error al guardar la nómina:", error);
        alert("Error al guardar la nómina");
    }
}

async function editPayroll(payrollId) {
    try {
        const response = await fetch(`/api/payrolls/${payrollId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener la nómina");
        }

        const payroll = await response.json();

        document.getElementById("payrollModalLabel").textContent = "Editar Nómina";
        document.getElementById("payrollId").value = payroll.id;
        document.getElementById("employeeId").value = payroll.employee_id;
        document.getElementById("salary").value = payroll.salary;
        document.getElementById("paymentDate").value = payroll.payment_date.split('T')[0]; // Formatear la fecha
        document.getElementById("status").value = payroll.status;

        new bootstrap.Modal(document.getElementById("payrollModal")).show();
    } catch (error) {
        console.error("Error al editar la nómina:", error);
        alert("Error al editar la nómina");
    }
}

async function deletePayroll(payrollId) {
    if (!confirm("¿Estás seguro de eliminar esta nómina?")) return;

    try {
        const response = await fetch(`/api/payrolls/${payrollId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (!response.ok) {
            throw new Error("Error al eliminar la nómina");
        }

        alert("Nómina eliminada correctamente");
        loadPayrolls();
    } catch (error) {
        console.error("Error al eliminar la nómina:", error);
        alert("Error al eliminar la nómina");
    }
}
