@echo off
echo Ejecutando migración para subcategorías de ingresos...
node scripts/migrate-categorias.js
if %errorlevel% neq 0 (
    echo Error al ejecutar la migración!
    exit /b %errorlevel%
)
echo Migración completada exitosamente!
pause
