# Guía de Conexión a la Base de Datos

## Parámetros de Conexión

Para conectarte a la base de datos desde una herramienta de administración de base de datos (MySQL Workbench, phpMyAdmin, DBeaver, etc.), necesitarás los siguientes parámetros:

### Entorno de Producción (Docker)
- **Host**: db (o 127.0.0.1 si te conectas desde fuera del contenedor)
- **Puerto**: 3306
- **Usuario**: gescoop_user
- **Contraseña**: gescoop_password
- **Base de datos**: gescoop_db

## Instrucciones para conectar usando herramientas populares

### MySQL Workbench
1. Abre MySQL Workbench
2. Haz clic en "+" para añadir una nueva conexión
3. Completa los campos:
   - Connection Name: GescoopDB
   - Hostname: 127.0.0.1 (o la IP del servidor donde está desplegado)
   - Port: 3306
   - Username: gescoop_user
   - Password: Haz clic en "Store in Vault" y escribe gescoop_password
4. Haz clic en "Test Connection" para verificar
5. Si la conexión es exitosa, haz clic en "OK" para guardar

### DBeaver
1. Abre DBeaver
2. Ve a Database > New Database Connection
3. Selecciona MySQL
4. Completa los campos:
   - Server Host: 127.0.0.1 (o la IP del servidor)
   - Port: 3306
   - Database: gescoop_db
   - Username: gescoop_user
   - Password: gescoop_password
5. Haz clic en "Test Connection..." para verificar
6. Si la conexión es exitosa, haz clic en "Finish"

## Solución de problemas comunes

### Error: "Communications link failure" en DBeaver
Si encuentras este error:
```
Communications link failure

The last packet sent successfully to the server was 0 milliseconds ago. The driver has not received any packets from the server.
Connection refused: getsockopt
Connection refused: getsockopt
```

Este error significa que DBeaver no puede establecer conexión con la base de datos. Para resolverlo:

1. **Verifica que el servidor MySQL esté en ejecución**
   - Si usas Docker, verifica que el contenedor de la base de datos esté activo:
     ```
     docker ps | grep db
     ```
   - Si no ves el contenedor, puede ser necesario iniciarlo:
     ```
     docker-compose up -d
     ```

2. **Comprueba la dirección del host y el puerto**
   - Si estás usando Docker, prueba usando `host.docker.internal` en lugar de `127.0.0.1` como host.
   - Verifica que el puerto 3306 esté abierto y accesible.

3. **Verifica la configuración de red**
   - Asegúrate de que no hay un firewall bloqueando la conexión al puerto 3306.
   - Si usas Docker, verifica que la red de Docker está configurada correctamente.

4. **Comprueba los bind-address en la configuración de MySQL**
   - MySQL podría estar configurado para escuchar solo en localhost o en una IP específica.
   - Verifica el archivo `my.cnf` o `my.ini` del servidor MySQL y asegúrate de que `bind-address` esté configurado para permitir conexiones desde tu IP.

5. **Prueba con la herramienta de línea de comandos de MySQL**
   - Intenta conectarte usando el cliente MySQL desde la línea de comandos para verificar si el problema es específico de DBeaver:
     ```
     mysql -h 127.0.0.1 -u gescoop_user -p gescoop_db
     ```

### phpMyAdmin
Si tienes phpMyAdmin instalado:
1. Accede a la URL de phpMyAdmin
2. Introduce los siguientes datos:
   - Servidor: db (o 127.0.0.1)
   - Usuario: gescoop_user
   - Contraseña: gescoop_password
3. Haz clic en "Iniciar sesión"

## Notas importantes
- Si te estás conectando desde fuera del entorno Docker, usa "127.0.0.1" o la IP del servidor como host.
- Si te estás conectando desde dentro de otro contenedor Docker en la misma red, usa "db" como hostname.
- Asegúrate de que el puerto 3306 esté accesible (no bloqueado por firewalls).
- Para conexiones remotas, verifica que MySQL esté configurado para aceptar conexiones externas.
