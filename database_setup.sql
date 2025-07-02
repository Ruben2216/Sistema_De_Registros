-- =====================================
-- SCRIPT DE BASE DE DATOS PARA PYTHONANYWHERE
-- =====================================

-- Este script crea las tablas necesarias para tu sistema en MySQL
-- Ejecuta estos comandos en la consola MySQL de PythonAnywhere

-- Usar la base de datos (ya viene creada como TU_USUARIO$default)
USE CFE$default;

-- =====================================
-- TABLA DE USUARIOS (si no existe)
-- =====================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- =====================================
-- TABLA DE EQUIPOS (ejemplo basado en tu sistema)
-- =====================================
CREATE TABLE IF NOT EXISTS equipos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_serie VARCHAR(100) NOT NULL UNIQUE,
    modelo VARCHAR(100),
    marca VARCHAR(100),
    ubicacion VARCHAR(200),
    estado VARCHAR(50) DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================
-- TABLA DE REGISTROS RIJ
-- =====================================
CREATE TABLE IF NOT EXISTS registros_rij (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_rij VARCHAR(50) NOT NULL,
    equipo_id INT,
    usuario_id INT,
    fecha_inspeccion DATE,
    observaciones TEXT,
    estado_equipo VARCHAR(100),
    fotos_rutas JSON,  -- Para almacenar rutas de fotos en formato JSON
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =====================================
-- TABLA DE ACTIVIDAD DE USUARIOS
-- =====================================
CREATE TABLE IF NOT EXISTS actividad_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- TABLA DE CORREOS ENVIADOS (para tracking)
-- =====================================
CREATE TABLE IF NOT EXISTS correos_enviados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destinatario VARCHAR(200),
    asunto VARCHAR(300),
    cuerpo TEXT,
    estado VARCHAR(50) DEFAULT 'ENVIADO',
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registro_rij_id INT,
    FOREIGN KEY (registro_rij_id) REFERENCES registros_rij(id)
);

-- =====================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================

-- Insertar usuario administrador por defecto
INSERT IGNORE INTO usuarios (username, password, email) VALUES 
('admin', 'admin123', 'admin@sistema.com'),
('operador', 'operador123', 'operador@sistema.com');

-- Insertar algunos equipos de ejemplo
INSERT IGNORE INTO equipos (numero_serie, modelo, marca, ubicacion) VALUES 
('CFE001', 'Transformador 500KV', 'ABB', 'Subestación Norte'),
('CFE002', 'Generador 300MW', 'Siemens', 'Central Térmica'),
('CFE003', 'Disyuntor SF6', 'GE', 'Subestación Sur');

-- =====================================
-- ÍNDICES PARA OPTIMIZAR PERFORMANCE
-- =====================================
CREATE INDEX idx_equipos_serie ON equipos(numero_serie);
CREATE INDEX idx_registros_fecha ON registros_rij(fecha_inspeccion);
CREATE INDEX idx_actividad_session ON actividad_usuarios(session_id);
CREATE INDEX idx_correos_fecha ON correos_enviados(fecha_envio);

-- =====================================
-- VERIFICAR TABLAS CREADAS
-- =====================================
SHOW TABLES;

-- Mostrar estructura de tablas principales
DESCRIBE usuarios;
DESCRIBE equipos;
DESCRIBE registros_rij;
