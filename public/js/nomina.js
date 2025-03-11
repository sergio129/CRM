document.addEventListener("DOMContentLoaded", () => {
    loadPayrolls();
    loadEmployeesForPayroll();

    // Agregar el event listener para el botón de crear nómina
    document.getElementById("createPayrollButton").addEventListener("click", openCreatePayrollModal);
    
    // Agregar el event listener para cuando se selecciona un empleado
    document.getElementById("employeeId").addEventListener("change", updateSalary);
});

async function loadPayrolls() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/payrolls', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            throw new Error("Error al obtener nóminas");
        }

        const payrolls = await response.json();
        renderPayrolls(payrolls);
    } catch (error) {
        console.error("Error al obtener nóminas:", error);
        showToast("Error al obtener nóminas: " + error.message);
    }
}

function renderPayrolls(payrolls) {
    const html = payrolls.map(payroll => `
        <tr>
            <td>${payroll.Employee.id_number}</td>
            <td>${payroll.Employee.full_name}</td>
            <td>${payroll.salary}</td>
            <td>${payroll.payment_date}</td>
            <td>${payroll.status}</td>
            <td>${payroll.status === 'Pagado' ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-exclamation-circle text-warning"></i>'}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editPayroll('${payroll.id}')" ${payroll.status === 'Pagado' ? 'disabled' : ''}>Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deletePayroll('${payroll.id}')" ${payroll.status === 'Pagado' ? 'disabled' : ''}>Eliminar</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("payrollTableBody").innerHTML = html;
}

// Reemplazar loadEmployees por esta versión actualizada
async function loadEmployeesForPayroll() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/employees/active', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Error al cargar empleados');
        }

        const { employees } = await response.json();
        const employeeSelect = document.getElementById('employeeId');
        employeeSelect.innerHTML = '<option value="">Seleccione un empleado</option>';
        
        if (employees && employees.length > 0) {
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = `${employee.full_name} - ${employee.id_number}`;
                option.dataset.salary = employee.salary;
                employeeSelect.appendChild(option);
            });
        } else {
            showToast("No se encontraron empleados activos");
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar la lista de empleados: ' + error.message);
    }
}

function updateSalary() {
    const employeeSelect = document.getElementById("employeeId");
    const selectedOption = employeeSelect.options[employeeSelect.selectedIndex];
    const salary = selectedOption.dataset.salary;
    document.getElementById("salary").value = salary;
}

function openCreatePayrollModal() {
    document.getElementById('payrollForm').reset();
    loadEmployeesForPayroll();
    const modal = new bootstrap.Modal(document.getElementById('payrollModal'));
    modal.show();
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

        if (payroll.status === 'Pagado') {
            alert("No se puede editar una nómina que ya ha sido pagada.");
            return;
        }

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

// Agregar función showToast si no existe
function showToast(message) {
    const toastElement = document.getElementById('successToast');
    const toast = new bootstrap.Toast(toastElement);
    toastElement.querySelector('.toast-body').textContent = message;
    toast.show();
}

function calculateTotals() {
    const salarioBase = parseFloat(document.getElementById('salarioBase').value) || 0;
    const valorHorasExtras = parseFloat(document.getElementById('valorHorasExtras').value) || 0;
    const bonificaciones = parseFloat(document.getElementById('bonificaciones').value) || 0;
    const comisiones = parseFloat(document.getElementById('comisiones').value) || 0;

    // Calcular deducciones
    const aporteSalud = salarioBase * 0.04;
    const aportePension = salarioBase * 0.04;
    const prestamos = parseFloat(document.getElementById('prestamos').value) || 0;
    const otrosDescuentos = parseFloat(document.getElementById('otrosDescuentos').value) || 0;

    // Calcular totales
    const totalIngresos = salarioBase + valorHorasExtras + bonificaciones + comisiones;
    const totalDeducciones = aporteSalud + aportePension + prestamos + otrosDescuentos;
    const netoPagar = totalIngresos - totalDeducciones;

    // Actualizar campos
    document.getElementById('totalIngresos').value = totalIngresos.toFixed(2);
    document.getElementById('totalDeducciones').value = totalDeducciones.toFixed(2);
    document.getElementById('netoPagar').value = netoPagar.toFixed(2);
}

// Agregar event listeners para recalcular cuando cambian los valores
['salarioBase', 'valorHorasExtras', 'bonificaciones', 'comisiones', 'prestamos', 'otrosDescuentos'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateTotals);
});
