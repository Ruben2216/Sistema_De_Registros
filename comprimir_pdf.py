#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para comprimir PDFs de mantenimiento
Optimiza el tamaño de los PDFs reduciendo la calidad de imágenes y eliminando metadatos innecesarios
"""

import os
import io
import base64
import tempfile
from typing import Optional, Tuple

def comprimir_pdf_base64(pdf_base64: str, calidad_imagen: int = 50, reducir_metadatos: bool = True) -> Tuple[str, dict]:
    """
    Comprime un PDF que está en formato base64
    
    Args:
        pdf_base64: PDF codificado en base64
        calidad_imagen: Calidad de compresión de imágenes (1-100, menor = más compresión)
        reducir_metadatos: Si eliminar metadatos innecesarios
    
    Returns:
        Tuple con (pdf_comprimido_base64, estadísticas_compresión)
    """
    estadisticas = {
        'tamaño_original': 0,
        'tamaño_comprimido': 0,
        'porcentaje_reduccion': 0,
        'metodo_usado': 'ninguno',
        'error': None
    }
    
    try:
        # Limpiar el base64 si tiene prefijo
        if pdf_base64.startswith('data:application/pdf;base64,'):
            pdf_base64_limpio = pdf_base64.split(',')[1]
        elif pdf_base64.startswith('data:'):
            comma_index = pdf_base64.find(',')
            if comma_index != -1:
                pdf_base64_limpio = pdf_base64[comma_index + 1:]
            else:
                pdf_base64_limpio = pdf_base64
        else:
            pdf_base64_limpio = pdf_base64
        
        # Decodificar PDF
        pdf_data = base64.b64decode(pdf_base64_limpio)
        estadisticas['tamaño_original'] = len(pdf_data)
        
        # Verificar que es un PDF válido
        if not pdf_data.startswith(b'%PDF'):
            raise Exception("El archivo no es un PDF válido")
        
        # Intentar compresión con PyMuPDF (método preferido)
        try:
            import fitz  # PyMuPDF
            
            # Abrir PDF desde bytes
            doc = fitz.open("pdf", pdf_data)
            
            # Configuración de compresión conservadora (SIN comprimir imágenes)
            opciones_compresion = {
                "garbage": 4,           # Máxima limpieza de garbage
                "clean": True,          # Limpiar contenido redundante
                "deflate": True,        # Comprimir streams de texto
                "deflate_images": False, # NO comprimir imágenes (preservar logo y firmas)
                "deflate_fonts": True,  # Comprimir fuentes
                "ascii": False,         # No forzar ASCII (permite mejor compresión)
                "linear": False,        # No linearizar (puede ahorrar espacio)
                "pretty": False,        # No formatear bonito (ahorra espacio)
                "encryption": fitz.PDF_ENCRYPT_NONE  # Sin encriptación
            }
            
            # NOTA: NO COMPRIMIR IMÁGENES para preservar calidad del logo y firmas
            # Solo aplicar compresión de texto, metadatos y streams
            print(f"[DEBUG] Preservando calidad original de imágenes (logo y firmas)")
            # Las imágenes se mantienen intactas para preservar la calidad visual
            
            # Eliminar metadatos si se solicita
            if reducir_metadatos:
                # Limpiar metadatos
                metadata = doc.metadata
                metadata_limpio = {
                    'title': '',
                    'author': '',
                    'subject': '',
                    'keywords': '',
                    'creator': 'Sistema CFE',
                    'producer': 'Sistema CFE',
                    'creationDate': '',
                    'modDate': ''
                }
                doc.set_metadata(metadata_limpio)
            
            # Guardar PDF comprimido
            pdf_comprimido = doc.tobytes(**opciones_compresion)
            doc.close()
            
            estadisticas['metodo_usado'] = 'PyMuPDF'
            
        except ImportError:
            # PyMuPDF no disponible, intentar con PyPDF2/PyPDF4
            try:
                import PyPDF2
                
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_data))
                pdf_writer = PyPDF2.PdfWriter()
                
                # Copiar páginas
                for page in pdf_reader.pages:
                    pdf_writer.add_page(page)
                
                # Eliminar metadatos
                if reducir_metadatos:
                    pdf_writer.add_metadata({
                        '/Title': '',
                        '/Author': '',
                        '/Subject': '',
                        '/Creator': 'Sistema CFE',
                        '/Producer': 'Sistema CFE'
                    })
                
                # Comprimir solo texto y metadatos, NO imágenes
                pdf_writer.compress_identical_objects()
                pdf_writer.remove_links()
                # NO usar remove_images() para preservar logo y firmas
                
                # Guardar
                output_buffer = io.BytesIO()
                pdf_writer.write(output_buffer)
                pdf_comprimido = output_buffer.getvalue()
                
                estadisticas['metodo_usado'] = 'PyPDF2'
                
            except ImportError:
                # Ninguna librería disponible, retornar original
                pdf_comprimido = pdf_data
                estadisticas['metodo_usado'] = 'sin_compresion'
                estadisticas['error'] = 'Librerías de compresión no disponibles'
        
        # Calcular estadísticas
        estadisticas['tamaño_comprimido'] = len(pdf_comprimido)
        if estadisticas['tamaño_original'] > 0:
            reduccion = ((estadisticas['tamaño_original'] - estadisticas['tamaño_comprimido']) / estadisticas['tamaño_original']) * 100
            estadisticas['porcentaje_reduccion'] = round(reduccion, 2)
        
        # Convertir de vuelta a base64
        pdf_comprimido_base64 = base64.b64encode(pdf_comprimido).decode('utf-8')
        
        # Agregar prefijo si el original lo tenía
        if pdf_base64.startswith('data:application/pdf;base64,'):
            pdf_comprimido_base64 = f"data:application/pdf;base64,{pdf_comprimido_base64}"
        
        return pdf_comprimido_base64, estadisticas
        
    except Exception as e:
        estadisticas['error'] = str(e)
        return pdf_base64, estadisticas  # Retornar original en caso de error

def comprimir_pdf_archivo(ruta_entrada: str, ruta_salida: str = None, calidad_imagen: int = 50) -> dict:
    """
    Comprime un archivo PDF directamente
    
    Args:
        ruta_entrada: Ruta del PDF original
        ruta_salida: Ruta donde guardar el PDF comprimido (opcional)
        calidad_imagen: Calidad de compresión de imágenes (1-100)
    
    Returns:
        Diccionario con estadísticas de compresión
    """
    try:
        # Leer archivo original
        with open(ruta_entrada, 'rb') as f:
            pdf_data = f.read()
        
        # Convertir a base64 y comprimir
        pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
        pdf_comprimido_base64, estadisticas = comprimir_pdf_base64(pdf_base64, calidad_imagen)
        
        # Determinar ruta de salida
        if ruta_salida is None:
            ruta_salida = ruta_entrada.replace('.pdf', '_comprimido.pdf')
        
        # Guardar archivo comprimido
        pdf_comprimido_data = base64.b64decode(pdf_comprimido_base64)
        with open(ruta_salida, 'wb') as f:
            f.write(pdf_comprimido_data)
        
        estadisticas['ruta_original'] = ruta_entrada
        estadisticas['ruta_comprimida'] = ruta_salida
        
        return estadisticas
        
    except Exception as e:
        return {
            'error': str(e),
            'ruta_original': ruta_entrada,
            'ruta_comprimida': ruta_salida
        }

def formatear_tamaño(bytes_size: int) -> str:
    """Convierte bytes a formato legible"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} TB"

