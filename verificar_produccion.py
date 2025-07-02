#!/usr/bin/env python3
"""
Script de verificación para PythonAnywhere
Ejecuta este script para verificar que todo esté configurado correctamente
"""

import os
import sys
import mysql.connector
from dotenv import load_dotenv

def verificar_configuracion():
    """Verifica que toda la configuración esté correcta para producción"""
    
    print("🔍 VERIFICANDO CONFIGURACIÓN PARA PYTHONANYWHERE")
    print("=" * 50)
    
    # Verificar archivos necesarios
    archivos_necesarios = [
        'ejecutable.py',
        'wsgi.py',
        'requirements.txt',
        '.env.production',
        'TEMPLATES',
        'RESOURCE'
    ]
    
    print("\n📁 Verificando archivos necesarios:")
    for archivo in archivos_necesarios:
        if os.path.exists(archivo):
            print(f"✅ {archivo} - ENCONTRADO")
        else:
            print(f"❌ {archivo} - FALTANTE")
            return False
    
    # Cargar variables de entorno
    print("\n🔧 Verificando variables de entorno:")
    if os.path.exists('.env.production'):
        load_dotenv('.env.production')
        print("✅ Archivo .env.production cargado")
    else:
        print("❌ Archivo .env.production no encontrado")
        return False
    
    # Verificar variables críticas
    variables_criticas = [
        'DB_HOST',
        'DB_USER', 
        'DB_PASSWORD',
        'DB_NAME',
        'FLASK_SECRET_KEY'
    ]
    
    for var in variables_criticas:
        valor = os.getenv(var)
        if valor:
            print(f"✅ {var} - CONFIGURADA")
        else:
            print(f"❌ {var} - FALTANTE")
            return False
    
    # Verificar conexión a base de datos
    print("\n🗄️ Verificando conexión a base de datos:")
    try:
        db_config = {
            'host': os.getenv('DB_HOST'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
            'database': os.getenv('DB_NAME')
        }
        
        conn = mysql.connector.connect(**db_config)
        if conn.is_connected():
            print("✅ Conexión a MySQL - EXITOSA")
            
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES")
            tablas = cursor.fetchall()
            print(f"✅ Tablas encontradas: {len(tablas)}")
            
            cursor.close()
            conn.close()
        else:
            print("❌ Conexión a MySQL - FALLIDA")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False
    
    # Verificar importaciones
    print("\n📦 Verificando importaciones:")
    try:
        from ejecutable import app
        print("✅ Flask app - IMPORTADA")
        
        from kilometro_vida import bp_imgdia
        print("✅ Blueprints - IMPORTADOS")
        
        from flask_mail import Mail
        print("✅ Flask-Mail - IMPORTADO")
        
    except ImportError as e:
        print(f"❌ Error de importación: {e}")
        return False
    
    print("\n🎉 VERIFICACIÓN COMPLETADA CON ÉXITO")
    print("Tu aplicación está lista para PythonAnywhere!")
    return True

def verificar_estructura_proyecto():
    """Verifica que la estructura del proyecto sea correcta"""
    
    print("\n📂 Verificando estructura del proyecto:")
    
    estructura_esperada = {
        'TEMPLATES': ['menu.html', 'login.html', 'formato_RIJ.html', 'camara.html'],
        'RESOURCE': ['CSS', 'JS', 'IMG'],
        'RESOURCE/CSS': ['index.css', 'login.css', 'menu.css'],
        'RESOURCE/JS': ['autoguardado_camara.js'],
        'RESOURCE/IMG': []
    }
    
    for carpeta, archivos in estructura_esperada.items():
        if os.path.exists(carpeta):
            print(f"✅ {carpeta}/ - EXISTE")
            
            for archivo in archivos:
                ruta_archivo = os.path.join(carpeta, archivo)
                if os.path.exists(ruta_archivo):
                    print(f"  ✅ {archivo}")
                else:
                    print(f"  ⚠️  {archivo} - NO ENCONTRADO")
        else:
            print(f"❌ {carpeta}/ - NO EXISTE")

if __name__ == "__main__":
    print("🚀 SISTEMA DE VERIFICACIÓN PARA PYTHONANYWHERE")
    print("Este script verifica que tu aplicación esté lista para producción")
    print()
    
    # Verificar configuración principal
    config_ok = verificar_configuracion()
    
    # Verificar estructura del proyecto
    verificar_estructura_proyecto()
    
    if config_ok:
        print("\n✅ TU APLICACIÓN ESTÁ LISTA PARA PYTHONANYWHERE")
        print("Sigue la guía en GUIA_DESPLIEGUE_PYTHONANYWHERE.md")
    else:
        print("\n❌ CORRIGE LOS ERRORES ANTES DE DESPLEGAR")
        
    print("\n📚 Archivos creados para el despliegue:")
    print("- wsgi.py (archivo principal para PythonAnywhere)")
    print("- .env.production (configuración de producción)")
    print("- database_setup.sql (estructura de base de datos)")
    print("- GUIA_DESPLIEGUE_PYTHONANYWHERE.md (guía completa)")
    print("- verificar_produccion.py (este archivo)")
    
    print("\n🌐 URL final: https://tuusuario.pythonanywhere.com")
