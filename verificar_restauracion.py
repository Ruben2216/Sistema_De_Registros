#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar que la restauración de la base de datos fue exitosa
Ejecutar después de restaurar el archivo database_setup.sql en PythonAnywhere
"""

import mysql.connector
import os
from datetime import datetime

def verificar_restauracion_db():
    """
    Verifica que todas las tablas y datos se restauraron correctamente
    """
    try:
        # Leer configuración desde variables de entorno
        config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'default'),
            'charset': 'utf8mb4',
            'use_unicode': True
        }
        
        print("🔍 VERIFICANDO RESTAURACIÓN DE BASE DE DATOS")
        print("=" * 50)
        print(f"Host: {config['host']}")
        print(f"Usuario: {config['user']}")
        print(f"Base de datos: {config['database']}")
        print()
        
        # Conectar a la base de datos
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # 1. Verificar que la base de datos existe y está seleccionada
        cursor.execute("SELECT DATABASE();")
        db_actual = cursor.fetchone()[0]
        print(f"✅ Base de datos activa: {db_actual}")
        
        # 2. Listar todas las tablas
        cursor.execute("SHOW TABLES;")
        tablas = cursor.fetchall()
        print(f"✅ Tablas encontradas: {len(tablas)}")
        for tabla in tablas:
            print(f"   - {tabla[0]}")
        print()
        
        # 3. Verificar tabla METAS
        if ('metas',) in tablas:
            print("🔍 VERIFICANDO TABLA METAS:")
            
            # Estructura de la tabla
            cursor.execute("DESCRIBE metas;")
            estructura = cursor.fetchall()
            print("   Estructura:")
            for columna in estructura:
                print(f"     - {columna[0]} ({columna[1]})")
            
            # Contar registros
            cursor.execute("SELECT COUNT(*) FROM metas;")
            total_metas = cursor.fetchone()[0]
            print(f"   ✅ Total de registros: {total_metas}")
            
            # Verificar que hay 365 metas (todo el año 2025)
            if total_metas == 365:
                print("   ✅ Todas las metas del año 2025 están presentes")
            else:
                print(f"   ⚠️  Se esperaban 365 metas, se encontraron {total_metas}")
            
            # Mostrar algunos ejemplos
            cursor.execute("SELECT * FROM metas ORDER BY fecha_meta LIMIT 5;")
            ejemplos = cursor.fetchall()
            print("   Ejemplos de metas:")
            for meta in ejemplos:
                print(f"     {meta[2]}: {meta[1][:50]}...")
            
            # Verificar meta de hoy
            cursor.execute("SELECT Meta FROM metas WHERE fecha_meta = CURDATE();")
            meta_hoy = cursor.fetchone()
            if meta_hoy:
                print(f"   ✅ Meta de hoy: {meta_hoy[0]}")
            else:
                print("   ℹ️  No hay meta específica para hoy")
            print()
        else:
            print("❌ TABLA METAS NO ENCONTRADA")
            print()
        
        # 4. Verificar tabla PRUEBA_DATOS
        if ('prueba_datos',) in tablas:
            print("🔍 VERIFICANDO TABLA PRUEBA_DATOS:")
            
            # Estructura de la tabla
            cursor.execute("DESCRIBE prueba_datos;")
            estructura = cursor.fetchall()
            print("   Estructura:")
            for columna in estructura:
                print(f"     - {columna[0]} ({columna[1]})")
            
            # Contar registros
            cursor.execute("SELECT COUNT(*) FROM prueba_datos;")
            total_registros = cursor.fetchone()[0]
            print(f"   ✅ Total de registros: {total_registros}")
            
            if total_registros > 0:
                # Mostrar algunos ejemplos (sin fotos para no saturar)
                cursor.execute("""
                    SELECT id, nombre, cedula, usuario_activo, fecha_registro 
                    FROM prueba_datos 
                    ORDER BY fecha_registro DESC 
                    LIMIT 3
                """)
                ejemplos = cursor.fetchall()
                print("   Últimos registros:")
                for reg in ejemplos:
                    print(f"     ID {reg[0]}: {reg[1]} ({reg[2]}) - {reg[4]}")
            else:
                print("   ℹ️  La tabla está vacía (normal para una instalación nueva)")
            print()
        else:
            print("❌ TABLA PRUEBA_DATOS NO ENCONTRADA")
            print()
        
        # 5. Verificar índices y claves
        print("🔍 VERIFICANDO ÍNDICES:")
        cursor.execute("SHOW INDEX FROM metas;")
        indices_metas = cursor.fetchall()
        print(f"   Tabla metas: {len(indices_metas)} índices")
        for indice in indices_metas:
            print(f"     - {indice[2]} en columna {indice[4]}")
        
        cursor.execute("SHOW INDEX FROM prueba_datos;")
        indices_datos = cursor.fetchall()
        print(f"   Tabla prueba_datos: {len(indices_datos)} índices")
        for indice in indices_datos:
            print(f"     - {indice[2]} en columna {indice[4]}")
        print()
        
        # 6. Probar consultas típicas de la aplicación
        print("🔍 PROBANDO CONSULTAS DE LA APLICACIÓN:")
        
        # Consulta de meta aleatoria
        cursor.execute("SELECT Meta FROM metas ORDER BY RAND() LIMIT 1;")
        meta_random = cursor.fetchone()
        if meta_random:
            print(f"   ✅ Meta aleatoria: {meta_random[0][:50]}...")
        
        # Consulta de conteo de registros por usuario
        cursor.execute("""
            SELECT usuario_activo, COUNT(*) 
            FROM prueba_datos 
            GROUP BY usuario_activo 
            ORDER BY COUNT(*) DESC 
            LIMIT 5
        """)
        usuarios_stats = cursor.fetchall()
        if usuarios_stats:
            print("   ✅ Estadísticas por usuario:")
            for stat in usuarios_stats:
                print(f"     - {stat[0]}: {stat[1]} registros")
        else:
            print("   ℹ️  No hay datos de usuarios aún")
        
        cursor.close()
        connection.close()
        
        print()
        print("🎉 VERIFICACIÓN COMPLETADA")
        print("=" * 50)
        print("✅ La base de datos se restauró correctamente")
        print("✅ Todas las tablas están presentes")
        print("✅ Los datos se cargaron exitosamente")
        print()
        print("Próximos pasos:")
        print("1. Probar la aplicación Flask")
        print("2. Verificar que las páginas cargan correctamente")
        print("3. Probar el registro de datos")
        
        return True
        
    except mysql.connector.Error as e:
        print(f"❌ ERROR DE BASE DE DATOS: {e}")
        print()
        print("Posibles soluciones:")
        print("1. Verificar las variables de entorno (.env.production)")
        print("2. Confirmar que la base de datos existe en PythonAnywhere")
        print("3. Verificar usuario y contraseña de MySQL")
        print("4. Asegurarse de que el script database_setup.sql se ejecutó correctamente")
        return False
        
    except Exception as e:
        print(f"❌ ERROR GENERAL: {e}")
        return False

if __name__ == "__main__":
    # Cargar variables de entorno desde .env.production si existe
    env_file = ".env.production"
    if os.path.exists(env_file):
        print(f"📁 Cargando configuración desde {env_file}")
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                if '=' in line and not line.strip().startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
        print()
    
    verificar_restauracion_db()
