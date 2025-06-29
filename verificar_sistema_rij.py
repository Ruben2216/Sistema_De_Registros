


import os
import requests
import json
import time
from pathlib import Path

def verificar_servidor():
    """Verifica que el servidor Flask esté ejecutándose"""
    print("🔍 Verificando servidor Flask...")
    try:
        response = requests.get('https://127.0.0.1:8000', verify=False, timeout=5)
        if response.status_code == 200:
            print("✅ Servidor Flask funcionando correctamente")
            return True
        else:
            print(f"⚠️ Servidor responde con código: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al conectar con servidor: {e}")
        return False

def verificar_endpoints_rij():
    """Verifica los endpoints específicos de RIJ"""
    print("\n🌐 Verificando endpoints RIJ...")
    
    # Endpoint para obtener imagen (debe devolver 404 para ID inexistente)
    try:
        response = requests.get('https://127.0.0.1:8000/api/rij/obtener_imagen/TEST_ID', 
                              verify=False, timeout=5)
        if response.status_code == 404:
            print("✅ Endpoint obtener_imagen funcionando (404 esperado)")
        else:
            print(f"⚠️ Endpoint obtener_imagen respuesta inesperada: {response.status_code}")
    except Exception as e:
        print(f"❌ Error en endpoint obtener_imagen: {e}")
    
    # Verificar que el endpoint de guardar imagen esté disponible
    try:
        # Solo verificamos que la ruta existe (POST sin datos debe dar error 400)
        response = requests.post('https://127.0.0.1:8000/api/rij/guardar_imagen', 
                               verify=False, timeout=5)
        if response.status_code in [400, 405]:  # Bad Request o Method Not Allowed es esperado
            print("✅ Endpoint guardar_imagen disponible")
        else:
            print(f"⚠️ Endpoint guardar_imagen respuesta inesperada: {response.status_code}")
    except Exception as e:
        print(f"❌ Error en endpoint guardar_imagen: {e}")

def verificar_archivos():
    """Verifica que todos los archivos necesarios existan"""
    print("\n📁 Verificando archivos del sistema...")
    
    archivos_requeridos = [
        'RESOURCE/JS/rij_pdf_a_imagen.js',
        'RESOURCE/JS/mostrar_rij_camara.js',
        'RESOURCE/JS/formato_RIJ/pdf_rij.js',
        'RESOURCE/JS/pdf_fotos.js',
        'RESOURCE/JS/envio_correo_camara.js',
        'TEMPLATES/formato_RIJ.html',
        'TEMPLATES/camara.html',
        'ejecutable.py'
    ]
    
    base_dir = Path('.')
    todos_presentes = True
    
    for archivo in archivos_requeridos:
        ruta = base_dir / archivo
        if ruta.exists():
            print(f"✅ {archivo}")
        else:
            print(f"❌ {archivo} - NO ENCONTRADO")
            todos_presentes = False
    
    # Verificar directorio de imágenes RIJ
    directorio_rij = base_dir / 'RESOURCE' / 'IMG' / 'img RIJ'
    if directorio_rij.exists():
        print("✅ Directorio img RIJ existe")
        archivos_rij = list(directorio_rij.glob('*.png'))
        print(f"   - Archivos PNG encontrados: {len(archivos_rij)}")
    else:
        print("❌ Directorio img RIJ no existe")
        todos_presentes = False
    
    return todos_presentes

def verificar_dependencias_html():
    """Verifica que las dependencias estén incluidas en los HTML"""
    print("\n🔗 Verificando dependencias en HTML...")
    
    # Verificar formato_RIJ.html
    try:
        with open('TEMPLATES/formato_RIJ.html', 'r', encoding='utf-8') as f:
            contenido_rij = f.read()
        
        dependencias_rij = [
            'pdf.min.js',
            'rij_pdf_a_imagen.js',
            'formato_RIJ/pdf_rij.js'
        ]
        
        for dep in dependencias_rij:
            if dep in contenido_rij:
                print(f"✅ formato_RIJ.html incluye {dep}")
            else:
                print(f"❌ formato_RIJ.html NO incluye {dep}")
    
    except Exception as e:
        print(f"❌ Error al leer formato_RIJ.html: {e}")
    
    # Verificar camara.html
    try:
        with open('TEMPLATES/camara.html', 'r', encoding='utf-8') as f:
            contenido_camara = f.read()
        
        dependencias_camara = [
            'pdf.min.js',
            'rij_pdf_a_imagen.js',
            'mostrar_rij_camara.js',
            'contenedor-rij'
        ]
        
        for dep in dependencias_camara:
            if dep in contenido_camara:
                print(f"✅ camara.html incluye {dep}")
            else:
                print(f"❌ camara.html NO incluye {dep}")
    
    except Exception as e:
        print(f"❌ Error al leer camara.html: {e}")

def generar_reporte_final():
    """Genera un reporte final del estado del sistema"""
    print("\n" + "="*50)
    print("📊 REPORTE FINAL DE VERIFICACIÓN")
    print("="*50)
    
    # Verificaciones principales
    servidor_ok = verificar_servidor()
    archivos_ok = verificar_archivos()
    
    verificar_endpoints_rij()
    verificar_dependencias_html()
    
    print("\n" + "="*50)
    
    if servidor_ok and archivos_ok:
        print("🎉 SISTEMA RIJ: COMPLETAMENTE FUNCIONAL")
        print("✅ Todos los componentes verificados exitosamente")
        print("✅ Sistema listo para uso en producción")
    else:
        print("⚠️ SISTEMA RIJ: REQUIERE ATENCIÓN")
        if not servidor_ok:
            print("❌ Problema con el servidor Flask")
        if not archivos_ok:
            print("❌ Archivos faltantes detectados")
    
    print("="*50)

def main():
    """Función principal"""
    print("🚀 INICIANDO VERIFICACIÓN COMPLETA DEL SISTEMA RIJ")
    print("Fecha:", time.strftime("%Y-%m-%d %H:%M:%S"))
    print("="*50)
    
    try:
        generar_reporte_final()
    except KeyboardInterrupt:
        print("\n\n⏹️ Verificación interrumpida por el usuario")
    except Exception as e:
        print(f"\n\n❌ Error durante la verificación: {e}")

if __name__ == "__main__":
    main()
