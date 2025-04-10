-- Initial configuration: disable foreign key checks to avoid constraint issues during setup
SET FOREIGN_KEY_CHECKS=0;

-- Make sure we have the basic roles created first
LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES 
(1,'Administrador',NOW(),NOW(),'Administrador del sistema con acceso completo',NOW(),NOW()),
(2,'Asesor',NOW(),NOW(),'Asesor con permisos limitados',NOW(),NOW()),
(3,'Cliente',NOW(),NOW(),'Usuario cliente',NOW(),NOW());
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

-- Create permissions
LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES 
(1,'Crear Usuarios','Permite crear nuevos usuarios'),
(2,'Editar Usuarios','Permite editar usuarios existentes'),
(3,'Eliminar Usuarios','Permite eliminar usuarios'),
(4,'Ver Roles','Permite ver la lista de roles'),
(5,'Asignar Roles','Permite asignar roles a usuarios'),
(6,'Gestionar Nómina','Permite gestionar la nómina'),
(7,'Gestionar Préstamos','Permite gestionar préstamos');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

-- Set up role permissions
LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES 
(1,1,NOW(),NOW()),
(1,2,NOW(),NOW()),
(1,3,NOW(),NOW()),
(1,4,NOW(),NOW()),
(1,5,NOW(),NOW()),
(1,6,NOW(),NOW()),
(1,7,NOW(),NOW()),
(2,4,NOW(),NOW()),
(2,7,NOW(),NOW());
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;