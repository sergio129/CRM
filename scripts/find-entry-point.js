/**
 * Script to find the entry point of the application
 */
const fs = require('fs');
const path = require('path');

console.log('=======================================================');
console.log('     GESCOOP - Buscando punto de entrada de la aplicación');
console.log('=======================================================\n');

const rootDir = path.resolve(__dirname, '..');
console.log(`Directorio raíz: ${rootDir}\n`);

// Check for common entry point files
const commonEntryPoints = ['server.js', 'app.js', 'index.js', 'main.js', 'src/index.js', 'src/app.js', 'src/server.js'];

console.log('Buscando archivos comunes de punto de entrada:');
const foundEntryPoints = commonEntryPoints.filter(entryPoint => {
    const entryPointPath = path.join(rootDir, entryPoint);
    const exists = fs.existsSync(entryPointPath);
    console.log(`- ${entryPoint}: ${exists ? 'ENCONTRADO' : 'no encontrado'}`);
    return exists;
});

// Check package.json for main or start script
let packageEntryPoint = null;
const packageJsonPath = path.join(rootDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    console.log('\nRevisando package.json:');
    const packageJson = require(packageJsonPath);
    
    if (packageJson.main) {
        console.log(`- Campo "main": ${packageJson.main}`);
        packageEntryPoint = packageJson.main;
    } else {
        console.log('- Campo "main" no encontrado');
    }
    
    if (packageJson.scripts && packageJson.scripts.start) {
        console.log(`- Script "start": ${packageJson.scripts.start}`);
        const startScript = packageJson.scripts.start;
        // Extract filename if it's a simple node command
        if (startScript.startsWith('node ')) {
            const startFile = startScript.replace('node ', '').trim();
            if (!startFile.includes(' ')) {
                if (!packageEntryPoint) packageEntryPoint = startFile;
            }
        }
    } else {
        console.log('- Script "start" no encontrado');
    }
} else {
    console.log('\nNo se encontró package.json');
}

// List all JavaScript files in the root directory
console.log('\nListando todos los archivos JavaScript en el directorio raíz:');
const rootFiles = fs.readdirSync(rootDir);
const jsFiles = rootFiles.filter(file => file.endsWith('.js'));
jsFiles.forEach(file => console.log(`- ${file}`));

console.log('\n=======================================================');
console.log('     RECOMENDACIÓN');
console.log('=======================================================\n');

if (foundEntryPoints.length > 0) {
    console.log(`Punto de entrada más probable: ${foundEntryPoints[0]}`);
    console.log('\nModifique docker-compose-fix.yml con este comando:');
    console.log(`node ${foundEntryPoints[0]}`);
} else if (packageEntryPoint) {
    console.log(`Punto de entrada según package.json: ${packageEntryPoint}`);
    console.log('\nModifique docker-compose-fix.yml con este comando:');
    console.log(`node ${packageEntryPoint}`);
} else if (jsFiles.length > 0) {
    console.log('No se ha podido determinar con certeza el punto de entrada.');
    console.log('Verifique manualmente cuál de estos archivos es el punto de entrada:');
    jsFiles.forEach(file => console.log(`- ${file}`));
} else {
    console.log('No se pudo determinar el punto de entrada. Verifique la estructura de su proyecto.');
}
