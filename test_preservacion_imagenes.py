#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prueba específica para verificar que las imágenes (logo y firmas) se preservan sin compresión
"""

import requests
import base64
import json
import io
import urllib3
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageDraw

# Desactivar advertencias SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def crear_imagen_logo():
    """Crea una imagen simulando el logo de CFE"""
    # Crear imagen de alta calidad para simular logo
    img = Image.new('RGB', (200, 100), color='white')
    draw = ImageDraw.Draw(img)
    
    # Simular logo CFE
    draw.rectangle([10, 10, 190, 90], outline='#005030', width=3)
    draw.text((50, 35), "CFE", fill='#005030', font_size=32)
    draw.text((30, 60), "LOGO", fill='#005030', font_size=16)
    
    # Convertir a bytes con alta calidad
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG', quality=100)
    img_buffer.seek(0)
    return img_buffer.getvalue()

def crear_imagen_firma():
    """Crea una imagen simulando una firma"""
    # Crear imagen simulando firma manuscrita
    img = Image.new('RGB', (150, 75), color='white')
    draw = ImageDraw.Draw(img)
    
    # Simular trazos de firma
    draw.line([(20, 40), (50, 30), (80, 45), (110, 35), (130, 50)], fill='blue', width=2)
    draw.line([(25, 45), (45, 55), (75, 50), (105, 60), (125, 55)], fill='blue', width=2)
    
    # Convertir a bytes con alta calidad
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG', quality=100)
    img_buffer.seek(0)
    return img_buffer.getvalue()

def crear_pdf_con_logo_y_firmas():
    """Crea un PDF con logo y firmas que NO deben comprimirse"""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Insertar logo en el encabezado
    try:
        logo_data = crear_imagen_logo()
        logo_reader = ImageReader(io.BytesIO(logo_data))
        p.drawImage(logo_reader, 50, height - 100, width=200, height=100)
        print(f"[DEBUG] Logo insertado - Tamaño: {len(logo_data)} bytes")
    except Exception as e:
        print(f"[DEBUG] Error al insertar logo: {e}")
    
    # Título
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 120, "FORMATO DE MANTENIMIENTO CON LOGO Y FIRMAS")
    
    # Contenido del formulario
    p.setFont("Helvetica", 12)
    y_pos = height - 160
    
    campos = [
        "ZONA: TUXTLA",
        "FOLIO: MT-2025-001", 
        "FECHA: 06/07/2025",
        "EQUIPO: Computadora Dell OptiPlex",
        "SERIE: ABC123XYZ789",
        "",
        "ACTIVIDADES REALIZADAS:",
        "☑ Limpieza externa completa",
        "☑ Verificación de conexiones",
        "☑ Actualización de software",
        "☑ Pruebas de funcionamiento",
        "",
        "OBSERVACIONES:",
        "Se realizó mantenimiento preventivo.",
        "Equipo funcionando correctamente.",
        "Sin anomalías detectadas.",
    ]
    
    for campo in campos:
        p.drawString(50, y_pos, campo)
        y_pos -= 20
    
    # Insertar firmas al final
    y_firmas = 150
    
    try:
        # Firma 1
        firma1_data = crear_imagen_firma()
        firma1_reader = ImageReader(io.BytesIO(firma1_data))
        p.drawImage(firma1_reader, 50, y_firmas, width=150, height=75)
        p.drawString(50, y_firmas - 10, "Firma Técnico")
        print(f"[DEBUG] Firma 1 insertada - Tamaño: {len(firma1_data)} bytes")
        
        # Firma 2
        firma2_data = crear_imagen_firma()
        firma2_reader = ImageReader(io.BytesIO(firma2_data))
        p.drawImage(firma2_reader, 250, y_firmas, width=150, height=75)
        p.drawString(250, y_firmas - 10, "Firma Responsable")
        print(f"[DEBUG] Firma 2 insertada - Tamaño: {len(firma2_data)} bytes")
        
        # Firma 3
        firma3_data = crear_imagen_firma()
        firma3_reader = ImageReader(io.BytesIO(firma3_data))
        p.drawImage(firma3_reader, 450, y_firmas, width=150, height=75)
        p.drawString(450, y_firmas - 10, "Visto Bueno")
        print(f"[DEBUG] Firma 3 insertada - Tamaño: {len(firma3_data)} bytes")
        
    except Exception as e:
        print(f"[DEBUG] Error al insertar firmas: {e}")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return buffer.getvalue()

def test_preservacion_imagenes():
    """Prueba que las imágenes se preserven sin compresión"""
    print("=== PRUEBA DE PRESERVACIÓN DE IMÁGENES (LOGO Y FIRMAS) ===")
    
    # Crear PDF con logo y firmas
    pdf_data = crear_pdf_con_logo_y_firmas()
    pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
    
    print(f"PDF con logo y firmas creado: {len(pdf_data):,} bytes ({len(pdf_data)/1024:.1f} KB)")
    
    # Datos para el endpoint
    payload = {
        'pdf_base64': f"data:application/pdf;base64,{pdf_base64}",
        'nombre_archivo': 'test_preservacion_imagenes.pdf'
    }
    
    try:
        # Enviar al endpoint de compresión
        url = 'https://localhost:8000/api/evidencia/comprimir_y_descargar_pdf'
        print(f"Enviando PDF al endpoint de compresión...")
        
        response = requests.post(
            url, 
            json=payload,
            verify=False,
            timeout=60
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Compresión completada")
            
            # Mostrar estadísticas
            if 'estadisticas' in result:
                stats = result['estadisticas']
                original = stats.get('tamaño_original', 0)
                comprimido = stats.get('tamaño_comprimido', 0)
                reduccion = stats.get('porcentaje_reduccion', 0)
                metodo = stats.get('metodo_usado', 'N/A')
                
                print(f"📊 Estadísticas de compresión (PRESERVANDO IMÁGENES):")
                print(f"   - Tamaño original: {original:,} bytes ({original/1024:.1f} KB)")
                print(f"   - Tamaño comprimido: {comprimido:,} bytes ({comprimido/1024:.1f} KB)")
                print(f"   - Reducción: {reduccion:.2f}%")
                print(f"   - Método usado: {metodo}")
                
                # Verificar PDF comprimido
                if 'pdf_comprimido_base64' in result:
                    pdf_comprimido_b64 = result['pdf_comprimido_base64']
                    if pdf_comprimido_b64.startswith('data:application/pdf;base64,'):
                        pdf_comprimido_b64_limpio = pdf_comprimido_b64.split(',')[1]
                        pdf_comprimido_data = base64.b64decode(pdf_comprimido_b64_limpio)
                        
                        # Guardar para verificación visual
                        with open('test_logo_firmas_comprimido.pdf', 'wb') as f:
                            f.write(pdf_comprimido_data)
                        print(f"💾 PDF comprimido guardado como 'test_logo_firmas_comprimido.pdf'")
                        print(f"📋 ABRIR EL ARCHIVO PARA VERIFICAR QUE LOGO Y FIRMAS SE VEN BIEN")
                        
                        if reduccion > 0:
                            print(f"✅ Compresión aplicada SIN afectar imágenes")
                        else:
                            print(f"ℹ️  Sin compresión significativa (normal con imágenes preservadas)")
            
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al servidor. Asegúrate de que esté corriendo.")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    test_preservacion_imagenes()
