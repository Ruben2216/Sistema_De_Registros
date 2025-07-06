#!/usr/bin/env python3
"""
Script para crear PDFs de prueba en el sistema de evidencia de mantenimiento.
Esto permitirá probar la funcionalidad sin necesidad de generar PDFs reales desde los formularios.
"""

import os
import tempfile
import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def crear_pdf_prueba():
    """
    Crea un PDF de prueba en el directorio de PDFs de mantenimiento
    """
    # Directorio donde se almacenan los PDFs de mantenimiento
    PDFS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
    os.makedirs(PDFS_MANTENIMIENTO_DIR, exist_ok=True)
    
    # Crear algunos PDFs de prueba
    pdfs_prueba = [
        {
            'nombre': 'computo_20240701_123456_test01.pdf',
            'titulo': 'Mantenimiento de Equipo de Cómputo',
            'contenido': [
                'FORMATO DE MANTENIMIENTO PREVENTIVO',
                'EQUIPO DE CÓMPUTO',
                '',
                'Folio: COMP-2024-001',
                'Fecha: 01/07/2024',
                'Técnico: Juan Pérez',
                '',
                'ACTIVIDADES REALIZADAS:',
                '• Limpieza externa del equipo',
                '• Limpieza interna del CPU',
                '• Verificación de conexiones',
                '• Actualización de sistema operativo',
                '• Verificación de antivirus',
                '',
                'OBSERVACIONES:',
                'Equipo en buen estado general.',
                'Se recomienda cambio de pasta térmica en 6 meses.',
                '',
                '________________',
                'Firma del técnico'
            ]
        },
        {
            'nombre': 'impresoras_20240702_234567_test02.pdf',
            'titulo': 'Mantenimiento de Impresoras',
            'contenido': [
                'FORMATO DE MANTENIMIENTO PREVENTIVO',
                'IMPRESORAS',
                '',
                'Folio: IMP-2024-001',
                'Fecha: 02/07/2024',
                'Técnico: María García',
                '',
                'ACTIVIDADES REALIZADAS:',
                '• Limpieza de cabezales',
                '• Calibración de impresión',
                '• Verificación de cartuchos',
                '• Limpieza de rodillos',
                '• Prueba de impresión',
                '',
                'OBSERVACIONES:',
                'Impresora HP LaserJet Pro M404n',
                'Cartucho al 75% de capacidad.',
                '',
                '________________',
                'Firma del técnico'
            ]
        },
        {
            'nombre': 'telecomunicaciones_20240703_345678_test03.pdf',
            'titulo': 'Mantenimiento de Telecomunicaciones',
            'contenido': [
                'FORMATO DE MANTENIMIENTO PREVENTIVO',
                'EQUIPOS DE TELECOMUNICACIONES',
                '',
                'Folio: TEL-2024-001',
                'Fecha: 03/07/2024',
                'Técnico: Carlos López',
                '',
                'ACTIVIDADES REALIZADAS:',
                '• Verificación de switches',
                '• Prueba de conectividad',
                '• Limpieza de equipos',
                '• Verificación de UPS',
                '• Medición de señales',
                '',
                'OBSERVACIONES:',
                'Todos los equipos funcionando correctamente.',
                'Switch principal requiere actualización firmware.',
                '',
                '________________',
                'Firma del técnico'
            ]
        }
    ]
    
    print(f"📁 Creando PDFs de prueba en: {PDFS_MANTENIMIENTO_DIR}")
    
    for pdf_info in pdfs_prueba:
        ruta_pdf = os.path.join(PDFS_MANTENIMIENTO_DIR, pdf_info['nombre'])
        
        # Crear el PDF usando reportlab
        c = canvas.Canvas(ruta_pdf, pagesize=A4)
        width, height = A4
        
        # Encabezado
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, height - 50, pdf_info['titulo'])
        
        # Línea horizontal
        c.line(50, height - 70, width - 50, height - 70)
        
        # Contenido
        y_position = height - 100
        c.setFont("Helvetica", 12)
        
        for linea in pdf_info['contenido']:
            if linea.startswith('•'):
                c.setFont("Helvetica", 10)
            elif linea.isupper() and len(linea) > 10:
                c.setFont("Helvetica-Bold", 12)
            else:
                c.setFont("Helvetica", 12)
                
            c.drawString(50, y_position, linea)
            y_position -= 20
            
            # Nueva página si es necesario
            if y_position < 50:
                c.showPage()
                y_position = height - 50
        
        # Pie de página
        c.setFont("Helvetica", 8)
        c.drawString(50, 30, f"Generado automáticamente - {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}")
        
        c.save()
        print(f"✅ Creado: {pdf_info['nombre']}")
    
    print(f"\n🎉 ¡{len(pdfs_prueba)} PDFs de prueba creados exitosamente!")
    print(f"📂 Ubicación: {PDFS_MANTENIMIENTO_DIR}")
    print("\n📋 Para probar:")
    print("1. Inicie el servidor Flask")
    print("2. Vaya a evidencia_mantenimiento.html") 
    print("3. Seleccione uno de los PDFs de prueba")
    print("4. Añada imágenes de evidencia")
    print("5. Genere PDF con evidencia")

def listar_pdfs_existentes():
    """
    Lista los PDFs existentes en el directorio
    """
    PDFS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
    
    if not os.path.exists(PDFS_MANTENIMIENTO_DIR):
        print("❌ No existe el directorio de PDFs de mantenimiento")
        return
    
    archivos = [f for f in os.listdir(PDFS_MANTENIMIENTO_DIR) if f.endswith('.pdf')]
    
    if not archivos:
        print("📁 No hay PDFs en el directorio de mantenimiento")
    else:
        print(f"📁 PDFs encontrados en {PDFS_MANTENIMIENTO_DIR}:")
        for archivo in archivos:
            ruta_completa = os.path.join(PDFS_MANTENIMIENTO_DIR, archivo)
            tamaño = os.path.getsize(ruta_completa)
            fecha = datetime.datetime.fromtimestamp(os.path.getctime(ruta_completa))
            print(f"  📄 {archivo} ({tamaño} bytes, {fecha.strftime('%d/%m/%Y %H:%M')})")

def limpiar_pdfs():
    """
    Elimina todos los PDFs de prueba
    """
    PDFS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
    
    if not os.path.exists(PDFS_MANTENIMIENTO_DIR):
        print("❌ No existe el directorio de PDFs de mantenimiento")
        return
    
    archivos = [f for f in os.listdir(PDFS_MANTENIMIENTO_DIR) if f.endswith('.pdf')]
    
    for archivo in archivos:
        ruta_completa = os.path.join(PDFS_MANTENIMIENTO_DIR, archivo)
        os.remove(ruta_completa)
        print(f"🗑️ Eliminado: {archivo}")
    
    print(f"✅ {len(archivos)} PDFs eliminados")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "listar":
            listar_pdfs_existentes()
        elif sys.argv[1] == "limpiar":
            limpiar_pdfs()
        elif sys.argv[1] == "crear":
            crear_pdf_prueba()
        else:
            print("Uso: python crear_pdfs_prueba.py [crear|listar|limpiar]")
    else:
        crear_pdf_prueba()
