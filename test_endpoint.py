#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para probar el endpoint de conversión PDF a imagen
"""

import requests
import json
import base64
import os

# URL del endpoint
url = "https://127.0.0.1:8000/api/rij/convertir_pdf_imagen"

# Leer un PDF de prueba (si existe) o crear datos de prueba
try:
    # Intentar leer el PDF RIJ si existe
    pdf_path = r"c:\Users\Ruben Clemente\Desktop\Sistema_Registros\RESOURCE\RIJ ENE A DIC 2025.pdf"
    if os.path.exists(pdf_path):
        with open(pdf_path, 'rb') as f:
            pdf_data = f.read()
        pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
        print(f"PDF leído correctamente, tamaño: {len(pdf_data)} bytes")
    else:
        # Crear un PDF muy simple para prueba
        print("No se encontró el PDF, creando datos de prueba")
        pdf_base64 = "JVBERi0xLjQKJcOkw7zDtsKjDQo="  # PDF vacío mínimo
        
    # Datos de prueba
    data = {
        "pdf_base64": pdf_base64,
        "identificador": "test_endpoint_12345"
    }
    
    print("Enviando petición al endpoint...")
    print(f"Tamaño del PDF base64: {len(pdf_base64)} caracteres")
    
    # Hacer la petición
    response = requests.post(url, json=data, verify=False)
    
    print(f"Código de respuesta: {response.status_code}")
    print(f"Respuesta: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Conversión exitosa: {result}")
    else:
        print(f"Error en la conversión: {response.text}")
        
except Exception as e:
    print(f"Error en el script de prueba: {e}")
