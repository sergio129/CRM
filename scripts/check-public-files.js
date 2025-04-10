/**
 * Script para verificar archivos estáticos en la carpeta public
 */
const fs = require('fs');
const path = require('path');

console.log('=======================================================');
console.log('     Verificando archivos estáticos');
console.log('=======================================================\n');

const publicPath = path.join(__dirname, '..', 'public');

try {
  if (!fs.existsSync(publicPath)) {
    console.log('[ERROR] La carpeta public no existe. Creándola...');
    fs.mkdirSync(publicPath, { recursive: true });
    console.log('[OK] Carpeta public creada.');
  }

  const files = fs.readdirSync(publicPath);
  console.log(`[INFO] La carpeta public contiene ${files.length} archivos/carpetas.`);

  if (files.length === 0) {
    console.log('[ADVERTENCIA] La carpeta public está vacía. Creando archivo de prueba...');
    
    // Crear un archivo HTML de prueba
    const testHtml = `<!DOCTYPE html>
<html>
<head>
  <title>GESCOOP - Página de Prueba</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    h1 { color: #333; }
    .success { color: green; }
    .warning { color: orange; }
    .error { color: red; }
  </style>
</head>
<body>
  <div class="container">
    <h1>GESCOOP - Servidor en funcionamiento</h1>
    <p class="success">✅ Si puedes ver esta página, el servidor web está funcionando correctamente.</p>
    <p>Esta es una página de prueba generada automáticamente para verificar que el servidor web puede servir archivos estáticos.</p>
    
    <h2>Enlaces de prueba:</h2>
    <ul>
      <li><a href="/api/health">Verificar API</a></li>
      <li><a href="/login.html">Ir a Login</a> (si existe)</li>
    </ul>
    
    <h2>Información del sistema:</h2>
    <p>Fecha y hora: <span id="datetime"></span></p>
    
    <script>
      document.getElementById('datetime').textContent = new Date().toLocaleString();
    </script>
  </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(publicPath, 'index.html'), testHtml);
    console.log('[OK] Archivo index.html de prueba creado.');
    
    // Verificar si existe login.html, si no, crearlo
    if (!files.includes('login.html')) {
      const loginHtml = `<!DOCTYPE html>
<html>
<head>
  <title>GESCOOP - Login</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f0f0; }
    .login-container { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 300px; }
    h2 { text-align: center; color: #333; }
    input { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; border: 1px solid #ddd; border-radius: 3px; }
    button { width: 100%; padding: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; }
    button:hover { background-color: #45a049; }
  </style>
</head>
<body>
  <div class="login-container">
    <h2>GESCOOP</h2>
    <form id="loginForm">
      <input type="text" id="username" placeholder="Usuario" required>
      <input type="password" id="password" placeholder="Contraseña" required>
      <button type="submit">Iniciar Sesión</button>
    </form>
  </div>
  
  <script>
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // Aquí normalmente enviarías los datos al servidor
      console.log('Intento de login con:', username);
      alert('Funcionalidad de login en desarrollo');
    });
  </script>
</body>
</html>`;
      
      fs.writeFileSync(path.join(publicPath, 'login.html'), loginHtml);
      console.log('[OK] Archivo login.html de prueba creado.');
    }
  } else {
    console.log('[INFO] Archivos encontrados:');
    
    let hasLoginFile = false;
    let hasIndexFile = false;
    
    files.forEach(file => {
      const stats = fs.statSync(path.join(publicPath, file));
      if (stats.isDirectory()) {
        console.log(`- ${file}/ (directorio)`);
      } else {
        console.log(`- ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      }
      
      if (file === 'login.html') hasLoginFile = true;
      if (file === 'index.html') hasIndexFile = true;
    });
    
    if (!hasLoginFile) {
      console.log('[ADVERTENCIA] No se encontró login.html en la carpeta public.');
    }
    
    if (!hasIndexFile) {
      console.log('[ADVERTENCIA] No se encontró index.html en la carpeta public.');
    }
  }
  
} catch (error) {
  console.error(`[ERROR] ${error.message}`);
}

console.log('\n=======================================================');
console.log('                   Próximos pasos');
console.log('=======================================================');
console.log('1. Asegúrese de que la carpeta public contenga todos los archivos estáticos necesarios');
console.log('2. Reconstruya los contenedores con el script rebuild-containers.bat');
console.log('3. Acceda a http://localhost:5000 para verificar que la aplicación funciona');
