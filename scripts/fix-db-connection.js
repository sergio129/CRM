/**
 * GESCOOP - Fix Database Connection for Docker
 * 
 * This script updates the database configuration to work with Docker.
 */

const fs = require('fs');
const path = require('path');

console.log('=======================================================');
console.log('     GESCOOP - Fix Database Connection for Docker');
console.log('=======================================================\n');

const configPath = path.join(__dirname, '..', 'config', 'config.json');

try {
    // Check if config file exists
    if (!fs.existsSync(configPath)) {
        console.error('[ERROR] No se encontró el archivo de configuración en:', configPath);
        process.exit(1);
    }

    // Read the current config
    const configContent = fs.readFileSync(configPath, 'utf8');
    console.log('[INFO] Leyendo configuración actual...');
    
    // Parse the JSON
    const config = JSON.parse(configContent);
    
    // Display the current production settings
    console.log('[INFO] Configuración de producción actual:');
    console.log(JSON.stringify(config.production, null, 2));

    // Make a backup of the current config
    const backupPath = `${configPath}.backup-${Date.now()}`;
    fs.writeFileSync(backupPath, configContent);
    console.log(`[INFO] Copia de seguridad creada en: ${backupPath}`);

    // Update the production settings for Docker
    const updatedConfig = {
        ...config,
        production: {
            ...config.production,
            username: "gescoop_user",
            password: "gescoop_password",
            database: "gescoop_db",
            host: "db",  // IMPORTANT: This should point to the DB container name in docker-compose
            dialect: "mysql",
            port: 3306
        }
    };

    // Write the updated config back to the file
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    console.log('[SUCCESS] Configuración actualizada para Docker:');
    console.log(JSON.stringify(updatedConfig.production, null, 2));
    
    console.log('\n[INFO] Ahora debe reiniciar los contenedores para aplicar los cambios:');
    console.log('  docker-compose down');
    console.log('  docker-compose up -d');

} catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);
}
