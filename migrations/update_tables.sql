-- Actualizar tabla employees
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS tipo_contrato ENUM('Indefinido', 'Fijo', 'Obra', 'Aprendizaje') AFTER hire_date,
ADD COLUMN IF NOT EXISTS salario_base DECIMAL(10,2) AFTER tipo_contrato,
ADD COLUMN IF NOT EXISTS riesgo_arl INT DEFAULT 1 AFTER salario_base,
ADD COLUMN IF NOT EXISTS eps VARCHAR(100) AFTER status,
ADD COLUMN IF NOT EXISTS fondo_pension VARCHAR(100) AFTER eps,
ADD COLUMN IF NOT EXISTS fondo_cesantias VARCHAR(100) AFTER fondo_pension,
ADD COLUMN IF NOT EXISTS caja_compensacion VARCHAR(100) AFTER fondo_cesantias;

-- Verificar y crear tabla bank_info si no existe
CREATE TABLE IF NOT EXISTS bank_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    banco VARCHAR(100) NOT NULL,
    tipo_cuenta ENUM('Ahorros', 'Corriente') NOT NULL,
    numero_cuenta VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Verificar y crear tabla payroll_loans si no existe
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

-- Actualizar tabla payroll_details o crearla si no existe
CREATE TABLE IF NOT EXISTS payroll_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    periodo VARCHAR(7) NOT NULL,
    fecha_pago DATE NOT NULL,
    dias_trabajados INT DEFAULT 30,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Agregar nuevas columnas a payroll_details
ALTER TABLE payroll_details
ADD COLUMN IF NOT EXISTS dias_vacaciones INT DEFAULT 0 AFTER dias_trabajados,
ADD COLUMN IF NOT EXISTS dias_incapacidad INT DEFAULT 0 AFTER dias_vacaciones,
ADD COLUMN IF NOT EXISTS salario_base DECIMAL(10,2) AFTER dias_incapacidad,
ADD COLUMN IF NOT EXISTS auxilio_transporte DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS horas_extras_diurnas INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_hora_extra_diurna DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS horas_extras_nocturnas INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_hora_extra_nocturna DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonificaciones DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS comisiones DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS recargo_dominical DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aporte_salud_empleado DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aporte_pension_empleado DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aporte_salud_empleador DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aporte_pension_empleador DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aporte_arl DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aporte_caja_compensacion DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aporte_icbf DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aporte_sena DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prestamos DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS embargos DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS otros_descuentos DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS provision_prima DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS provision_cesantias DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS provision_intereses_cesantias DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS provision_vacaciones DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ingresos DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_deducciones DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_provisiones DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS neto_pagar DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS estado ENUM('Pendiente', 'Pagado', 'Anulado') DEFAULT 'Pendiente',
ADD COLUMN IF NOT EXISTS metodo_pago ENUM('Transferencia', 'Cheque', 'Efectivo') DEFAULT 'Transferencia',
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Agregar índices si no existen
CREATE INDEX IF NOT EXISTS idx_employee_id_number ON employees(id_number);
CREATE INDEX IF NOT EXISTS idx_payroll_periodo ON payroll_details(periodo);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_details(employee_id);
CREATE INDEX IF NOT EXISTS idx_loan_employee ON payroll_loans(employee_id);
