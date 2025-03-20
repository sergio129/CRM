document.addEventListener("DOMContentLoaded", () => {
    loadRoles();
    loadPermissions();

    // Event listener para abrir la modal de nuevo rol usando el botón original
    document.getElementById("newRoleButton").addEventListener("click", () => {
        openRoleModal();
    });

    // Event listener para guardar el rol
    document.getElementById("saveRoleButton").addEventListener("click", saveRole);
});

function showToast(message, type = "success", duration = 5000) {
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

    // Eliminar el toast después de un tiempo
    setTimeout(() => {
        toast.remove();
    }, duration);
}

function showConfirmationToast(message, onConfirm) {
    const toastContainer = document.getElementById("toastContainer");

    // Crear el elemento del toast de confirmación
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-warning border-0 show`;
    toast.role = "alert";
    toast.ariaLive = "assertive";
    toast.ariaAtomic = "true";
    toast.innerHTML = `
        <div class="d-flex flex-column">
            <div class="toast-body">
                ${message}
            </div>
            <div class="d-flex justify-content-end mt-2">
                <button class="btn btn-danger btn-sm me-2" id="confirmButton">Confirmar</button>
                <button class="btn btn-secondary btn-sm" id="cancelButton">Cancelar</button>
            </div>
        </div>
    `;

    // Agregar el toast al contenedor
    toastContainer.appendChild(toast);

    // Manejar el clic en el botón de confirmar
    document.getElementById("confirmButton").addEventListener("click", () => {
        onConfirm();
        toast.remove();
    });

    // Manejar el clic en el botón de cancelar
    document.getElementById("cancelButton").addEventListener("click", () => {
        toast.remove();
    });
}

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

        const html = roles.map(role => `
            <tr>
                <td>${role.id}</td>
                <td>${role.role_name}</td>
                <td>${role.permissions || 'Sin permisos'}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editRole(${role.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRole(${role.id})">Eliminar</button>
                </td>
            </tr>
        `).join("");

        document.getElementById("roleTableBody").innerHTML = html;
        showToast("Roles cargados correctamente.", "success");
    } catch (error) {
        console.error("Error al cargar roles:", error);
        showToast("Error al cargar roles.", "danger");
    }
}

async function loadPermissions() {
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
        const permissionsContainer = document.getElementById("permissionsContainer");

        permissionsContainer.innerHTML = permissions.map(permission => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${permission.id}" id="permission-${permission.id}">
                <label class="form-check-label" for="permission-${permission.id}">
                    ${permission.permission_name}
                </label>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error al cargar permisos:", error);
        alert("Error al cargar permisos.");
    }
}

function openRoleModal(role = null) {
    const modalTitle = document.getElementById("roleModalLabel");
    const roleNameInput = document.getElementById("roleName");
    const roleDescriptionInput = document.getElementById("roleDescription");
    const permissionsContainer = document.getElementById("permissionsContainer");

    // Restablecer los campos de la modal
    roleNameInput.value = "";
    roleDescriptionInput.value = "";
    permissionsContainer.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        checkbox.checked = false;
    });

    if (role) {
        modalTitle.textContent = "Editar Rol";
        roleNameInput.value = role.role_name;
        roleDescriptionInput.value = role.description || "";

        // Marcar los permisos asociados al rol
        role.permissions.forEach(permissionId => {
            const checkbox = document.getElementById(`permission-${permissionId}`);
            if (checkbox) checkbox.checked = true;
        });
    } else {
        modalTitle.textContent = "Crear Rol";
    }

    const roleModal = new bootstrap.Modal(document.getElementById("roleModal"));
    roleModal.show();
}

async function saveRole() {
    const roleName = document.getElementById("roleName").value.trim();
    const description = document.getElementById("roleDescription").value.trim();
    const selectedPermissions = Array.from(document.querySelectorAll("#permissionsContainer input[type='checkbox']:checked"))
        .map(checkbox => checkbox.value);

    if (!roleName) {
        showToast("El nombre del rol es obligatorio.", "danger");
        return;
    }

    const roleData = {
        role_name: roleName,
        description,
        permissions: selectedPermissions
    };

    try {
        const response = await fetch('/api/roles', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(roleData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al guardar el rol.");
        }

        showToast("Rol guardado correctamente.", "success");
        loadRoles();
        bootstrap.Modal.getInstance(document.getElementById("roleModal")).hide();
    } catch (error) {
        console.error("Error al guardar el rol:", error);
        showToast(error.message, "danger");
    }
}

async function deleteRole(roleId) {
    showConfirmationToast("¿Estás seguro de eliminar este rol?", async () => {
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

            showToast("Rol eliminado correctamente.", "success");
            loadRoles();
        } catch (error) {
            console.error("Error al eliminar el rol:", error);
            showToast("Error al eliminar el rol.", "danger");
        }
    });
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
