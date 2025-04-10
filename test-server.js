/**
 * Servidor web mínimo para pruebas de diagnóstico
 * Copie este archivo al contenedor y ejecútelo para verificar conexión
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware para logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para verificar si el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'El servidor está funcionando correctamente' });
});

// Página HTML mínima para pruebas
app.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Server</title>
    </head>
    <body>
      <h1>El servidor está funcionando correctamente</h1>
      <p>Esta página es generada por test-server.js</p>
      <hr>
      <h2>Información del sistema:</h2>
      <pre>
        Node.js: ${process.version}
        Directorio: ${__dirname}
        Archivos en directorio público:
        ${fs.existsSync('./public') ? 
          fs.readdirSync('./public').join('\n        ') : 
          'Directorio public no encontrado'}
      </pre>
    </body>
    </html>
  `);
});

// Listar todos los archivos en la ruta raíz
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(__dirname);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Servidor de prueba ejecutándose en http://localhost:${PORT}`);
  console.log(`[${new Date().toISOString()}] Rutas disponibles:`);
  console.log(`[${new Date().toISOString()}] - http://localhost:${PORT}/test`);
  console.log(`[${new Date().toISOString()}] - http://localhost:${PORT}/api/health`);
  console.log(`[${new Date().toISOString()}] - http://localhost:${PORT}/api/files`);
});
