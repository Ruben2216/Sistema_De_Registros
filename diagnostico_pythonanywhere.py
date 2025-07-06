#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Herramienta de diagnóstico específica para PythonAnywhere
Verifica la configuración del sistema antes del despliegue
"""

import os
import sys
import json
import tempfile
from pathlib import Path

def verificar_estructura_archivos():
    """Verifica que todos los archivos necesarios existan"""
    print("🔍 Verificando estructura de archivos...")
    
    archivos_requeridos = [
        'ejecutable.py',
        'wsgi.py',
        'requirements.txt',
        '.env.production',
        'TEMPLATES/menu.html',
        'TEMPLATES/login.html',
        'TEMPLATES/formato_RIJ.html',
        'TEMPLATES/camara.html',
        'RESOURCE/CSS/index.css',
        'RESOURCE/CSS/login.css',
        'RESOURCE/JS/autoguardado_camara.js'
    ]
    
    archivos_faltantes = []
    for archivo in archivos_requeridos:
        if not os.path.exists(archivo):
            archivos_faltantes.append(archivo)
        else:
            print(f"✅ {archivo}")
    
    if archivos_faltantes:
        print(f"❌ Archivos faltantes: {archivos_faltantes}")
        return False
    else:
        print("✅ Todos los archivos requeridos están presentes")
        return True

def verificar_configuracion_flask():
    """Verifica la configuración de Flask"""
    print("\n🔍 Verificando configuración de Flask...")
    
    try:
        # Importar sin ejecutar
        sys.path.insert(0, '.')
        import ejecutable
        
        print("✅ ejecutable.py se importa correctamente")
        
        # Verificar que tiene la configuración correcta
        app = ejecutable.app
        print(f"✅ Flask app creada: {app}")
        print(f"✅ Template folder: {app.template_folder}")
        print(f"✅ Static folder: {app.static_folder}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error importando ejecutable.py: {e}")
        return False

def verificar_variables_entorno():
    """Verifica que las variables de entorno estén configuradas"""
    print("\n🔍 Verificando variables de entorno...")
    
    if not os.path.exists('.env.production'):
        print("❌ Archivo .env.production no encontrado")
        return False
    
    try:
        from dotenv import load_dotenv
        load_dotenv('.env.production')
        
        variables_requeridas = [
            'DB_HOST',
            'DB_USER', 
            'DB_PASSWORD',
            'DB_NAME',
            'FLASK_SECRET_KEY'
        ]
        
        variables_faltantes = []
        for var in variables_requeridas:
            if not os.getenv(var):
                variables_faltantes.append(var)
            else:
                print(f"✅ {var} configurada")
        
        if variables_faltantes:
            print(f"❌ Variables faltantes: {variables_faltantes}")
            return False
        else:
            print("✅ Todas las variables de entorno están configuradas")
            return True
            
    except Exception as e:
        print(f"❌ Error verificando variables de entorno: {e}")
        return False

def verificar_sistema_usuarios_activos():
    """Verifica el sistema de usuarios activos"""
    print("\n🔍 Verificando sistema de usuarios activos...")
    
    try:
        usuarios_activos_file = os.path.join(tempfile.gettempdir(), 'rij_usuarios_activos.json')
        
        # Intentar cargar la función de ejecutable
        from ejecutable import get_usuarios_activos
        
        usuarios = get_usuarios_activos()
        print(f"✅ Función get_usuarios_activos funciona: {type(usuarios)}")
        
        if isinstance(usuarios, dict):
            print("✅ Retorna diccionario válido")
            return True
        else:
            print(f"❌ No retorna diccionario: {type(usuarios)}")
            return False
            
    except Exception as e:
        print(f"❌ Error en sistema de usuarios activos: {e}")
        return False

def verificar_templates():
    """Verifica que Flask pueda encontrar los templates"""
    print("\n🔍 Verificando templates...")
    
    try:
        from ejecutable import app
        
        with app.app_context():
            # Verificar que se pueden renderizar
            from flask import render_template_string
            
            # Test básico
            template_test = render_template_string("{{ 'test' }}")
            print("✅ Sistema de templates básico funciona")
            
            # Verificar templates específicos
            templates_criticos = [
                'formato_RIJ.html',
                'login.html',
                'menu.html'
            ]
            
            for template in templates_criticos:
                try:
                    # Solo verificar que el archivo existe en el template folder
                    template_path = os.path.join(app.template_folder, template)
                    if os.path.exists(template_path):
                        print(f"✅ Template encontrado: {template}")
                    else:
                        print(f"❌ Template no encontrado: {template}")
                        return False
                except Exception as e:
                    print(f"❌ Error verificando template {template}: {e}")
                    return False
            
            return True
            
    except Exception as e:
        print(f"❌ Error verificando templates: {e}")
        return False

def generar_reporte():
    """Genera un reporte completo del estado del sistema"""
    print("=" * 60)
    print("🚀 DIAGNÓSTICO PYTHONANYWHERE - SISTEMA RIJ")
    print("=" * 60)
    
    resultados = {
        'archivos': verificar_estructura_archivos(),
        'flask': verificar_configuracion_flask(),
        'variables': verificar_variables_entorno(),
        'usuarios_activos': verificar_sistema_usuarios_activos(),
        'templates': verificar_templates()
    }
    
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE RESULTADOS:")
    print("=" * 60)
    
    total_tests = len(resultados)
    tests_passed = sum(resultados.values())
    
    for categoria, resultado in resultados.items():
        status = "✅ PASÓ" if resultado else "❌ FALLÓ"
        print(f"{categoria.upper()}: {status}")
    
    print(f"\n🎯 TOTAL: {tests_passed}/{total_tests} tests pasaron")
    
    if tests_passed == total_tests:
        print("\n🎉 ¡SISTEMA LISTO PARA DESPLIEGUE!")
        print("✅ Todos los componentes están configurados correctamente")
    else:
        print(f"\n🚨 SISTEMA NO LISTO")
        print(f"❌ {total_tests - tests_passed} componentes necesitan corrección")
    
    return tests_passed == total_tests

if __name__ == "__main__":
    exito = generar_reporte()
    sys.exit(0 if exito else 1)
