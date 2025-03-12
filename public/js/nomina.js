document.addEventListener("DOMContentLoaded", () => {
    loadPayrolls();
    loadEmployeesForPayroll();

    // Agregar el event listener para el botón de crear nómina
    document.getElementById("createPayrollButton").addEventListener("click", openCreatePayrollModal);
    
    // Agregar el event listener para cuando se selecciona un empleado
    document.getElementById("employeeId").addEventListener("change", updateSalary);
    
    // Agregar event listener para el cambio en tipo de pago
    document.getElementById("tipoPago").addEventListener("change", calculateTotals);
    
    // Agregar event listener para el cambio en salario base
    document.getElementById("salarioBase").addEventListener("input", calculateTotals);

    // Agregar manejo del sidebar
    document.getElementById("sidebarCollapse").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("active");
        document.getElementById("content").classList.toggle("active");
    });

    // Agregar búsqueda en tiempo real
    document.getElementById("searchPayroll").addEventListener("input", function(e) {
        if (this.value === "") {
            loadPayrolls(); // Cargar todas las nóminas si el campo está vacío
        }
    });
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
            <td>${payroll.salario_base}</td>
            <td>${payroll.payment_date}</td>
            <td>${payroll.status}</td>
            <td>${payroll.status === 'Pagado' ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-exclamation-circle text-warning"></i>'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-sm action-btn" onclick="editPayroll('${payroll.id}')" ${payroll.status === 'Pagado' ? 'disabled' : ''}>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm action-btn" onclick="deletePayroll('${payroll.id}')" ${payroll.status === 'Pagado' ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-info btn-sm action-btn" onclick="generatePayrollPDF('${payroll.id}')">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </div>
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
                option.dataset.salary = employee.salario_base || 0;
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
    
    // Obtener el salario del dataset del option seleccionado
    const salarioBase = selectedOption.dataset.salary || 0;
    console.log("Salario base del empleado:", salarioBase); // Para debugging
    
    // Actualizar el campo de salario base
    document.getElementById("salarioBase").value = salarioBase;
    
    // Recalcular totales cuando cambia el salario
    calculateTotals();
}

function openCreatePayrollModal() {
    document.getElementById('payrollForm').reset();
    loadEmployeesForPayroll();
    const modal = new bootstrap.Modal(document.getElementById('payrollModal'));
    modal.show();
}

function validateAndSavePayroll() {
    const form = document.getElementById("payrollForm");
    const inputs = form.querySelectorAll("input[required], select[required]");
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
        savePayroll();
    } else {
        showToast("Por favor, complete todos los campos requeridos");
    }
}

async function savePayroll() {
    try {
        const estadoPago = document.getElementById("estadoPago").checked;
        const payrollData = {
            employee_id: document.getElementById("employeeId").value,
            periodo: document.getElementById("periodo").value,
            tipo_pago: document.getElementById("tipoPago").value,
            dias_trabajados: document.getElementById("diasTrabajados").value,
            salario_base: document.getElementById("salarioBase").value, // Asegurarse de usar salario_base
            horas_extras: document.getElementById("horasExtras").value,
            valor_horas_extras: document.getElementById("valorHorasExtras").value,
            bonificaciones: document.getElementById("bonificaciones").value,
            comisiones: document.getElementById("comisiones").value,
            prestamos: document.getElementById("prestamos").value,
            otros_descuentos: document.getElementById("otrosDescuentos").value,
            total_ingresos: document.getElementById("totalIngresos").value,
            total_deducciones: document.getElementById("totalDeducciones").value,
            neto_pagar: document.getElementById("netoPagar").value,
            status: estadoPago ? 'Pagado' : 'Pendiente'  // Asegurarnos de enviar el estado correcto
        };

        const response = await fetch('/api/payrolls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payrollData)
        });

        if (!response.ok) {
            throw new Error('Error al guardar la nómina');
        }

        const result = await response.json();
        
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('payrollModal'));
        modal.hide();
        
        // Mostrar mensaje de éxito
        showToast("Nómina creada correctamente");
        
        // Recargar la lista de nóminas
        loadPayrolls();
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al guardar la nómina: ' + error.message);
    }
}

