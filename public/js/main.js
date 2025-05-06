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

                // Mensajes de carga para mostrar en diferentes etapas (reducidos para mayor velocidad)
                const loadingMessages = [
                    "Iniciando sistema...",
                    "Cargando módulos...",
                    "Configurando interfaz...",
                    "¡Todo listo!"
                ];

                // Implementar una animación de carga más rápida
                const loadingPercentage = document.getElementById('loadingPercentage');
                const progressBar = document.getElementById('progressBar');
                const loadingMessageEl = document.getElementById('loadingMessage');
                let percentage = 0;
                
                // Usar requestAnimationFrame para animación más suave pero más rápida
                let lastUpdate = Date.now();
                let messageIndex = 0;
                loadingMessageEl.textContent = loadingMessages[0];
                
                const updateProgress = () => {
                    const now = Date.now();
                    const deltaTime = now - lastUpdate;
                    
                    // Incremento acelerado - más rápido que antes
                    let increment = deltaTime / 40; // Reducido de 100 a 40 para mayor velocidad
                    
                    // Ajustar la curva de velocidad para que sea aún más rápida
                    if (percentage > 85) {
                        increment = increment * 0.8; // Frena un poco al final, pero menos que antes
                    } else if (percentage < 20) {
                        increment = increment * 2.0; // Mucho más rápido al inicio (antes era 1.2)
                    } else {
                        increment = increment * 1.5; // Velocidad intermedia aumentada
                    }
                    
                    percentage = Math.min(percentage + increment, 100);
                    lastUpdate = now;
                    
                    // Actualizar el porcentaje mostrado y la barra de progreso
                    const displayPercentage = Math.floor(percentage);
                    loadingPercentage.textContent = `${displayPercentage}%`;
                    progressBar.style.width = `${percentage}%`;
                    progressBar.setAttribute('aria-valuenow', displayPercentage);
                    
                    // Actualizar mensaje de carga según el porcentaje (ajustado para mensajes reducidos)
                    const newMessageIndex = Math.min(Math.floor(percentage / 25), loadingMessages.length - 1);
                    if (newMessageIndex > messageIndex) {
                        messageIndex = newMessageIndex;
                        
                        // Transición más rápida entre mensajes
                        loadingMessageEl.style.opacity = '0';
                        setTimeout(() => {
                            loadingMessageEl.textContent = loadingMessages[messageIndex];
                            loadingMessageEl.style.opacity = '1';
                        }, 100); // Reducido de 200ms a 100ms
                    }
                    
                    // Continuar la animación o terminar
                    if (percentage < 100) {
                        requestAnimationFrame(updateProgress);
                    } else {
                        // Al finalizar la carga, mostramos un efecto final
                        loadingMessageEl.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> ¡Todo listo!</span>';
                        loadingPercentage.className = 'badge bg-success mb-2';
                        progressBar.classList.remove('progress-bar-animated');
                        
                        // Tiempo de espera reducido antes de redireccionar
                        setTimeout(() => {
                            welcomeModal.hide();
                            window.location.href = '/dashboard';
                        }, 400); // Reducido de 800ms a 400ms
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
