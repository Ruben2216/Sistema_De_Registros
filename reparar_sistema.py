#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de reparación automática para el sistema RIJ en PythonAnywhere
Corrige errores comunes de despliegue
"""

import os
import json
import tempfile
import datetime

def reparar_archivo_usuarios_activos():
    """
    Repara o recrea el archivo de usuarios activos
    """
    archivo_usuarios = os.path.join(tempfile.gettempdir(), 'rij_usuarios_activos.json')
    
    print(f"🔍 Verificando archivo de usuarios activos...")
    print(f"📁 Ruta: {archivo_usuarios}")
    
    try:
        if os.path.exists(archivo_usuarios):
            print(f"✅ Archivo existe")
            
            # Verificar contenido
            with open(archivo_usuarios, 'r', encoding='utf-8') as f:
                content = f.read().strip()
            
            if not content:
                print(f"⚠️ Archivo está vacío")
                content = '{}'
            
            # Intentar cargar JSON
            try:
                data = json.loads(content)
                if not isinstance(data, dict):
                    print(f"❌ Contenido no es un diccionario válido: {type(data)}")
                    data = {}
                else:
                    print(f"✅ Contenido JSON válido con {len(data)} usuarios")
            except json.JSONDecodeError as e:
                print(f"❌ JSON corrupto: {e}")
                data = {}
            
            # Reescribir archivo limpio
            with open(archivo_usuarios, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f"✅ Archivo reparado correctamente")
            
        else:
            print(f"⚠️ Archivo no existe, creando archivo limpio...")
            with open(archivo_usuarios, 'w', encoding='utf-8') as f:
                json.dump({}, f, indent=2)
            print(f"✅ Archivo creado correctamente")
    
    except Exception as e:
        print(f"❌ Error al reparar archivo: {e}")
        # Crear archivo de emergencia
        try:
            with open(archivo_usuarios, 'w', encoding='utf-8') as f:
                json.dump({}, f)
            print(f"✅ Archivo de emergencia creado")
        except Exception as e2:
            print(f"❌ Error crítico: {e2}")

def verificar_estructura_directorios():
    """
    Verifica que existan las carpetas necesarias
    """
    print(f"\n🔍 Verificando estructura de directorios...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    directorios_necesarios = [
        'TEMPLATES',
        'RESOURCE',
        'RESOURCE/CSS',
        'RESOURCE/JS', 
        'RESOURCE/IMG',
        'RESOURCE/IMG/Evidencias',
        'RESOURCE/IMG/img RIJ',
        'static/imagenes'
    ]
    
    for directorio in directorios_necesarios:
        ruta_completa = os.path.join(base_dir, directorio)
        if os.path.exists(ruta_completa):
            print(f"✅ {directorio}")
        else:
            print(f"❌ {directorio} - No existe")
            try:
                os.makedirs(ruta_completa, exist_ok=True)
                print(f"  ✅ Creado: {directorio}")
            except Exception as e:
                print(f"  ❌ Error al crear {directorio}: {e}")

def verificar_archivos_criticos():
    """
    Verifica que existan los archivos críticos
    """
    print(f"\n🔍 Verificando archivos críticos...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    archivos_criticos = [
        'ejecutable.py',
        'wsgi.py',
        'requirements.txt',
        '.env.production',
        'TEMPLATES/formato_RIJ.html',
        'TEMPLATES/menu.html',
        'TEMPLATES/login.html',
        'TEMPLATES/camara.html'
    ]
    
    for archivo in archivos_criticos:
        ruta_completa = os.path.join(base_dir, archivo)
        if os.path.exists(ruta_completa):
            print(f"✅ {archivo}")
        else:
            print(f"❌ {archivo} - No existe")

def limpiar_archivos_temporales():
    """
    Limpia archivos temporales corruptos
    """
    print(f"\n🧹 Limpiando archivos temporales...")
    
    temp_dir = tempfile.gettempdir()
    archivos_a_limpiar = [
        'rij_usuarios_activos.json',
        'rij_fotos'  # Directorio
    ]
    
    for item in archivos_a_limpiar:
        ruta_temp = os.path.join(temp_dir, item)
        try:
            if os.path.isfile(ruta_temp):
                os.remove(ruta_temp)
                print(f"✅ Eliminado archivo: {item}")
            elif os.path.isdir(ruta_temp):
                import shutil
                shutil.rmtree(ruta_temp)
                print(f"✅ Eliminado directorio: {item}")
        except Exception as e:
            print(f"❌ Error al eliminar {item}: {e}")

def probar_importaciones():
    """
    Prueba las importaciones críticas del sistema
    """
    print(f"\n🔍 Probando importaciones críticas...")
    
    imports_criticos = [
        ('flask', 'Flask'),
        ('mysql.connector', 'MySQL Connector'),
        ('google.oauth2.service_account', 'Google OAuth'),
        ('googleapiclient.discovery', 'Google API Client'),
        ('fitz', 'PyMuPDF'), 
        ('PIL', 'Pillow'),
        ('flask_mail', 'Flask-Mail')
    ]
    
    for modulo, nombre in imports_criticos:
        try:
            __import__(modulo)
            print(f"✅ {nombre}")
        except ImportError as e:
            print(f"❌ {nombre} - Error: {e}")

def main():
    """
    Función principal del script de reparación
    """
    print("🚀 === SISTEMA DE REPARACIÓN AUTOMÁTICA RIJ ===")
    print(f"📅 Fecha: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # 1. Reparar archivo de usuarios activos
    reparar_archivo_usuarios_activos()
    
    # 2. Verificar estructura de directorios
    verificar_estructura_directorios()
    
    # 3. Verificar archivos críticos
    verificar_archivos_criticos()
    
    # 4. Limpiar archivos temporales
    limpiar_archivos_temporales()
    
    # 5. Probar importaciones
    probar_importaciones()
    
    print("\n" + "=" * 50)
    print("✅ REPARACIÓN COMPLETADA")
    print("🔄 Haz reload de tu Web App en PythonAnywhere")
    print("🌐 Prueba tu aplicación: https://TU_USUARIO.pythonanywhere.com")

if __name__ == "__main__":
    main()
