-- Verificar y agregar columnas si no existen
SET @dbname = DATABASE();

-- Agregar columna periodo si no existe
SET @existe_periodo = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'payrolls' AND COLUMN_NAME = 'periodo');
SET @sql = IF(@existe_periodo = 0, 'ALTER TABLE payrolls ADD COLUMN periodo VARCHAR(7) NOT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna total_ingresos si no existe
SET @existe_ingresos = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'payrolls' AND COLUMN_NAME = 'total_ingresos');
SET @sql = IF(@existe_ingresos = 0, 'ALTER TABLE payrolls ADD COLUMN total_ingresos DECIMAL(10,2) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna total_deducciones si no existe
SET @existe_deducciones = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'payrolls' AND COLUMN_NAME = 'total_deducciones');
SET @sql = IF(@existe_deducciones = 0, 'ALTER TABLE payrolls ADD COLUMN total_deducciones DECIMAL(10,2) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna neto_pagar si no existe
SET @existe_neto = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'payrolls' AND COLUMN_NAME = 'neto_pagar');
SET @sql = IF(@existe_neto = 0, 'ALTER TABLE payrolls ADD COLUMN neto_pagar DECIMAL(10,2) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar columna status
ALTER TABLE payrolls MODIFY COLUMN status ENUM('Pendiente', 'Pagado', 'Anulado') DEFAULT 'Pendiente';
