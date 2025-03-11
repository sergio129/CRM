document.addEventListener("DOMContentLoaded", () => {
    loadClients();

    document.getElementById("createClientButton").addEventListener("click", openClientModal);
});

async function loadClients() {
    try {
        const response = await fetch('/api/clients', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener clientes.");
        }

        const clients = await response.json();
        renderClients(clients);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        alert("Error al obtener clientes.");
    }
}

function renderClients(clients) {
    const html = clients.map(client => `
        <tr>
            <td>${client.identification}</td>
            <td>${client.full_name}</td>
            <td>${client.email}</td>
            <td>${client.phone}</td>
            <td>${client.address}</td>
            <td>${client.status}</td>
            <td>
                <div class="d-flex justify-content-between">
                    <button class="btn btn-warning btn-sm me-2" onclick="editClient('${client.identification}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteClient('${client.identification}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join("");

    document.getElementById("clientTableBody").innerHTML = html;
}

function openClientModal() {
    document.getElementById("clientModalLabel").textContent = "Crear Cliente";
    document.getElementById("clientForm").reset();
    document.getElementById("clientId").value = "";
    new bootstrap.Modal(document.getElementById("clientModal")).show();
}

async function saveClient() {
    const clientId = document.getElementById("clientId").value;
    const url = clientId ? `/api/clients/${clientId}` : "/api/clients";
    const method = clientId ? "PUT" : "POST";

    const clientData = {
        full_name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
        identification: document.getElementById("identification").value,
        deuda_total: document.getElementById("deudaTotal").value,
        ultimo_pago: document.getElementById("ultimoPago").value,
        estado_financiero: document.getElementById("estadoFinanciero").value,
        status: document.getElementById("status").value,
    };

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(clientData),
        });

        if (!response.ok) {
            throw new Error("Error al guardar el cliente");
        }

        const data = await response.json();
        alert(`Cliente ${clientId ? "actualizado" : "creado"} correctamente`);
        loadClients();
        const modal = bootstrap.Modal.getInstance(document.getElementById("clientModal"));
        modal.hide();
    } catch (error) {
        console.error("Error al guardar el cliente:", error);
        alert("Error al guardar el cliente");
    }
}

async function editClient(clientId) {
    try {
        const response = await fetch(`/api/clients/${clientId}`, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener el cliente");
        }

        const client = await response.json();

        document.getElementById("clientModalLabel").textContent = "Editar Cliente";
        document.getElementById("clientId").value = client.identification;
        document.getElementById("fullName").value = client.full_name;
        document.getElementById("email").value = client.email;
        document.getElementById("phone").value = client.phone;
        document.getElementById("address").value = client.address;
        document.getElementById("identification").value = client.identification;
        document.getElementById("deudaTotal").value = client.deuda_total;
        document.getElementById("ultimoPago").value = client.ultimo_pago ? client.ultimo_pago.split('T')[0] : ''; // Manejar null
        document.getElementById("estadoFinanciero").value = client.estado_financiero;
        document.getElementById("status").value = client.status;

        new bootstrap.Modal(document.getElementById("clientModal")).show();
    } catch (error) {
        console.error("Error al editar el cliente:", error);
        alert("Error al editar el cliente");
    }
}

async function deleteClient(clientId) {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

    try {
        const response = await fetch(`/api/clients/${clientId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Error al eliminar el cliente");
        }

        alert("Cliente eliminado correctamente");
        loadClients();
    } catch (error) {
        console.error("Error al eliminar el cliente:", error);
        alert("Error al eliminar el cliente");
    }
}
