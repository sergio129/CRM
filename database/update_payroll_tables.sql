-- Procedimiento para agregar columna si no existe
DELIMITER //

CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(64),
    IN columnName VARCHAR(64),
    IN columnDefinition VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE table_name = tableName
        AND column_name = columnName
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDefinition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- Actualizar tabla de empleados
CALL AddColumnIfNotExists('employees', 'phone', 'VARCHAR(20)');
CALL AddColumnIfNotExists('employees', 'address', 'VARCHAR(255)');
CALL AddColumnIfNotExists('employees', 'role', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employees', 'status', 'VARCHAR(50)');
CALL AddColumnIfNotExists('employees', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('employees', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- Actualizar tabla de nóminas
CALL AddColumnIfNotExists('payrolls', 'employee_id', 'INT NOT NULL');
CALL AddColumnIfNotExists('payrolls', 'salary', 'FLOAT NOT NULL');
CALL AddColumnIfNotExists('payrolls', 'payment_date', 'DATE NOT NULL');
CALL AddColumnIfNotExists('payrolls', 'status', 'VARCHAR(50) NOT NULL');
CALL AddColumnIfNotExists('payrolls', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('payrolls', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
ALTER TABLE payrolls ADD CONSTRAINT fk_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- Actualizar tabla de roles
CALL AddColumnIfNotExists('roles', 'role_name', 'VARCHAR(50) NOT NULL UNIQUE');
CALL AddColumnIfNotExists('roles', 'permissions', 'JSON');
CALL AddColumnIfNotExists('roles', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('roles', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- Actualizar tabla de usuarios
CALL AddColumnIfNotExists('users', 'full_name', 'VARCHAR(255) NOT NULL');
CALL AddColumnIfNotExists('users', 'email', 'VARCHAR(255) NOT NULL UNIQUE');
CALL AddColumnIfNotExists('users', 'username', 'VARCHAR(50) NOT NULL UNIQUE');
CALL AddColumnIfNotExists('users', 'password_hash', 'VARCHAR(255) NOT NULL');
CALL AddColumnIfNotExists('users', 'role_id', 'INT');
CALL AddColumnIfNotExists('users', 'status', 'VARCHAR(50)');
CALL AddColumnIfNotExists('users', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
ALTER TABLE users ADD CONSTRAINT fk_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Actualizar tabla de clientes
CALL AddColumnIfNotExists('clients', 'identification', 'VARCHAR(50) NOT NULL UNIQUE');
CALL AddColumnIfNotExists('clients', 'full_name', 'VARCHAR(255) NOT NULL');
CALL AddColumnIfNotExists('clients', 'email', 'VARCHAR(255) NOT NULL');
CALL AddColumnIfNotExists('clients', 'phone', 'VARCHAR(20)');
CALL AddColumnIfNotExists('clients', 'address', 'VARCHAR(255)');
CALL AddColumnIfNotExists('clients', 'status', 'VARCHAR(50)');
CALL AddColumnIfNotExists('clients', 'deuda_total', 'FLOAT');
CALL AddColumnIfNotExists('clients', 'ultimo_pago', 'DATE');
CALL AddColumnIfNotExists('clients', 'estado_financiero', 'VARCHAR(50)');
CALL AddColumnIfNotExists('clients', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('clients', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
