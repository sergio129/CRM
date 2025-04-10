/**
 * Script para diagnosticar problemas de conexión web en la aplicación
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('=======================================================');
console.log('     DIAGNÓSTICO DE CONEXIÓN WEB');
console.log('=======================================================\n');

// Verificar estado de contenedores
try {
    console.log('[INFO] Verificando estado de contenedores...');
    const containerStatus = execSync('docker ps', { encoding: 'utf8' });
    console.log(containerStatus);
} catch (error) {
    console.error('[ERROR] No se pudo obtener el estado de los contenedores:', error.message);
}

// Verificar logs recientes de la aplicación
try {
    console.log('\n[INFO] Últimas 30 líneas de logs de la aplicación:');
    const appLogs = execSync('docker logs --tail 30 gescoop_app', { encoding: 'utf8' });
    console.log(appLogs);
} catch (error) {
    console.error('[ERROR] No se pudo obtener los logs del contenedor:', error.message);
}

// Verificar estructura de directorios en el contenedor
try {
    console.log('\n[INFO] Verificando estructura de archivos en el contenedor:');
    console.log('\nDirectorio raíz:');
    const rootDir = execSync('docker exec gescoop_app ls -la /usr/src/app', { encoding: 'utf8' });
    console.log(rootDir);
    
    console.log('\nDirectorio public (si existe):');
    try {
        const publicDir = execSync('docker exec gescoop_app ls -la /usr/src/app/public', { encoding: 'utf8' });
        console.log(publicDir);
    } catch {
        console.log('No se encontró directorio public');
    }
} catch (error) {
    console.error('[ERROR] No se pudo examinar archivos en el contenedor:', error.message);
}

// Verificar la configuración del servidor en app.js
try {
    console.log('\n[INFO] Inspeccionando configuración de app.js:');
    const appJsContent = execSync('docker exec gescoop_app cat /usr/src/app/app.js', { encoding: 'utf8' });
    
    // Buscar patrones importantes en app.js
    const listenPattern = appJsContent.match(/\.listen\(.*\)/);
    if (listenPattern) {
        console.log('[ENCONTRADO] Configuración de puerto:', listenPattern[0]);
    } else {
        console.log('[ADVERTENCIA] No se encontró configuración de puerto (.listen())');
    }
    
    const staticPattern = appJsContent.match(/express\.static\(.*\)/);
    if (staticPattern) {
        console.log('[ENCONTRADO] Configuración de archivos estáticos:', staticPattern[0]);
    } else {
        console.log('[ADVERTENCIA] No se encontró configuración de archivos estáticos (express.static())');
    }
    
    const publicPath = appJsContent.match(/app\.use\(['"](\/[^'"]*)['"]/);
    if (publicPath) {
        console.log('[ENCONTRADO] Ruta pública configurada como:', publicPath[1]);
    }
    
} catch (error) {
    console.error('[ERROR] No se pudo leer app.js en el contenedor:', error.message);
}

// Intentar hacer una solicitud HTTP al servidor
console.log('\n[INFO] Intentando conectar al servidor...');
const request = http.get('http://localhost:5000', (response) => {
    console.log(`[INFO] Respuesta del servidor: ${response.statusCode} ${response.statusMessage}`);
    response.on('data', (chunk) => {
        console.log('[INFO] Primeros 100 caracteres de la respuesta:', chunk.toString().substring(0, 100));
    });
}).on('error', (err) => {
    console.error('[ERROR] No se pudo conectar al servidor:', err.message);
});

request.setTimeout(5000, () => {
    console.error('[ERROR] Timeout al conectar al servidor después de 5 segundos');
    request.destroy();
});

// Recomendaciones
console.log('\n=======================================================');
console.log('     RECOMENDACIONES PARA RESOLUCIÓN DE PROBLEMAS');
console.log('=======================================================\n');

console.log('1. Verificar que el puerto 5000 no está bloqueado por el firewall:');
console.log('   - Windows: Comprobar Firewall de Windows en Panel de Control');
console.log('   - Temporalmente deshabilitar firewall para pruebas\n');

console.log('2. Verificar que la aplicación está escuchando correctamente:');
console.log('   docker exec gescoop_app netstat -tlnp\n');

console.log('3. Verificar estructura de archivos en la carpeta pública:');
console.log('   docker exec gescoop_app ls -la /usr/src/app/public\n');

console.log('4. Revisar punto de entrada (app.js):');
console.log('   docker exec gescoop_app cat /usr/src/app/app.js\n');

console.log('5. Probar conectividad desde el contenedor:');
console.log('   docker exec gescoop_app curl http://localhost:5000\n');

console.log('6. Reiniciar la aplicación dentro del contenedor:');
console.log('   docker exec gescoop_app npm start\n');

console.log('7. Si ninguna solución funciona, modificar la configuración para exponer un servidor mínimo:');
console.log('   - Crear un archivo test-server.js en la raíz\n');
