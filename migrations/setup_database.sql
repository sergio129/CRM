-- Eliminar el procedimiento si existe
DROP PROCEDURE IF EXISTS SetupPayrollSystem;

DELIMITER //

CREATE PROCEDURE SetupPayrollSystem()
BEGIN
    -- Control de errores
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error en la configuración de la base de datos';
    END;

    START TRANSACTION;
    
    -- Verificar que estamos en la base de datos correcta
    SET @db_name = DATABASE();
    IF @db_name IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No hay base de datos seleccionada';
    END IF;

    -- Verificar y crear tabla id_types si no existe
    CREATE TABLE IF NOT EXISTS id_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type_name VARCHAR(50) NOT NULL,
        description VARCHAR(100)
    );

    -- Verificar y actualizar tabla employees
    CREATE TABLE IF NOT EXISTS employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(100) NOT NULL,
        id_type_id INT NOT NULL,
        id_number VARCHAR(20) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20),
        address VARCHAR(200),
        role VARCHAR(50),
        department VARCHAR(50),
        position VARCHAR(100),
        hire_date DATE,
        tipo_contrato ENUM('Indefinido', 'Fijo', 'Obra', 'Aprendizaje'),
        salario_base DECIMAL(10,2),
        riesgo_arl INT DEFAULT 1,
        status ENUM('Activo', 'Inactivo', 'Suspendido') DEFAULT 'Activo',
        eps VARCHAR(100),
        fondo_pension VARCHAR(100),
        fondo_cesantias VARCHAR(100),
        caja_compensacion VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- Agregar columnas faltantes a employees si no existen
    SET @alterEmployees = (
        SELECT IF(
            COUNT(*) = 0,
            'ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS tipo_contrato ENUM("Indefinido", "Fijo", "Obra", "Aprendizaje"),
            ADD COLUMN IF NOT EXISTS salario_base DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS riesgo_arl INT DEFAULT 1,
            ADD COLUMN IF NOT EXISTS eps VARCHAR(100),
            ADD COLUMN IF NOT EXISTS fondo_pension VARCHAR(100),
            ADD COLUMN IF NOT EXISTS fondo_cesantias VARCHAR(100),
            ADD COLUMN IF NOT EXISTS caja_compensacion VARCHAR(100)',
            'SELECT 1'
        )
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'employees' 
        AND COLUMN_NAME = 'tipo_contrato'
    );
    PREPARE alterStmt FROM @alterEmployees;
    EXECUTE alterStmt;
    DEALLOCATE PREPARE alterStmt;

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

    -- Crear índices si no existen
    CREATE INDEX IF NOT EXISTS idx_employee_id_number ON employees(id_number);
    CREATE INDEX IF NOT EXISTS idx_payroll_periodo ON payroll_details(periodo);
    CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_details(employee_id);
    CREATE INDEX IF NOT EXISTS idx_loan_employee ON payroll_loans(employee_id);

    COMMIT;
    
    SELECT CONCAT('Sistema de nómina configurado correctamente en la base de datos: ', @db_name) AS Result;
END //

DELIMITER ;

-- Ejecutar el procedimiento
SET autocommit = 0;
CALL SetupPayrollSystem();
COMMIT;
SET autocommit = 1;
