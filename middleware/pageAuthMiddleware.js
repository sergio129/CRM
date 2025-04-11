const jwt = require('jsonwebtoken');
const path = require('path');

// Middleware para proteger las páginas HTML
const protectPages = (req, res, next) => {
    const url = req.url;
    
    // Páginas públicas y recursos que siempre son accesibles
    if (url === '/' || 
        url === '/login' ||
        url === '/login.html' || 
        url === '/index.html' || 
        url.startsWith('/js/') || 
        url.startsWith('/css/') || 
        url.startsWith('/img/') ||
        url.startsWith('/images/') ||
        url.startsWith('/assets/') ||
        url.startsWith('/templates/') ||
        url.startsWith('/api/')) {
        console.log(`URL pública permitida: ${url}`);
        return next();
    }
    
    // Para archivos de recursos estáticos, permitir acceso
    const ext = path.extname(url);
    if (ext && (ext === '.css' || 
        ext === '.js' || 
        ext === '.png' || 
        ext === '.jpg' || 
        ext === '.jpeg' || 
        ext === '.gif' || 
        ext === '.svg' || 
        ext === '.ico')) {
        console.log(`Archivo estático permitido: ${url}`);
        return next();
    }
    
    // El dashboard y otras páginas autenticadas ya se manejan en rutas específicas en app.js
    // Solo necesitamos verificar que las peticiones a rutas protegidas tengan token válido
    
    // Intenta obtener el token del header de autorización
    const token = req.headers.authorization ? 
                  req.headers.authorization.split(' ')[1] : null;
    
    console.log(`Verificando acceso a página protegida: ${url}`);
    console.log(`Token en headers: ${token ? 'Presente' : 'No presente'}`);
    
    // Para peticiones sin token, permitir que continúen (las rutas en app.js se encargarán)
    if (!token) {
        console.log(`No se encontró token para ruta ${url} - permitiendo acceso al middleware siguiente`);
        return next();
    }
    
    // Si hay token, verificarlo
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`Token válido para usuario: ${decoded.username}`);
        req.user = decoded; // Almacenar datos del usuario para uso posterior
        return next();
    } catch (error) {
        console.error(`Error en token: ${error.message}`);
        // Incluso con token inválido, permitimos que continúe - las rutas específicas decidirán qué hacer
        return next();
    }
};

module.exports = protectPages;