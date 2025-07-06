#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test específico para verificar la compresión de PDFs de mantenimiento
"""

import requests
import json
import urllib3
import base64
import io

# Desactivar advertencias SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def generar_pdf_grande():
    """Genera un PDF más grande para probar mejor la compresión"""
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.colors import red, blue, green
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Página 1 - Formulario de mantenimiento simulado
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 50, "FORMATO DE MANTENIMIENTO DE EQUIPO DE CÓMPUTO")
    
    p.setFont("Helvetica", 12)
    y_pos = height - 100
    
    # Simular un formulario con muchos campos
    campos = [
        "Número de Inventario: 12345",
        "Número de Serie: ABC123DEF456",
        "Marca: Dell",
        "Modelo: OptiPlex 7090",
        "Usuario Responsable: Juan Pérez",
        "División: Tecnologías de la Información",
        "Centro de Trabajo: Oficinas Centrales",
        "Fecha de Mantenimiento: 06/07/2025",
        "Tipo de Mantenimiento: Preventivo",
        "",
        "ACTIVIDADES REALIZADAS:",
        "☑ Limpieza externa del equipo",
        "☑ Limpieza interna (ventiladores y componentes)",
        "☑ Verificación de conexiones",
        "☑ Actualización de antivirus",
        "☑ Desfragmentación de disco",
        "☑ Limpieza de archivos temporales",
        "☑ Verificación de temperatura",
        "☑ Prueba de funcionamiento",
        "",
        "OBSERVACIONES:",
        "El equipo se encuentra en buen estado general.",
        "Se detectó acumulación moderada de polvo en ventiladores.",
        "Sistema operativo funcionando correctamente.",
        "Temperatura dentro de parámetros normales.",
        "Se recomienda mantenimiento cada 6 meses.",
        "",
        "COMPONENTES VERIFICADOS:",
        "• Procesador: Intel Core i7-10700",
        "• Memoria RAM: 16 GB DDR4",
        "• Disco duro: SSD 500 GB",
        "• Tarjeta gráfica: Intel UHD Graphics 630",
        "• Fuente de poder: 180W",
        "• Conectividad: Ethernet, WiFi, USB 3.0",
    ]
    
    for campo in campos:
        if y_pos < 50:  # Nueva página si se acaba el espacio
            p.showPage()
            y_pos = height - 50
        
        if campo.startswith("☑"):
            p.setFillColor(green)
        elif campo.startswith("•"):
            p.setFillColor(blue)
        elif campo == "" or campo.endswith(":"):
            p.setFillColor(red if campo.endswith(":") else blue)
            if campo.endswith(":"):
                p.setFont("Helvetica-Bold", 12)
            else:
                p.setFont("Helvetica", 12)
        else:
            p.setFillColor(blue)
            p.setFont("Helvetica", 10)
        
        p.drawString(50, y_pos, campo)
        y_pos -= 15
    
    # Página 2 - Simular firmas
    p.showPage()
    p.setFillColor(blue)
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, height - 50, "FIRMAS DE AUTORIZACIÓN")
    
    # Simular áreas de firma
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 150, "Técnico que realizó el mantenimiento:")
    p.rect(50, height - 200, 200, 30, stroke=1, fill=0)
    p.drawString(50, height - 220, "Nombre: ________________")
    p.drawString(50, height - 240, "Fecha: ________________")
    
    p.drawString(350, height - 150, "Usuario responsable:")
    p.rect(350, height - 200, 200, 30, stroke=1, fill=0)
    p.drawString(350, height - 220, "Nombre: ________________")
    p.drawString(350, height - 240, "Fecha: ________________")
    
    # Agregar una tabla simulada
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, height - 300, "HISTORIAL DE MANTENIMIENTOS:")
    
    # Encabezados de tabla
    y_table = height - 330
    p.drawString(50, y_table, "Fecha")
    p.drawString(150, y_table, "Tipo")
    p.drawString(250, y_table, "Técnico")
    p.drawString(400, y_table, "Observaciones")
    
    # Línea de separación
    p.line(50, y_table - 5, 550, y_table - 5)
    
    # Datos de tabla simulados
    p.setFont("Helvetica", 9)
    historial = [
        ("01/01/2025", "Preventivo", "Juan García", "Mantenimiento regular"),
        ("15/06/2024", "Correctivo", "María López", "Cambio de ventilador"),
        ("10/12/2023", "Preventivo", "Carlos Ruiz", "Limpieza general"),
        ("05/06/2023", "Preventivo", "Ana Torres", "Actualización sistema"),
    ]
    
    for i, (fecha, tipo, tecnico, obs) in enumerate(historial):
        y_row = y_table - 20 - (i * 15)
        p.drawString(50, y_row, fecha)
        p.drawString(150, y_row, tipo)
        p.drawString(250, y_row, tecnico)
        p.drawString(400, y_row, obs)
    
    p.save()
    
    buffer.seek(0)
    pdf_data = buffer.getvalue()
    return base64.b64encode(pdf_data).decode('utf-8')

def test_compresion_endpoint():
    """Test de compresión en el endpoint"""
    print("=" * 60)
    print("TEST DE COMPRESIÓN EN ENDPOINT DE MANTENIMIENTO")
    print("=" * 60)
    
    # Generar PDF grande
    print("Generando PDF de prueba más grande...")
    pdf_base64 = generar_pdf_grande()
    
    # Calcular tamaño original
    pdf_data_original = base64.b64decode(pdf_base64)
    tamaño_original = len(pdf_data_original)
    print(f"Tamaño del PDF original: {tamaño_original:,} bytes ({tamaño_original/1024:.1f} KB)")
    
    # Datos para el endpoint
    datos = {
        'pdf_base64': f'data:application/pdf;base64,{pdf_base64}',
        'nombre_archivo': 'Mantenimiento_Computo_Test_Compresion.pdf',
        'tipo_mantenimiento': 'computo'
    }
    
    print(f"Enviando PDF al endpoint...")
    
    try:
        response = requests.post(
            'https://192.168.100.30:8000/api/evidencia/guardar_pdf_mantenimiento',
            json=datos,
            headers={'Content-Type': 'application/json'},
            verify=False,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ PDF guardado exitosamente!")
            print(f"Nombre del archivo: {result.get('nombre_archivo')}")
            
            # Mostrar información de compresión si está disponible
            if 'compresion' in result:
                comp_info = result['compresion']
                print(f"\nINFORMACIÓN DE COMPRESIÓN:")
                print(f"  Tamaño original: {comp_info.get('tamaño_original', 0):,} bytes")
                print(f"  Tamaño comprimido: {comp_info.get('tamaño_comprimido', 0):,} bytes")
                print(f"  Reducción: {comp_info.get('porcentaje_reduccion', 0):.2f}%")
                print(f"  Método usado: {comp_info.get('metodo_usado', 'N/A')}")
            
            return True
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en petición: {e}")
        return False

if __name__ == "__main__":
    test_compresion_endpoint()
