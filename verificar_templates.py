#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script específico para verificar la configuración de templates en PythonAnywhere
"""

import os
import sys

def verificar_templates():
    """Verifica la configuración de templates"""
    print("🔍 VERIFICANDO CONFIGURACIÓN DE TEMPLATES...")
    
    # Obtener directorio base
    base_dir = os.path.dirname(os.path.abspath(__file__))
    templates_folder = os.path.join(base_dir, 'TEMPLATES')
    
    print(f"📁 BASE_DIR: {base_dir}")
    print(f"📁 TEMPLATES_FOLDER: {templates_folder}")
    
    # Verificar que la carpeta TEMPLATES existe
    if os.path.exists(templates_folder):
        print("✅ Carpeta TEMPLATES existe")
        
        # Listar archivos en TEMPLATES
        try:
            archivos = os.listdir(templates_folder)
            print(f"📄 Archivos en TEMPLATES: {archivos}")
            
            # Verificar archivos críticos
            archivos_criticos = ['formato_RIJ.html', 'menu.html', 'login.html', 'camara.html']
            for archivo in archivos_criticos:
                if archivo in archivos:
                    print(f"✅ {archivo} - ENCONTRADO")
                else:
                    print(f"❌ {archivo} - FALTANTE")
                    
        except Exception as e:
            print(f"❌ Error listando archivos en TEMPLATES: {e}")
            
    else:
        print("❌ Carpeta TEMPLATES NO existe")
        return False
    
    # Probar configuración de Flask
    print("\n🔍 VERIFICANDO CONFIGURACIÓN DE FLASK...")
    try:
        # Importar configuración de Flask
        sys.path.insert(0, '.')
        from ejecutable import app, TEMPLATES_FOLDER
        
        print(f"📁 Flask template_folder configurado: {app.template_folder}")
        print(f"📁 Variable TEMPLATES_FOLDER: {TEMPLATES_FOLDER}")
        
        # Verificar si coinciden
        if app.template_folder == TEMPLATES_FOLDER:
            print("✅ Configuración de Flask coincide con variable")
        else:
            print("❌ PROBLEMA: Configuración de Flask NO coincide")
            
        # Verificar que Flask puede acceder a la carpeta
        if os.path.exists(app.template_folder):
            print("✅ Flask puede acceder a template_folder")
        else:
            print("❌ Flask NO puede acceder a template_folder")
            
        return True
        
    except Exception as e:
        print(f"❌ Error verificando configuración de Flask: {e}")
        return False

def verificar_permisos():
    """Verifica permisos de archivos"""
    print("\n🔍 VERIFICANDO PERMISOS...")
    
    archivos_verificar = [
        'ejecutable.py',
        'TEMPLATES/formato_RIJ.html',
        'TEMPLATES/menu.html'
    ]
    
    for archivo in archivos_verificar:
        if os.path.exists(archivo):
            # Verificar si es legible
            try:
                with open(archivo, 'r', encoding='utf-8') as f:
                    content = f.read(100)  # Leer solo primeros 100 caracteres
                print(f"✅ {archivo} - LEGIBLE")
            except Exception as e:
                print(f"❌ {archivo} - ERROR LEYENDO: {e}")
        else:
            print(f"❌ {archivo} - NO EXISTE")

def main():
    """Función principal"""
    print("=" * 60)
    print("🚀 DIAGNÓSTICO DE TEMPLATES - PYTHONANYWHERE")
    print("=" * 60)
    
    resultado_templates = verificar_templates()
    verificar_permisos()
    
    print("\n" + "=" * 60)
    if resultado_templates:
        print("✅ CONFIGURACIÓN DE TEMPLATES CORRECTA")
    else:
        print("❌ PROBLEMAS EN CONFIGURACIÓN DE TEMPLATES")
    print("=" * 60)

if __name__ == "__main__":
    main()
