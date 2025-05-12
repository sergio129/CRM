-- Tabla para registro de anulaciones de ingresos
CREATE TABLE IF NOT EXISTS `anulacion_ingresos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ingreso_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `fecha_anulacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `motivo_anulacion` VARCHAR(255) NOT NULL,
  `datos_ingreso_anulado` TEXT NOT NULL COMMENT 'JSON con los datos completos del ingreso antes de la anulación',
  `ip_usuario` VARCHAR(45) NULL,
  `navegador_usuario` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ingreso_id_UNIQUE` (`ingreso_id` ASC),
  INDEX `fk_anulacion_usuario_idx` (`usuario_id` ASC),
  CONSTRAINT `fk_anulacion_ingreso`
    FOREIGN KEY (`ingreso_id`)
    REFERENCES `ingresos` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_anulacion_usuario`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);
