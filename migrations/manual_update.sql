-- Función auxiliar para verificar si existe una columna
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DELIMITER //
CREATE PROCEDURE AddColumnIfNotExists(
    IN table_name VARCHAR(100),
    IN column_name VARCHAR(100),
    IN column_definition VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns 
        WHERE table_name = table_name
        AND column_name = column_name
        AND table_schema = DATABASE()
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', table_name, 
                         ' ADD COLUMN ', column_name, ' ', column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Agregar columnas a employees
CALL AddColumnIfNotExists('employees', 'tipo_contrato', "ENUM('Indefinido', 'Fijo', 'Obra', 'Aprendizaje') NULL");
CALL AddColumnIfNotExists('employees', 'salario_base', 'DECIMAL(10,2) NULL');
CALL AddColumnIfNotExists('employees', 'riesgo_arl', 'INT DEFAULT 1');
CALL AddColumnIfNotExists('employees', 'eps', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists('employees', 'fondo_pension', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists('employees', 'fondo_cesantias', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists('employees', 'caja_compensacion', 'VARCHAR(100) NULL');

-- Verificar y crear tabla bank_info
CREATE TABLE IF NOT EXISTS bank_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    banco VARCHAR(100) NOT NULL,
    tipo_cuenta ENUM('Ahorros', 'Corriente') NOT NULL,
    numero_cuenta VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Verificar y crear tabla payroll_loans
CREATE TABLE IF NOT EXISTS payroll_loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    cuotas_totales INT NOT NULL,
    cuotas_pagadas INT DEFAULT 0,
    valor_cuota DECIMAL(10,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE NOT NULL,
    estado ENUM('Activo', 'Pagado', 'Cancelado') DEFAULT 'Activo',
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Verificar y crear tabla payroll_details
CREATE TABLE IF NOT EXISTS payroll_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    periodo VARCHAR(7) NOT NULL,
    fecha_pago DATE NOT NULL,
    dias_trabajados INT DEFAULT 30,
    dias_vacaciones INT DEFAULT 0,
    dias_incapacidad INT DEFAULT 0,
    salario_base DECIMAL(10,2) NOT NULL,
    auxilio_transporte DECIMAL(10,2) DEFAULT 0,
    horas_extras_diurnas INT DEFAULT 0,
    valor_hora_extra_diurna DECIMAL(10,2) DEFAULT 0,
    horas_extras_nocturnas INT DEFAULT 0,
    valor_hora_extra_nocturna DECIMAL(10,2) DEFAULT 0,
    bonificaciones DECIMAL(10,2) DEFAULT 0,
    comisiones DECIMAL(10,2) DEFAULT 0,
    recargo_dominical DECIMAL(10,2) DEFAULT 0,
    aporte_salud_empleado DECIMAL(10,2) DEFAULT 0,
    aporte_pension_empleado DECIMAL(10,2) DEFAULT 0,
    aporte_salud_empleador DECIMAL(10,2) DEFAULT 0,
    aporte_pension_empleador DECIMAL(10,2) DEFAULT 0,
    aporte_arl DECIMAL(10,2) DEFAULT 0,
    aporte_caja_compensacion DECIMAL(10,2) DEFAULT 0,
    aporte_icbf DECIMAL(10,2) DEFAULT 0,
    aporte_sena DECIMAL(10,2) DEFAULT 0,
    prestamos DECIMAL(10,2) DEFAULT 0,
    embargos DECIMAL(10,2) DEFAULT 0,
    otros_descuentos DECIMAL(10,2) DEFAULT 0,
    provision_prima DECIMAL(10,2) DEFAULT 0,
    provision_cesantias DECIMAL(10,2) DEFAULT 0,
    provision_intereses_cesantias DECIMAL(10,2) DEFAULT 0,
    provision_vacaciones DECIMAL(10,2) DEFAULT 0,
    total_ingresos DECIMAL(10,2) DEFAULT 0,
    total_deducciones DECIMAL(10,2) DEFAULT 0,
    total_provisiones DECIMAL(10,2) DEFAULT 0,
    neto_pagar DECIMAL(10,2) DEFAULT 0,
    estado ENUM('Pendiente', 'Pagado', 'Anulado') DEFAULT 'Pendiente',
    metodo_pago ENUM('Transferencia', 'Cheque', 'Efectivo') DEFAULT 'Transferencia',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Crear índices (versión corregida)
DROP INDEX IF EXISTS idx_employee_id_number ON employees;
CREATE INDEX idx_employee_id_number ON employees(id_number);

DROP INDEX IF EXISTS idx_payroll_periodo ON payroll_details;
CREATE INDEX idx_payroll_periodo ON payroll_details(periodo);

DROP INDEX IF EXISTS idx_payroll_employee ON payroll_details;
CREATE INDEX idx_payroll_employee ON payroll_details(employee_id);

DROP INDEX IF EXISTS idx_loan_employee ON payroll_loans;
CREATE INDEX idx_loan_employee ON payroll_loans(employee_id);

-- Limpiar
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
