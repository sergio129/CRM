async function loadRoles() {
    const response = await fetch('/api/roles', {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });

    const roles = await response.json();
    renderRoles(roles);
}

function renderRoles(roles) {
    let html = "";
    roles.forEach(role => {
        html += `<tr>
            <td>${role.id || 'N/A'}</td>
            <td>${role.role_name || 'Sin nombre'}</td>
            <td>${role.permissions ? JSON.stringify(role.permissions) : 'Sin permisos'}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editRole(${role.id}, '${role.role_name || ''}', '${role.permission ? JSON.stringify(role.permission) : ''}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteRole(${role.id})">Eliminar</button>
            </td>
        </tr>`;
    });
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

function editRole(id, name, permissions) {
    document.getElementById("roleId").value = id;
    document.getElementById("roleName").value = name;

    const permArray = JSON.parse(permissions);
    document.getElementById("rolePermissions").querySelectorAll("option").forEach(option => {
        option.selected = permArray.includes(option.value);
    });
}

async function deleteRole(id) {
    await fetch(`/api/roles/${id}`, {
       
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    loadRoles();
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
