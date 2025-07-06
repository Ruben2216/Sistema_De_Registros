#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para migrar URLs hardcodeadas en archivos JavaScript
Convierte URLs locales a URLs dinámicas para PythonAnywhere
"""

import os
import re
import glob

def migrar_urls_javascript():
    """Migra URLs hardcodeadas en archivos JavaScript"""
    print("🔧 Migrando URLs en archivos JavaScript...")
    
    # Patrones de URLs a migrar
    patrones_url = [
        # IPs locales con puerto
        (r'https?://192\.168\.\d+\.\d+:8000', ''),
        (r'https?://127\.0\.0\.1:8000', ''),
        (r'https?://localhost:8000', ''),
        (r'https?://10\.0\.\d+\.\d+:8000', ''),
        
        # URLs que deberían ser relativas
        (r'https?://[^/]+/api/rij/', '/api/rij/'),
        (r'https?://[^/]+/RESOURCE/', '/RESOURCE/'),
        (r'https?://[^/]+/TEMPLATES/', '/TEMPLATES/'),
        (r'https?://[^/]+/static/', '/static/'),
    ]
    
    # Buscar archivos JavaScript
    archivos_js = glob.glob('RESOURCE/JS/**/*.js', recursive=True)
    
    archivos_modificados = []
    
    for archivo_js in archivos_js:
        print(f"📄 Procesando: {archivo_js}")
        
        try:
            with open(archivo_js, 'r', encoding='utf-8') as f:
                contenido = f.read()
                
            contenido_original = contenido
            
            # Aplicar reemplazos
            for patron, reemplazo in patrones_url:
                contenido = re.sub(patron, reemplazo, contenido)
            
            # Si hubo cambios, guardar
            if contenido != contenido_original:
                with open(archivo_js, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                archivos_modificados.append(archivo_js)
                print(f"✅ Modificado: {archivo_js}")
            else:
                print(f"⏭️ Sin cambios: {archivo_js}")
                
        except Exception as e:
            print(f"❌ Error procesando {archivo_js}: {e}")
    
    print(f"\n📊 Resumen:")
    print(f"Total archivos procesados: {len(archivos_js)}")
    print(f"Archivos modificados: {len(archivos_modificados)}")
    
    if archivos_modificados:
        print(f"\n📝 Archivos modificados:")
        for archivo in archivos_modificados:
            print(f"  - {archivo}")
    
    return len(archivos_modificados) > 0

def verificar_urls_dinamicas():
    """Verifica que los archivos usen configuración dinámica"""
    print("\n🔍 Verificando uso de API_CONFIG...")
    
    archivos_js = glob.glob('RESOURCE/JS/**/*.js', recursive=True)
    archivos_con_api_config = []
    archivos_sin_api_config = []
    
    for archivo_js in archivos_js:
        try:
            with open(archivo_js, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            if 'API_CONFIG' in contenido or 'window.API_CONFIG' in contenido:
                archivos_con_api_config.append(archivo_js)
            elif '/api/rij/' in contenido or 'fetch(' in contenido:
                archivos_sin_api_config.append(archivo_js)
                
        except Exception as e:
            print(f"❌ Error verificando {archivo_js}: {e}")
    
    print(f"✅ Archivos que usan API_CONFIG: {len(archivos_con_api_config)}")
    print(f"⚠️ Archivos que podrían necesitar API_CONFIG: {len(archivos_sin_api_config)}")
    
    if archivos_sin_api_config:
        print("\n📝 Archivos que podrían necesitar revisión:")
        for archivo in archivos_sin_api_config[:5]:  # Solo mostrar primeros 5
            print(f"  - {archivo}")

def main():
    """Función principal"""
    print("=" * 60)
    print("🚀 MIGRACIÓN DE URLs PARA PYTHONANYWHERE")
    print("=" * 60)
    
    if not os.path.exists('RESOURCE/JS'):
        print("❌ Carpeta RESOURCE/JS no encontrada")
        return
    
    # Ejecutar migración
    cambios_realizados = migrar_urls_javascript()
    
    # Verificar configuración
    verificar_urls_dinamicas()
    
    print("\n" + "=" * 60)
    if cambios_realizados:
        print("✅ MIGRACIÓN COMPLETADA - ARCHIVOS MODIFICADOS")
    else:
        print("ℹ️ MIGRACIÓN COMPLETADA - NO HAY CAMBIOS NECESARIOS")
    print("=" * 60)

if __name__ == "__main__":
    main()
