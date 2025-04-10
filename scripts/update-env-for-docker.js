/**
 * Script para actualizar el archivo .env para uso en Docker
 */
const fs = require('fs');
const path = require('path');

console.log('=======================================================');
console.log('     Actualizando configuración .env para Docker');
console.log('=======================================================\n');

const envPath = path.join(__dirname, '..', '.env');

try {
  // Verificar si el archivo existe
  if (!fs.existsSync(envPath)) {
    console.log('[INFO] Archivo .env no encontrado. Creando uno nuevo.');
    
    // Crear un nuevo archivo .env basado en .env.backup
    const envBackupPath = path.join(__dirname, '..', '.env.backup');
    if (fs.existsSync(envBackupPath)) {
      let envContent = fs.readFileSync(envBackupPath, 'utf8');
      
      // Modificar la configuración para Docker
      envContent = envContent
        .replace(/DB_HOST=.*/g, 'DB_HOST=db')
        .replace(/DB_USER=.*/g, 'DB_USER=gescoop_user')
        .replace(/DB_PASSWORD=.*/g, 'DB_PASSWORD=gescoop_password')
        .replace(/DB_NAME=.*/g, 'DB_NAME=gescoop_db')
        .replace(/DB_PORT=.*/g, 'DB_PORT=3306');
      
      fs.writeFileSync(envPath, envContent);
      console.log('[OK] Archivo .env creado correctamente.');
    } else {
      console.log('[ERROR] No se encontró archivo .env.backup para usar como base.');
      
      // Crear un archivo .env básico
      const basicEnv = `DB_HOST=db
DB_USER=gescoop_user
DB_PASSWORD=gescoop_password
DB_NAME=gescoop_db
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key`;
      
      fs.writeFileSync(envPath, basicEnv);
      console.log('[OK] Archivo .env básico creado.');
    }
  } else {
    // Modificar el archivo .env existente
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Hacer backup
    fs.writeFileSync(`${envPath}.docker-backup`, envContent);
    console.log('[INFO] Se ha creado una copia de seguridad del archivo .env actual.');
    
    // Modificar la configuración para Docker
    envContent = envContent
      .replace(/DB_HOST=.*/g, 'DB_HOST=db')
      .replace(/DB_USER=.*/g, 'DB_USER=gescoop_user')
      .replace(/DB_PASSWORD=.*/g, 'DB_PASSWORD=gescoop_password')
      .replace(/DB_NAME=.*/g, 'DB_NAME=gescoop_db')
      .replace(/DB_PORT=.*/g, 'DB_PORT=3306');
    
    fs.writeFileSync(envPath, envContent);
    console.log('[OK] Archivo .env actualizado correctamente para Docker.');
  }
  
  console.log('\nConfiguración resultante:');
  console.log(fs.readFileSync(envPath, 'utf8'));
  
} catch (error) {
  console.error(`[ERROR] ${error.message}`);
}

console.log('\n=======================================================');
console.log('                   Próximos pasos');
console.log('=======================================================');
console.log('1. Reconstruya los contenedores:');
console.log('   docker-compose -f docker-compose-fix.yml down');
console.log('   docker-compose -f docker-compose-fix.yml up -d --build');
console.log('\n2. Verifique los logs:');
console.log('   docker logs -f gescoop_app');
