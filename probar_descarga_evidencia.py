#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de prueba para simular el flujo completo de generación y descarga de PDFs con evidencia
"""

import requests
import json
import base64
import io
import os
import tempfile
from PIL import Image

def probar_flujo_completo():
    """
    Prueba el flujo completo de generación y descarga de PDF con evidencia
    """
    print("=" * 60)
    print("PRUEBA DEL FLUJO COMPLETO DE EVIDENCIA")
    print("=" * 60)
    
    # URL base del servidor (ajustar según sea necesario)
    BASE_URL = "http://localhost:5000"  # o la URL donde esté corriendo el servidor
    
    try:
        # 1. Verificar que el servidor esté funcionando
        print("\n1. Verificando conexión al servidor...")
        try:
            response = requests.get(f"{BASE_URL}/api/evidencia/listar_pdfs", timeout=5)
            if response.status_code == 200:
                pdfs_disponibles = response.json()
                print(f"   ✓ Servidor respondiendo, PDFs disponibles: {len(pdfs_disponibles.get('pdfs', []))}")
                
                if pdfs_disponibles.get('pdfs'):
                    pdf_seleccionado = pdfs_disponibles['pdfs'][0]
                    print(f"   ✓ Usando PDF: {pdf_seleccionado['nombre']}")
                else:
                    print("   ✗ No hay PDFs disponibles para probar")
                    return
            else:
                print(f"   ✗ Error al conectar: {response.status_code}")
                return
        except requests.exceptions.RequestException as e:
            print(f"   ✗ No se puede conectar al servidor: {e}")
            print("   ℹ Asegúrate de que el servidor esté corriendo en el puerto 5000")
            return
        
        # 2. Crear imagen de prueba
        print("\n2. Creando imagen de evidencia de prueba...")
        imagen_base64 = crear_imagen_prueba()
        if imagen_base64:
            print("   ✓ Imagen de prueba creada")
        else:
            print("   ✗ Error al crear imagen de prueba")
            return
        
        # 3. Generar PDF con evidencia
        print("\n3. Generando PDF con evidencia...")
        datos_generacion = {
            'pdfSeleccionado': pdf_seleccionado,
            'imagenes': [{
                'nombre': 'prueba_evidencia.jpg',
                'data': imagen_base64
            }]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/evidencia/generar_pdf_con_evidencia",
            json=datos_generacion,
            timeout=30
        )
        
        if response.status_code == 200:
            resultado = response.json()
            if resultado.get('success'):
                print(f"   ✓ PDF generado exitosamente")
                print(f"   ✓ Archivo: {resultado['nombreArchivo']}")
                print(f"   ✓ URL: {resultado['urlPdf']}")
                
                # 4. Intentar descargar el PDF generado
                print("\n4. Probando descarga del PDF generado...")
                url_descarga = f"{BASE_URL}{resultado['urlPdf']}"
                
                response_descarga = requests.get(url_descarga, timeout=10)
                
                if response_descarga.status_code == 200:
                    print(f"   ✓ PDF descargado exitosamente")
                    print(f"   ✓ Tamaño: {len(response_descarga.content)} bytes")
                    print(f"   ✓ Content-Type: {response_descarga.headers.get('Content-Type', 'No especificado')}")
                    
                    # Guardar archivo para verificación
                    with open('pdf_evidencia_descargado.pdf', 'wb') as f:
                        f.write(response_descarga.content)
                    print(f"   ✓ Archivo guardado como 'pdf_evidencia_descargado.pdf'")
                    
                else:
                    print(f"   ✗ Error al descargar: {response_descarga.status_code}")
                    try:
                        error_info = response_descarga.json()
                        print(f"   ✗ Detalles del error: {error_info}")
                    except:
                        print(f"   ✗ Respuesta: {response_descarga.text}")
            else:
                print(f"   ✗ Error en generación: {resultado.get('error', 'Error desconocido')}")
        else:
            print(f"   ✗ Error HTTP en generación: {response.status_code}")
            try:
                error_info = response.json()
                print(f"   ✗ Detalles: {error_info}")
            except:
                print(f"   ✗ Respuesta: {response.text}")
    
    except Exception as e:
        print(f"\n✗ Error general en la prueba: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("PRUEBA COMPLETADA")
    print("=" * 60)

def crear_imagen_prueba():
    """
    Crea una imagen de prueba y la convierte a base64
    """
    try:
        # Crear imagen simple con texto
        img = Image.new('RGB', (800, 600), color='white')
        
        # Agregar algo de contenido visual simple
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        
        # Usar fuente por defecto
        try:
            # Intentar usar una fuente del sistema
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            # Usar fuente por defecto si no hay Arial
            font = ImageFont.load_default()
        
        draw.text((50, 50), "EVIDENCIA DE PRUEBA", fill='black', font=font)
        draw.text((50, 100), "Esta es una imagen de prueba", fill='gray', font=font)
        draw.text((50, 150), f"Generada automáticamente", fill='blue', font=font)
        
        # Agregar algunos elementos gráficos
        draw.rectangle([50, 200, 750, 500], outline='red', width=3)
        draw.ellipse([300, 250, 500, 450], outline='green', width=2)
        
        # Convertir a base64
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        img_bytes = buffer.getvalue()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        return f"data:image/jpeg;base64,{img_base64}"
        
    except Exception as e:
        print(f"Error al crear imagen: {e}")
        return None

def verificar_servidor_local():
    """
    Verifica si hay un servidor corriendo localmente y en qué puerto
    """
    puertos_comunes = [5000, 8000, 8080, 3000]
    
    print("Verificando servidores locales...")
    for puerto in puertos_comunes:
        try:
            response = requests.get(f"http://localhost:{puerto}", timeout=2)
            print(f"   Puerto {puerto}: ✓ Servidor respondiendo")
            return puerto
        except requests.exceptions.RequestException:
            print(f"   Puerto {puerto}: ✗ No hay respuesta")
    
    return None

if __name__ == "__main__":
    # Primero verificar si hay un servidor corriendo
    puerto = verificar_servidor_local()
    
    if puerto:
        print(f"\nUsando servidor en puerto {puerto}")
        probar_flujo_completo()
    else:
        print("\n⚠ No se detectó ningún servidor corriendo.")
        print("Para probar, primero ejecuta el servidor con:")
        print("python ejecutable.py")
        print("\nLuego ejecuta este script nuevamente.")
