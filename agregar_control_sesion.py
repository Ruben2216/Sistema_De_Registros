
import os
import re

def agregar_control_sesion_a_archivo(ruta_archivo):
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Verificar si ya tiene el script
        if 'control_sesion.js' in contenido:
            print(f" {os.path.basename(ruta_archivo)} ya tiene el control de sesión")
            return
        
        # Buscar la etiqueta de cierre </body>
        patron_body = r'(\s*</body>\s*</html>)'
        
        if re.search(patron_body, contenido):
            # Insertar el script antes del cierre del body
            nuevo_script = '\n    <!-- Sistema de Control de Sesión -->\n    <script src="/RESOURCE/JS/control_sesion.js"></script>\n'
            contenido_nuevo = re.sub(patron_body, nuevo_script + r'\1', contenido)
            
            # Escribir el archivo actualizado
            with open(ruta_archivo, 'w', encoding='utf-8') as f:
                f.write(contenido_nuevo)
            
        else:
            print(f" No se pudo encontrar </body> en {os.path.basename(ruta_archivo)}")
            
    except Exception as e:
        print(f" Error procesando {ruta_archivo}: {e}")

def main():
    """Función principal"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    carpeta_mantenimiento = os.path.join(base_dir, 'TEMPLATES', 'Mantenimiento')
    
    if not os.path.exists(carpeta_mantenimiento):
        print(f"❌ No se encontró la carpeta {carpeta_mantenimiento}")
        return
    
    print("🔐 Agregando control de sesión a páginas de mantenimiento...\n")
    
    # Procesar todos los archivos HTML en la carpeta de mantenimiento
    archivos_html = [f for f in os.listdir(carpeta_mantenimiento) if f.endswith('.html')]
    
    for archivo in archivos_html:
        ruta_completa = os.path.join(carpeta_mantenimiento, archivo)
        agregar_control_sesion_a_archivo(ruta_completa)
    
    print(f"\n✅ Procesamiento completado. {len(archivos_html)} archivos procesados.")

if __name__ == '__main__':
    main()
