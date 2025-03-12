document.addEventListener("DOMContentLoaded", () => {
    loadUsers();

    // Cambiar este event listener
    document.getElementById("sidebarCreateUserButton").addEventListener("click", () => {
        openUserModal();
    });

    // Actualizar los event listeners para ambos botones
    document.getElementById("mainCreateUserButton")?.addEventListener("click", openUserModal);

    // Agregar manejo del sidebar
    document.getElementById("sidebarCollapse").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("active");
        document.getElementById("content").classList.toggle("active");
    });
});

async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener usuarios.");
        }

        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        alert("Error al obtener usuarios.");
    }
}

function renderUsers(users) {
    const html = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td>${user.status}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-sm action-btn" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm action-btn" onclick="deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    document.getElementById("userTableBody").innerHTML = html;
}

function openUserModal() {
    document.getElementById("userModalLabel").textContent = "Crear Usuario";
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    new bootstrap.Modal(document.getElementById("userModal")).show();
}

async function saveUser() {
    const userId = document.getElementById("userId").value;
    const url = userId ? `/api/users/${userId}` : "/api/users";
    const method = userId ? "PUT" : "POST";

    const userData = {
        full_name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value,
        status: document.getElementById("status").value,
    };

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error("Error al guardar el usuario");
        }

        const data = await response.json();
        alert(`Usuario ${userId ? "actualizado" : "creado"} correctamente`);
        loadUsers();
        const modal = bootstrap.Modal.getInstance(document.getElementById("userModal"));
        modal.hide();
    } catch (error) {
        console.error("Error al guardar el usuario:", error);
        alert("Error al guardar el usuario");
    }
}

async function editUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener el usuario");
        }

        const user = await response.json();

        document.getElementById("userModalLabel").textContent = "Editar Usuario";
        document.getElementById("userId").value = user.id;
        document.getElementById("fullName").value = user.full_name;
        document.getElementById("email").value = user.email;
        document.getElementById("username").value = user.username;
        document.getElementById("password").value = ""; // No mostrar la contraseña
        document.getElementById("role").value = user.role;
        document.getElementById("status").value = user.status;

        new bootstrap.Modal(document.getElementById("userModal")).show();
    } catch (error) {
        console.error("Error al editar el usuario:", error);
        alert("Error al editar el usuario");
    }
}

async function deleteUser(userId) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (!response.ok) {
            throw new Error("Error al eliminar el usuario");
        }

        alert("Usuario eliminado correctamente");
        loadUsers();
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        alert("Error al eliminar el usuario");
    }
}

function showMessage(message, type = "error") {
    const messageContainer = document.getElementById("messageContainer");
    messageContainer.textContent = message;
    messageContainer.className = `message-container ${type}`;
    messageContainer.style.display = "block";

    setTimeout(() => {
        messageContainer.style.display = "none";
    }, 5000);
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

function goToDashboard() {
    window.location.href = '/dashboard';
}

function toggleSubmenu(event) {
    event.preventDefault();

    let parent = event.currentTarget.parentElement;
    let submenu = parent.querySelector(".submenu");

    if (submenu.classList.contains("show")) {
        submenu.classList.remove("show");
    } else {
        submenu.classList.add("show");
    }
}
