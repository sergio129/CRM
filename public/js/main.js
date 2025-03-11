document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcomeMessage');
    welcomeMessage.textContent = 'Bienvenido a CRM GESCOOP';

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.token); // Guardar el token en localStorage

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
                        window.location.href = "dashboard.html";
                    }
                }, 1000);
            } else {
                alert('Usuario o contraseña incorrectos');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            alert('Ocurrió un error. Intenta nuevamente.');
        }
    });
});
