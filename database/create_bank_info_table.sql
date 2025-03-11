-- Crear tabla de información bancaria (si no existe)
CREATE TABLE IF NOT EXISTS bank_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    bank_account_type VARCHAR(50) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
