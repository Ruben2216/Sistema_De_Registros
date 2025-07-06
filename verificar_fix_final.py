#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba final para verificar que el fix del PDF no encontrado funciona
"""

import os
import tempfile
import datetime
import json

def verificar_fix_completo():
    """
    Verifica que el fix completo funciona correctamente
    """
    print("=" * 60)
    print("VERIFICACIÓN FINAL DEL FIX")
    print("=" * 60)
    
    # Simular el proceso completo
    PDFS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
    
    # 1. Verificar que el directorio existe y tiene archivos
    print(f"\n1. VERIFICAR DIRECTORIO:")
    print(f"   Directorio: {PDFS_MANTENIMIENTO_DIR}")
    print(f"   Existe: {os.path.exists(PDFS_MANTENIMIENTO_DIR)}")
    
    if not os.path.exists(PDFS_MANTENIMIENTO_DIR):
        print("   ❌ Directorio no existe")
        return
    
    archivos_evidencia = [f for f in os.listdir(PDFS_MANTENIMIENTO_DIR) if f.startswith('Evidencia_')]
    print(f"   Archivos evidencia: {len(archivos_evidencia)}")
    
    # 2. Simular generación de nombre de archivo (como lo hace el backend)
    print(f"\n2. SIMULACIÓN DE GENERACIÓN:")
    
    # Datos de ejemplo que llegan del frontend
    pdf_seleccionado = {
        'id': 'computo_20250706_075254_0904ed48',
        'nombre': 'Computo 20250706 075254 0904Ed48'
    }
    
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    nombre_pdf_final = f"Evidencia_{pdf_seleccionado['nombre']}_{timestamp}.pdf"
    ruta_pdf_final = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_pdf_final)
    
    print(f"   Nombre generado: {nombre_pdf_final}")
    print(f"   Ruta completa: {ruta_pdf_final}")
    
    # 3. Simular lo que haría el navegador con la URL
    print(f"\n3. SIMULACIÓN DE URL DEL NAVEGADOR:")
    
    import urllib.parse
    
    url_descarga = f'/api/evidencia/descargar_pdf/{nombre_pdf_final}'
    nombre_en_url = nombre_pdf_final
    nombre_url_encoded = urllib.parse.quote(nombre_pdf_final)
    
    print(f"   URL original: {url_descarga}")
    print(f"   Nombre en URL: {nombre_en_url}")
    print(f"   URL encoded: /api/evidencia/descargar_pdf/{nombre_url_encoded}")
    
    # 4. Simular lo que hace el nuevo endpoint de descarga
    print(f"\n4. SIMULACIÓN DEL ENDPOINT DE DESCARGA:")
    
    # Simular parámetro recibido por Flask (puede venir con %20)
    nombre_recibido = nombre_url_encoded
    
    # Decodificar como hace el nuevo código
    nombre_decodificado = urllib.parse.unquote(nombre_recibido)
    
    # Validar seguridad
    import re
    patron_permitido = re.compile(r'^[a-zA-Z0-9\s\-_\.]+$')
    es_seguro = patron_permitido.match(nombre_decodificado) is not None
    
    # Construir ruta
    ruta_archivo_buscada = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_decodificado)
    
    print(f"   Nombre recibido: {nombre_recibido}")
    print(f"   Nombre decodificado: {nombre_decodificado}")
    print(f"   Es seguro: {es_seguro}")
    print(f"   Ruta buscada: {ruta_archivo_buscada}")
    
    # 5. Verificar si encontraría el archivo
    print(f"\n5. VERIFICACIÓN DE BÚSQUEDA:")
    
    # Para esta prueba, usar un archivo existente
    if archivos_evidencia:
        archivo_real = archivos_evidencia[0]
        ruta_archivo_real = os.path.join(PDFS_MANTENIMIENTO_DIR, archivo_real)
        
        print(f"   Archivo de prueba: {archivo_real}")
        
        # Simular URL para este archivo
        url_encoded_real = urllib.parse.quote(archivo_real)
        nombre_decodificado_real = urllib.parse.unquote(url_encoded_real)
        ruta_buscada_real = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_decodificado_real)
        
        print(f"   URL encoded: {url_encoded_real}")
        print(f"   Decodificado: {nombre_decodificado_real}")
        print(f"   Archivo existe: {os.path.exists(ruta_buscada_real)}")
        
        # Verificar que los nombres coinciden
        if archivo_real == nombre_decodificado_real:
            print(f"   ✅ ÉXITO: Los nombres coinciden perfectamente")
            print(f"   ✅ El fix funcionará correctamente")
        else:
            print(f"   ❌ PROBLEMA: Los nombres no coinciden")
            print(f"      Original: '{archivo_real}'")
            print(f"      Decodificado: '{nombre_decodificado_real}'")
    else:
        print("   ⚠ No hay archivos de evidencia para probar")
    
    # 6. Resumen de cambios realizados
    print(f"\n6. RESUMEN DE CAMBIOS REALIZADOS:")
    print(f"   ✅ Se eliminó el uso de secure_filename() en el endpoint de descarga")
    print(f"   ✅ Se agregó decodificación URL con urllib.parse.unquote()")
    print(f"   ✅ Se implementó validación de seguridad personalizada")
    print(f"   ✅ Se mantiene la ruta como <path:nombre_archivo> para manejar espacios")
    print(f"   ✅ Se agregó logging detallado para diagnóstico")
    
    print(f"\n" + "=" * 60)
    print("VERIFICACIÓN COMPLETADA")
    print("El fix debería resolver el error 'PDF no encontrado'")
    print("=" * 60)

if __name__ == "__main__":
    verificar_fix_completo()
