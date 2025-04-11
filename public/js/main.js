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

                // Mensajes de carga para mostrar en diferentes etapas
                const loadingMessages = [
                    "Iniciando sistema...",
                    "Cargando módulos...",
                    "Preparando datos...",
                    "Configurando interfaz...",
                    "Sincronizando información...",
                    "¡Todo listo!"
                ];

                // Implementar una animación de carga más fluida
                const loadingPercentage = document.getElementById('loadingPercentage');
                const progressBar = document.getElementById('progressBar');
                const loadingMessageEl = document.getElementById('loadingMessage');
                let percentage = 0;
                
                // Usar requestAnimationFrame para animación más suave
                let lastUpdate = Date.now();
                let messageIndex = 0;
                loadingMessageEl.textContent = loadingMessages[0];
                
                const updateProgress = () => {
                    const now = Date.now();
                    const deltaTime = now - lastUpdate;
                    
                    // Avanza más rápido al principio y más lento hacia el final
                    let increment = deltaTime / 100;
                    if (percentage > 80) {
                        increment = increment * 0.5; // Más lento al final
                    } else if (percentage < 30) {
                        increment = increment * 1.2; // Más rápido al principio
                    }
                    
                    percentage = Math.min(percentage + increment, 100);
                    lastUpdate = now;
                    
                    // Actualizar el porcentaje mostrado y la barra de progreso
                    const displayPercentage = Math.floor(percentage);
                    loadingPercentage.textContent = `${displayPercentage}%`;
                    progressBar.style.width = `${percentage}%`;
                    progressBar.setAttribute('aria-valuenow', displayPercentage);
                    
                    // Actualizar mensaje de carga según el porcentaje
                    const newMessageIndex = Math.min(Math.floor(percentage / 20), loadingMessages.length - 1);
                    if (newMessageIndex > messageIndex) {
                        messageIndex = newMessageIndex;
                        
                        // Animar el cambio de mensaje con desvanecimiento
                        loadingMessageEl.style.opacity = '0';
                        setTimeout(() => {
                            loadingMessageEl.textContent = loadingMessages[messageIndex];
                            loadingMessageEl.style.opacity = '1';
                        }, 200);
                    }
                    
                    // Continuar la animación o terminar
                    if (percentage < 100) {
                        requestAnimationFrame(updateProgress);
                    } else {
                        // Al finalizar la carga, mostramos un efecto final
                        loadingMessageEl.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> ¡Todo listo!</span>';
                        loadingPercentage.className = 'badge bg-success mb-2';
                        progressBar.classList.remove('progress-bar-animated');
                        
                        // Después de un breve momento, ocultamos el modal y redirigimos
                        setTimeout(() => {
                            welcomeModal.hide();
                            window.location.href = '/dashboard';
                        }, 800);
                    }
                };
                
                // Iniciar la animación
                requestAnimationFrame(updateProgress);
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
