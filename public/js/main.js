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
            localStorage.setItem("token", data.token); // 🔹 Guardar el token en localStorage
            alert('Login exitoso');
            console.log('Token:', data.token);
           window.location.href = "dashboard.html"; // 🔹 Redirigir al usuario
        
        } else {
            alert('Usuario o contraseña incorrectos');
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('Ocurrió un error. Intenta nuevamente.');
    }
});