def log_compresion(estadisticas: dict, contexto: str = ""):
    """Registra información sobre la compresión realizada"""
    if estadisticas.get('error'):
        print(f"[COMPRESION{' '+contexto if contexto else ''}] ERROR: {estadisticas['error']}")
        return
    
    tamaño_original = estadisticas.get('tamaño_original', 0)
    tamaño_comprimido = estadisticas.get('tamaño_comprimido', 0)
    porcentaje = estadisticas.get('porcentaje_reduccion', 0)
    metodo = estadisticas.get('metodo_usado', 'desconocido')
    
    print(f"[COMPRESION{' '+contexto if contexto else ''}] "
          f"Método: {metodo} | "
          f"Original: {formatear_tamaño(tamaño_original)} | "
          f"Comprimido: {formatear_tamaño(tamaño_comprimido)} | "
          f"Reducción: {porcentaje}%")

# Función de prueba
def test_compresion():
    """Función de prueba para verificar la compresión"""
    print("=== TEST DE COMPRESIÓN DE PDF ===")
    
    # Crear un PDF de prueba simple
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.drawString(100, 750, "PDF de Prueba para Compresión")
    p.drawString(100, 700, "Este es un documento de prueba con texto.")
    p.drawString(100, 650, "Contiene múltiples líneas de texto para probar la compresión.")
    p.showPage()
    p.save()
    
    buffer.seek(0)
    pdf_data = buffer.getvalue()
    pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
    
    print(f"PDF de prueba creado: {formatear_tamaño(len(pdf_data))}")
    
    # Probar compresión
    pdf_comprimido, estadisticas = comprimir_pdf_base64(pdf_base64)
    log_compresion(estadisticas, "TEST")
    
    return estadisticas

if __name__ == "__main__":
    test_compresion()
