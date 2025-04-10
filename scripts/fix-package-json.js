/**
 * Script to fix package.json start script
 */
const fs = require('fs');
const path = require('path');

console.log('=======================================================');
console.log('     GESCOOP - Corrigiendo package.json');
console.log('=======================================================\n');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  // Read the package.json file
  const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonData);
  
  console.log('Estado actual:');
  console.log(`- Campo "main": ${packageJson.main || 'No definido'}`);
  console.log(`- Script "start": ${packageJson.scripts && packageJson.scripts.start ? packageJson.scripts.start : 'No definido'}`);
  
  // Update the start script to use app.js
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts.start = "node app.js";
  
  // Make sure main is also consistent
  packageJson.main = "app.js";
  
  // Write the updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log('\npackage.json actualizado:');
  console.log(`- Campo "main": ${packageJson.main}`);
  console.log(`- Script "start": ${packageJson.scripts.start}`);
  console.log('\nEl archivo package.json ha sido actualizado correctamente.');
  
} catch (error) {
  console.error(`\nError al modificar package.json: ${error.message}`);
  process.exit(1);
}

console.log('\n=======================================================');
console.log('     SIGUIENTES PASOS');
console.log('=======================================================\n');

console.log('1. Reconstruya y reinicie sus contenedores Docker:');
console.log('   docker-compose -f docker-compose-fix.yml down');
console.log('   docker-compose -f docker-compose-fix.yml up -d --build');
console.log('\n2. Verifique los logs para asegurarse de que todo funciona correctamente:');
console.log('   docker logs -f gescoop_app');
