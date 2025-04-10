-- MySQL dump 10.13  Distrib 8.4.0, for Win64 (x86_64)
--
-- Host: localhost    Database: crm_system
-- ------------------------------------------------------
-- Server version	8.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bank_info`
--

DROP TABLE IF EXISTS `bank_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `bank_account_number` varchar(50) NOT NULL,
  `bank_account_type` varchar(50) NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `bank_info_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bankinfos`
--

DROP TABLE IF EXISTS `bankinfos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bankinfos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `bank_account_number` varchar(255) NOT NULL,
  `bank_account_type` varchar(255) NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `bankinfos_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) DEFAULT NULL,
  `tipo_documento` enum('DNI','Pasaporte','Cédula','Otro') DEFAULT NULL,
  `identification` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `status` varchar(255) DEFAULT 'Activo',
  `deuda_total` decimal(15,2) DEFAULT '0.00',
  `ultimo_pago` datetime NOT NULL,
  `estado_financiero` varchar(255) DEFAULT NULL,
  `fecha_nacimiento` datetime DEFAULT NULL,
  `genero` enum('Masculino','Femenino','Otro') DEFAULT NULL,
  `estado_civil` enum('Soltero','Casado','Divorciado','Viudo','Otro') DEFAULT NULL,
  `nacionalidad` varchar(255) DEFAULT NULL,
  `telefono_movil` varchar(255) DEFAULT NULL,
  `telefono_fijo` varchar(255) DEFAULT NULL,
  `ciudad` varchar(255) DEFAULT NULL,
  `codigo_postal` varchar(255) DEFAULT NULL,
  `pais` varchar(255) DEFAULT NULL,
  `numero_cuenta` varchar(255) DEFAULT NULL,
  `tipo_cuenta` enum('Corriente','Ahorros') DEFAULT NULL,
  `moneda` varchar(3) DEFAULT NULL,
  `saldo_disponible` decimal(15,2) DEFAULT '0.00',
  `limite_credito` decimal(15,2) DEFAULT NULL,
  `ocupacion` varchar(255) DEFAULT NULL,
  `empresa` varchar(255) DEFAULT NULL,
  `sector_economico` varchar(255) DEFAULT NULL,
  `ingresos_mensuales` decimal(15,2) DEFAULT NULL,
  `tipo_contrato` enum('Indefinido','Temporal','Autónomo','Otro') DEFAULT NULL,
  `antiguedad_trabajo` datetime DEFAULT NULL,
  `scoring_crediticio` int DEFAULT NULL,
  `deudas_actuales` decimal(15,2) DEFAULT '0.00',
  `creditos_vigentes` int DEFAULT '0',
  `id_number` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identification` (`identification`),
  UNIQUE KEY `id_number` (`id_number`),
  UNIQUE KEY `identification_2` (`identification`),
  UNIQUE KEY `id_number_2` (`id_number`),
  UNIQUE KEY `identification_3` (`identification`),
  UNIQUE KEY `id_number_3` (`id_number`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `credit_histories`
--

DROP TABLE IF EXISTS `credit_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credit_histories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `credit_score` int NOT NULL,
  `report_date` datetime NOT NULL,
  `details` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `credit_histories_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `credithistories`
--

DROP TABLE IF EXISTS `credithistories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credithistories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `credit_score` int NOT NULL,
  `report_date` datetime NOT NULL,
  `details` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `credithistories_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `id_number` varchar(255) NOT NULL,
  `id_type_id` int NOT NULL,
  `position` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `hire_date` datetime DEFAULT NULL,
  `contract_type` varchar(255) DEFAULT NULL,
  `work_schedule` varchar(255) DEFAULT NULL,
  `tipo_contrato` enum('Indefinido','Fijo','Obra','Aprendizaje') DEFAULT 'Indefinido',
  `salario_base` decimal(10,2) NOT NULL DEFAULT '0.00',
  `riesgo_arl` int DEFAULT '1',
  `eps` varchar(255) DEFAULT NULL,
  `fondo_pension` varchar(255) DEFAULT NULL,
  `fondo_cesantias` varchar(255) DEFAULT NULL,
  `caja_compensacion` varchar(255) DEFAULT NULL,
  `cuenta_bancaria` varchar(255) DEFAULT NULL,
  `banco` varchar(255) DEFAULT NULL,
  `tipo_cuenta` enum('Ahorros','Corriente') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  KEY `fk_id_type_id` (`id_type_id`),
  KEY `idx_employee_id_number` (`id_number`),
  CONSTRAINT `fk_id_type_id` FOREIGN KEY (`id_type_id`) REFERENCES `id_types` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `id_types`
--

DROP TABLE IF EXISTS `id_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `id_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_name` (`type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `idtypes`
--

DROP TABLE IF EXISTS `idtypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `idtypes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_name` (`type_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loans`
--

DROP TABLE IF EXISTS `loans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `amount_requested` decimal(10,2) NOT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `interest_type` enum('Fijo','Variable') NOT NULL DEFAULT 'Fijo',
  `payment_term` int NOT NULL,
  `payment_frequency` enum('Semanal','Quincenal','Mensual') NOT NULL DEFAULT 'Mensual',
  `guarantee_type` enum('Personal','Prendaria','Hipotecaria','Aval Digital') DEFAULT NULL,
  `co_signer_id` int DEFAULT NULL,
  `loan_status` enum('Activo','Pagado','Vencido','En Mora') NOT NULL DEFAULT 'Activo',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `loan_number` varchar(255) NOT NULL,
  `additional_income` decimal(10,2) DEFAULT '0.00',
  `total_due` decimal(10,2) NOT NULL DEFAULT '0.00',
  `remaining_installments` int NOT NULL DEFAULT '0',
  `installment_amount` decimal(10,2) DEFAULT NULL,
  `risk_score` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loan_number` (`loan_number`),
  UNIQUE KEY `loan_number_2` (`loan_number`),
  UNIQUE KEY `loan_number_3` (`loan_number`),
  KEY `client_id` (`client_id`),
  KEY `co_signer_id` (`co_signer_id`),
  CONSTRAINT `loans_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `loans_ibfk_2` FOREIGN KEY (`co_signer_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_histories`
--

DROP TABLE IF EXISTS `payment_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_histories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_id` int NOT NULL,
  `payment_date` datetime NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_method` enum('Transferencia','Cheque','Efectivo') NOT NULL DEFAULT 'Transferencia',
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `loan_id` (`loan_id`),
  CONSTRAINT `payment_histories_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paymenthistories`
--

DROP TABLE IF EXISTS `paymenthistories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paymenthistories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_id` int NOT NULL,
  `payment_date` datetime NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_method` enum('Transferencia','Cheque','Efectivo') NOT NULL DEFAULT 'Transferencia',
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `loan_id` (`loan_id`),
  CONSTRAINT `paymenthistories_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payroll`
--

DROP TABLE IF EXISTS `payroll`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_name` varchar(100) NOT NULL,
  `identification` varchar(20) NOT NULL,
  `salario_base` decimal(10,0) NOT NULL,
  `department` varchar(50) NOT NULL,
  `payment_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identification` (`identification`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payroll_details`
--

DROP TABLE IF EXISTS `payroll_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `periodo` varchar(255) NOT NULL,
  `fecha_pago` datetime NOT NULL,
  `dias_trabajados` int DEFAULT '30',
  `dias_vacaciones` int DEFAULT '0',
  `dias_incapacidad` int DEFAULT '0',
  `auxilio_transporte` decimal(10,2) DEFAULT '0.00',
  `recargo_dominical` decimal(10,2) DEFAULT '0.00',
  `salario_base` decimal(10,2) NOT NULL,
  `horas_extras_diurnas` int DEFAULT '0',
  `valor_hora_extra_diurna` decimal(10,2) DEFAULT '0.00',
  `horas_extras_nocturnas` int DEFAULT '0',
  `valor_hora_extra_nocturna` decimal(10,2) DEFAULT '0.00',
  `bonificaciones` decimal(10,2) DEFAULT '0.00',
  `comisiones` decimal(10,2) DEFAULT '0.00',
  `prestamos` decimal(10,2) DEFAULT '0.00',
  `embargos` decimal(10,2) DEFAULT '0.00',
  `otros_descuentos` decimal(10,2) DEFAULT '0.00',
  `aporte_salud_empleado` decimal(10,2) DEFAULT '0.00',
  `aporte_pension_empleado` decimal(10,2) DEFAULT '0.00',
  `aporte_salud_empleador` decimal(10,2) DEFAULT '0.00',
  `aporte_pension_empleador` decimal(10,2) DEFAULT '0.00',
  `aporte_arl` decimal(10,2) DEFAULT '0.00',
  `aporte_caja_compensacion` decimal(10,2) DEFAULT '0.00',
  `aporte_icbf` decimal(10,2) DEFAULT '0.00',
  `aporte_sena` decimal(10,2) DEFAULT '0.00',
  `provision_prima` decimal(10,2) DEFAULT '0.00',
  `provision_cesantias` decimal(10,2) DEFAULT '0.00',
  `provision_intereses_cesantias` decimal(10,2) DEFAULT '0.00',
  `provision_vacaciones` decimal(10,2) DEFAULT '0.00',
  `total_provisiones` decimal(10,2) DEFAULT '0.00',
  `total_ingresos` decimal(10,2) DEFAULT '0.00',
  `total_deducciones` decimal(10,2) DEFAULT '0.00',
  `neto_pagar` decimal(10,2) DEFAULT '0.00',
  `metodo_pago` enum('Transferencia','Cheque','Efectivo') DEFAULT 'Transferencia',
  `observaciones` text,
  `estado` enum('Pendiente','Pagado','Anulado') DEFAULT 'Pendiente',
  PRIMARY KEY (`id`),
  KEY `payroll_id` (`payroll_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `payroll_details_ibfk_5` FOREIGN KEY (`payroll_id`) REFERENCES `payrolls` (`id`),
  CONSTRAINT `payroll_details_ibfk_6` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payroll_loans`
--

DROP TABLE IF EXISTS `payroll_loans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_loans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `cuotas_totales` int NOT NULL,
  `cuotas_pagadas` int DEFAULT '0',
  `valor_cuota` decimal(10,2) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin_estimada` date NOT NULL,
  `estado` enum('Activo','Pagado','Cancelado') DEFAULT 'Activo',
  `descripcion` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_loan_employee` (`employee_id`),
  CONSTRAINT `payroll_loans_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payrolldetails`
--

DROP TABLE IF EXISTS `payrolldetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payrolldetails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `periodo` varchar(255) NOT NULL,
  `fecha_pago` datetime NOT NULL,
  `tipo_pago` enum('Mensual','Quincenal','Semanal') NOT NULL DEFAULT 'Mensual',
  `dias_trabajados` int DEFAULT '30',
  `dias_vacaciones` int DEFAULT '0',
  `dias_incapacidad` int DEFAULT '0',
  `salario_base` decimal(10,2) NOT NULL,
  `auxilio_transporte` decimal(10,2) DEFAULT '0.00',
  `horas_extras_diurnas` int DEFAULT '0',
  `valor_hora_extra_diurna` decimal(10,2) DEFAULT '0.00',
  `horas_extras_nocturnas` int DEFAULT '0',
  `valor_hora_extra_nocturna` decimal(10,2) DEFAULT '0.00',
  `recargo_dominical` decimal(10,2) DEFAULT '0.00',
  `bonificaciones` decimal(10,2) DEFAULT '0.00',
  `comisiones` decimal(10,2) DEFAULT '0.00',
  `deduccion_salud` decimal(10,2) NOT NULL DEFAULT '0.00',
  `deduccion_pension` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prestamos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `otros_descuentos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `embargos` decimal(10,2) DEFAULT '0.00',
  `aporte_salud_empleado` decimal(10,2) DEFAULT '0.00',
  `aporte_pension_empleado` decimal(10,2) DEFAULT '0.00',
  `aporte_salud_empleador` decimal(10,2) DEFAULT '0.00',
  `aporte_pension_empleador` decimal(10,2) DEFAULT '0.00',
  `aporte_arl` decimal(10,2) DEFAULT '0.00',
  `aporte_caja_compensacion` decimal(10,2) DEFAULT '0.00',
  `aporte_icbf` decimal(10,2) DEFAULT '0.00',
  `aporte_sena` decimal(10,2) DEFAULT '0.00',
  `total_ingresos` decimal(10,2) DEFAULT '0.00',
  `total_deducciones` decimal(10,2) NOT NULL DEFAULT '0.00',
  `neto_pagar` decimal(10,2) DEFAULT '0.00',
  `provision_prima` decimal(10,2) DEFAULT '0.00',
  `provision_cesantias` decimal(10,2) DEFAULT '0.00',
  `provision_intereses_cesantias` decimal(10,2) DEFAULT '0.00',
  `provision_vacaciones` decimal(10,2) DEFAULT '0.00',
  `total_provisiones` decimal(10,2) DEFAULT '0.00',
  `metodo_pago` enum('Transferencia','Cheque','Efectivo') DEFAULT 'Transferencia',
  `observaciones` text,
  `estado` enum('Pendiente','Pagado','Anulado') NOT NULL DEFAULT 'Pendiente',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `payroll_id` (`payroll_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `payrolldetails_ibfk_1` FOREIGN KEY (`payroll_id`) REFERENCES `payrolls` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `payrolldetails_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payrolldetails_backup`
--

DROP TABLE IF EXISTS `payrolldetails_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payrolldetails_backup` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `periodo` varchar(255) NOT NULL,
  `tipo_pago` enum('Mensual','Quincenal','Semanal') NOT NULL DEFAULT 'Mensual',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payroll_id` (`payroll_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payrollloans`
--

DROP TABLE IF EXISTS `payrollloans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payrollloans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `cuotas_totales` int NOT NULL,
  `cuotas_pagadas` int DEFAULT '0',
  `valor_cuota` decimal(10,2) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin_estimada` datetime NOT NULL,
  `estado` enum('Activo','Pagado','Cancelado') DEFAULT 'Activo',
  `descripcion` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `payrollloans_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payrolls`
--

DROP TABLE IF EXISTS `payrolls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payrolls` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `salario_base` decimal(10,2) NOT NULL,
  `payment_date` datetime NOT NULL,
  `status` enum('Pendiente','Pagado','Anulado') DEFAULT 'Pendiente',
  `periodo` varchar(255) NOT NULL,
  `total_ingresos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_deducciones` decimal(10,2) NOT NULL DEFAULT '0.00',
  `neto_pagar` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `payrolls_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `permission_name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_name` (`permission_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` int DEFAULT NULL,
  `permission_id` int DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `role_id` (`role_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(30) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`),
  UNIQUE KEY `roles_role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sequelizemeta`
--

DROP TABLE IF EXISTS `sequelizemeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `status` enum('Activo','Inactivo','Suspendido') DEFAULT 'Activo',
  `role_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `roleId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `role` (`role`),
  KEY `fk_role_id` (`role_id`),
  KEY `users_roleId_foreign_idx` (`roleId`),
  CONSTRAINT `fk_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role`) REFERENCES `roles` (`role_name`),
  CONSTRAINT `users_roleId_foreign_idx` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-09 19:17:53


-- 
-- Dumping data for table `bank_info`
--

LOCK TABLES `bank_info` WRITE;
/*!40000 ALTER TABLE `bank_info` DISABLE KEYS */;
INSERT INTO `bank_info` VALUES (750,4411,'8304187549','Ahorros','Banco de Bogotá','2025-03-11 19:45:41','2025-03-11 19:45:41'),(751,4412,'9500988270','Corriente','Davivienda','2025-03-11 19:45:41','2025-03-11 19:45:41'),(752,4413,'8519697181','Ahorros','Banco de Bogotá','2025-03-11 19:45:41','2025-03-11 19:45:41'),(753,4414,'1690730887','Corriente','Banco de Bogotá','2025-03-11 19:45:41','2025-03-11 19:45:41'),(754,4415,'5512312603','Ahorros','Davivienda','2025-03-11 19:45:41','2025-03-11 19:45:41'),(755,4416,'2529162760','Corriente','Davivienda','2025-03-11 19:45:41','2025-03-11 19:45:41'),
(1098,12,'890123456','Corriente','BBVA','2025-03-12 13:45:48','2025-03-12 13:45:48'),(1099,13,'901234567','Ahorros','Banco de Bogotá','2025-03-12 13:45:48','2025-03-12 13:45:48');
/*!40000 ALTER TABLE `bank_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `bankinfos`
--

LOCK TABLES `bankinfos` WRITE;
/*!40000 ALTER TABLE `bankinfos` DISABLE KEYS */;
/*!40000 ALTER TABLE `bankinfos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,'Sergio Anaya Romero','Cédula','1015411162','sanayaromero62@gmail.com','3103904286','Carrera 11W #18-27 Casa 3A Rejas Grises Techo azul','Activo',2300000.00,'2025-02-24 19:00:00','Al día','2025-02-28 19:00:00','Masculino','Casado','','3103904286','','Carrera 11W #18-27 Casa 3A Rejas Grises Techo azul','','','101551111','Corriente','',0.00,0.00,'','Magisterio','',10000000.00,NULL,NULL,NULL,0.00,0,'');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `credit_histories`
--

LOCK TABLES `credit_histories` WRITE;
/*!40000 ALTER TABLE `credit_histories` DISABLE KEYS */;
INSERT INTO `credit_histories` VALUES (1,1,0,'2025-03-18 10:20:08','Historial crediticio no disponible','2025-03-18 10:20:08','2025-03-18 10:20:08'),(2,1,0,'2025-03-18 10:20:44','Historial crediticio no disponible','2025-03-18 10:20:44','2025-03-18 10:20:44'),(3,1,0,'2025-03-18 10:25:29','Historial crediticio no disponible','2025-03-18 10:25:29','2025-03-18 10:25:29');
/*!40000 ALTER TABLE `credit_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `credithistories`
--

LOCK TABLES `credithistories` WRITE;
/*!40000 ALTER TABLE `credithistories` DISABLE KEYS */;
/*!40000 ALTER TABLE `credithistories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (5,'Juan Pérez González','juan.perez@email.com','3001234567','Calle 123 #45-67','','Activo','1234567890',1,'Desarrollador Senior','TI',NULL,NULL,NULL,'Indefinido',2500000.00,3,'nueva ',NULL,NULL,NULL,NULL,NULL,NULL),(6,'María Rodríguez López','maria.rodriguez@email.com','3102345678','Carrera 12 #34-56','','Activo','2345678901',1,'Analista de Datos','TI',NULL,NULL,NULL,NULL,3000000.00,2,'Sanitas',NULL,NULL,'Cafam',NULL,NULL,NULL),
(40,'Carlos Gómez Herrera','carlos.@email.com','3203456789','Avenida Siempre Viva 742','Cliente','Suspendido','3456789012',3,'Gerente General','Gerencia','2025-03-19 19:00:00',NULL,NULL,'Indefinido',7000000.00,3,'Compensar','Protección','Protección','Colsubsidio',NULL,NULL,NULL);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `id_types`
--

LOCK TABLES `id_types` WRITE;
/*!40000 ALTER TABLE `id_types` DISABLE KEYS */;
INSERT INTO `id_types` VALUES (1,'Cédula de ciudadanía'),(2,'Cédula de extranjería'),(3,'Pasaporte');
/*!40000 ALTER TABLE `id_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `idtypes`
--

LOCK TABLES `idtypes` WRITE;
/*!40000 ALTER TABLE `idtypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `idtypes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `loans`
--

LOCK TABLES `loans` WRITE;
/*!40000 ALTER TABLE `loans` DISABLE KEYS */;
INSERT INTO `loans` VALUES (10,1,3000000.00,1.50,'Fijo',12,'Mensual','Personal',NULL,'Pagado','2025-03-18 16:17:25','2025-03-18 16:27:25','LN-1-4011f429',0.00,0.00,0,NULL,0.50),(12,1,500000.00,1.00,'Fijo',24,'Mensual','Prendaria',NULL,'Pagado','2025-03-19 09:58:04','2025-03-19 10:23:30','LN-1-4c975331',0.00,0.00,0,NULL,0.20),(13,1,1000000.00,1.20,'Variable',12,'Mensual','Personal',NULL,'Pagado','2025-03-19 10:49:04','2025-03-19 10:55:26','LN-1-701b57fc',0.00,0.00,0,NULL,0.20),(14,1,1000000.00,1.00,'Fijo',6,'Mensual','Personal',NULL,'Activo','2025-03-19 11:03:42','2025-04-09 16:50:01','LN-1-77b683bb',0.00,0.88,1,NULL,0.20);
/*!40000 ALTER TABLE `loans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `payment_histories`
--

LOCK TABLES `payment_histories` WRITE;
/*!40000 ALTER TABLE `payment_histories` DISABLE KEYS */;
INSERT INTO `payment_histories` VALUES (28,10,'2025-03-17 19:00:00',2500000.00,'Transferencia','','2025-03-18 16:19:53','2025-03-18 16:19:53'),(29,10,'2025-03-18 19:00:00',1502813.09,'Transferencia','','2025-03-18 16:27:25','2025-03-18 16:27:25'),
(36,14,'2025-04-09 19:00:00',12846.00,'Transferencia','','2025-04-09 16:50:01','2025-04-09 16:50:01');
/*!40000 ALTER TABLE `payment_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for all remaining tables
--

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-09 19:25:08
