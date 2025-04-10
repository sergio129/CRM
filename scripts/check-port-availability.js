/**
 * Check Port Availability
 * 
 * This script checks if the port 5000 is already in use
 */

const net = require('net');
const { execSync } = require('child_process');

console.log('=======================================================');
console.log('     GESCOOP - Verificación de disponibilidad de puerto');
console.log('=======================================================\n');

const port = 5000;

// Function to check if a port is in use
function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer()
            .once('error', () => {
                // Port is in use
                resolve(true);
            })
            .once('listening', () => {
                // Port is free, close server
                server.close(() => {
                    resolve(false);
                });
            })
            .listen(port);
    });
}

// Function to get process using a port (Windows only)
function getProcessUsingPort(port) {
    try {
        const command = `netstat -ano | findstr :${port}`;
        const output = execSync(command, { encoding: 'utf8' });
        
        if (output) {
            const lines = output.trim().split('\n');
            if (lines.length > 0) {
                // Extract PID from last column
                const pid = lines[0].trim().split(/\s+/).pop();
                
                // Get process name from PID
                const processInfo = execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf8' });
                return {
                    pid,
                    info: processInfo
                };
            }
        }
        return null;
    } catch (error) {
        console.error('Error al obtener información del proceso:', error.message);
        return null;
    }
}

// Main function
async function checkPort() {
    const inUse = await isPortInUse(port);
    
    if (inUse) {
        console.log(`[PROBLEMA] El puerto ${port} ya está en uso.`);
        
        // Get information about the process using the port (Windows only)
        if (process.platform === 'win32') {
            const processInfo = getProcessUsingPort(port);
            if (processInfo) {
                console.log(`\n[INFO] Proceso utilizando el puerto ${port}:`);
                console.log(`PID: ${processInfo.pid}`);
                console.log('Información del proceso:');
                console.log(processInfo.info);
                
                console.log('\n[SOLUCIÓN] Puede intentar:');
                console.log(`1. Terminar el proceso: taskkill /F /PID ${processInfo.pid}`);
                console.log('2. Cambiar el puerto de la aplicación en la configuración');
                console.log('3. Actualizar el mapeo de puertos en docker-compose.yml');
            }
        } else {
            console.log('\n[SOLUCIÓN] Puede intentar:');
            console.log(`1. En Linux/Mac: lsof -i :${port} para identificar el proceso`);
            console.log('2. Cambiar el puerto de la aplicación en la configuración');
            console.log('3. Actualizar el mapeo de puertos en docker-compose.yml');
        }
    } else {
        console.log(`[OK] El puerto ${port} está disponible.`);
        console.log('\n[INFO] Si sigue teniendo problemas para acceder a la aplicación:');
        console.log('1. Verifique que la aplicación esté escuchando en el puerto correcto dentro del contenedor');
        console.log('2. Revise los logs de Docker: docker-compose logs -f');
        console.log('3. Asegúrese de que no haya reglas de firewall bloqueando la conexión');
    }
}

// Run the check
checkPort().catch(error => {
    console.error('Error:', error);
});
