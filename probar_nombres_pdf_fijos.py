#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de prueba para verificar que los nombres de PDF se respeten exactamente
desde la generación hasta la visualización en evidencia_mantenimiento.html

Autor: Asistente AI
Fecha: 7 de julio, 2025
"""

import requests
import json
import base64
import time
import os

def probar_flujo_nombres_pdf():
    """
    Prueba que un PDF con nombre personalizado se mantenga exactamente igual
    desde la generación hasta la visualización en evidencia
    """
    
    print("=== PRUEBA DE NOMBRES PDF FIJOS ===")
    print("Verificando que el nombre del PDF se respete en todo el flujo...")
    print()
    
    # URL base del servidor
    BASE_URL = "http://localhost:5000"
    
    # Nombre de prueba que debe conservarse exactamente
    nombre_prueba = "hola"
    
    # Simular un PDF básico para la prueba
    pdf_content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n184\n%%EOF'
    pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
    pdf_datauri = f"data:application/pdf;base64,{pdf_base64}"
    
    print(f"1. Enviando PDF con nombre personalizado: '{nombre_prueba}.pdf'")
    
    # Datos para enviar al servidor
    datos_pdf = {
        "pdf_base64": pdf_datauri,
        "nombre_archivo": f"{nombre_prueba}.pdf",
        "tipo_mantenimiento": "TPS_HONEYWELL"
    }
    
    try:
        # Enviar PDF al servidor
        response = requests.post(
            f"{BASE_URL}/api/evidencia/guardar_pdf_mantenimiento",
            json=datos_pdf,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                print(f"   ✓ PDF enviado correctamente")
                print(f"   ✓ ID asignado: {result['pdf_id']}")
                print(f"   ✓ Nombre guardado: {result.get('nombre_guardado', 'No especificado')}")
                print(f"   ✓ Archivo guardado como: {result['nombre_archivo']}")
                
                # Esperar un momento para que el archivo se guarde
                time.sleep(1)
                
                print("\n2. Verificando que el PDF aparece en la lista con el nombre correcto...")
                
                # Obtener lista de PDFs
                response_lista = requests.get(f"{BASE_URL}/api/evidencia/obtener_pdfs_mantenimiento")
                
                if response_lista.status_code == 200:
                    lista_result = response_lista.json()
                    if lista_result['success'] and lista_result['pdfs']:
                        
                        # Buscar nuestro PDF en la lista
                        pdf_encontrado = None
                        for pdf in lista_result['pdfs']:
                            if pdf['id'] == result['pdf_id']:
                                pdf_encontrado = pdf
                                break
                        
                        if pdf_encontrado:
                            print(f"   ✓ PDF encontrado en la lista")
                            print(f"   ✓ Nombre mostrado: '{pdf_encontrado['nombre']}'")
                            print(f"   ✓ Tipo: {pdf_encontrado['tipo']}")
                            
                            # Verificar que el nombre coincide exactamente
                            if pdf_encontrado['nombre'] == nombre_prueba:
                                print(f"   ✅ ¡ÉXITO! El nombre se respeta exactamente: '{nombre_prueba}'")
                                return True
                            else:
                                print(f"   ❌ ERROR: El nombre no coincide")
                                print(f"      Esperado: '{nombre_prueba}'")
                                print(f"      Obtenido: '{pdf_encontrado['nombre']}'")
                                return False
                        else:
                            print(f"   ❌ ERROR: PDF no encontrado en la lista")
                            return False
                    else:
                        print(f"   ❌ ERROR: No se pudieron obtener los PDFs o la lista está vacía")
                        return False
                else:
                    print(f"   ❌ ERROR: No se pudo obtener la lista de PDFs (status: {response_lista.status_code})")
                    return False
            else:
                print(f"   ❌ ERROR del servidor: {result.get('error', 'Error desconocido')}")
                return False
        else:
            print(f"   ❌ ERROR HTTP: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ ERROR de conexión: {e}")
        print("   Asegúrese de que el servidor esté ejecutándose en http://localhost:5000")
        return False

def main():
    """Función principal"""
    
    print("Iniciando prueba del flujo de nombres de PDF...")
    print("=" * 60)
    
    # Probar con diferentes nombres
    nombres_prueba = ["hola", "QUO_SIT_VOLUPTAS_INC", "Mantenimiento Computadora", "TPS-001"]
    
    resultados = []
    
    for nombre in nombres_prueba:
        print(f"\nProbando con nombre: '{nombre}'")
        print("-" * 40)
        
        # Modificar el nombre de prueba
        global nombre_prueba
        nombre_prueba = nombre
        
        resultado = probar_flujo_nombres_pdf()
        resultados.append((nombre, resultado))
        
        # Esperar entre pruebas
        time.sleep(2)
    
    # Mostrar resumen
    print("\n" + "=" * 60)
    print("RESUMEN DE RESULTADOS:")
    print("=" * 60)
    
    exitosos = 0
    for nombre, resultado in resultados:
        estado = "✅ ÉXITO" if resultado else "❌ FALLO"
        print(f"  {nombre:<25} : {estado}")
        if resultado:
            exitosos += 1
    
    print(f"\nTotal exitosos: {exitosos}/{len(resultados)}")
    
    if exitosos == len(resultados):
        print("\n🎉 ¡Todos los nombres se respetan correctamente!")
    else:
        print(f"\n⚠️  Hay {len(resultados) - exitosos} casos que fallan.")
        print("   Revisar la lógica del backend o frontend.")

if __name__ == "__main__":
    main()
