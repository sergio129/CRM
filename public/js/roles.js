document.addEventListener("DOMContentLoaded", () => {
    loadRoles();

    document.getElementById("createRoleButton").addEventListener("click", () => {
        openRoleModal();
    });

    document.getElementById("sidebarCollapse").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("active");
        document.getElementById("content").classList.toggle("active");
    });
});

async function loadRoles() {
    const response = await fetch('/api/roles', {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });

    const roles = await response.json();
    renderRoles(roles);
}

function renderRoles(roles) {
    const html = roles.map(role => `
        <tr>
            <td>${role.id}</td>
            <td>${role.role_name}</td>
            <td>${role.description || ''}</td>
            <td>${role.status}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-sm action-btn" onclick="editRole('${role.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm action-btn" onclick="deleteRole('${role.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    document.getElementById("roleTableBody").innerHTML = html;
}

async function saveRole() {
    const id = document.getElementById("roleId").value;
    const name = document.getElementById("roleName").value;
    const permissions = Array.from(document.getElementById("rolePermissions").selectedOptions).map(opt => opt.value);

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/roles/${id}` : "/api/roles";

    await fetch(url, {
        method,
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ role_name: name, permission: permissions })
    });

    loadRoles();
}

async function searchRole() {
    const roleName = document.getElementById("searchRole").value.trim();
    if (!roleName) {
        alert("Ingrese un nombre de rol.");
        return;
    }

    try {
        const response = await fetch(`/api/roles/search/${roleName}`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });

        if (!response.ok) {
            alert("Rol no encontrado.");
            return;
        }

        const roles = await response.json();
        renderRoles(roles);
    } catch (error) {
        console.error("Error al buscar rol:", error);
        alert("Error al buscar rol.");
    }
}

function openEditRoleModal(id, name, permissions) {
    document.getElementById("editRoleId").value = id;
    document.getElementById("editRoleName").value = name;

    const permArray = JSON.parse(permissions);
    document.getElementById("editRolePermissions").querySelectorAll("option").forEach(option => {
        option.selected = permArray.includes(option.value);
    });

    new bootstrap.Modal(document.getElementById("editRoleModal")).show();
}

document.getElementById('editRoleForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const roleId = document.getElementById('editRoleId').value;
    const rolePermissions = Array.from(document.getElementById('editRolePermissions').selectedOptions).map(opt => opt.value);

    try {
        const response = await fetch(`/api/roles/${roleId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ permissions: rolePermissions })
        });

        if (response.ok) {
            alert('Permisos del rol actualizados correctamente');
            loadRoles();
            new bootstrap.Modal(document.getElementById("editRoleModal")).hide();
        } else {
            const errorData = await response.json();
            alert(`Error al actualizar los permisos del rol: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error al actualizar los permisos del rol:', error);
        alert('Ocurrió un error. Intenta nuevamente.');
    }
});

async function deleteRole(id) {
    if (!confirm("¿Estás seguro de eliminar este rol?")) return;

    try {
        const response = await fetch(`/api/roles/${id}`, {
            method: 'DELETE',
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });

        if (response.ok) {
            alert('Rol eliminado correctamente');
            loadRoles();
        } else {
            alert('Error al eliminar el rol');
        }
    } catch (error) {
        console.error('Error al eliminar el rol:', error);
        alert('Error al eliminar el rol');
    }
}

// Buscar un usuario por nombre de usuario
async function searchUser() {
    const username = document.getElementById("searchUser").value.trim();
    if (!username) {
        alert("Ingrese un nombre de usuario.");
        return;
    }

    try {
        const response = await fetch(`/api/users/search/${username}`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });

        if (!response.ok) {
           // alert("Usuario no encontrado.");
            document.getElementById("userDetails").style.display = "none";
            return;
        }

        const users = await response.json();
        console.log("Usuarios encontrados:", users); // 🔍 Verificar datos en consola

        // Verificar si hay al menos un usuario en la respuesta
        if (!users.length || !users[0].username) {
           // alert("Usuario no encontrado.");
            document.getElementById("userDetails").style.display = "none";
            return;
        }

        const user = users[0]; // Obtener el primer usuario del array

        // Mostrar los datos del usuario
        document.getElementById("userDetails").style.display = "block";
        document.getElementById("foundUsername").innerText = user.username;
        document.getElementById("foundEmail").innerText = user.email;
        document.getElementById("foundRole").innerText = user.role;

        // Cargar los roles disponibles en el select
        loadRolesForSelect(user.role);

    } catch (error) {
     //   console.error("Error al buscar usuario:", error);
       // alert("Error al buscar usuario.");
    }
}

async function loadRolesForSelect(currentRole) {
    try {
        const response = await fetch("/api/roles", {
            method: "GET",
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });

        if (!response.ok) {
            console.error("Error al obtener roles.");
            return;
        }

        const roles = await response.json();
        const newRoleSelect = document.getElementById("newRole");

        // Limpiar el select antes de agregar opciones
        newRoleSelect.innerHTML = "";

        roles.forEach(role => {
            let option = document.createElement("option");
            option.value = role.role_name;
            option.text = role.role_name;

            // Seleccionar automáticamente el rol actual del usuario
            if (role.role_name === currentRole) {
                option.selected = true;
            }

            newRoleSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error al cargar roles:", error);
    }
}

// Cambiar el rol de un usuario
async function changeUserRole() {
    const username = document.getElementById("foundUsername").innerText;
    const newRole = document.getElementById("newRole").value;

    const response = await fetch(`/api/users/update-role/${encodeURIComponent(username)}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ newRole })
    });
    const result = await response.json();
    if (response.ok) {
        alert("Rol actualizado correctamente.");
        document.getElementById("userDetails").style.display = "none";
    } else {
        alert("Error al actualizar el rol.");
    }
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

loadRoles();
