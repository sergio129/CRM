@echo off
echo =======================================================
echo      GESCOOP - SOLUCION COMPLETA DOCKER
echo =======================================================

echo [INFO] Deteniendo todos los contenedores...
docker-compose down

echo [INFO] Forzando eliminacion de todos los contenedores relacionados...
docker rm -f gescoop_app gescoop_db 2>nul

echo [INFO] Eliminando imagenes antiguas...
docker rmi -f modeloweb-app 2>nul

echo [INFO] Eliminando todos los volumenes para limpiar completamente...
docker volume rm modeloweb_gescoop_db_data 2>nul

echo [INFO] Limpiando cache de Docker...
docker builder prune -f

echo [INFO] Verificando archivo .env...
copy .env .env.backup
echo # Configuracion para Docker > .env
echo DB_HOST=db >> .env
echo DB_USER=gescoop_user >> .env
echo DB_PASSWORD=gescoop_password >> .env
echo DB_NAME=gescoop_db >> .env
echo DB_PORT=3306 >> .env
echo JWT_SECRET=your_jwt_secret_key >> .env
echo NODE_ENV=production >> .env
echo FRONTEND_URL=http://localhost:5000 >> .env

echo [INFO] Aplicando Dockerfile multi-etapa optimizado...
copy Dockerfile.multistage Dockerfile

echo [INFO] Reconstruyendo todos los contenedores desde cero...
docker-compose -f docker-compose-network-fix.yml build --no-cache

echo [INFO] Iniciando contenedores con configuracion corregida...
docker-compose -f docker-compose-network-fix.yml up -d

echo [INFO] Esperando 60 segundos para verificar que la base de datos se inicialice correctamente...
timeout /t 60 /nobreak > nul

echo [INFO] Estado de los contenedores:
docker ps

echo [INFO] Logs del contenedor de la aplicacion:
docker logs gescoop_app

echo.
echo =======================================================
echo     SOLUCION COMPLETA DOCKER FINALIZADA
echo =======================================================
echo.
echo Si ahora funcionan los servicios, para utilizarlos en el futuro use:
echo   docker-compose -f docker-compose-network-fix.yml up -d
echo.
echo Para detener los servicios:
echo   docker-compose -f docker-compose-network-fix.yml down
echo.
echo Para ver los logs:
echo   docker logs -f gescoop_app
echo.
pause