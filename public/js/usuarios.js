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

    // Agregar event listener para búsqueda en tiempo real
    document.getElementById("tableSearch").addEventListener("keyup", filterTable);
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
            <td><span class="badge bg-${user.status === 'Activo' ? 'success' : 'danger'}">${user.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm action-btn" onclick="viewUserDetails(${user.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm action-btn" onclick="editUser(${user.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm action-btn" onclick="deleteUser(${user.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('userTableBody').innerHTML = html;
}

async function viewUserDetails(id) {
    try {
        const response = await fetch(`/api/users/${id}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener detalles del usuario');
        }

        const user = await response.json();
        openUserModal(user, true); // true indica modo lectura
    } catch (error) {
        console.error("Error:", error);
        showMessage(error.message, "error");
    }
}

function openUserModal(user = null, readOnly = false) {
    document.getElementById("userModalLabel").textContent = user ? "Editar Usuario" : "Crear Usuario";
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = user ? user.id : "";
    document.getElementById("fullName").value = user ? user.full_name : "";
    document.getElementById("email").value = user ? user.email : "";
    document.getElementById("username").value = user ? user.username : "";
    document.getElementById("password").value = ""; // No mostrar la contraseña
    document.getElementById("role").value = user ? user.role : "";
    document.getElementById("status").value = user ? user.status : "";

    // Mostrar sección de búsqueda al crear nuevo usuario
    document.getElementById("searchEmployeeSection").style.display = user ? "none" : "block";

    // Habilitar/deshabilitar campos según modo
    const form = document.getElementById("userForm");
    const inputs = form.getElementsByTagName('input');
    const selects = form.getElementsByTagName('select');
    
    [...inputs, ...selects].forEach(element => {
        element.readOnly = readOnly;
        if (element.tagName === 'SELECT') {
            element.disabled = readOnly;
        }
    });

    // Mostrar/ocultar botón de guardar según modo
    const saveButton = document.querySelector('.modal-footer .btn-primary');
    if (saveButton) {
        saveButton.style.display = readOnly ? 'none' : 'block';
    }

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

        // Ocultar sección de búsqueda en modo edición
        document.getElementById("searchEmployeeSection").style.display = "none";
        // Permitir edición directa de los campos
        document.getElementById("fullName").readOnly = false;
        document.getElementById("email").readOnly = false;
        
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

async function searchEmployeeByDocument() {
    const documentNumber = document.getElementById("searchEmployee").value.trim();
    
    if (!documentNumber) {
        showMessage("Por favor ingrese un número de documento", "warning");
        return;
    }

    try {
        const response = await fetch(`/api/employees/by-id-number/${documentNumber}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Empleado no encontrado");
        }

        const employee = await response.json();
        
        // Llenar campos automáticamente
        document.getElementById("fullName").value = employee.full_name;
        document.getElementById("email").value = employee.email;

        // Generar y establecer usuario sugerido
        const suggestedUsername = generateUsername(employee.full_name);
        document.getElementById("username").value = suggestedUsername;

        showMessage("Empleado encontrado. Se han rellenado los campos automáticamente.", "success");
    } catch (error) {
        console.error("Error:", error);
        showMessage("Error al buscar empleado: " + error.message, "error");
        
        // Limpiar campos
        document.getElementById("fullName").value = "";
        document.getElementById("email").value = "";
        document.getElementById("username").value = "";
    }
}

function generateUsername(fullName) {
    // Limpiar el nombre: remover acentos y caracteres especiales
    const cleanName = fullName.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z\s]/g, "");

    // Dividir en palabras
    const names = cleanName.split(" ");
    
    let username = "";
    if (names.length >= 2) {
        // Primera letra del primer nombre + primer apellido completo
        username = names[0].charAt(0) + names[names.length - 1];
    } else {
        // Si solo hay una palabra, usar las primeras 5 letras
        username = names[0].substring(0, 5);
    }

    // Agregar número aleatorio para evitar duplicados
    username += Math.floor(Math.random() * 100);

    return username;
}

function showMessage(message, type = "error") {
    // Crear el elemento de alerta si no existe
    let alertDiv = document.getElementById("alertMessage");
    if (!alertDiv) {
        alertDiv = document.createElement("div");
        alertDiv.id = "alertMessage";
        document.getElementById("userForm").prepend(alertDiv);
    }

    // Configurar la alerta
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Eliminar la alerta después de 3 segundos
    setTimeout(() => {
        if (alertDiv) {
            alertDiv.remove();
        }
    }, 3000);
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

function filterTable() {
    const searchText = document.getElementById("tableSearch").value.toLowerCase();
    const tbody = document.getElementById("userTableBody");
    const rows = tbody.getElementsByTagName("tr");

    for (let row of rows) {
        const cells = row.getElementsByTagName("td");
        let found = false;
        
        for (let cell of cells) {
            if (cell.textContent.toLowerCase().includes(searchText)) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? "" : "none";
    }
}
