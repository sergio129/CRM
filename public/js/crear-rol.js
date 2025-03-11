document.getElementById('createRoleForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const roleName = document.getElementById('roleName').value;
    const rolePermissions = Array.from(document.getElementById('rolePermissions').selectedOptions).map(opt => opt.value);

    try {
        const response = await fetch('/api/roles', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role_name: roleName, permission: rolePermissions })
        });

        if (response.ok) {
            alert('Rol creado correctamente');
            window.location.href = 'roles.html';
        } else {
            const errorData = await response.json();
            alert(`Error al crear el rol: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error al crear el rol:', error);
        alert('Ocurrió un error. Intenta nuevamente.');
    }
});
