#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba para verificar que el fix de secure_filename funciona correctamente
"""

import os
import tempfile
import urllib.parse

def probar_fix_secure_filename():
    """
    Prueba que el fix de secure_filename funciona correctamente
    """
    print("=" * 60)
    print("PRUEBA DEL FIX DE secure_filename")
    print("=" * 60)
    
    # Simular la función es_nombre_archivo_seguro
    import re
    def es_nombre_archivo_seguro(nombre):
        patron_permitido = re.compile(r'^[a-zA-Z0-9\s\-_\.]+$')
        return patron_permitido.match(nombre) is not None
    
    # Casos de prueba
    casos_prueba = [
        "Evidencia_PDF_Prueba_20250706_081513.pdf",
        "Evidencia_Computo 20250706 075254 0904Ed48_20250706_075736.pdf",
        "Evidencia_Mantenimiento Impresora_20250706_123456.pdf",
        "Evidencia_Test_20250706_090000.pdf",
        "Evidencia_PDF con espacios y-guiones_20250706_100000.pdf",
        # Casos que deberían fallar (caracteres no seguros)
        "Evidencia_<script>_20250706_100000.pdf",
        "Evidencia_..\\..\\malicious_20250706_100000.pdf",
        "Evidencia_file|pipe_20250706_100000.pdf"
    ]
    
    print("\n1. PRUEBA DE VALIDACIÓN DE NOMBRES:")
    for nombre in casos_prueba:
        es_seguro = es_nombre_archivo_seguro(nombre)
        resultado = "✅ SEGURO" if es_seguro else "❌ NO SEGURO"
        print(f"{resultado} | {nombre}")
    
    print("\n2. PRUEBA DE DECODIFICACIÓN URL:")
    nombres_url = [
        "Evidencia_PDF_Prueba_20250706_081513.pdf",
        "Evidencia_Computo%2020250706%20075254%200904Ed48_20250706_075736.pdf",
        "Evidencia_Mantenimiento%20Impresora_20250706_123456.pdf"
    ]
    
    for nombre_url in nombres_url:
        nombre_decodificado = urllib.parse.unquote(nombre_url)
        print(f"URL:         {nombre_url}")
        print(f"Decodificado: {nombre_decodificado}")
        print(f"Es seguro:    {es_nombre_archivo_seguro(nombre_decodificado)}")
        print()
    
    print("3. VERIFICACIÓN CON ARCHIVOS REALES:")
    PDFS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
    
    if os.path.exists(PDFS_MANTENIMIENTO_DIR):
        archivos_evidencia = [f for f in os.listdir(PDFS_MANTENIMIENTO_DIR) if f.startswith('Evidencia_')]
        
        for archivo in archivos_evidencia:
            # Simular lo que haría el navegador (espacios -> %20)
            archivo_url = urllib.parse.quote(archivo)
            archivo_decodificado = urllib.parse.unquote(archivo_url)
            
            ruta_original = os.path.join(PDFS_MANTENIMIENTO_DIR, archivo)
            ruta_decodificada = os.path.join(PDFS_MANTENIMIENTO_DIR, archivo_decodificado)
            
            print(f"Archivo:      {archivo}")
            print(f"URL:          {archivo_url}")
            print(f"Decodificado: {archivo_decodificado}")
            print(f"Existe orig:  {os.path.exists(ruta_original)}")
            print(f"Existe decod: {os.path.exists(ruta_decodificada)}")
            print(f"Es seguro:    {es_nombre_archivo_seguro(archivo_decodificado)}")
            
            if archivo == archivo_decodificado:
                print("✅ COMPATIBLE: Los nombres coinciden")
            else:
                print("⚠ ATENCIÓN: Los nombres difieren")
            print("-" * 50)
    else:
        print("No se encontró directorio de PDFs")
    
    print("\n" + "=" * 60)
    print("PRUEBA COMPLETADA")
    print("=" * 60)

if __name__ == "__main__":
    probar_fix_secure_filename()
