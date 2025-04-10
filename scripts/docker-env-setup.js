/**
 * Script para configurar variables de entorno para Docker
 * 
 * Este script crea un archivo .env específico para el entorno Docker
 */

const fs = require('fs');
const path = require('path');

console.log('=======================================================');
console.log('     Configurando entorno para Docker');
console.log('=======================================================\n');

// Rutas de archivos
const projectRoot = path.join(__dirname, '..');
const envProductionPath = path.join(projectRoot, '.env.production');
const envDockerPath = path.join(projectRoot, '.env.docker-config');
const envPath = path.join(projectRoot, '.env');

try {
  // Verificar si existe un directorio con el nombre .env.docker
  const envDockerDir = path.join(projectRoot, '.env.docker');
  if (fs.existsSync(envDockerDir) && fs.statSync(envDockerDir).isDirectory()) {
    console.log(`[ADVERTENCIA] Existe un directorio llamado .env.docker. Usaremos .env.docker-config en su lugar.`);
  }

  // Contenido para el archivo .env.docker-config
  const dockerEnvContent = `# Configuración para Docker
DB_HOST=db
DB_USER=gescoop_user
DB_PASSWORD=gescoop_password
DB_NAME=gescoop_db
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
FRONTEND_URL=http://localhost:5000
`;

  console.log(`[INFO] Creando archivo .env.docker-config...`);
  fs.writeFileSync(envDockerPath, dockerEnvContent);
  console.log(`[OK] Archivo .env.docker-config creado correctamente.`);

  // Hacer copia de seguridad del archivo .env actual si existe
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, `${envPath}.backup-${Date.now()}`);
    console.log('[INFO] Se ha creado una copia de seguridad del archivo .env actual.');
  }

  // Copiar el contenido al archivo .env
  fs.writeFileSync(envPath, dockerEnvContent);
  console.log('[OK] Archivo .env actualizado para Docker.');

  console.log('\n[INFO] Configuración de entorno completada.');
  console.log('Variables de entorno configuradas:');
  console.log(dockerEnvContent);

} catch (error) {
  console.error(`[ERROR] ${error.message}`);
  process.exit(1);
}

console.log('\n=======================================================');
console.log('     SIGUIENTES PASOS');
console.log('=======================================================\n');
console.log('1. Modificar el Dockerfile para usar la configuración correcta');
console.log('2. Reconstruir los contenedores Docker:');
console.log('   docker-compose -f docker-compose-fix.yml down');
console.log('   docker-compose -f docker-compose-fix.yml up -d --build');
