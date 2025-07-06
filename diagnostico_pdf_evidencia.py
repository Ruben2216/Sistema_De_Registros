#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de diagnóstico para el sistema de evidencia de PDFs
Verifica la ubicación y estado de los PDFs antes y después de la generación
"""

import os
import tempfile
import json
import datetime
import base64
from io import BytesIO
from PIL import Image

def diagnosticar_sistema_evidencia():
    """
    Realiza un diagnóstico completo del sistema de evidencia
    """
    print("=" * 60)
    print("DIAGNÓSTICO DEL SISTEMA DE EVIDENCIA DE PDFs")
    print("=" * 60)
    
    # 1. Verificar directorio principal
    PDFS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
    print(f"\n1. DIRECTORIO DE PDFs:")
    print(f"   Ruta: {PDFS_MANTENIMIENTO_DIR}")
    print(f"   Existe: {os.path.exists(PDFS_MANTENIMIENTO_DIR)}")
    
    if os.path.exists(PDFS_MANTENIMIENTO_DIR):
        archivos = os.listdir(PDFS_MANTENIMIENTO_DIR)
        print(f"   Número de archivos: {len(archivos)}")
        print(f"   Archivos:")
        for archivo in archivos:
            ruta_completa = os.path.join(PDFS_MANTENIMIENTO_DIR, archivo)
            stat = os.stat(ruta_completa)
            fecha_modificacion = datetime.datetime.fromtimestamp(stat.st_mtime)
            tamaño = stat.st_size
            print(f"     - {archivo} ({tamaño} bytes, modificado: {fecha_modificacion})")
    else:
        print("   ¡DIRECTORIO NO EXISTE!")
    
    # 2. Verificar permisos
    print(f"\n2. PERMISOS:")
    try:
        if os.path.exists(PDFS_MANTENIMIENTO_DIR):
            print(f"   Lectura: {os.access(PDFS_MANTENIMIENTO_DIR, os.R_OK)}")
            print(f"   Escritura: {os.access(PDFS_MANTENIMIENTO_DIR, os.W_OK)}")
            print(f"   Ejecución: {os.access(PDFS_MANTENIMIENTO_DIR, os.X_OK)}")
        else:
            print("   No se pueden verificar permisos - directorio no existe")
    except Exception as e:
        print(f"   Error al verificar permisos: {e}")
    
    # 3. Simular generación de PDF con evidencia
    print(f"\n3. SIMULACIÓN DE GENERACIÓN DE PDF:")
    
    try:
        # Crear un PDF de prueba si no existe
        archivo_prueba = "test_original.pdf"
        ruta_pdf_prueba = os.path.join(PDFS_MANTENIMIENTO_DIR, archivo_prueba)
        
        if not os.path.exists(ruta_pdf_prueba):
            print("   Creando PDF de prueba...")
            crear_pdf_prueba(ruta_pdf_prueba)
        
        # Simular imagen de evidencia
        imagen_base64 = crear_imagen_prueba_base64()
        
        # Simular datos de la petición
        datos_simulados = {
            'pdfSeleccionado': {
                'id': 'test_original',
                'nombre': 'PDF_Prueba'
            },
            'imagenes': [{
                'nombre': 'evidencia_prueba.jpg',
                'data': imagen_base64
            }]
        }
        
        print(f"   PDF original: {ruta_pdf_prueba}")
        print(f"   Existe PDF original: {os.path.exists(ruta_pdf_prueba)}")
        
        # Generar nombre del PDF final
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        nombre_pdf_final = f"Evidencia_{datos_simulados['pdfSeleccionado']['nombre']}_{timestamp}.pdf"
        ruta_pdf_final = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_pdf_final)
        
        print(f"   PDF final esperado: {ruta_pdf_final}")
        
        # Intentar generar PDF con evidencia
        success = generar_pdf_con_evidencia_simulado(ruta_pdf_prueba, ruta_pdf_final, datos_simulados['imagenes'])
        
        if success:
            print(f"   ✓ PDF generado exitosamente")
            print(f"   ✓ Archivo existe: {os.path.exists(ruta_pdf_final)}")
            if os.path.exists(ruta_pdf_final):
                stat = os.stat(ruta_pdf_final)
                print(f"   ✓ Tamaño: {stat.st_size} bytes")
                print(f"   ✓ Creado: {datetime.datetime.fromtimestamp(stat.st_ctime)}")
        else:
            print(f"   ✗ Error al generar PDF")
            
    except Exception as e:
        print(f"   ✗ Error en simulación: {e}")
        import traceback
        traceback.print_exc()
    
    # 4. Verificar archivos después de la simulación
    print(f"\n4. ESTADO FINAL DEL DIRECTORIO:")
    if os.path.exists(PDFS_MANTENIMIENTO_DIR):
        archivos_finales = os.listdir(PDFS_MANTENIMIENTO_DIR)
        print(f"   Archivos después de simulación: {len(archivos_finales)}")
        for archivo in archivos_finales:
            if archivo.startswith('Evidencia_'):
                print(f"     ✓ PDF con evidencia: {archivo}")
            else:
                print(f"     - {archivo}")
    
    print("\n" + "=" * 60)
    print("DIAGNÓSTICO COMPLETADO")
    print("=" * 60)

def crear_pdf_prueba(ruta_archivo):
    """
    Crea un PDF de prueba simple
    """
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        
        c = canvas.Canvas(ruta_archivo, pagesize=A4)
        width, height = A4
        
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, height - 50, "PDF de Prueba para Sistema de Evidencia")
        
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 100, f"Generado: {datetime.datetime.now()}")
        c.drawString(50, height - 130, "Este es un PDF de prueba para verificar el sistema de evidencia.")
        
        c.save()
        return True
        
    except Exception as e:
        print(f"Error al crear PDF de prueba: {e}")
        return False

def crear_imagen_prueba_base64():
    """
    Crea una imagen de prueba en formato base64
    """
    try:
        # Crear imagen simple
        img = Image.new('RGB', (400, 300), color='lightblue')
        
        # Convertir a base64
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_bytes = buffer.getvalue()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        return f"data:image/jpeg;base64,{img_base64}"
        
    except Exception as e:
        print(f"Error al crear imagen de prueba: {e}")
        return None

def generar_pdf_con_evidencia_simulado(ruta_original, ruta_final, imagenes):
    """
    Simula la generación de PDF con evidencia
    """
    try:
        # Intentar con PyMuPDF primero
        try:
            import fitz
            
            doc_original = fitz.open(ruta_original)
            doc_final = fitz.open()
            
            # Copiar páginas originales
            doc_final.insert_pdf(doc_original)
            
            # Añadir páginas de evidencia
            for i, imagen in enumerate(imagenes):
                img_data = imagen['data']
                if img_data.startswith('data:image'):
                    img_data = img_data.split(',')[1]
                
                img_bytes = base64.b64decode(img_data)
                
                page = doc_final.new_page(width=595, height=842)
                page.insert_text((50, 50), f"Evidencia {i + 1}", fontsize=16)
                
                try:
                    img_rect = fitz.Rect(50, 100, 545, 750)
                    page.insert_image(img_rect, stream=img_bytes)
                except:
                    page.insert_text((50, 400), f"Error al cargar imagen", fontsize=12)
            
            doc_final.save(ruta_final)
            doc_final.close()
            doc_original.close()
            
            return True
            
        except ImportError:
            # Fallback con reportlab
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import A4
            import shutil
            
            # Copiar PDF original
            shutil.copy2(ruta_original, ruta_final)
            
            return True
            
    except Exception as e:
        print(f"Error al generar PDF: {e}")
        return False

if __name__ == "__main__":
    diagnosticar_sistema_evidencia()
