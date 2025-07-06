#!/usr/bin/env python3
"""
Script de verificación para la integración del sistema de cámara
con evidencia de mantenimiento.

Este script prueba las nuevas funcionalidades sin afectar el sistema principal.
"""

import requests
import json
import time

def probar_integracion_camara():
    """
    Prueba las APIs de integración con la cámara
    """
    print("🔍 Iniciando pruebas de integración cámara-evidencia...")
    
    base_url = "https://localhost:8000"  # Ajustar según la configuración
    
    # Configurar sesión para manejar cookies
    session = requests.Session()
    session.verify = False  # Para certificados auto-firmados
    
    try:
        # 1. Probar verificación de estado de cámara
        print("\n1️⃣ Probando verificación de estado de cámara...")
        response = session.get(f"{base_url}/api/evidencia/estado_camara")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Estado obtenido: {data['fotos_disponibles']} fotos disponibles")
        else:
            print(f"   ❌ Error al obtener estado: {response.status_code}")
            return False
        
        # 2. Probar sincronización de fotos (sin fotos reales)
        print("\n2️⃣ Probando API de sincronización...")
        sync_data = {"pdf_id": "test_pdf_123"}
        response = session.post(
            f"{base_url}/api/evidencia/sincronizar_fotos_camara",
            json=sync_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Sincronización respondió: {data['message']}")
        else:
            print(f"   ❌ Error en sincronización: {response.status_code}")
            return False
        
        # 3. Probar listado de PDFs de mantenimiento
        print("\n3️⃣ Probando listado de PDFs de mantenimiento...")
        response = session.get(f"{base_url}/api/evidencia/obtener_pdfs_mantenimiento")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ PDFs obtenidos: {len(data.get('pdfs', []))} PDFs disponibles")
        else:
            print(f"   ❌ Error al obtener PDFs: {response.status_code}")
            return False
        
        print("\n🎉 ¡Todas las pruebas de API pasaron correctamente!")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error de conexión: {e}")
        print("💡 Asegúrese de que el servidor Flask esté ejecutándose")
        return False
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        return False

def verificar_archivos_frontend():
    """
    Verifica que los archivos frontend tengan las modificaciones correctas
    """
    print("\n🔍 Verificando archivos frontend...")
    
    archivos_requeridos = [
        "TEMPLATES/evidencia_mantenimiento.html",
        "RESOURCE/JS/evidencia_mantenimiento.js", 
        "RESOURCE/CSS/evidencia_mantenimiento.css"
    ]
    
    funciones_requeridas = [
        "abrirCamara",
        "importarFotosCamara", 
        "sincronizarFotosCamara",
        "verificarEstadoCamara",
        "actualizarEstadoCamara"
    ]
    
    elementos_html_requeridos = [
        "btn-camara",
        "btn-importar-camara", 
        "btn-sincronizar",
        "estado-camara"
    ]
    
    try:
        # Verificar archivo JavaScript
        with open("RESOURCE/JS/evidencia_mantenimiento.js", 'r', encoding='utf-8') as f:
            js_content = f.read()
            
        for funcion in funciones_requeridas:
            if f"function {funcion}" in js_content:
                print(f"   ✅ Función {funcion} encontrada")
            else:
                print(f"   ❌ Función {funcion} NO encontrada")
                return False
        
        # Verificar archivo HTML
        with open("TEMPLATES/evidencia_mantenimiento.html", 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        for elemento in elementos_html_requeridos:
            if elemento in html_content:
                print(f"   ✅ Elemento {elemento} encontrado en HTML")
            else:
                print(f"   ❌ Elemento {elemento} NO encontrado en HTML")
                return False
        
        print("\n🎉 ¡Todos los archivos frontend están correctos!")
        return True
        
    except FileNotFoundError as e:
        print(f"\n❌ Archivo no encontrado: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Error al verificar archivos: {e}")
        return False

def main():
    """
    Función principal del script de verificación
    """
    print("🚀 VERIFICACIÓN DE INTEGRACIÓN CÁMARA-EVIDENCIA")
    print("=" * 50)
    
    # Verificar archivos frontend
    frontend_ok = verificar_archivos_frontend()
    
    if frontend_ok:
        print("\n" + "=" * 50)
        # Verificar APIs del backend
        backend_ok = probar_integracion_camara()
        
        if backend_ok:
            print("\n🎯 RESULTADO FINAL: ¡INTEGRACIÓN EXITOSA!")
            print("\n📋 PASOS SIGUIENTES:")
            print("   1. Probar manualmente desde el navegador")
            print("   2. Seleccionar un PDF de mantenimiento")
            print("   3. Hacer clic en 'Abrir Cámara'")
            print("   4. Tomar algunas fotos de prueba")
            print("   5. Regresar y probar 'Importar de Cámara'")
        else:
            print("\n⚠️ RESULTADO: Archivos OK, pero APIs con problemas")
    else:
        print("\n❌ RESULTADO: Problemas en archivos frontend")
        
    print("\n" + "=" * 50)

if __name__ == "__main__":
    main()
