document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    console.log("Token en dashboard:", token); // 🔍 Verificar que el token esté disponible

    if (!token) {
        alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
        window.location.href = "login.html"; // 🔹 Redirigir al login
    }
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
