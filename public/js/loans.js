document.addEventListener("DOMContentLoaded", () => {
    loadLoans();
    renderLoanStatsChart();
});

function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer");

    // Crear el elemento del toast
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

    // Agregar el toast al contenedor
    toastContainer.appendChild(toast);

    // Eliminar el toast después de 5 segundos
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Función para formatear valores en pesos colombianos
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
}

async function loadLoans() {
    try {
        const response = await fetch('/api/loans', {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Error al cargar préstamos.");
        }

        const loans = await response.json();

        // Verificar si la respuesta contiene datos
        if (!Array.isArray(loans) || loans.length === 0) {
            showToast("No se encontraron préstamos.", "warning");
            document.getElementById("loanTableBody").innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">No se encontraron préstamos.</td>
                </tr>
            `;
            return;
        }

        renderLoans(loans);
        showToast("Préstamos cargados correctamente.", "success");
    } catch (error) {
        console.error("Error al cargar préstamos:", error);
        showToast("Error al cargar préstamos.", "danger");
    }
}

function renderLoans(loans) {
    const html = loans.map(loan => {
        const riskScore = loan.risk_score !== null ? `${(loan.risk_score * 100).toFixed(2)}%` : 'N/A';
        const coSigner = loan.CoSigner ? loan.CoSigner.full_name : 'N/A';

        return `
            <tr>
                <td>${loan.loan_number}</td>
                <td>${loan.Client.full_name} (${loan.Client.id_number || 'N/A'})</td>
                <td>${formatCurrency(loan.amount_requested)}</td>
                <td>${loan.interest_rate}% (${loan.interest_type})</td>
                <td>${loan.payment_term} meses</td>
                <td>${loan.loan_status}</td>
                <td>${riskScore}</td>
                <td>${formatCurrency(loan.total_due)}</td>
                <td>${loan.remaining_installments}</td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-info btn-sm" onclick="calculateInstallmentsForLoan(${loan.id})" title="Calcular Cuotas">
                            <i class="fas fa-calculator"></i>
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editLoan(${loan.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteLoan(${loan.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    document.getElementById("loanTableBody").innerHTML = html;
}

async function deleteLoan(loanId) {
    if (!confirm("¿Estás seguro de eliminar este préstamo?")) return;

    try {
        const response = await fetch(`/api/loans/${loanId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Error al eliminar el préstamo.");
        }

        showToast("Préstamo eliminado correctamente.", "success");
        loadLoans();
    } catch (error) {
        console.error("Error al eliminar el préstamo:", error);
        showToast("Error al eliminar el préstamo.", "danger");
    }
}

async function searchClientByDocument() {
    const documentNumber = document.getElementById("searchClient").value.trim();

    if (!documentNumber) {
        alert("Por favor ingrese un número de documento.");
        return;
    }

    try {
        const response = await fetch(`/api/clients/by-id-number/${documentNumber}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Cliente no encontrado.");
        }

        const client = await response.json();
        document.getElementById("clientName").value = client.full_name;
        document.getElementById("searchClient").dataset.clientId = client.id; // Guardar el ID del cliente
    } catch (error) {
        console.error("Error al buscar cliente:", error);
        alert("Error al buscar cliente.");
        document.getElementById("clientName").value = "";
        document.getElementById("searchClient").dataset.clientId = "";
    }
}

async function saveLoan() {
    const clientId = document.getElementById("searchClient").dataset.clientId;
    const amountRequested = document.getElementById("amountRequested").value;
    const interestRate = document.getElementById("interestRate").value;
    const interestType = document.getElementById("interestType").value;
    const paymentTerm = document.getElementById("paymentTerm").value;
    const paymentFrequency = document.getElementById("paymentFrequency").value;
    const guaranteeType = document.getElementById("guaranteeType").value;
    const coSigner = document.getElementById("coSigner").value;
    const additionalIncome = document.getElementById("additionalIncome").value;

    if (!clientId) {
        showToast("Debe buscar y seleccionar un cliente antes de guardar el préstamo.", "danger");
        return;
    }

    const loanData = {
        client_id: clientId,
        amount_requested: amountRequested,
        interest_rate: interestRate,
        interest_type: interestType,
        payment_term: paymentTerm,
        payment_frequency: paymentFrequency,
        guarantee_type: guaranteeType,
        co_signer_id: coSigner || null,
        additional_income: additionalIncome || 0
    };

    try {
        const response = await fetch('/api/loans', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loanData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al guardar el préstamo.");
        }

        showToast("Préstamo guardado correctamente.", "success");
        loadLoans();
        bootstrap.Modal.getInstance(document.getElementById("loanModal")).hide();
    } catch (error) {
        console.error("Error al guardar el préstamo:", error);
        showToast(error.message, "danger");
    }
}

function openLoanModal() {
    // Restablecer el formulario de la modal
    document.getElementById("loanForm").reset();
    document.getElementById("searchClient").dataset.clientId = ""; // Limpiar el ID del cliente
    document.getElementById("clientName").value = ""; // Limpiar el nombre del cliente

    // Mostrar la modal utilizando Bootstrap
    const loanModal = new bootstrap.Modal(document.getElementById("loanModal"));
    loanModal.show();
}

function calculateInstallments() {
    const amountRequestedInput = document.getElementById("amountRequested");
    const interestRateInput = document.getElementById("interestRate");
    const paymentTermInput = document.getElementById("paymentTerm");

    const amountRequested = parseFloat(amountRequestedInput.value);
    const interestRate = parseFloat(interestRateInput.value) / 100;
    const paymentTerm = parseInt(paymentTermInput.value);

    // Validar campos y resaltar los que están vacíos o inválidos
    let isValid = true;
    if (isNaN(amountRequested) || amountRequested <= 0) {
        amountRequestedInput.classList.add("is-invalid");
        isValid = false;
    } else {
        amountRequestedInput.classList.remove("is-invalid");
    }

    if (isNaN(interestRate) || interestRate <= 0) {
        interestRateInput.classList.add("is-invalid");
        isValid = false;
    } else {
        interestRateInput.classList.remove("is-invalid");
    }

    if (isNaN(paymentTerm) || paymentTerm <= 0) {
        paymentTermInput.classList.add("is-invalid");
        isValid = false;
    } else {
        paymentTermInput.classList.remove("is-invalid");
    }

    if (!isValid) {
        showToast("Por favor, complete todos los campos correctamente para calcular las cuotas.", "danger");
        return;
    }

    // Calcular cuotas si todos los campos son válidos
    const monthlyRate = interestRate / 12;
    const installment = (amountRequested * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -paymentTerm));

    const paymentSchedule = [];
    let remainingBalance = amountRequested;

    for (let i = 1; i <= paymentTerm; i++) {
        const interest = remainingBalance * monthlyRate;
        const principal = installment - interest;
        remainingBalance -= principal;

        paymentSchedule.push({
            month: i,
            installment: installment.toFixed(2),
            principal: principal.toFixed(2),
            interest: interest.toFixed(2),
            remainingBalance: remainingBalance.toFixed(2)
        });
    }

    renderPaymentSchedule(paymentSchedule);
}

function renderPaymentSchedule(schedule) {
    const tableBody = document.getElementById("paymentScheduleBody");
    tableBody.innerHTML = schedule.map(row => `
        <tr>
            <td>${row.month}</td>
            <td>${formatCurrency(row.installment)}</td>
            <td>${formatCurrency(row.principal)}</td>
            <td>${formatCurrency(row.interest)}</td>
            <td>${formatCurrency(row.remainingBalance)}</td>
        </tr>
    `).join("");
}

async function calculateInstallmentsForLoan(loanId) {
    try {
        const response = await fetch(`/api/loans/${loanId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Error al obtener los datos del préstamo.");
        }

        const loan = await response.json();
        selectedLoanId = loanId; // Guarda el ID del préstamo seleccionado

        // Calcular cuotas utilizando los datos del préstamo
        const amountRequested = parseFloat(loan.amount_requested);
        const interestRate = parseFloat(loan.interest_rate) / 100;
        const paymentTerm = parseInt(loan.payment_term);

        const monthlyRate = interestRate / 12;
        const installment = (amountRequested * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -paymentTerm));

        const paymentSchedule = [];
        let remainingBalance = amountRequested;

        for (let i = 1; i <= paymentTerm; i++) {
            const interest = remainingBalance * monthlyRate;
            const principal = installment - interest;
            remainingBalance -= principal;

            paymentSchedule.push({
                month: i,
                installment: installment.toFixed(2),
                principal: principal.toFixed(2),
                interest: interest.toFixed(2),
                remainingBalance: remainingBalance.toFixed(2)
            });
        }

        renderPaymentSchedule(paymentSchedule);
        showToast(`Cuotas calculadas para el préstamo ${loan.loan_number}.`, "success");
    } catch (error) {
        console.error("Error al calcular cuotas:", error);
        showToast("Error al calcular cuotas.", "danger");
    }
}

async function loadPaymentHistory(loanId) {
    try {
        const response = await fetch(`/api/payment-history/${loanId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Error al cargar el historial de pagos.");
        }

        const payments = await response.json();
        renderPaymentHistory(payments);
    } catch (error) {
        console.error("Error al cargar el historial de pagos:", error);
        showToast("Error al cargar el historial de pagos.", "danger");
    }
}

function renderPaymentHistory(payments) {
    const html = payments.map(payment => `
        <tr>
            <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
            <td>${formatCurrency(payment.amount_paid)}</td>
            <td>${payment.payment_method}</td>
            <td>${payment.payment_type || "N/A"}</td>
            <td>${payment.notes || "Sin notas"}</td>
        </tr>
    `).join("");

    document.getElementById("paymentHistoryBody").innerHTML = html;
}

async function registerPayment() {
    const loanId = document.getElementById("selectLoan").value;
    const paymentDate = document.getElementById("paymentDate").value;
    const paymentAmount = parseFloat(document.getElementById("paymentAmount").value);
    const paymentMethod = document.getElementById("paymentMethod").value;
    const paymentType = document.getElementById("paymentType").value;
    const paymentNotes = document.getElementById("paymentNotes").value;

    if (!loanId || !paymentDate || isNaN(paymentAmount) || paymentAmount <= 0) {
        showToast("Por favor, complete todos los campos correctamente.", "danger");
        return;
    }

    const paymentData = {
        loan_id: loanId,
        payment_date: paymentDate,
        amount_paid: paymentAmount,
        payment_method: paymentMethod,
        payment_type: paymentType,
        notes: paymentNotes
    };

    try {
        const response = await fetch('/api/payment-history', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al registrar el pago.");
        }

        showToast("Pago registrado correctamente.", "success");
        bootstrap.Modal.getInstance(document.getElementById("paymentModal")).hide();
        loadLoans(); // Actualiza la tabla de préstamos para reflejar el nuevo saldo
    } catch (error) {
        console.error("Error al registrar el pago:", error);
        showToast(error.message, "danger");
    }
}

function renderLoanStatsChart() {
    const ctx = document.getElementById('loanStatsChart').getContext('2d');
    const data = {
        labels: ['Activo', 'Cancelado', 'Vencido', 'En Mora'],
        datasets: [{
            label: 'Estados de Préstamos',
            data: [10, 5, 3, 2], // Datos simulados, reemplazar con datos reales
            backgroundColor: ['#28a745', '#007bff', '#ffc107', '#dc3545']
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

let selectedLoanId = null;

async function openPaymentModal() {
    // Restablecer el formulario de pago
    document.getElementById("paymentForm").reset();
    document.getElementById("selectLoan").innerHTML = '<option value="">Seleccione un préstamo</option>';
    document.getElementById("selectLoan").disabled = true;

    // Mostrar el modal
    const paymentModal = new bootstrap.Modal(document.getElementById("paymentModal"));
    paymentModal.show();

    // Cargar préstamos del cliente seleccionado
    const clientId = document.getElementById("searchClientPayment").dataset.clientId;
    if (clientId) {
        await loadClientLoans(clientId);
    }
}

async function searchClientForPayment() {
    const documentNumber = document.getElementById("searchClientPayment").value.trim();

    if (!documentNumber) {
        showToast("Por favor, ingrese un número de documento.", "danger");
        return;
    }

    try {
        const response = await fetch(`/api/clients/by-id-number/${documentNumber}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Cliente no encontrado.");
        }

        const client = await response.json();
        loadClientLoans(client.id);
    } catch (error) {
        console.error("Error al buscar cliente:", error);
        showToast("Error al buscar cliente.", "danger");
    }
}

async function loadClientLoans(clientId) {
    try {
        const response = await fetch(`/api/loans?client_id=${clientId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Error al cargar los préstamos del cliente.");
        }

        const loans = await response.json();
        const loanSelect = document.getElementById("selectLoan");

        // Filtrar préstamos activos con saldo pendiente mayor a 0
        const activeLoans = loans.filter(loan => loan.loan_status === "Activo" && parseFloat(loan.total_due) > 0);

        if (activeLoans.length === 0) {
            loanSelect.innerHTML = '<option value="">Cliente sin créditos activos</option>';
            loanSelect.disabled = true;
document.getElementById("minimumPayment").textContent = "Pago mínimo: No disponible";
            return;
        }

        loanSelect.innerHTML = activeLoans.map(loan => `
            <option value="${loan.id}" 
                        data-amount-requested="${loan.amount_requested}" 
                        data-interest-rate="${loan.interest_rate}" 
                        data-remaining-installments="${loan.remaining_installments}">
${loan.loan_number} - ${parseFloat(loan.amount_requested).toFixed(2)} (${loan.loan_status})
</option>
        `).join("");
        loanSelect.disabled = false;

        // Si hay un solo crédito activo, seleccionarlo automáticamente y mostrar el pago mínimo
        if (activeLoans.length === 1) {
            loanSelect.value = activeLoans[0].id;
            updateMinimumPayment(activeLoans[0]);
        } else {
            document.getElementById("minimumPayment").textContent = "Pago mínimo: Seleccione un crédito";
        }

        // Mostrar el pago mínimo al seleccionar un préstamo
        loanSelect.addEventListener("change", () => {
            const selectedOption = loanSelect.options[loanSelect.selectedIndex];
            if (selectedOption.value) {
                const selectedLoan = activeLoans.find(loan => loan.id == selectedOption.value);
                updateMinimumPayment(selectedLoan);
            } else {
                document.getElementById("minimumPayment").textContent = "Pago mínimo: 0.00";
            }
        });
    } catch (error) {
        console.error("Error al cargar los préstamos del cliente:", error);
        showToast("Error al cargar los préstamos del cliente.", "danger");
    }
}

function updateMinimumPayment(loan) {
    const amountRequested = parseFloat(loan.amount_requested || 0);
    const interestRate = parseFloat(loan.interest_rate || 0) / 100;
    const remainingInstallments = parseInt(loan.remaining_installments || 0);

    if (amountRequested > 0 && interestRate > 0 && remainingInstallments > 0) {
        // Calcular el pago mínimo
        const monthlyRate = interestRate / 12;
        const minimumPayment = (amountRequested * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -remainingInstallments));

        document.getElementById("minimumPayment").textContent = `Pago mínimo: ${minimumPayment.toFixed(2)}`;
    } else {
        document.getElementById("minimumPayment").textContent = "Pago mínimo: No disponible";
    }
}

async function registerPayment() {
    const loanId = document.getElementById("selectLoan").value;
    const paymentDate = document.getElementById("paymentDate").value;
    const paymentAmount = parseFloat(document.getElementById("paymentAmount").value);
    const paymentMethod = document.getElementById("paymentMethod").value;
    const paymentType = document.getElementById("paymentType").value;
    const paymentNotes = document.getElementById("paymentNotes").value;

    if (!loanId || !paymentDate || isNaN(paymentAmount) || paymentAmount <= 0) {
        showToast("Por favor, complete todos los campos correctamente.", "danger");
        return;
    }

    const paymentData = {
        loan_id: loanId,
        payment_date: paymentDate,
        amount_paid: paymentAmount,
        payment_method: paymentMethod,
        payment_type: paymentType,
        notes: paymentNotes
    };

    try {
        const response = await fetch('/api/payment-history', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al registrar el pago.");
        }

        showToast("Pago registrado correctamente.", "success");
        bootstrap.Modal.getInstance(document.getElementById("paymentModal")).hide();
        loadLoans(); // Actualiza la tabla de préstamos
    } catch (error) {
        console.error("Error al registrar el pago:", error);
        showToast(error.message, "danger");
    }
}

function openPaymentHistoryModal() {
    // Restablecer el formulario y la tabla del historial
    document.getElementById("searchClientHistory").value = "";
    document.getElementById("selectLoanHistory").innerHTML = '<option value="">Seleccione un préstamo</option>';
    document.getElementById("selectLoanHistory").disabled = true;
    document.getElementById("paymentHistoryTableBody").innerHTML = "";

    // Mostrar el modal
    const paymentHistoryModal = new bootstrap.Modal(document.getElementById("paymentHistoryModal"));
    paymentHistoryModal.show();
}

async function searchClientForHistory() {
    const documentNumber = document.getElementById("searchClientHistory").value.trim();

    if (!documentNumber) {
        showToast("Por favor, ingrese un número de documento.", "danger");
        return;
    }

    try {
        const response = await fetch(`/api/clients/by-id-number/${documentNumber}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Cliente no encontrado.");
        }

        const client = await response.json();
        loadClientLoansForHistory(client.id);
    } catch (error) {
        console.error("Error al buscar cliente:", error);
        showToast("Error al buscar cliente.", "danger");
    }
}

async function loadClientLoansForHistory(clientId) {
    try {
        const response = await fetch(`/api/loans?client_id=${clientId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Error al cargar los préstamos del cliente.");
        }

        const loans = await response.json();
        const loanSelect = document.getElementById("selectLoanHistory");

        if (loans.length === 0) {
            loanSelect.innerHTML = '<option value="">No hay préstamos disponibles</option>';
            loanSelect.disabled = true;
document.getElementById("paymentHistoryTableBody").innerHTML = `
                <tr>
                    <td colspan="5">No hay pagos registrados para este cliente.</td>
                </tr>
            `;
            return;
        }

        loanSelect.innerHTML = loans.map(loan => `
            <option value="${loan.id}">${loan.loan_number} - ${loan.amount_requested} (${loan.loan_status})</option>
        `).join("");
        loanSelect.disabled = false;

        // Si hay un solo préstamo, seleccionarlo automáticamente y cargar su historial
        if (loans.length === 1) {
            loanSelect.value = loans[0].id;
            loadPaymentHistoryForLoan(loans[0].id);
        } else {
            document.getElementById("paymentHistoryTableBody").innerHTML = `
                <tr>
                    <td colspan="5">Seleccione un préstamo para ver el historial de pagos.</td>
                </tr>
            `;
        }

        // Agregar evento para cargar el historial de pagos al seleccionar un préstamo
        loanSelect.addEventListener("change", () => {
            const selectedLoanId = loanSelect.value;
            if (selectedLoanId) {
                loadPaymentHistoryForLoan(selectedLoanId);
} else {
                document.getElementById("paymentHistoryTableBody").innerHTML = `
                    <tr>
                        <td colspan="5">Seleccione un préstamo para ver el historial de pagos.</td>
                    </tr>
                `;
            }
        });
    } catch (error) {
        console.error("Error al cargar los préstamos del cliente:", error);
        showToast("Error al cargar los préstamos del cliente.", "danger");
    }
}

async function loadPaymentHistoryForLoan(loanId) {
    try {
        const response = await fetch(`/api/payment-history/${loanId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Error al cargar el historial de pagos.");
        }

        const payments = await response.json();

        // Verificar si hay pagos disponibles
        if (payments.length === 0) {
            document.getElementById("paymentHistoryTableBody").innerHTML = `
                <tr>
                    <td colspan="5">No hay pagos registrados para este préstamo.</td>
                </tr>
            `;
            return;
        }

        renderPaymentHistoryForLoan(payments);
    } catch (error) {
        console.error("Error al cargar el historial de pagos:", error);
// No mostrar mensaje de error si el historial se carga correctamente
        if (!document.getElementById("paymentHistoryTableBody").innerHTML.trim()) {
        showToast("Error al cargar el historial de pagos.", "danger");
    }
}
}

function renderPaymentHistoryForLoan(payments) {
    const html = payments.map(payment => `
        <tr>
            <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
            <td>${formatCurrency(payment.amount_paid)}</td>
            <td>${payment.payment_method}</td>
            <td>${payment.payment_type === 'Cuota' ? 'Cuota' : 'Capital'}</td>
            <td>${payment.notes || "Sin notas"}</td>
        </tr>
    `).join("");

    document.getElementById("paymentHistoryTableBody").innerHTML = html;

    // Mostrar saldo pendiente y cuotas pendientes en el modal
    const loan = payments.length > 0 ? payments[0].Loan : null;
    if (loan) {
        document.getElementById("paymentHistoryLoanDetails").innerHTML = `
            <p><strong>Saldo Pendiente:</strong> ${formatCurrency(loan.total_due)}</p>
            <p><strong>Cuotas Pendientes:</strong> ${loan.remaining_installments}</p>
        `;
    }
}
