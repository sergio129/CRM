-- Agregar columna payroll_id si no existe
SET @dbname = DATABASE();
SET @tablename = "payroll_details";
SET @columnname = "payroll_id";
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            TABLE_SCHEMA = @dbname
            AND TABLE_NAME = @tablename
            AND COLUMN_NAME = @columnname
    ) > 0,
    "SELECT 1",
    "ALTER TABLE payroll_details ADD COLUMN payroll_id INT"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar la llave foránea si no existe
SET @fkName = "fk_payroll_details_payroll";
SET @checkFK = (SELECT IF(
    EXISTS(
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = @dbname 
        AND CONSTRAINT_NAME = @fkName
    ),
    "SELECT 1",
    "ALTER TABLE payroll_details ADD CONSTRAINT fk_payroll_details_payroll FOREIGN KEY (payroll_id) REFERENCES payrolls(id)"
));
PREPARE addFKIfNotExists FROM @checkFK;
EXECUTE addFKIfNotExists;
DEALLOCATE PREPARE addFKIfNotExists;
