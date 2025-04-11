document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcomeMessage');
    welcomeMessage.textContent = 'Bienvenido a CRM GESCOOP';

    // Preparar contenedor de toasts
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '11';
    document.body.appendChild(toastContainer);

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Mostrar toast de carga
        showToast('Iniciando sesión...', 'info');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar el token en localStorage
                localStorage.setItem("token", data.token);
                showToast('Inicio de sesión exitoso', 'success');

                // Mostrar modal de bienvenida
                const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal'));
                welcomeModal.show();

                // Actualizar porcentaje de carga y barra de progreso
                let percentage = 0;
                const loadingPercentage = document.getElementById('loadingPercentage');
                const progressBar = document.getElementById('progressBar');
                const interval = setInterval(() => {
                    percentage += 20;
                    loadingPercentage.textContent = `Cargando... ${percentage}%`;
                    progressBar.style.width = `${percentage}%`;
                    progressBar.setAttribute('aria-valuenow', percentage);

                    // Cambiar color de la barra de progreso
                    if (percentage <= 40) {
                        progressBar.classList.add('bg-danger');
                        progressBar.classList.remove('bg-warning', 'bg-success');
                    } else if (percentage <= 80) {
                        progressBar.classList.add('bg-warning');
                        progressBar.classList.remove('bg-danger', 'bg-success');
                    } else {
                        progressBar.classList.add('bg-success');
                        progressBar.classList.remove('bg-danger', 'bg-warning');
                    }

                    if (percentage >= 100) {
                        clearInterval(interval);
                        welcomeModal.hide();
                        
                        // Redirigir al dashboard sin incluir el token en la URL
                        window.location.href = '/dashboard';
                    }
                }, 1000);
            } else {
                // Mostrar el mensaje de error del servidor
                const errorMessage = data.message || 'Usuario o contraseña incorrectos';
                showToast(errorMessage, 'danger');
                console.error('Error de login:', data);
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            showToast('Error de conexión. Intenta nuevamente.', 'danger');
        }
    });

    // Función para mostrar toast notifications
    function showToast(message, type) {
        const toastId = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const toastInstance = new bootstrap.Toast(toast, {
            animation: true,
            autohide: true,
            delay: 5000
        });
        
        toastInstance.show();
        
        // Remover toast del DOM después de ocultarse
        toast.addEventListener('hidden.bs.toast', function() {
            toast.remove();
        });
    }
});
