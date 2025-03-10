document.addEventListener("DOMContentLoaded", () => {
    loadUsers(); // 🔹 Cargar usuarios cuando el DOM esté listo

    // Asignar evento al botón de búsqueda
    document.getElementById("searchButton").addEventListener("click", searchUser);
    document.getElementById("createUserButton").addEventListener("click", openUserModal);
});

async function loadUsers() {
    const token = localStorage.getItem("token");
    console.log("Token que se enviará al backend:", token); // 🔍 Verificar que el token no sea null ni vacío

    if (!token) {
        showMessage("Tu sesión ha expirado. Inicia sesión nuevamente.", "error");
        window.location.href = "login.html"; // 🔹 Redirigir al login
        return;
    }

    try {
        const response = await fetch('/api/users', {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Código de respuesta del backend:", response.status); // 🔍 Verificar código de respuesta

        if (!response.ok) {
            throw new Error("Token inválido o expirado.");
        }

        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        showMessage("Token inválido o expirado. Inicia sesión nuevamente.", "error");
        localStorage.removeItem("token");
        window.location.href = "login.html"; // 🔹 Redirigir al login
    }
}

async function searchUser() {
    const username = document.getElementById("searchUsername").value.trim();
    if (!username) {
        showMessage("Por favor, ingresa un nombre de usuario.", "error");
        return;
    }


    try {
        const response = await fetch(`/api/users/search/${username}`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Token inválido o expirado.");
        }

        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error("Error al buscar usuario:", error);
    
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
                <button class="btn btn-warning btn-sm" onclick="editUser(${user.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Eliminar</button>
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

// Función para guardar usuario (crear o editar)
async function saveUser() {
    const userId = document.getElementById("userId").value;
    const url = userId ? `/api/users/${userId}` : "/api/users";
    const method = userId ? "PUT" : "POST";

    const userData = {
        full_name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        username: document.getElementById("username").value,
        password: document.getElementById("password_hash").value,
        role: document.getElementById("role").value,
        status: document.getElementById("status").value,
    };

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error("Error al guardar el usuario");
        }

        const data = await response.json();
        showMessage(`Usuario ${userId ? "actualizado" : "creado"} correctamente`, "success");
        loadUsers(); // Recargar la lista de usuarios
        new bootstrap.Modal(document.getElementById("userModal")).hide();
    } catch (error) {
        console.error("Error al guardar el usuario:", error);
        showMessage("Error al guardar el usuario", "error");
    }
}

// Función para editar un usuario
async function editUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener el usuario");
        }

        const user = await response.json();

        // Llenar el formulario con los datos del usuario
        document.getElementById("userModalLabel").textContent = "Editar Usuario";
        document.getElementById("userId").value = user.id;
        document.getElementById("fullName").value = user.full_name;
        document.getElementById("email").value = user.email;
        document.getElementById("username").value = user.username;
        document.getElementById("role").value = user.role;
        document.getElementById("status").value = user.status;

        new bootstrap.Modal(document.getElementById("userModal")).show();
    } catch (error) {
        console.error("Error al editar el usuario:", error);
        showMessage("Error al editar el usuario", "error");
    }
}

// Función para eliminar un usuario
async function deleteUser(userId) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) {
            throw new Error("Error al eliminar el usuario");
        }

        showMessage("Usuario eliminado correctamente", "success");
        loadUsers(); // Recargar la lista de usuarios
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        showMessage("Error al eliminar el usuario", "error");
    }
}

async function editUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener el usuario");
        }

        const user = await response.json();

        // Llenar el formulario con los datos del usuario
        document.getElementById("userModalLabel").textContent = "Editar Usuario";
        document.getElementById("userId").value = user.id;
        document.getElementById("fullName").value = user.full_name;
        document.getElementById("email").value = user.email;
        document.getElementById("username").value = user.username;
        document.getElementById("role").value = user.role;
        document.getElementById("status").value = user.status;

        new bootstrap.Modal(document.getElementById("userModal")).show();
    } catch (error) {
        console.error("Error al editar el usuario:", error);
        showMessage("Error al editar el usuario", "error");
    }
}
async function deleteUser(userId) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) {
            throw new Error("Error al eliminar el usuario");
        }

        showMessage("Usuario eliminado correctamente", "success");
        loadUsers(); // Recargar la lista de usuarios
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        showMessage("Error al eliminar el usuario", "error");
    }
}



function showMessage(message, type = "error") {
    const messageContainer = document.getElementById("messageContainer");
    messageContainer.textContent = message;
    messageContainer.className = `message-container ${type}`;
    messageContainer.style.display = "block";

    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        messageContainer.style.display = "none";
    }, 5000);
}

function logout() {
    // Eliminar el token del localStorage
    localStorage.removeItem("token");

    // Redirigir al usuario a la página de login
    window.location.href = "login.html";
}
function goToDashboard() {
    window.location.href = '/dashboard';
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
