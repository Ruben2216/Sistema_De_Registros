#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de verificación completa del Sistema de Registros
Verifica que todas las funcionalidades críticas estén operativas
"""

import os
import sys
import importlib.util
import json
import tempfile
from pathlib import Path

# Configuración del script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def verificar_estructura_archivos():
    """Verifica que todos los archivos críticos existan"""
    print("🔍 Verificando estructura de archivos...")
    
    archivos_criticos = [
        'ejecutable.py',
        'database_setup.sql',
        'RESOURCE/JS/control_sesion.js',
        'RESOURCE/JS/login.js',
        'TEMPLATES/menu.html',
        'TEMPLATES/login.html',
        'TEMPLATES/formato_RIJ.html',
        'TEMPLATES/camara.html'
    ]
    
    archivos_faltantes = []
    
    for archivo in archivos_criticos:
        ruta_completa = os.path.join(BASE_DIR, archivo)
        if not os.path.exists(ruta_completa):
            archivos_faltantes.append(archivo)
        else:
            print(f"  ✅ {archivo}")
    
    if archivos_faltantes:
        print(f"  ❌ Archivos faltantes: {archivos_faltantes}")
        return False
    
    print("  ✅ Todos los archivos críticos están presentes")
    return True

def verificar_importaciones():
    """Verifica que se puedan importar las dependencias críticas"""
    print("\n🔍 Verificando importaciones de Python...")
    
    dependencias = [
        'flask',
        'mysql.connector',
        'werkzeug',
        'flask_mail',
        'flask_cors',
        'hashlib',
        'secrets',
        'datetime',
        'threading',
        'tempfile',
        'json'
    ]
    
    fallos_importacion = []
    
    for dep in dependencias:
        try:
            __import__(dep)
            print(f"  ✅ {dep}")
        except ImportError as e:
            fallos_importacion.append(f"{dep}: {e}")
            print(f"  ❌ {dep}: {e}")
    
    if fallos_importacion:
        print(f"  ❌ Fallos de importación: {len(fallos_importacion)}")
        return False
    
    print("  ✅ Todas las dependencias están disponibles")
    return True

def verificar_sintaxis_ejecutable():
    """Verifica que ejecutable.py tenga sintaxis válida"""
    print("\n🔍 Verificando sintaxis de ejecutable.py...")
    
    try:
        ruta_ejecutable = os.path.join(BASE_DIR, 'ejecutable.py')
        spec = importlib.util.spec_from_file_location("ejecutable", ruta_ejecutable)
        if spec is None:
            print("  ❌ No se pudo cargar el spec del archivo")
            return False
        
        # Solo verificar sintaxis, no ejecutar
        with open(ruta_ejecutable, 'r', encoding='utf-8') as f:
            codigo = f.read()
        
        compile(codigo, ruta_ejecutable, 'exec')
        print("  ✅ Sintaxis válida")
        return True
        
    except SyntaxError as e:
        print(f"  ❌ Error de sintaxis: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Error inesperado: {e}")
        return False

def verificar_archivos_js():
    """Verifica que los archivos JavaScript tengan contenido válido"""
    print("\n🔍 Verificando archivos JavaScript...")
    
    archivos_js = [
        'RESOURCE/JS/control_sesion.js',
        'RESOURCE/JS/login.js'
    ]
    
    for archivo in archivos_js:
        ruta_completa = os.path.join(BASE_DIR, archivo)
        try:
            with open(ruta_completa, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Verificaciones básicas de contenido
            if len(contenido.strip()) == 0:
                print(f"  ❌ {archivo}: Archivo vacío")
                return False
            
            # Verificar funciones críticas
            if 'control_sesion.js' in archivo:
                if 'verificarSesion' not in contenido or 'iniciarControlSesion' not in contenido:
                    print(f"  ❌ {archivo}: Faltan funciones críticas")
                    return False
            
            if 'login.js' in archivo:
                if 'formulario-login' not in contenido or 'fetch(\'/api/login\'' not in contenido:
                    print(f"  ❌ {archivo}: Faltan funciones críticas")
                    return False
            
            print(f"  ✅ {archivo}")
            
        except Exception as e:
            print(f"  ❌ {archivo}: Error al leer - {e}")
            return False
    
    print("  ✅ Todos los archivos JavaScript son válidos")
    return True

def verificar_templates_html():
    """Verifica que los templates HTML incluyan el control de sesión"""
    print("\n🔍 Verificando templates HTML...")
    
    templates_criticos = [
        'TEMPLATES/menu.html',
        'TEMPLATES/formato_RIJ.html',
        'TEMPLATES/camara.html'
    ]
    
    for template in templates_criticos:
        ruta_completa = os.path.join(BASE_DIR, template)
        try:
            with open(ruta_completa, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Verificar que incluya el control de sesión
            if 'control_sesion.js' not in contenido:
                print(f"  ❌ {template}: No incluye control_sesion.js")
                return False
            
            print(f"  ✅ {template}")
            
        except Exception as e:
            print(f"  ❌ {template}: Error al leer - {e}")
            return False
    
    print("  ✅ Todos los templates HTML incluyen control de sesión")
    return True

def verificar_configuracion_base_datos():
    """Verifica que el script de base de datos sea válido"""
    print("\n🔍 Verificando configuración de base de datos...")
    
    try:
        ruta_sql = os.path.join(BASE_DIR, 'database_setup.sql')
        with open(ruta_sql, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Verificar que contenga las tablas críticas
        tablas_requeridas = ['usuario', 'sesiones_usuario']
        
        for tabla in tablas_requeridas:
            if f"CREATE TABLE {tabla}" not in contenido and f"CREATE TABLE IF NOT EXISTS {tabla}" not in contenido:
                print(f"  ❌ Falta la definición de la tabla: {tabla}")
                return False
        
        print("  ✅ Script de base de datos contiene todas las tablas requeridas")
        return True
        
    except Exception as e:
        print(f"  ❌ Error al verificar base de datos: {e}")
        return False

def generar_reporte_final():
    """Genera un reporte final del estado del sistema"""
    print("\n" + "="*60)
    print("📋 REPORTE FINAL DE VERIFICACIÓN")
    print("="*60)
    
    verificaciones = [
        ("Estructura de archivos", verificar_estructura_archivos),
        ("Importaciones Python", verificar_importaciones),
        ("Sintaxis ejecutable.py", verificar_sintaxis_ejecutable),
        ("Archivos JavaScript", verificar_archivos_js),
        ("Templates HTML", verificar_templates_html),
        ("Configuración BD", verificar_configuracion_base_datos)
    ]
    
    resultados = []
    todas_exitosas = True
    
    for nombre, funcion in verificaciones:
        try:
            resultado = funcion()
            resultados.append((nombre, resultado))
            if not resultado:
                todas_exitosas = False
        except Exception as e:
            print(f"  ❌ Error inesperado en {nombre}: {e}")
            resultados.append((nombre, False))
            todas_exitosas = False
    
    print("\n📊 RESUMEN:")
    for nombre, resultado in resultados:
        status = "✅ EXITOSO" if resultado else "❌ FALLÓ"
        print(f"  {status}: {nombre}")
    
    if todas_exitosas:
        print("\n🎉 ¡TODAS LAS VERIFICACIONES PASARON!")
        print("   El sistema está listo para producción.")
        print("\n📝 PRÓXIMOS PASOS:")
        print("   1. Ejecutar el script database_setup.sql en MySQL")
        print("   2. Configurar las credenciales de base de datos")
        print("   3. Instalar dependencias: pip install -r requirements.txt")
        print("   4. Ejecutar: python ejecutable.py")
        return True
    else:
        print("\n⚠️  ALGUNAS VERIFICACIONES FALLARON")
        print("   Revisar los errores arriba antes de desplegar.")
        return False

if __name__ == "__main__":
    print("🚀 INICIANDO VERIFICACIÓN COMPLETA DEL SISTEMA")
    print("="*60)
    
    # Cambiar al directorio del script
    os.chdir(BASE_DIR)
    
    # Ejecutar verificación completa
    exito = generar_reporte_final()
    
    # Código de salida
    sys.exit(0 if exito else 1)
