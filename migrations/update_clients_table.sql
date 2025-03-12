-- Datos Personales
ALTER TABLE clients
ADD COLUMN tipo_documento ENUM('DNI', 'Pasaporte', 'Cédula', 'Otro') AFTER full_name,
ADD COLUMN fecha_nacimiento DATE,
ADD COLUMN genero ENUM('Masculino', 'Femenino', 'Otro'),
ADD COLUMN estado_civil ENUM('Soltero', 'Casado', 'Divorciado', 'Viudo', 'Otro'),
ADD COLUMN nacionalidad VARCHAR(50),

-- Datos de Contacto
ADD COLUMN telefono_movil VARCHAR(20),
ADD COLUMN telefono_fijo VARCHAR(20),
ADD COLUMN ciudad VARCHAR(100),
ADD COLUMN codigo_postal VARCHAR(10),
ADD COLUMN pais VARCHAR(50),

-- Datos Financieros
ADD COLUMN numero_cuenta VARCHAR(50),
ADD COLUMN tipo_cuenta ENUM('Corriente', 'Ahorros'),
ADD COLUMN moneda VARCHAR(3),
ADD COLUMN saldo_disponible DECIMAL(15,2) DEFAULT 0,
ADD COLUMN limite_credito DECIMAL(15,2),

-- Datos Laborales
ADD COLUMN ocupacion VARCHAR(100),
ADD COLUMN empresa VARCHAR(100),
ADD COLUMN sector_economico VARCHAR(100),
ADD COLUMN ingresos_mensuales DECIMAL(15,2),
ADD COLUMN tipo_contrato ENUM('Indefinido', 'Temporal', 'Autónomo', 'Otro'),
ADD COLUMN antiguedad_trabajo DATE,

-- Datos de Crédito y Riesgo
ADD COLUMN scoring_crediticio INT,
ADD COLUMN deudas_actuales DECIMAL(15,2) DEFAULT 0,
ADD COLUMN creditos_vigentes INT DEFAULT 0,

-- Datos Adicionales
ADD COLUMN personas_autorizadas TEXT,
ADD COLUMN beneficiarios TEXT,
ADD COLUMN observaciones TEXT;
