#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para analizar el comportamiento de secure_filename con nombres de PDFs de evidencia
"""

import os
import tempfile
from werkzeug.utils import secure_filename

def analizar_secure_filename():
    """
    Analiza cómo secure_filename afecta los nombres de los PDFs de evidencia
    """
    print("=" * 70)
    print("ANÁLISIS DEL COMPORTAMIENTO DE secure_filename()")
    print("=" * 70)
    
    # Obtener directorio de PDFs
    PDFS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
    
    print(f"\nDirectorio de PDFs: {PDFS_MANTENIMIENTO_DIR}")
    
    if not os.path.exists(PDFS_MANTENIMIENTO_DIR):
        print("⚠ Directorio no existe")
        return
    
    # Obtener archivos con evidencia
    archivos_evidencia = []
    for archivo in os.listdir(PDFS_MANTENIMIENTO_DIR):
        if archivo.startswith('Evidencia_'):
            archivos_evidencia.append(archivo)
    
    print(f"\nArchivos de evidencia encontrados: {len(archivos_evidencia)}")
    
    for archivo in archivos_evidencia:
        print(f"\n--- Analizando: {archivo} ---")
        
        # Aplicar secure_filename
        nombre_seguro = secure_filename(archivo)
        
        print(f"Original:     {archivo}")
        print(f"Secure:       {nombre_seguro}")
        print(f"¿Cambió?:     {archivo != nombre_seguro}")
        
        # Verificar si el archivo existe con el nombre original
        ruta_original = os.path.join(PDFS_MANTENIMIENTO_DIR, archivo)
        ruta_segura = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_seguro)
        
        print(f"Existe original: {os.path.exists(ruta_original)}")
        print(f"Existe seguro:   {os.path.exists(ruta_segura)}")
        
        if archivo != nombre_seguro:
            print(f"❌ PROBLEMA DETECTADO: secure_filename() está cambiando el nombre")
            print(f"   Esto causará error 'PDF no encontrado'")
            
            # Analizar qué caracteres están causando el problema
            caracteres_problemáticos = []
            for i, (char_orig, char_seg) in enumerate(zip(archivo, nombre_seguro)):
                if char_orig != char_seg:
                    caracteres_problemáticos.append((i, char_orig, char_seg))
            
            if len(archivo) != len(nombre_seguro):
                print(f"   Longitud cambió: {len(archivo)} -> {len(nombre_seguro)}")
            
            if caracteres_problemáticos:
                print(f"   Caracteres problemáticos:")
                for pos, orig, seg in caracteres_problemáticos[:5]:  # Mostrar solo los primeros 5
                    print(f"     Posición {pos}: '{orig}' -> '{seg}'")
        else:
            print(f"✅ OK: secure_filename() no cambió el nombre")
    
    # Simular generación de nombres típicos
    print(f"\n" + "=" * 50)
    print("SIMULACIÓN DE NOMBRES TÍPICOS")
    print("=" * 50)
    
    nombres_test = [
        "Evidencia_PDF_Prueba_20250706_081513.pdf",
        "Evidencia_Computo 20250706 075254 0904Ed48_20250706_075736.pdf",
        "Evidencia_Mantenimiento Impresora_20250706_123456.pdf",
        "Evidencia_Test_Ñandú_20250706_090000.pdf",
        "Evidencia_PDF con espacios y-guiones_20250706_100000.pdf"
    ]
    
    for nombre in nombres_test:
        nombre_seguro = secure_filename(nombre)
        cambio = "❌ CAMBIA" if nombre != nombre_seguro else "✅ OK"
        print(f"{cambio} | {nombre}")
        if nombre != nombre_seguro:
            print(f"        -> {nombre_seguro}")
    
    print(f"\n" + "=" * 70)
    print("ANÁLISIS COMPLETADO")
    print("=" * 70)

def generar_solucion():
    """
    Genera código de solución basado en el análisis
    """
    print(f"\n" + "=" * 50)
    print("SOLUCIÓN PROPUESTA")
    print("=" * 50)
    
    print("""
PROBLEMA: secure_filename() está cambiando los nombres de archivos con espacios,
causando que el PDF generado no se pueda encontrar para descarga.

SOLUCIONES POSIBLES:

1. OPCIÓN A - No usar secure_filename en descarga (RECOMENDADO):
   - Validar que el nombre no contenga caracteres peligrosos
   - Usar el nombre exacto como se generó
   
2. OPCIÓN B - Usar secure_filename en generación también:
   - Aplicar secure_filename al nombre cuando se genera el PDF
   - Mantener consistencia entre generación y descarga

3. OPCIÓN C - Decodificar URL:
   - Los espacios en URL se convierten en %20
   - Decodificar antes de aplicar secure_filename

CÓDIGO PARA OPCIÓN A (RECOMENDADO):
""")
    
    codigo_solucion = '''
def es_nombre_archivo_seguro(nombre):
    """Verifica si un nombre de archivo es seguro sin modificarlo"""
    import re
    # Permitir letras, números, espacios, guiones, puntos y underscore
    patron_permitido = re.compile(r'^[a-zA-Z0-9\s\-_\.]+$')
    return patron_permitido.match(nombre) is not None

@app.route('/api/evidencia/descargar_pdf/<path:nombre_archivo>')
def descargar_pdf_evidencia(nombre_archivo):
    try:
        # Decodificar URL (para manejar %20 -> espacio)
        from urllib.parse import unquote
        nombre_archivo = unquote(nombre_archivo)
        
        # Validar seguridad sin modificar el nombre
        if not es_nombre_archivo_seguro(nombre_archivo):
            return jsonify({'error': 'Nombre de archivo no válido'}), 400
        
        ruta_archivo = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_archivo)
        
        if not os.path.exists(ruta_archivo):
            return jsonify({'error': 'PDF no encontrado'}), 404
        
        return send_from_directory(
            PDFS_MANTENIMIENTO_DIR,
            nombre_archivo,
            as_attachment=True,
            download_name=nombre_archivo
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
'''
    
    print(codigo_solucion)

if __name__ == "__main__":
    analizar_secure_filename()
    generar_solucion()
