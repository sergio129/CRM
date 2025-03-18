document.addEventListener("DOMContentLoaded", () => {
    loadLoans();
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
        renderLoans(loans);
        showToast("Préstamos cargados correctamente.", "success");
    } catch (error) {
        console.error("Error al cargar préstamos:", error);
        showToast("Error al cargar préstamos.", "danger");
    }
}

function renderLoans(loans) {
    const html = loans.map(loan => `
        <tr>
            <td>${loan.id}</td>
            <td>${loan.loan_number}</td>
            <td>${loan.Client.full_name} (${loan.Client.id_number})</td>
            <td>${loan.amount_requested}</td>
            <td>${loan.interest_rate}% (${loan.interest_type})</td>
            <td>${loan.payment_term} meses</td>
            <td>${loan.loan_status}</td>
            <td>${loan.risk_score ? `${(loan.risk_score * 100).toFixed(2)}%` : 'N/A'}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editLoan(${loan.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteLoan(${loan.id})">Eliminar</button>
            </td>
        </tr>
    `).join("");

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
