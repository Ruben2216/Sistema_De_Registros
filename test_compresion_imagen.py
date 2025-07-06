#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prueba de compresión con PDF que contiene imágenes reales
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

def crear_imagen_simulada():
    """Crea una imagen simulada para el PDF"""
    # Crear imagen de prueba (simula foto de equipo)
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Dibujar elementos simulando una foto de equipo
    draw.rectangle([50, 50, 750, 550], outline='black', width=3)
    draw.rectangle([100, 100, 700, 250], fill='lightgray', outline='black')
    draw.text((150, 150), "EQUIPO DE COMPUTO", fill='black')
    draw.text((150, 180), "Dell OptiPlex 7090", fill='black')
    draw.text((150, 210), "Serie: ABC123XYZ", fill='black')
    
    # Simular elementos visuales
    draw.rectangle([100, 300, 350, 500], fill='darkgray', outline='black')
    draw.text((120, 350), "Monitor", fill='white')
    
    draw.rectangle([400, 300, 650, 500], fill='lightblue', outline='black')
    draw.text((450, 400), "CPU", fill='black')
    
    # Convertir a bytes
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='JPEG', quality=95)  # Alta calidad inicial
    img_buffer.seek(0)
    return img_buffer.getvalue()

def crear_pdf_con_imagen():
    """Crea un PDF con imagen integrada para probar compresión"""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Título
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 50, "FORMATO DE MANTENIMIENTO CON EVIDENCIA FOTOGRÁFICA")
    
    # Información básica
    p.setFont("Helvetica", 12)
    y_pos = height - 100
    
    campos = [
        "Número de Inventario: 98765",
        "Número de Serie: XYZ789ABC",
        "Marca: Dell",
        "Modelo: OptiPlex 7090",
        "Fecha: 06/07/2025",
        "",
        "EVIDENCIA FOTOGRÁFICA:",
    ]
    
    for campo in campos:
        p.drawString(50, y_pos, campo)
        y_pos -= 20
    
    # Insertar imagen
    try:
        img_data = crear_imagen_simulada()
        img_reader = ImageReader(io.BytesIO(img_data))
        
        # Insertar imagen en el PDF
        p.drawImage(img_reader, 50, y_pos - 200, width=400, height=150)
        y_pos -= 220
        
    except Exception as e:
        p.drawString(50, y_pos - 20, f"Error al insertar imagen: {e}")
        y_pos -= 40
    
    # Agregar más contenido
    p.drawString(50, y_pos, "OBSERVACIONES:")
    y_pos -= 20
    p.drawString(50, y_pos, "Se realizó mantenimiento preventivo completo.")
    y_pos -= 20
    p.drawString(50, y_pos, "Equipo funcionando correctamente.")
    y_pos -= 40
    
    # Firmas
    p.drawString(50, y_pos, "____________________")
    p.drawString(300, y_pos, "____________________")
    y_pos -= 20
    p.drawString(50, y_pos, "Firma Técnico")
    p.drawString(300, y_pos, "Firma Responsable")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return buffer.getvalue()

def test_compresion_con_imagen():
    """Prueba la compresión con un PDF que contiene imágenes"""
    print("=== PRUEBA DE COMPRESIÓN CON IMÁGENES ===")
    
    # Crear PDF con imagen
    pdf_data = crear_pdf_con_imagen()
    pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
    
    print(f"PDF con imagen creado: {len(pdf_data)} bytes ({len(pdf_data)/1024:.1f} KB)")
    
    # Datos para el endpoint
    payload = {
        'pdf_base64': f"data:application/pdf;base64,{pdf_base64}",
        'nombre_archivo': 'test_mantenimiento_con_imagen',
        'tipo_mantenimiento': 'prueba_imagen'
    }
    
    try:
        # Enviar al endpoint
        url = 'https://localhost:8000/api/evidencia/guardar_pdf_mantenimiento'
        response = requests.post(
            url, 
            json=payload,
            verify=False,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Éxito: {result.get('message', 'PDF guardado')}")
            
            # Mostrar estadísticas de compresión
            if 'compresion' in result:
                comp = result['compresion']
                print(f"📊 Estadísticas de compresión con imagen:")
                print(f"   - Tamaño original: {comp.get('tamaño_original', 0):,} bytes ({comp.get('tamaño_original', 0)/1024:.1f} KB)")
                print(f"   - Tamaño comprimido: {comp.get('tamaño_comprimido', 0):,} bytes ({comp.get('tamaño_comprimido', 0)/1024:.1f} KB)")
                print(f"   - Reducción: {comp.get('porcentaje_reduccion', 0):.2f}%")
                print(f"   - Método usado: {comp.get('metodo_usado', 'N/A')}")
                
                # Calcular ahorro en KB
                ahorro_bytes = comp.get('tamaño_original', 0) - comp.get('tamaño_comprimido', 0)
                print(f"   - Ahorro: {ahorro_bytes:,} bytes ({ahorro_bytes/1024:.1f} KB)")
                
                if comp.get('porcentaje_reduccion', 0) > 0:
                    print("✅ Compresión aplicada correctamente")
                    if comp.get('porcentaje_reduccion', 0) > 20:
                        print("🎉 Excelente nivel de compresión!")
                else:
                    print("⚠️  No se detectó compresión significativa")
            
            print(f"📄 Archivo guardado: {result.get('nombre_archivo', 'N/A')}")
            
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al servidor. Asegúrate de que esté corriendo.")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    test_compresion_con_imagen()
