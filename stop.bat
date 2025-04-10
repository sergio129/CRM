@echo off
ECHO =======================================================
ECHO      GESCOOP - Detener Servicios Docker
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

ECHO [INFO] Deteniendo servicios de GESCOOP...
docker-compose down
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ADVERTENCIA] Error con docker-compose down, intentando con archivo específico...
    docker-compose -f docker-compose-fix.yml down
    IF %ERRORLEVEL% NEQ 0 (
        ECHO.
        ECHO [ERROR] Error al detener los servicios Docker.
        PAUSE
        EXIT /B 1
    )
)

ECHO.
ECHO [INFO] Los servicios de GESCOOP se han detenido correctamente.
ECHO [INFO] Limpiando contenedores huérfanos...
docker container prune -f

ECHO.
ECHO =======================================================
ECHO     OPCIONES DISPONIBLES
ECHO =======================================================
ECHO.
ECHO 1. Reiniciar servicios (preservando datos)
ECHO 2. Salir
ECHO.
choice /C 12 /M "Seleccione una opcion: "

if errorlevel 2 goto exit
if errorlevel 1 goto restart

:restart
ECHO.
ECHO [INFO] Reiniciando servicios (manteniendo los datos de la base de datos)...
ECHO.

ECHO [INFO] Eliminando contenedores...
docker rm -f gescoop_app 2>nul

ECHO [INFO] Eliminando imagenes...
docker rmi -f modeloweb-app 2>nul

REM Línea comentada para preservar los datos de la base de datos
REM ECHO [INFO] Limpiando volumenes...
REM docker volume rm modeloweb_gescoop_db_data 2>nul

ECHO [INFO] Limpiando cache...
docker builder prune -f

ECHO [INFO] Reconstruyendo servicios...
docker-compose build --no-cache
docker-compose up -d

ECHO [INFO] Servicios reiniciados correctamente.
ECHO [INFO] La aplicacion estara disponible en unos momentos en: http://localhost:5000
ECHO.
ECHO Para ver los logs de la aplicacion: docker logs -f gescoop_app
ECHO.
PAUSE
goto end

:exit
ECHO.
ECHO Saliendo...

:end