async function generatePayrollPDF(payrollId) {
    try {
        const response = await fetch(`/api/payrolls/${payrollId}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al generar el PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nomina-${payrollId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showToast('Error al generar PDF: ' + error.message);
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
            showToast("No se puede editar una nómina que ya ha sido pagada.");
            return;
        }

        // Cargar datos en el formulario
        const form = document.getElementById("payrollForm");
        
        // Limpiar el formulario antes de cargar los nuevos datos
        form.reset();

        // Establecer el título del modal
        document.getElementById("payrollModalLabel").textContent = "Editar Nómina";

        // Cargar datos básicos
        document.getElementById("payrollId").value = payroll.id;
        document.getElementById("employeeId").value = payroll.employee_id;
        document.getElementById("periodo").value = payroll.PayrollDetail?.periodo || '';
        document.getElementById("tipoPago").value = payroll.PayrollDetail?.tipo_pago || 'Mensual';
        document.getElementById("diasTrabajados").value = payroll.PayrollDetail?.dias_trabajados || 30;
        document.getElementById("salarioBase").value = payroll.salario_base || 0;

        // Cargar datos de extras y bonificaciones
        document.getElementById("horasExtras").value = payroll.PayrollDetail?.horas_extras_diurnas || 0;
        document.getElementById("valorHorasExtras").value = payroll.PayrollDetail?.valor_hora_extra_diurna || 0;
        document.getElementById("bonificaciones").value = payroll.PayrollDetail?.bonificaciones || 0;
        document.getElementById("comisiones").value = payroll.PayrollDetail?.comisiones || 0;

        // Cargar deducciones
        document.getElementById("prestamos").value = payroll.PayrollDetail?.prestamos || 0;
        document.getElementById("otrosDescuentos").value = payroll.PayrollDetail?.otros_descuentos || 0;

        // Calcular y mostrar totales
        calculateTotals();
        
        // Actualizar el estado del checkbox según el estado de la nómina
        const estadoPagoCheckbox = document.getElementById("estadoPago");
        estadoPagoCheckbox.checked = payroll.status === 'Pagado';
        estadoPagoCheckbox.disabled = payroll.status === 'Pagado';

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById("payrollModal"));
        modal.show();
    } catch (error) {
        console.error("Error al editar la nómina:", error);
        showToast("Error al editar la nómina: " + error.message);
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
    try {
        const toastElement = document.getElementById('successToast');
        if (!toastElement) {
            console.error('Elemento toast no encontrado');
            return;
        }
        const toastBody = toastElement.querySelector('.toast-body');
        if (!toastBody) {
            console.error('Elemento toast-body no encontrado');
            return;
        }
        toastBody.textContent = message;
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    } catch (error) {
        console.error('Error al mostrar el toast:', error);
    }
}

function calculateTotals() {
    // Obtener valores base
    const salarioBase = parseFloat(document.getElementById('salarioBase').value) || 0;
    const valorHorasExtras = parseFloat(document.getElementById('valorHorasExtras').value) || 0;
    const bonificaciones = parseFloat(document.getElementById('bonificaciones').value) || 0;
    const comisiones = parseFloat(document.getElementById('comisiones').value) || 0;
    const tipoPago = document.getElementById('tipoPago').value;

    // Calcular ingresos
    const totalIngresos = salarioBase + valorHorasExtras + bonificaciones + comisiones;

    // Calcular deducciones de ley según tipo de pago
    let porcentaje;
    switch (tipoPago) {
        case 'Mensual':
            porcentaje = 0.08; // 8% para pagos mensuales
            break;
        case 'Quincenal':
            porcentaje = 0.04; // 4% para pagos quincenales
            break;
        case 'Semanal':
            porcentaje = 0.02; // 2% para pagos semanales
            break;
        default:
            porcentaje = 0.08; // Por defecto usar 8%
    }

    const deduccionSalud = salarioBase * porcentaje;
    const deduccionPension = salarioBase * porcentaje;
    
    // Mostrar deducciones en los campos
    document.getElementById('deduccionSalud').value = deduccionSalud.toFixed(2);
    document.getElementById('deduccionPension').value = deduccionPension.toFixed(2);

    // Otras deducciones
    const prestamos = parseFloat(document.getElementById('prestamos').value) || 0;
    const otrosDescuentos = parseFloat(document.getElementById('otrosDescuentos').value) || 0;

    // Calcular total deducciones y neto a pagar
    const totalDeducciones = deduccionSalud + deduccionPension + prestamos + otrosDescuentos;
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

// Reemplazar el event listener del checkbox y agregar manejo del modal
let confirmationModal = null;
let currentCheckbox = null;

document.getElementById("estadoPago").addEventListener("change", function(e) {
    if (this.checked) {
        currentCheckbox = this;
        // Prevenir el cambio inmediato del checkbox
        e.preventDefault();
        this.checked = false;
        
        // Inicializar y mostrar el modal
        confirmationModal = new bootstrap.Modal(document.getElementById('confirmPaymentModal'), {
            backdrop: 'static',
            keyboard: false
        });
        confirmationModal.show();
    }
});

// Agregar event listeners para el modal de confirmación
document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const confirmModal = document.getElementById('confirmPaymentModal');

    confirmBtn.addEventListener('click', function() {
        if (currentCheckbox) {
            currentCheckbox.checked = true;
        }
        confirmationModal.hide();
    });

    confirmModal.addEventListener('hidden.bs.modal', function() {
        if (currentCheckbox) {
            currentCheckbox.checked = currentCheckbox.checked;
        }
        currentCheckbox = null;
    });
});

// Agregar función de exportación
async function exportPayrollReport() {
    try {
        const response = await fetch('/api/payrolls/export', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al exportar reporte');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-nomina-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Reporte exportado correctamente');
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al exportar el reporte: ' + error.message);
    }
}

// Agregar función de búsqueda
async function searchPayroll() {
    const searchTerm = document.getElementById("searchPayroll").value.trim();
    if (!searchTerm) {
        loadPayrolls();
        return;
    }

    try {
        const response = await fetch(`/api/payrolls/search?term=${encodeURIComponent(searchTerm)}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error("Error en la búsqueda");
        }

        const payrolls = await response.json();
        renderPayrolls(payrolls);
    } catch (error) {
        console.error("Error:", error);
        showToast("Error en la búsqueda: " + error.message);
    }
}
