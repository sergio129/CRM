/**
 * GESCOOP - Docker Deployment Troubleshooting Script
 * 
 * This script helps diagnose common issues with the GESCOOP Docker deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=======================================================');
console.log('     GESCOOP - Docker Deployment Troubleshooter');
console.log('=======================================================\n');

// Function to execute command and return result
function runCommand(command, silent = false) {
    try {
        const output = execSync(command, { encoding: 'utf8' });
        if (!silent) console.log(output);
        return { success: true, output };
    } catch (error) {
        if (!silent) console.error(`Error executing command: ${command}\n`, error.message);
        return { success: false, error: error.message };
    }
}

// 1. Check if Docker is running
console.log('[CHECK] Verificando si Docker está en ejecución...');
const dockerRunning = runCommand('docker info', true);
if (!dockerRunning.success) {
    console.error('[ERROR] Docker no está en ejecución. Por favor inicie el servicio Docker.');
    process.exit(1);
}
console.log('[OK] Docker está en ejecución.\n');

// 2. List running containers
console.log('[CHECK] Verificando contenedores en ejecución...');
runCommand('docker ps');
console.log('\n');

// 3. Check specific containers status
console.log('[CHECK] Verificando estado de contenedores específicos...');
const appContainer = runCommand('docker ps --filter "name=gescoop_app" --format "{{.Status}}"', true);
const dbContainer = runCommand('docker ps --filter "name=gescoop_db" --format "{{.Status}}"', true);

console.log(`- App Container: ${appContainer.success ? appContainer.output.trim() || 'Not running' : 'Not running'}`);
console.log(`- DB Container: ${dbContainer.success ? dbContainer.output.trim() || 'Not running' : 'Not running'}\n`);

// 4. Check port mapping
console.log('[CHECK] Verificando mapeo de puertos...');
runCommand('docker port gescoop_app');
console.log('\n');

// 5. Check application logs
console.log('[CHECK] Últimas 20 líneas de logs de la aplicación:');
runCommand('docker logs --tail 20 gescoop_app');
console.log('\n');

// 6. Check database logs
console.log('[CHECK] Últimas 10 líneas de logs de la base de datos:');
runCommand('docker logs --tail 10 gescoop_db');
console.log('\n');

// 7. Check network connectivity
console.log('[CHECK] Verificando configuración de red de Docker...');
runCommand('docker network inspect modeloweb_default');
console.log('\n');

// 8. Check if app is listening on the correct port inside the container
console.log('[CHECK] Verificando puertos de escucha dentro del contenedor...');
runCommand('docker exec gescoop_app netstat -tlnp || echo "netstat not available, trying ss..." && docker exec gescoop_app ss -tlnp');
console.log('\n');

// 9. Generate recommendations
console.log('=======================================================');
console.log('     RECOMENDACIONES DE SOLUCIÓN');
console.log('=======================================================\n');

console.log('1. Verificar la configuración del puerto en docker-compose.yml');
console.log('   Confirmar que el puerto 5000 está correctamente mapeado\n');

console.log('2. Verificar que el archivo de configuración tiene los valores correctos:');
console.log('   - Revisar host/puerto en app.js o server.js\n');

console.log('3. Reiniciar los contenedores:');
console.log('   docker-compose down');
console.log('   docker-compose up -d\n');

console.log('4. Verificar que no hay otro servicio usando el puerto 5000:');
console.log('   netstat -ano | findstr :5000  (Windows)');
console.log('   lsof -i :5000                 (Linux/Mac)\n');

console.log('5. Verificar la configuración de conexión a la base de datos:');
console.log('   Revisar si los valores en config.json coinciden con los de docker-compose.yml\n');

console.log('Para obtener ayuda adicional, ejecute:');
console.log('docker-compose logs -f\n');

// 10. Check configuration file for database connection
try {
    console.log('[CHECK] Verificando configuración de conexión a la base de datos...');
    const configPath = path.join(__dirname, '..', 'config', 'config.json');
    if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        console.log('Configuración actual:');
        console.log(`- Production DB Host: ${config.production.host}`);
        console.log(`- Production DB Port: ${config.production.port}`);
        console.log(`- Production DB User: ${config.production.username}`);
        console.log(`- Production DB Name: ${config.production.database}`);
        
        if (config.production.host !== 'db') {
            console.log('\n[WARN] El host de producción no está configurado como "db". En Docker, debería ser "db".');
        }
    } else {
        console.log('[WARN] No se encontró el archivo de configuración.');
    }
} catch (error) {
    console.error('[ERROR] Error al leer la configuración:', error.message);
}
