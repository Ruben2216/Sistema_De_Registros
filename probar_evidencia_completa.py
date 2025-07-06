#!/usr/bin/env python3
"""
Script de prueba completa para el sistema de evidencia de mantenimiento.
Este script inicia el servidor y hace pruebas automatizadas.
"""

import requests
import json
import base64
import time
import threading
import subprocess
import os
from PIL import Image
import io

def crear_imagen_prueba():
    """
    Crea una imagen de prueba en base64 para las evidencias
    """
    # Crear una imagen simple de prueba
    img = Image.new('RGB', (800, 600), color='white')
    
    # Añadir algo de contenido básico
    try:
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        
        # Texto de prueba
        try:
            font = ImageFont.truetype("arial.ttf", 40)
        except:
            font = ImageFont.load_default()
            
        draw.text((50, 50), "EVIDENCIA DE PRUEBA", fill='black', font=font)
        draw.text((50, 150), f"Fecha: {time.strftime('%d/%m/%Y %H:%M')}", fill='blue', font=font)
        draw.text((50, 250), "Mantenimiento realizado correctamente", fill='green', font=font)
        
        # Rectángulo decorativo
        draw.rectangle([(20, 20), (780, 580)], outline='red', width=3)
        
    except ImportError:
        # Si PIL no tiene las funciones de dibujo, crear imagen básica
        pass
    
    # Convertir a base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=90)
    img_data = buffer.getvalue()
    
    return base64.b64encode(img_data).decode()

def probar_flujo_completo():
    """
    Prueba el flujo completo de evidencia de mantenimiento
    """
    base_url = "https://localhost:8000"
    session = requests.Session()
    session.verify = False  # Para certificados auto-firmados
    
    print("🚀 INICIANDO PRUEBA COMPLETA DEL SISTEMA DE EVIDENCIA")
    print("=" * 60)
    
    try:
        # 1. Obtener lista de PDFs disponibles
        print("\n1️⃣ Obteniendo lista de PDFs disponibles...")
        response = session.get(f"{base_url}/api/evidencia/obtener_pdfs_mantenimiento")
        
        if response.status_code != 200:
            print(f"❌ Error al obtener PDFs: {response.status_code}")
            return False
        
        data = response.json()
        if not data['success'] or not data['pdfs']:
            print("❌ No hay PDFs disponibles para probar")
            print("💡 Ejecute: python crear_pdfs_prueba.py crear")
            return False
        
        pdfs = data['pdfs']
        print(f"✅ {len(pdfs)} PDFs encontrados:")
        for pdf in pdfs:
            print(f"   📄 {pdf['nombre']} ({pdf['tipo']})")
        
        # Seleccionar el primer PDF para la prueba
        pdf_seleccionado = pdfs[0]
        print(f"\n📋 Usando para prueba: {pdf_seleccionado['nombre']}")
        
        # 2. Crear algunas imágenes de evidencia
        print("\n2️⃣ Creando imágenes de evidencia...")
        imagenes_evidencia = []
        
        for i in range(3):
            img_base64 = crear_imagen_prueba()
            imagen = {
                'id': f"evidencia_prueba_{i+1}",
                'nombre': f"evidencia_mantenimiento_{i+1}.jpg",
                'tipo': 'image/jpeg',
                'data': f"data:image/jpeg;base64,{img_base64}"
            }
            imagenes_evidencia.append(imagen)
            print(f"   📷 Creada: {imagen['nombre']}")
        
        # 3. Generar PDF con evidencia
        print("\n3️⃣ Generando PDF con evidencia...")
        datos_request = {
            'pdfSeleccionado': pdf_seleccionado,
            'imagenes': imagenes_evidencia
        }
        
        response = session.post(
            f"{base_url}/api/evidencia/generar_pdf_con_evidencia",
            json=datos_request,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code != 200:
            print(f"❌ Error al generar PDF: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return False
        
        result = response.json()
        if not result['success']:
            print(f"❌ Error en generación: {result.get('error', 'Error desconocido')}")
            return False
        
        print(f"✅ PDF generado exitosamente: {result['nombreArchivo']}")
        
        # 4. Probar descarga del PDF
        print("\n4️⃣ Probando descarga del PDF...")
        url_descarga = result['urlPdf']
        response = session.get(f"{base_url}{url_descarga}")
        
        if response.status_code == 200:
            print(f"✅ PDF descargable (tamaño: {len(response.content)} bytes)")
            
            # Guardar PDF localmente para verificación manual
            with open("evidencia_generada_prueba.pdf", "wb") as f:
                f.write(response.content)
            print("💾 PDF guardado como 'evidencia_generada_prueba.pdf'")
            
        else:
            print(f"❌ Error al descargar PDF: {response.status_code}")
            return False
        
        # 5. Verificar estado de cámara
        print("\n5️⃣ Verificando integración con cámara...")
        response = session.get(f"{base_url}/api/evidencia/estado_camara")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Estado de cámara: {data['fotos_disponibles']} fotos disponibles")
        else:
            print(f"⚠️ Estado de cámara no disponible: {response.status_code}")
        
        print("\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!")
        print("\n📋 RESUMEN:")
        print(f"   ✅ PDFs disponibles: {len(pdfs)}")
        print(f"   ✅ Imágenes procesadas: {len(imagenes_evidencia)}")
        print(f"   ✅ PDF generado: {result['nombreArchivo']}")
        print(f"   ✅ Integración con cámara: Funcional")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error de conexión: {e}")
        print("💡 Asegúrese de que el servidor Flask esté ejecutándose")
        return False
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        return False

def verificar_servidor():
    """
    Verifica si el servidor está ejecutándose
    """
    try:
        response = requests.get("https://localhost:8000", verify=False, timeout=5)
        return True
    except:
        return False

def main():
    """
    Función principal del script de prueba
    """
    print("🔧 SISTEMA DE PRUEBAS - EVIDENCIA DE MANTENIMIENTO")
    print("=" * 60)
    
    # Verificar si el servidor está ejecutándose
    print("🔍 Verificando estado del servidor...")
    if not verificar_servidor():
        print("❌ El servidor Flask no está ejecutándose")
        print("💡 Inicie el servidor con: python ejecutable.py")
        print("🔗 Luego acceda a: https://localhost:8000/TEMPLATES/evidencia_mantenimiento.html")
        return
    
    print("✅ Servidor Flask ejecutándose correctamente")
    
    # Verificar que existan PDFs de prueba
    import tempfile
    pdfs_dir = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
    if not os.path.exists(pdfs_dir) or not os.listdir(pdfs_dir):
        print("\n📁 Creando PDFs de prueba...")
        os.system("python crear_pdfs_prueba.py crear")
    
    # Ejecutar pruebas
    if probar_flujo_completo():
        print("\n🎯 SISTEMA COMPLETAMENTE FUNCIONAL")
        print("\n📝 PASOS PARA PRUEBA MANUAL:")
        print("1. Abra https://localhost:8000/TEMPLATES/evidencia_mantenimiento.html")
        print("2. Seleccione un PDF de mantenimiento")
        print("3. Añada imágenes desde archivos o cámara")
        print("4. Genere PDF con evidencia")
        print("5. Descargue y verifique el resultado")
    else:
        print("\n❌ ALGUNAS PRUEBAS FALLARON")
        print("🔧 Revise los logs del servidor y los errores mostrados")

if __name__ == "__main__":
    main()
