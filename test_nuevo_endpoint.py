#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prueba del nuevo endpoint de compresión para descarga directa
"""

import requests
import base64
import json
import io
import urllib3
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Desactivar advertencias SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def crear_pdf_prueba_computo():
    """Crea un PDF simulando un formato de mantenimiento de cómputo"""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Título
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 50, "FORMATO DE MANTENIMIENTO DE COMPUTO")
    
    # Información del equipo
    p.setFont("Helvetica", 12)
    y_pos = height - 100
    
    campos = [
        "ZONA: TUXTLA",
        "FOLIO: MT-2025-001",
        "FECHA: 06/07/2025",
        "TIPO DE EQUIPO: PC",
        "SERVICIO: Preventivo",
        "HR. INICIO: 08:00",
        "HR. TÉRMINO: 10:00",
        "",
        "DATOS DEL EQUIPO:",
        "NÚMERO INVENTARIO: 12345",
        "NÚMERO SERIE: ABC123XYZ789",
        "MARCA: Dell",
        "MODELO: OptiPlex 7090",
        "USUARIO: Juan Pérez",
        "DIVISIÓN: Tecnologías de Información",
        "CENTRO DE TRABAJO: Oficinas Centrales",
        "TIPO DE USO: Administrativo",
        "",
        "ACTIVIDADES REALIZADAS:",
        "☑ Limpieza externa: SI",
        "☑ Pantalla: SI", 
        "☑ Teclado: SI",
        "☑ Conexiones: SI",
        "☑ Después del servicio: SI",
        "☑ Antivirus: SI",
        "☑ Desfragmentación: SI",
        "☑ Dominio: SI",
        "☑ Windows Update: SI",
        "",
        "OBSERVACIONES:",
        "Se realizó mantenimiento preventivo completo.",
        "Equipo funcionando correctamente.",
        "Se actualizó el antivirus y se ejecutó",
        "desfragmentación del disco duro.",
        "Todas las conexiones verificadas y limpias.",
        "",
        "MATERIALES UTILIZADOS:",
        "- Aire comprimido",
        "- Alcohol isopropílico", 
        "- Paños microfibra",
        "- Aplicador de limpieza",
        "",
        "PRÓXIMO MANTENIMIENTO: 06/01/2026",
        "",
        "FIRMAS:",
        "",
        "Realizó servicio:",
        "Juan Técnico López",
        "",
        "Responsable del Equipo:",
        "María Usuaria García",
        "",
        "Visto Bueno:",
        "Luis Supervisor Méndez"
    ]
    
    for campo in campos:
        if y_pos < 50:  # Nueva página si es necesario
            p.showPage()
            y_pos = height - 50
            p.setFont("Helvetica", 12)
        
        if campo.startswith("FORMATO DE MANTENIMIENTO"):
            p.setFont("Helvetica-Bold", 16)
        elif campo in ["DATOS DEL EQUIPO:", "ACTIVIDADES REALIZADAS:", "OBSERVACIONES:", "MATERIALES UTILIZADOS:", "FIRMAS:"]:
            p.setFont("Helvetica-Bold", 12)
        else:
            p.setFont("Helvetica", 10)
        
        p.drawString(50, y_pos, campo)
        y_pos -= 15
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return buffer.getvalue()

def test_compresion_descarga():
    """Prueba el nuevo endpoint de compresión para descarga"""
    print("=== PRUEBA DE COMPRESIÓN PARA DESCARGA DIRECTA ===")
    
    # Crear PDF realista
    pdf_data = crear_pdf_prueba_computo()
    pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
    
    print(f"PDF de computo creado: {len(pdf_data):,} bytes ({len(pdf_data)/1024:.1f} KB)")
    
    # Datos para el endpoint
    payload = {
        'pdf_base64': f"data:application/pdf;base64,{pdf_base64}",
        'nombre_archivo': 'mantenimiento_computo_comprimido.pdf'
    }
    
    try:
        # Enviar al nuevo endpoint
        url = 'https://localhost:8000/api/evidencia/comprimir_y_descargar_pdf'
        print(f"Enviando al endpoint: {url}")
        
        response = requests.post(
            url, 
            json=payload,
            verify=False,
            timeout=60  # Aumentar timeout para compresión
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Éxito: Compresión completada")
            
            # Mostrar estadísticas de compresión
            if 'estadisticas' in result:
                stats = result['estadisticas']
                original = stats.get('tamaño_original', 0)
                comprimido = stats.get('tamaño_comprimido', 0)
                reduccion = stats.get('porcentaje_reduccion', 0)
                metodo = stats.get('metodo_usado', 'N/A')
                
                print(f"📊 Estadísticas de compresión:")
                print(f"   - Tamaño original: {original:,} bytes ({original/1024:.1f} KB)")
                print(f"   - Tamaño comprimido: {comprimido:,} bytes ({comprimido/1024:.1f} KB)")
                print(f"   - Reducción: {reduccion:.2f}%")
                print(f"   - Método usado: {metodo}")
                
                # Calcular ahorro
                ahorro_bytes = original - comprimido
                ahorro_kb = ahorro_bytes / 1024
                print(f"   - Ahorro: {ahorro_bytes:,} bytes ({ahorro_kb:.1f} KB)")
                
                if reduccion > 0:
                    print("✅ Compresión aplicada exitosamente")
                    if reduccion > 10:
                        print("🎉 Excelente nivel de compresión!")
                    elif reduccion > 5:
                        print("👍 Buen nivel de compresión")
                else:
                    print("⚠️  No se detectó reducción significativa")
            
            # Verificar que se retornó el PDF comprimido
            if 'pdf_comprimido_base64' in result:
                pdf_comprimido_b64 = result['pdf_comprimido_base64']
                if pdf_comprimido_b64.startswith('data:application/pdf;base64,'):
                    pdf_comprimido_b64_limpio = pdf_comprimido_b64.split(',')[1]
                    pdf_comprimido_data = base64.b64decode(pdf_comprimido_b64_limpio)
                    print(f"📄 PDF comprimido recibido: {len(pdf_comprimido_data):,} bytes")
                    
                    # Guardar para verificación (opcional)
                    with open('test_pdf_comprimido.pdf', 'wb') as f:
                        f.write(pdf_comprimido_data)
                    print(f"💾 PDF comprimido guardado como 'test_pdf_comprimido.pdf'")
                else:
                    print("❌ Formato de PDF comprimido inválido")
            else:
                print("❌ No se recibió PDF comprimido en la respuesta")
            
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al servidor. Asegúrate de que esté corriendo.")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    test_compresion_descarga()
