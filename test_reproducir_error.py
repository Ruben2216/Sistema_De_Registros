#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test específico que reproduce exactamente la petición del frontend
"""

import requests
import json
import urllib3
import base64

# Desactivar advertencias SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def generar_pdf_base64_valido():
    """Genera un PDF válido en base64"""
    # PDF mínimo válido (estructura PDF básica)
    pdf_content = """%PDF-1.3
%
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Count 1
/Kids [3 0 R]
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
398
%%EOF"""
    
    # Convertir a bytes y luego a base64
    pdf_bytes = pdf_content.encode('latin-1')
    return base64.b64encode(pdf_bytes).decode('utf-8')

def test_endpoint_exacto():
    """Test que reproduce exactamente la petición problemática"""
    print("=" * 60)
    print("TEST EXACTO DEL ENDPOINT")
    print("=" * 60)
    
    # Generar PDF válido
    pdf_base64 = generar_pdf_base64_valido()
    
    # Datos exactos como los del frontend
    datos = {
        'pdf_base64': f'data:application/pdf;base64,{pdf_base64}',
        'nombre_archivo': 'SEQUI_QUIS_RERUM_CUL.pdf',
        'tipo_mantenimiento': 'computo'
    }
    
    print(f"Enviando datos:")
    print(f"  nombre_archivo: {datos['nombre_archivo']}")
    print(f"  tipo_mantenimiento: {datos['tipo_mantenimiento']}")
    print(f"  pdf_base64 length: {len(datos['pdf_base64'])}")
    
    try:
        # Usar la misma URL que aparece en el error
        response = requests.post(
            'https://192.168.100.30:8000/api/evidencia/guardar_pdf_mantenimiento',
            json=datos,
            headers={'Content-Type': 'application/json'},
            verify=False,
            timeout=30
        )
        
        print(f"\nRespuesta:")
        print(f"  Status Code: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
        print(f"  Content: {response.text}")
        
        if response.status_code == 500:
            print(f"\n❌ ERROR 500 REPRODUCIDO!")
            try:
                error_data = response.json()
                print(f"  Error detallado: {error_data}")
            except:
                print(f"  Error text: {response.text}")
        elif response.status_code == 200:
            print(f"\n✅ ÉXITO - El endpoint funciona correctamente")
            try:
                success_data = response.json()
                print(f"  Datos respuesta: {success_data}")
            except:
                print(f"  Response text: {response.text}")
        else:
            print(f"\n⚠ Status Code inesperado: {response.status_code}")
        
        return response.status_code, response.text
        
    except requests.exceptions.ConnectinError as e:
        print(f"❌ Error de conexión: {e}")
        return None, str(e)
    except requests.exceptions.Timeout as e:
        print(f"❌ Timeout: {e}")
        return None, str(e)
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return None, str(e)

def test_con_diferentes_nombres():
    """Test con diferentes variaciones de nombres"""
    print("\n" + "=" * 60)
    print("TEST CON DIFERENTES NOMBRES")
    print("=" * 60)
    
    pdf_base64 = generar_pdf_base64_valido()
    
    nombres_test = [
        'SEQUI_QUIS_RERUM_CUL.pdf',
        'Evidencia_Test.pdf',
        'evidencia test con espacios.pdf',
        'evidencia-con-guiones.pdf',
        'evidencia_con_underscore.pdf',
        None,
        '',
        'archivo_ñ_especial.pdf'
    ]
    
    for nombre in nombres_test:
        print(f"\n--- Testing con nombre: {repr(nombre)} ---")
        
        datos = {
            'pdf_base64': f'data:application/pdf;base64,{pdf_base64}',
            'nombre_archivo': nombre,
            'tipo_mantenimiento': 'computo'
        }
        
        try:
            response = requests.post(
                'https://192.168.100.30:8000/api/evidencia/guardar_pdf_mantenimiento',
                json=datos,
                headers={'Content-Type': 'application/json'},
                verify=False,
                timeout=10
            )
            
            print(f"Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Error: {response.text[:200]}")
            else:
                print("✅ OK")
                
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    print("Reproducción exacta del error del frontend")
    print("Asegúrate de que el servidor esté corriendo en https://192.168.100.30:8000")
    
    # Test principal
    status, response = test_endpoint_exacto()
    
    # Test con diferentes nombres
    test_con_diferentes_nombres()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETADO")
    print("=" * 60)
