-- =====================================
-- SCRIPT DE BASE DE DATOS PARA PYTHONANYWHERE
-- =====================================

-- Ejecuta estos comandos en la consola MySQL de PythonAnywhere

-- Usar la base de datos
USE CFE$default;

-- Crear tabla de usuarios para autenticación simplificada
CREATE TABLE IF NOT EXISTS usuario (
  id INT NOT NULL AUTO_INCREMENT,
  password VARCHAR(50) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX password_UNIQUE (password ASC)
);

CREATE TABLE IF NOT EXISTS sesiones_usuario (
  id INT NOT NULL AUTO_INCREMENT,
  session_token VARCHAR(255) NOT NULL,
  usuario_id INT,
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion TIMESTAMP,
  ip_cliente VARCHAR(45),
  user_agent TEXT,
  activa BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE INDEX token_UNIQUE (session_token ASC),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

-- NOTA: En producción, usar contraseñas más seguras
INSERT IGNORE INTO usuario (password) VALUES 
('Pass%word0dk040'),
('pass%word0'),
('cfe2025'),
('admin123'),
('mantenimiento'),
('evidencias'),
('registro');


