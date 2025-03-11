document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    console.log("Token en dashboard:", token); // 🔍 Verificar que el token esté disponible

    if (!token) {
        alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
        window.location.href = "login.html"; // 🔹 Redirigir al login
    }

    loadDashboardData();
});

async function searchClient() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
        window.location.href = "login.html"; // 🔹 Redirigir al login
        return;
    }

    const clientId = document.getElementById("clientId").value.trim();
    const resultDiv = document.getElementById("clientResult");

    if (!clientId) {
        resultDiv.innerHTML = "<p class='text-danger'>Ingrese un número de identificación válido.</p>";
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/clients/${clientId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        const estadosFinancieros = {
            "Al día": { class: "alert-success", text: "✅ El cliente está al día con sus pagos." },
            "En mora": { class: "alert-warning", text: "⚠️ El cliente tiene pagos atrasados." },
            "Bloqueado": { class: "alert-danger", text: "❌ El cliente está bloqueado por deudas." },
            default: { class: "alert-secondary", text: "ℹ️ Estado financiero no disponible." }
        };

        const estado = estadosFinancieros[data.estado_financiero] || estadosFinancieros.default;

        resultDiv.innerHTML = `
            <div class="alert ${estado.class}" role="alert">${estado.text}</div>
            <p><strong>Cliente:</strong> ${data.full_name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Teléfono:</strong> ${data.phone}</p>
            <p><strong>Dirección:</strong> ${data.address}</p>
            <p><strong>Deuda Total:</strong> $${data.deuda_total}</p>
            <p><strong>Último Pago:</strong> ${data.ultimo_pago || 'No disponible'}</p>
        `;
    } catch (error) {
        console.error("Error al buscar cliente:", error);
        resultDiv.innerHTML = `<p class='text-danger'>Ocurrió un error al buscar el cliente: ${error.message}</p>`;
    }
}

const user = JSON.parse(localStorage.getItem("user"));
const permission = user ? user.permission : {};

if (!permission.roles.includes("read")) {
    document.getElementById("rolesModule").style.display = "none";
}

if (!permission.users.includes("read")) {
    document.getElementById("usersModule").style.display = "none";
}

function toggleSubmenu(event) {
    event.preventDefault(); // Evita que el enlace recargue la página

    let parent = event.currentTarget.parentElement;
    let submenu = parent.querySelector(".submenu");

    if (submenu.classList.contains("show")) {
        submenu.classList.remove("show");
    } else {
        submenu.classList.add("show");
    }
}

async function loadDashboardData() {
    try {
        const [clientsResponse, employeesResponse, payrollsResponse] = await Promise.all([
            fetch('/api/clients', { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }),
            fetch('/api/employees', { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }),
            fetch('/api/payrolls', { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } })
        ]);

        if (!clientsResponse.ok || !employeesResponse.ok || !payrollsResponse.ok) {
            throw new Error("Error al obtener datos del dashboard.");
        }

        const clients = await clientsResponse.json();
        const employees = await employeesResponse.json();
        const payrolls = await payrollsResponse.json();

        document.getElementById("totalClients").textContent = clients.length;
        document.getElementById("totalEmployees").textContent = employees.length;
        document.getElementById("totalPayrolls").textContent = payrolls.length;

        renderClientsChart(clients);
        renderClientsPercentageChart(clients);
    } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        alert("Error al cargar datos del dashboard.");
    }
}

function renderClientsChart(clients) {
    const ctx = document.getElementById('clientsChart').getContext('2d');
    const clientsData = clients.reduce((acc, client) => {
        const status = client.status || 'Desconocido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(clientsData),
            datasets: [{
                label: 'Clientes',
                data: Object.values(clientsData),
                backgroundColor: ['#42b72a', '#f7b731', '#e74c3c', '#3498db']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribución de Clientes por Estado'
                }
            }
        }
    });
}

function renderClientsPercentageChart(clients) {
    const ctx = document.getElementById('clientsPercentageChart').getContext('2d');
    const clientsData = clients.reduce((acc, client) => {
        const estadoFinanciero = client.estado_financiero || 'Desconocido';
        acc[estadoFinanciero] = (acc[estadoFinanciero] || 0) + 1;
        return acc;
    }, {});

    const totalClients = clients.length;
    const clientsPercentageData = Object.keys(clientsData).reduce((acc, key) => {
        acc[key] = ((clientsData[key] / totalClients) * 100).toFixed(2);
        return acc;
    }, {});

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(clientsPercentageData),
            datasets: [{
                label: 'Porcentaje de Clientes',
                data: Object.values(clientsPercentageData),
                backgroundColor: ['#42b72a', '#f7b731', '#e74c3c', '#3498db']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Porcentaje de Clientes por Estado Financiero'
                }
            }
        }
    });
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}
