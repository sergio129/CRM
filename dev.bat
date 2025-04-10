@echo off
ECHO =======================================================
ECHO      GESCOOP - Entorno de Desarrollo con Actualizacion Automatica
ECHO =======================================================
ECHO.

:: Verificar que Docker está instalado
docker --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] Docker no está instalado o no se encuentra en el PATH.
    ECHO.
    PAUSE
    EXIT /B 1
)

ECHO =======================================================
ECHO     OPCIONES DISPONIBLES
ECHO =======================================================
ECHO.
ECHO 1. Iniciar entorno de desarrollo con actualizacion automatica
ECHO 2. Detener entorno de desarrollo
ECHO 3. Ver logs de la aplicacion
ECHO 4. Salir
ECHO.
choice /C 1234 /M "Seleccione una opcion: "

if errorlevel 4 goto exit
if errorlevel 3 goto logs
if errorlevel 2 goto stop
if errorlevel 1 goto start

:start
ECHO.
ECHO [INFO] Iniciando entorno de desarrollo con actualizacion automatica...
ECHO.

:: Iniciar contenedores de desarrollo
docker-compose -f docker-compose.dev.yml up -d --build

ECHO.
ECHO [INFO] Entorno de desarrollo iniciado correctamente.
ECHO [INFO] La aplicacion esta disponible en: http://localhost:5000
ECHO.
ECHO IMPORTANTE: Los cambios en tu codigo se actualizaran automaticamente.
ECHO Para ver los logs en tiempo real, selecciona la opcion 3.
ECHO.
PAUSE
GOTO menu

:stop
ECHO.
ECHO [INFO] Deteniendo entorno de desarrollo...
ECHO.

:: Detener contenedores
docker-compose -f docker-compose.dev.yml down

ECHO.
ECHO [INFO] Entorno de desarrollo detenido correctamente.
ECHO.
PAUSE
GOTO menu

:logs
ECHO.
ECHO [INFO] Mostrando logs de la aplicacion en tiempo real...
ECHO [INFO] Presiona Ctrl+C para salir de los logs.
ECHO.
docker logs -f gescoop_app_dev
GOTO menu

:menu
cls
GOTO :EOF

:exit
ECHO.
ECHO Saliendo...
ECHO.
exit /B 0