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

-- Crear tabla de tipos de identificación si no existe
CREATE TABLE IF NOT EXISTS id_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE
);

-- Insertar tipos de identificación por defecto si no existen
INSERT IGNORE INTO id_types (type_name) VALUES ('Cédula de ciudadanía'), ('Cédula de extranjería'), ('Pasaporte');

-- Actualizar tabla de empleados
CALL AddColumnIfNotExists('employees', 'id_type_id', 'INT NOT NULL');
CALL AddColumnIfNotExists('employees', 'id_number', 'VARCHAR(50) NOT NULL');
CALL AddColumnIfNotExists('employees', 'salary', 'FLOAT NOT NULL');
ALTER TABLE employees ADD CONSTRAINT fk_id_type_id FOREIGN KEY (id_type_id) REFERENCES id_types(id) ON DELETE RESTRICT;
