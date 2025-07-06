#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prueba directa del endpoint problemático
"""

import requests
import json
import urllib3

# Desactivar advertencias SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def probar_endpoint():
    print("Probando endpoint con datos del error...")
    
    # PDF base64 mínimo válido
    pdf_base64 = "JVBERi0xLjMKJeLjz9MKNCAwIG9iago8PAovQ3JlYXRvciAoUmVwb3J0TGFiIFBERiBMaWJyYXJ5KQo+PgplbmRvYmoKDQp4cmVmCjAgMQowMDAwMDAwMDAwIDY1NTM1IGYgCnRyYWlsZXIKPDwKL1NpemUgMQo+PgpzdGFydHhyZWYKOTQKJSVFT0YK"
    
    # Datos que están causando el error
    datos = {
        'pdf_base64': f'data:application/pdf;base64,{pdf_base64}',
        'nombre_archivo': 'SEQUI_QUIS_RERUM_CUL.pdf',
        'tipo_mantenimiento': 'computo'
    }
    
    try:
        # Probar con la IP que aparece en el error
        response = requests.post(
            'https://192.168.100.30:8000/api/evidencia/guardar_pdf_mantenimiento',
            json=datos,
            headers={'Content-Type': 'application/json'},
            verify=False,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Respuesta: {response.text}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"Error en petición: {e}")
        return False

if __name__ == "__main__":
    probar_endpoint()
