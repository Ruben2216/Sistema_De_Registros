#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de reparación para el error de usuarios_activos en producción
Ejecutar en la consola Bash de PythonAnywhere: python3.10 fix_usuarios_activos.py
"""

import os
import json
import tempfile
import datetime

def reparar_usuarios_activos():
    """
    Repara el archivo de usuarios activos y asegura que esté bien formateado
    """
    usuarios_activos_file = os.path.join(tempfile.gettempdir(), 'rij_usuarios_activos.json')
    
    print(f"🔧 Iniciando reparación de usuarios activos...")
    print(f"📁 Archivo: {usuarios_activos_file}")
    
    try:
        # Verificar si el archivo existe
        if os.path.exists(usuarios_activos_file):
            print(f"✅ Archivo encontrado")
            
            # Intentar cargar el archivo
            try:
                with open(usuarios_activos_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                print(f"✅ Archivo JSON válido con {len(data)} usuarios")
                
                # Verificar estructura de cada usuario
                usuarios_reparados = {}
                for sid, info in data.items():
                    if isinstance(info, dict):
                        # Reparar timestamp si es necesario
                        if 'timestamp' in info:
                            if isinstance(info['timestamp'], str):
                                try:
                                    info['timestamp'] = datetime.datetime.fromisoformat(info['timestamp']).isoformat()
                                except:
                                    info['timestamp'] = datetime.datetime.now().isoformat()
                        else:
                            info['timestamp'] = datetime.datetime.now().isoformat()
                        
                        # Asegurar campos requeridos
                        info.setdefault('datos_sesion', True)
                        info.setdefault('fotos_guardadas', True)
                        info.setdefault('pdf_generado', True)
                        
                        usuarios_reparados[sid] = info
                
                # Guardar archivo reparado
                with open(usuarios_activos_file, 'w', encoding='utf-8') as f:
                    json.dump(usuarios_reparados, f, indent=2)
                
                print(f"✅ Archivo reparado exitosamente")
                return True
                
            except json.JSONDecodeError as e:
                print(f"❌ Error JSON: {e}")
                print(f"🔧 Creando archivo nuevo...")
                
        else:
            print(f"📁 Archivo no existe, creando nuevo...")
        
        # Crear archivo nuevo si no existe o está corrupto
        usuarios_nuevos = {}
        with open(usuarios_activos_file, 'w', encoding='utf-8') as f:
            json.dump(usuarios_nuevos, f, indent=2)
        
        print(f"✅ Archivo de usuarios activos creado/reparado")
        return True
        
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def verificar_permisos():
    """
    Verifica que se tengan permisos de escritura en el directorio temporal
    """
    temp_dir = tempfile.gettempdir()
    print(f"📁 Directorio temporal: {temp_dir}")
    
    try:
        # Probar crear archivo de prueba
        test_file = os.path.join(temp_dir, 'test_permisos.txt')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        print(f"✅ Permisos de escritura OK")
        return True
    except Exception as e:
        print(f"❌ Error de permisos: {e}")
        return False

def main():
    """
    Función principal del script de reparación
    """
    print("🚀 Script de Reparación - Usuarios Activos")
    print("=" * 50)
    
    # Verificar permisos
    if not verificar_permisos():
        print("❌ No se pueden reparar los permisos. Contactar administrador.")
        return False
    
    # Reparar usuarios activos
    if reparar_usuarios_activos():
        print("\n✅ Reparación completada exitosamente!")
        print("\n📋 Próximos pasos:")
        print("1. Ir a tu Web App en PythonAnywhere")
        print("2. Hacer clic en 'Reload' (botón verde)")
        print("3. Probar la aplicación nuevamente")
        print("\n🌐 URL: https://TU_USUARIO.pythonanywhere.com")
        return True
    else:
        print("\n❌ Reparación falló")
        return False

if __name__ == "__main__":
    main()
