-- Primero verificar si existe la llave foránea y eliminarla si existe
SET @dbname = DATABASE();
SET @tablename = "payroll_details";
SET @constraintname = "fk_payroll_details_payroll";

SELECT IF(
    EXISTS(
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = @dbname 
        AND TABLE_NAME = @tablename 
        AND CONSTRAINT_NAME = @constraintname
    ),
    CONCAT('ALTER TABLE ', @tablename, ' DROP FOREIGN KEY ', @constraintname),
    'SELECT 1'
) INTO @dropconstraint;

PREPARE stmt FROM @dropconstraint;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Luego modificar la columna y agregar la nueva restricción
ALTER TABLE payroll_details 
MODIFY COLUMN payroll_id INT NULL;

ALTER TABLE payroll_details
ADD CONSTRAINT fk_payroll_details_payroll 
FOREIGN KEY (payroll_id) REFERENCES payrolls(id) 
ON DELETE SET NULL;
