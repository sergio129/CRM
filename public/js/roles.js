document.addEventListener("DOMContentLoaded", () => {
    loadRoles();

    document.getElementById("createRoleButton").addEventListener("click", () => {
        openRoleModal();
    });

    document.getElementById("searchRole").addEventListener("input", filterRoles);
});

async function loadRoles() {
    try {
        const response = await fetch('/api/roles', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}` // Agregar token de autenticación
            }
        });

        if (!response.ok) {
            throw new Error("Error al cargar roles.");
        }

        const roles = await response.json();
        renderRoles(roles);
    } catch (error) {
        console.error("Error al cargar roles:", error);
        alert("Error al cargar roles.");
    }
}

function renderRoles(roles) {
    const html = roles.map(role => `
        <tr>
            <td>${role.id || 'N/A'}</td>
            <td>${role.role_name || 'Sin nombre'}</td>
            <td>${formatPermissions(role.permissions) || 'Sin permisos'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm" onclick="viewRole(${role.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="editRole(${role.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRole(${role.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    document.getElementById("roleTableBody").innerHTML = html;
}

function formatPermissions(permissions) {
    if (!permissions || typeof permissions !== 'object') {
        return 'Sin permisos';
    }

    return Object.entries(permissions)
        .map(([module, actions]) => `${module}: ${Array.isArray(actions) ? actions.join(', ') : actions}`)
        .join('<br>');
}

function openRoleModal(role = null) {
    document.getElementById("roleForm").reset();
    document.getElementById("roleId").value = role ? role.id : "";
    document.getElementById("roleName").value = role ? role.name : "";
    document.getElementById("roleDescription").value = role ? role.description : "";
    document.getElementById("roleStatus").value = role ? role.status : "Activo";

    loadPermissions(role ? role.permissions : []);

    new bootstrap.Modal(document.getElementById("roleModal")).show();
}

async function loadPermissions(selectedPermissions = []) {
    try {
        const response = await fetch('/api/permissions', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}` // Agregar token de autenticación
            }
        });

        if (!response.ok) {
            throw new Error("Error al cargar permisos.");
        }

        const permissions = await response.json();
        const container = document.getElementById("rolePermissions");
        container.innerHTML = permissions.map(permission => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="permission-${permission.id}" value="${permission.id}" ${selectedPermissions.includes(permission.id) ? "checked" : ""}>
                <label class="form-check-label" for="permission-${permission.id}">${permission.name}</label>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error al cargar permisos:", error);
        alert("Error al cargar permisos.");
    }
}

async function saveRole() {
    const roleId = document.getElementById("roleId").value;
    const url = roleId ? `/api/roles/${roleId}` : "/api/roles";
    const method = roleId ? "PUT" : "POST";

    const permissions = Array.from(document.querySelectorAll("#rolePermissions .form-check-input:checked")).map(input => input.value);

    const roleData = {
        name: document.getElementById("roleName").value,
        description: document.getElementById("roleDescription").value,
        status: document.getElementById("roleStatus").value,
        permissions
    };

    try {
        const response = await fetch(url, {
            method,
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}` // Agregar token de autenticación
            },
            body: JSON.stringify(roleData)
        });

        if (!response.ok) {
            throw new Error("Error al guardar el rol.");
        }

        alert(`Rol ${roleId ? "actualizado" : "creado"} correctamente.`);
        loadRoles();
        bootstrap.Modal.getInstance(document.getElementById("roleModal")).hide();
    } catch (error) {
        console.error("Error al guardar el rol:", error);
        alert("Error al guardar el rol.");
    }
}

async function deleteRole(roleId) {
    if (!confirm("¿Estás seguro de eliminar este rol?")) return;

    try {
        const response = await fetch(`/api/roles/${roleId}`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}` // Agregar token de autenticación
            }
        });

        if (!response.ok) {
            throw new Error("Error al eliminar el rol.");
        }

        alert("Rol eliminado correctamente.");
        loadRoles();
    } catch (error) {
        console.error("Error al eliminar el rol:", error);
        alert("Error al eliminar el rol.");
    }
}

function filterRoles() {
    const searchText = document.getElementById("searchRole").value.toLowerCase();
    const rows = document.querySelectorAll("#roleTableBody tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const matches = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(searchText));
        row.style.display = matches ? "" : "none";
    });
}

async function exportRoles() {
    try {
        const response = await fetch('/api/roles/export', {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}` // Agregar token de autenticación
            }
        });

        if (!response.ok) {
            throw new Error("Error al exportar roles.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "roles.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        console.error("Error al exportar roles:", error);
        alert("Error al exportar roles.");
    }
}
