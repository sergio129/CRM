const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const { authenticate } = require('../middleware/authMiddleware');

// Ruta para ejecutar scripts SQL específicos
router.post('/run-sql/:script', authenticate, async (req, res) => {
    try {
        // Verificar si el usuario es administrador
        if (req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para ejecutar esta acción'
            });
        }

        // Obtener el nombre del script
        const scriptName = req.params.script;
        const scriptPath = path.join(__dirname, '..', 'database', `${scriptName}.sql`);

        // Verificar que el archivo existe
        if (!fs.existsSync(scriptPath)) {
            return res.status(404).json({
                success: false,
                error: `El script ${scriptName}.sql no existe`
            });
        }

        // Leer el archivo SQL
        const sqlScript = fs.readFileSync(scriptPath, 'utf8');

        // Ejecutar el script SQL
        await sequelize.query(sqlScript);

        return res.json({
            success: true,
            message: `Script ${scriptName}.sql ejecutado correctamente`
        });
    } catch (error) {
        console.error('Error al ejecutar script SQL:', error);
        return res.status(500).json({
            success: false,
            error: `Error al ejecutar script SQL: ${error.message}`
        });
    }
});

// Ruta para obtener una lista de scripts SQL disponibles
router.get('/scripts', authenticate, (req, res) => {
    try {
        // Verificar si el usuario es administrador
        if (req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para ejecutar esta acción'
            });
        }

        const databaseDir = path.join(__dirname, '..', 'database');
        const files = fs.readdirSync(databaseDir)
            .filter(file => file.endsWith('.sql'))
            .map(file => ({
                name: file,
                path: `/api/setup/run-sql/${file.replace('.sql', '')}`
            }));

        return res.json({
            success: true,
            data: files
        });
    } catch (error) {
        console.error('Error al listar scripts SQL:', error);
        return res.status(500).json({
            success: false,
            error: `Error al listar scripts SQL: ${error.message}`
        });
    }
});

module.exports = router;
