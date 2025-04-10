/**
 * Script para actualizar la configuración de la base de datos
 * para reflejar el cambio de puerto MySQL
 */

const fs = require('fs');
const path = require('path');

console.log('=======================================================');
console.log('     Actualizando configuración de base de datos');
console.log('=======================================================\n');

// Función para actualizar config.json
function updateConfigJson() {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'config.json');
    
    if (!fs.existsSync(configPath)) {
      console.log(`[ADVERTENCIA] No se encontró el archivo: ${configPath}`);
      return false;
    }

    let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Hacer backup
    fs.writeFileSync(`${configPath}.backup`, JSON.stringify(config, null, 2));
    console.log(`[INFO] Creado backup de config.json`);

    // Actualizar configuración para desarrollo local
    if (config.development) {
      config.development.port = 3307;
      console.log('[INFO] Actualizada configuración para desarrollo');
    }

    // Guardar cambios
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('[OK] Archivo config.json actualizado');
    return true;
  } catch (err) {
    console.error(`[ERROR] Al actualizar config.json: ${err.message}`);
    return false;
  }
}

// Función para buscar y actualizar cualquier archivo .env
function updateEnvFiles() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log(`[INFO] No se encontró archivo .env, no es necesario actualizarlo`);
      return false;
    }
    
    // Hacer backup
    fs.copyFileSync(envPath, `${envPath}.backup`);
    console.log(`[INFO] Creado backup de .env`);
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Actualizar la configuración del puerto de DB
    envContent = envContent
      .replace(/DB_PORT\s*=\s*3306/g, 'DB_PORT=3307')
      .replace(/DATABASE_PORT\s*=\s*3306/g, 'DATABASE_PORT=3307');
    
    fs.writeFileSync(envPath, envContent);
    console.log('[OK] Archivo .env actualizado');
    return true;
  } catch (err) {
    console.error(`[ERROR] Al actualizar archivo .env: ${err.message}`);
    return false;
  }
}

// Ejecutar las actualizaciones
let updated = false;
updated = updateConfigJson() || updated;
updated = updateEnvFiles() || updated;

console.log('\n=======================================================');
if (updated) {
  console.log('     Configuración actualizada correctamente');
} else {
  console.log('     No se encontraron archivos para actualizar');
  console.log('     Es posible que necesites actualizar la configuración manualmente');
}
console.log('=======================================================\n');

console.log('Recuerda que la nueva configuración de la base de datos es:');
console.log('  Host: localhost');
console.log('  Puerto: 3307');
console.log('  Usuario: gescoop_user');
console.log('  Contraseña: gescoop_password');
console.log('  Base de datos: gescoop_db\n');
