-- Crear tabla de tipos de identificación (si no existe)
CREATE TABLE IF NOT EXISTS id_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE
);

-- Insertar tipos de identificación por defecto
INSERT IGNORE INTO id_types (type_name) VALUES ('Cédula de ciudadanía'), ('Cédula de extranjería'), ('Pasaporte');

-- Crear tabla de empleados (si no existe)
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    id_type_id INT NOT NULL, -- Referencia a la tabla de tipos de identificación
    id_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address VARCHAR(255),
    role VARCHAR(50),
    salary FLOAT NOT NULL,
    department VARCHAR(255),
    position VARCHAR(255),
    hire_date DATE,
    contract_type VARCHAR(255),
    work_schedule VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_type_id) REFERENCES id_types(id) ON DELETE RESTRICT
);
