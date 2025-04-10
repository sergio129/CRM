-- This file creates initial users with properly hashed passwords
-- It must run after the roles have been created

-- Continue with foreign key checks disabled
SET FOREIGN_KEY_CHECKS=0;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
-- Note: The password for all these users is 'admin123'
-- The bcrypt hash below is for 'admin123'
INSERT INTO `users` VALUES 
(1, 'Admin Sistema', 'admin@gescoop.com', 'admin', '$2b$10$qB1SE3RSuQGpGUQ1FJPEm.iczChTHw8WDjMsf2qmo71fXwL2kkxI2', 'Administrador', 'Activo', 1, NOW(), NOW(), 1, NOW(), NOW()),
(2, 'Sergio Anaya', 'sanayaromero62@gmail.com', 'sanayaromero62', '$2b$10$qB1SE3RSuQGpGUQ1FJPEm.iczChTHw8WDjMsf2qmo71fXwL2kkxI2', 'Administrador', 'Activo', 1, NOW(), NOW(), 1, NOW(), NOW()),
(3, 'Juan Pérez', 'juan@example.com', 'juanperez', '$2b$10$qB1SE3RSuQGpGUQ1FJPEm.iczChTHw8WDjMsf2qmo71fXwL2kkxI2', 'Asesor', 'Activo', 2, NOW(), NOW(), 2, NOW(), NOW()),
(4, 'Cliente Demo', 'cliente@example.com', 'cliente', '$2b$10$qB1SE3RSuQGpGUQ1FJPEm.iczChTHw8WDjMsf2qmo71fXwL2kkxI2', 'Cliente', 'Activo', 3, NOW(), NOW(), 3, NOW(), NOW());
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;