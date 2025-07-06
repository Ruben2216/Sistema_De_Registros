#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script integral para detectar TODOS los errores posibles en el sistema
Combina múltiples métodos de diagnóstico
"""

import os
import sys
import json
import requests
import tempfile
from pathlib import Path

def verificar_importaciones():
    """Verifica que todas las importaciones funcionen"""
    print("🔍 VERIFICANDO IMPORTACIONES...")
    
    try:
        # Importación principal
        from ejecutable import app
        print("✅ ejecutable.py - IMPORTA CORRECTAMENTE")
        
        # Verificar configuración básica
        print(f"✅ Flask app: {app}")
        print(f"✅ Template folder: {app.template_folder}")
        print(f"✅ Template folder existe: {os.path.exists(app.template_folder)}")
        
        # Verificar imports críticos
        try:
            from ejecutable import get_usuarios_activos
            usuarios = get_usuarios_activos()
            print(f"✅ get_usuarios_activos: {type(usuarios)}")
        except Exception as e:
            print(f"❌ Error en get_usuarios_activos: {e}")
        
        try:
            from kilometro_vida import obtener_servicio_drive
            print("✅ kilometro_vida - IMPORTA CORRECTAMENTE")
        except Exception as e:
            print(f"❌ Error en kilometro_vida: {e}")
            
        return True
        
    except Exception as e:
        print(f"❌ ERROR CRÍTICO en importaciones: {e}")
        import traceback
        traceback.print_exc()
        return False

def verificar_estructura_archivos():
    """Verifica estructura completa de archivos"""
    print("\n🔍 VERIFICANDO ESTRUCTURA DE ARCHIVOS...")
    
    archivos_criticos = {
        'Aplicación principal': [
            'ejecutable.py',
            'wsgi.py',
            '.env.production',
            'requirements.txt'
        ],
        'Templates': [
            'TEMPLATES/menu.html',
            'TEMPLATES/login.html', 
            'TEMPLATES/formato_RIJ.html',
            'TEMPLATES/camara.html'
        ],
        'JavaScript crítico': [
            'RESOURCE/JS/api_config.js',
            'RESOURCE/JS/autoguardado_camara.js',
            'RESOURCE/JS/autoguardado_RIJ.js',
            'RESOURCE/JS/index.js'
        ],
        'CSS crítico': [
            'RESOURCE/CSS/index.css',
            'RESOURCE/CSS/login.css',
            'RESOURCE/CSS/camara.css'
        ]
    }
    
    errores_encontrados = []
    
    for categoria, archivos in archivos_criticos.items():
        print(f"\n📂 {categoria}:")
        for archivo in archivos:
            if os.path.exists(archivo):
                # Verificar que no esté vacío
                try:
                    size = os.path.getsize(archivo)
                    if size > 0:
                        print(f"  ✅ {archivo} ({size} bytes)")
                    else:
                        print(f"  ⚠️ {archivo} (VACÍO)")
                        errores_encontrados.append(f"{archivo} está vacío")
                except:
                    print(f"  ❌ {archivo} (ERROR ACCESO)")
                    errores_encontrados.append(f"No se puede acceder a {archivo}")
            else:
                print(f"  ❌ {archivo} (FALTANTE)")
                errores_encontrados.append(f"{archivo} no existe")
    
    return len(errores_encontrados) == 0, errores_encontrados

def verificar_variables_entorno():
    """Verifica variables de entorno"""
    print("\n🔍 VERIFICANDO VARIABLES DE ENTORNO...")
    
    if not os.path.exists('.env.production'):
        print("❌ .env.production NO EXISTE")
        return False
    
    try:
        from dotenv import load_dotenv
        load_dotenv('.env.production')
        
        variables_requeridas = [
            'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 
            'FLASK_SECRET_KEY', 'MAIL_USERNAME', 'MAIL_PASSWORD'
        ]
        
        variables_faltantes = []
        for var in variables_requeridas:
            valor = os.getenv(var)
            if valor:
                print(f"✅ {var}: {'*' * min(len(valor), 8)}")  # Ocultar valores
            else:
                print(f"❌ {var}: NO CONFIGURADA")
                variables_faltantes.append(var)
        
        return len(variables_faltantes) == 0
        
    except Exception as e:
        print(f"❌ Error cargando variables: {e}")
        return False

def verificar_dependencias():
    """Verifica que las dependencias estén instaladas"""
    print("\n🔍 VERIFICANDO DEPENDENCIAS PYTHON...")
    
    dependencias_criticas = [
        'flask', 'mysql.connector', 'google.auth', 
        'googleapiclient.discovery', 'fitz', 'PIL'
    ]
    
    dependencias_faltantes = []
    
    for dep in dependencias_criticas:
        try:
            __import__(dep)
            print(f"✅ {dep}")
        except ImportError:
            print(f"❌ {dep} - NO INSTALADA")
            dependencias_faltantes.append(dep)
        except Exception as e:
            print(f"⚠️ {dep} - ERROR: {e}")
    
    return len(dependencias_faltantes) == 0

def probar_endpoints_basicos():
    """Prueba endpoints básicos si el servidor está corriendo"""
    print("\n🔍 PROBANDO ENDPOINTS BÁSICOS...")
    
    # Solo si estamos en PythonAnywhere
    try:
        # Intentar hacer petición a localhost (solo funciona si servidor está activo)
        import socket
        hostname = socket.gethostname()
        
        if 'pythonanywhere' in hostname.lower():
            print("🌐 Entorno PythonAnywhere detectado")
            # En PythonAnywhere no podemos hacer peticiones a localhost
            print("ℹ️ Pruebas de endpoint omitidas (usar navegador)")
        else:
            print("🖥️ Entorno local detectado")
            # Aquí podrías agregar pruebas locales
            
    except Exception as e:
        print(f"ℹ️ No se puede determinar entorno: {e}")

def verificar_permisos_archivos():
    """Verifica permisos de archivos críticos"""
    print("\n🔍 VERIFICANDO PERMISOS DE ARCHIVOS...")
    
    archivos_ejecutables = ['ejecutable.py', 'wsgi.py']
    
    for archivo in archivos_ejecutables:
        if os.path.exists(archivo):
            try:
                # Intentar leer el archivo
                with open(archivo, 'r', encoding='utf-8') as f:
                    content = f.read(100)  # Solo primeros 100 caracteres
                print(f"✅ {archivo} - LEGIBLE")
            except Exception as e:
                print(f"❌ {archivo} - ERROR LEYENDO: {e}")
        else:
            print(f"❌ {archivo} - NO EXISTE")

def generar_reporte_completo():
    """Genera reporte completo de todos los errores"""
    print("=" * 70)
    print("🚀 DIAGNÓSTICO INTEGRAL - TODOS LOS ERRORES")
    print("=" * 70)
    
    resultados = {}
    errores_totales = []
    
    # Ejecutar todas las verificaciones
    print("\n1️⃣ IMPORTACIONES:")
    resultados['importaciones'] = verificar_importaciones()
    
    print("\n2️⃣ ESTRUCTURA DE ARCHIVOS:")
    resultado_archivos, errores_archivos = verificar_estructura_archivos()
    resultados['archivos'] = resultado_archivos
    errores_totales.extend(errores_archivos)
    
    print("\n3️⃣ VARIABLES DE ENTORNO:")
    resultados['variables'] = verificar_variables_entorno()
    
    print("\n4️⃣ DEPENDENCIAS PYTHON:")
    resultados['dependencias'] = verificar_dependencias()
    
    print("\n5️⃣ ENDPOINTS:")
    probar_endpoints_basicos()
    
    print("\n6️⃣ PERMISOS:")
    verificar_permisos_archivos()
    
    # Resumen final
    print("\n" + "=" * 70)
    print("📊 RESUMEN FINAL:")
    print("=" * 70)
    
    total_verificaciones = len(resultados)
    verificaciones_exitosas = sum(resultados.values())
    
    for categoria, resultado in resultados.items():
        status = "✅ OK" if resultado else "❌ FALLO"
        print(f"{categoria.upper()}: {status}")
    
    print(f"\n🎯 TOTAL: {verificaciones_exitosas}/{total_verificaciones} verificaciones exitosas")
    
    if errores_totales:
        print(f"\n🚨 ERRORES ESPECÍFICOS ENCONTRADOS:")
        for i, error in enumerate(errores_totales, 1):
            print(f"  {i}. {error}")
    
    if verificaciones_exitosas == total_verificaciones and not errores_totales:
        print("\n🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!")
        print("✅ No se encontraron errores")
    else:
        print(f"\n⚠️ SE ENCONTRARON PROBLEMAS")
        print(f"❌ {total_verificaciones - verificaciones_exitosas} categorías con errores")
        print(f"❌ {len(errores_totales)} errores específicos")
    
    print("=" * 70)
    
    return verificaciones_exitosas == total_verificaciones and not errores_totales

if __name__ == "__main__":
    exito = generar_reporte_completo()
    
    print("\n💡 PARA VER MÁS ERRORES:")
    print("1. Error Log Web App: Dashboard → Web → Log files → Error log")
    print("2. Consola navegador: F12 → Console (en tu aplicación web)")
    print("3. Network tab: F12 → Network (peticiones HTTP)")
    print("4. Endpoint diagnóstico: https://tuusuario.pythonanywhere.com/debug/flask_config")
    
    sys.exit(0 if exito else 1)
