-- =====================================
-- SCRIPT DE BASE DE DATOS PARA PYTHONANYWHERE
-- =====================================

-- Este script crea las tablas necesarias para tu sistema en MySQL
-- Ejecuta estos comandos en la consola MySQL de PythonAnywhere

-- Usar la base de datos (ya viene creada como TU_USUARIO$default)
USE CFE$default;

-- Crear tabla de usuarios para autenticación simplificada
CREATE TABLE IF NOT EXISTS usuario (
  id INT NOT NULL AUTO_INCREMENT,
  password VARCHAR(50) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX password_UNIQUE (password ASC)
);

-- Insertar contraseñas de ejemplo para pruebas
-- NOTA: En producción, usar contraseñas más seguras
INSERT IGNORE INTO usuario (password) VALUES 
('Pass%word0dk040'),
('pass%word0'),
('cfe2025'),
('admin123'),
('mantenimiento'),
('evidencias'),
('registro');

-- Verificar que las contraseñas se insertaron correctamente
SELECT * FROM usuario;
