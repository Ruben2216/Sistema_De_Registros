#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para diagnosticar el error 500 en guardar_pdf_mantenimiento
"""

import requests
import json
import base64

def probar_endpoint_guardar_pdf():
    """
    Prueba el endpoint de guardar PDF con datos simulados
    """
    print("=" * 60)
    print("DIAGNÓSTICO DE ENDPOINT guardar_pdf_mantenimiento")
    print("=" * 60)
    
    # URL base del servidor
    BASE_URL = "http://localhost:8000"  # o https://192.168.100.30:8000
    
    # Crear un PDF base64 simple para prueba
    pdf_simple = b'%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF'
    pdf_base64 = base64.b64encode(pdf_simple).decode('utf-8')
    pdf_datauri = f"data:application/pdf;base64,{pdf_base64}"
    
    # Casos de prueba
    casos_prueba = [
        {
            'nombre': 'Caso normal',
            'datos': {
                'pdf_base64': pdf_datauri,
                'nombre_archivo': 'test_mantenimiento.pdf',
                'tipo_mantenimiento': 'computo'
            }
        },
        {
            'nombre': 'Nombre de archivo None',
            'datos': {
                'pdf_base64': pdf_datauri,
                'nombre_archivo': None,
                'tipo_mantenimiento': 'computo'
            }
        },
        {
            'nombre': 'Nombre de archivo vacío',
            'datos': {
                'pdf_base64': pdf_datauri,
                'nombre_archivo': '',
                'tipo_mantenimiento': 'computo'
            }
        },
        {
            'nombre': 'Sin nombre de archivo',
            'datos': {
                'pdf_base64': pdf_datauri,
                'tipo_mantenimiento': 'computo'
            }
        },
        {
            'nombre': 'Sin PDF base64',
            'datos': {
                'nombre_archivo': 'test.pdf',
                'tipo_mantenimiento': 'computo'
            }
        },
        {
            'nombre': 'Datos vacíos',
            'datos': {}
        },
        {
            'nombre': 'Sin datos',
            'datos': None
        }
    ]
    
    for i, caso in enumerate(casos_prueba):
        print(f"\n{i+1}. PROBANDO: {caso['nombre']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/evidencia/guardar_pdf_mantenimiento",
                json=caso['datos'],
                timeout=10
            )
            
            print(f"   Status: {response.status_code}")
            
            try:
                result = response.json()
                print(f"   Respuesta: {result}")
            except:
                print(f"   Respuesta (texto): {response.text[:200]}...")
                
        except requests.exceptions.RequestException as e:
            print(f"   Error de conexión: {e}")
    
    print(f"\n" + "=" * 60)
    print("DIAGNÓSTICO COMPLETADO")
    print("=" * 60)

def verificar_directorio_temporal():
    """
    Verifica que el directorio temporal de PDFs existe
    """
    import tempfile
    import os
    
    print("\nVERIFICACIÓN DE DIRECTORIO TEMPORAL:")
    
    PDFS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
    
    print(f"Directorio: {PDFS_MANTENIMIENTO_DIR}")
    print(f"Existe: {os.path.exists(PDFS_MANTENIMIENTO_DIR)}")
    
    if os.path.exists(PDFS_MANTENIMIENTO_DIR):
        archivos = os.listdir(PDFS_MANTENIMIENTO_DIR)
        print(f"Archivos: {len(archivos)}")
        for archivo in archivos[:5]:  # Mostrar solo los primeros 5
            print(f"  - {archivo}")
    else:
        print("⚠ Directorio no existe, se creará automáticamente")

if __name__ == "__main__":
    verificar_directorio_temporal()
    
    # Solo probar endpoint si hay un servidor corriendo
    try:
        response = requests.get("http://localhost:8000", timeout=2)
        print("\n🟢 Servidor detectado en puerto 8000")
        probar_endpoint_guardar_pdf()
    except:
        try:
            response = requests.get("https://192.168.100.30:8000", timeout=2, verify=False)
            print("\n🟢 Servidor detectado en 192.168.100.30:8000")
            # Cambiar BASE_URL en la función si es necesario
            probar_endpoint_guardar_pdf()
        except:
            print("\n🔴 No se detectó servidor corriendo")
            print("Inicia el servidor con: python ejecutable.py")
