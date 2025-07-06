#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de verificación final para el sistema RIJ en PythonAnywhere
Verifica que todas las correcciones estén funcionando
"""

import os
import sys
import tempfile
import json

def verificar_usuarios_activos():
    """
    Verifica que la función de usuarios activos funcione correctamente
    """
    print("🔍 Verificando sistema de usuarios activos...")
    
    try:
        # Importar las funciones del sistema
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from ejecutable import cargar_usuarios_activos, get_usuarios_activos
        
        # Probar carga de usuarios activos
        usuarios = cargar_usuarios_activos()
        print(f"✅ cargar_usuarios_activos() funciona - Tipo: {type(usuarios)}")
        
        # Verificar que es un diccionario
        if isinstance(usuarios, dict):
            print(f"✅ Retorna diccionario válido con {len(usuarios)} usuarios")
        else:
            print(f"❌ No retorna diccionario: {type(usuarios)}")
            return False
        
        # Probar get_usuarios_activos
        usuarios2 = get_usuarios_activos()
        print(f"✅ get_usuarios_activos() funciona - Tipo: {type(usuarios2)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en verificación de usuarios activos: {e}")
        import traceback
        traceback.print_exc()
        return False

def verificar_importacion_ejecutable():
    """
    Verifica que ejecutable.py se pueda importar sin errores
    """
    print("\n🔍 Verificando importación de ejecutable.py...")
    
    try:
        # Intentar importar ejecutable
        from ejecutable import app
        print("✅ ejecutable.py se importa correctamente")
        
        # Verificar que Flask esté configurado
        print(f"✅ App Flask creada: {app}")
        print(f"✅ Template folder: {app.template_folder}")
        print(f"✅ Static folder: {app.static_folder}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al importar ejecutable.py: {e}")
        import traceback
        traceback.print_exc()
        return False

def verificar_registrar_actividad():
    """
    Verifica que la función registrar_actividad_usuario funcione
    """
    print("\n🔍 Verificando función registrar_actividad_usuario...")
    
    try:
        from ejecutable import registrar_actividad_usuario
        
        # Crear contexto de aplicación Flask para prueba
        from ejecutable import app
        with app.app_context():
            with app.test_request_context():
                sid = registrar_actividad_usuario()
                print(f"✅ registrar_actividad_usuario() funciona - SID: {sid}")
                return True
                
    except Exception as e:
        print(f"❌ Error en registrar_actividad_usuario: {e}")
        import traceback
        traceback.print_exc()
        return False

def verificar_archivos_templates():
    """
    Verifica que los templates se puedan encontrar
    """
    print("\n🔍 Verificando templates...")
    
    try:
        from ejecutable import app
        
        templates_a_verificar = [
            'formato_RIJ.html',
            'menu.html', 
            'login.html',
            'camara.html'
        ]
        
        with app.app_context():
            for template in templates_a_verificar:
                try:
                    # Intentar encontrar el template
                    template_path = app.jinja_env.get_template(template)
                    print(f"✅ {template} encontrado")
                except Exception as e:
                    print(f"❌ {template} no encontrado: {e}")
                    return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error al verificar templates: {e}")
        return False

def main():
    """
    Función principal de verificación
    """
    print("🔍 === VERIFICACIÓN FINAL DEL SISTEMA RIJ ===")
    print("=" * 50)
    
    resultados = []
    
    # 1. Verificar usuarios activos
    resultados.append(verificar_usuarios_activos())
    
    # 2. Verificar importación de ejecutable
    resultados.append(verificar_importacion_ejecutable())
    
    # 3. Verificar función de actividad
    resultados.append(verificar_registrar_actividad())
    
    # 4. Verificar templates
    resultados.append(verificar_archivos_templates())
    
    # Resumen final
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE VERIFICACIÓN:")
    
    exitosos = sum(resultados)
    total = len(resultados)
    
    if exitosos == total:
        print(f"✅ TODAS LAS VERIFICACIONES EXITOSAS ({exitosos}/{total})")
        print("🚀 El sistema está listo para funcionar")
        print("🔄 Haz reload de tu Web App en PythonAnywhere")
        return 0
    else:
        print(f"❌ ALGUNAS VERIFICACIONES FALLARON ({exitosos}/{total})")
        print("🔧 Revisa los errores anteriores y ejecuta reparar_sistema.py")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
