#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de verificación post-corrección para PythonAnywhere
Ejecutar después de aplicar las correcciones: python3.10 verificar_correccion.py
"""

import os
import sys
import json
import tempfile

def verificar_ejecutable():
    """
    Verifica que ejecutable.py se importe correctamente
    """
    print("🔍 Verificando importación de ejecutable.py...")
    
    try:
        # Agregar directorio actual al path
        sys.path.insert(0, '.')
        
        from ejecutable import app
        print("✅ ejecutable.py se importa correctamente")
        print(f"✅ App Flask creada: {type(app)}")
        
        # Verificar configuración básica
        if hasattr(app, 'secret_key') and app.secret_key:
            print("✅ Secret key configurada")
        else:
            print("⚠️ Secret key no configurada")
        
        return True
        
    except ImportError as e:
        print(f"❌ Error de importación: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def verificar_usuarios_activos():
    """
    Verifica el estado del sistema de usuarios activos
    """
    print("\n🔍 Verificando sistema de usuarios activos...")
    
    try:
        usuarios_activos_file = os.path.join(tempfile.gettempdir(), 'rij_usuarios_activos.json')
        
        if os.path.exists(usuarios_activos_file):
            print(f"✅ Archivo encontrado: {usuarios_activos_file}")
            
            with open(usuarios_activos_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"✅ JSON válido con {len(data)} usuarios")
            
            # Verificar que sea un diccionario
            if isinstance(data, dict):
                print("✅ Estructura de diccionario correcta")
            else:
                print("❌ Estructura incorrecta")
                return False
                
        else:
            print(f"📁 Archivo no existe, será creado automáticamente")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando usuarios activos: {e}")
        return False

def verificar_funciones_clave():
    """
    Verifica que las funciones clave estén disponibles
    """
    print("\n🔍 Verificando funciones clave...")
    
    try:
        sys.path.insert(0, '.')
        
        # Importar funciones específicas
        from ejecutable import (
            get_usuarios_activos, 
            set_usuarios_activos, 
            registrar_actividad_usuario
        )
        
        print("✅ Funciones de usuarios activos importadas")
        
        # Probar get_usuarios_activos
        usuarios = get_usuarios_activos()
        if usuarios is not None:
            print(f"✅ get_usuarios_activos() retorna: {type(usuarios)}")
        else:
            print("❌ get_usuarios_activos() retorna None")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando funciones: {e}")
        return False

def verificar_base_datos():
    """
    Verifica la conexión a la base de datos
    """
    print("\n🔍 Verificando conexión a base de datos...")
    
    try:
        from dotenv import load_dotenv
        import mysql.connector
        
        # Cargar variables de entorno
        if os.path.exists('.env.production'):
            load_dotenv('.env.production')
            print("✅ Variables de entorno cargadas de .env.production")
        else:
            print("⚠️ Archivo .env.production no encontrado")
            return False
        
        # Verificar variables de entorno
        db_host = os.getenv('DB_HOST')
        db_user = os.getenv('DB_USER')
        db_password = os.getenv('DB_PASSWORD')
        db_name = os.getenv('DB_NAME')
        
        if all([db_host, db_user, db_password, db_name]):
            print("✅ Variables de base de datos configuradas")
        else:
            print("❌ Variables de base de datos faltantes")
            return False
        
        # Probar conexión
        try:
            conn = mysql.connector.connect(
                host=db_host,
                user=db_user,
                password=db_password,
                database=db_name,
                connect_timeout=10
            )
            print("✅ Conexión a MySQL exitosa")
            conn.close()
            return True
            
        except mysql.connector.Error as e:
            print(f"❌ Error de conexión MySQL: {e}")
            return False
            
    except ImportError as e:
        print(f"❌ Error importando dependencias: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def main():
    """
    Función principal de verificación
    """
    print("🔍 VERIFICACIÓN POST-CORRECCIÓN")
    print("=" * 50)
    
    verificaciones = [
        ("Ejecutable.py", verificar_ejecutable),
        ("Usuarios Activos", verificar_usuarios_activos),
        ("Funciones Clave", verificar_funciones_clave),
        ("Base de Datos", verificar_base_datos)
    ]
    
    resultados = []
    
    for nombre, funcion in verificaciones:
        print(f"\n📋 {nombre}:")
        resultado = funcion()
        resultados.append((nombre, resultado))
    
    # Resumen final
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE VERIFICACIONES:")
    print("=" * 50)
    
    todas_exitosas = True
    for nombre, resultado in resultados:
        estado = "✅ EXITOSA" if resultado else "❌ FALLO"
        print(f"{nombre:20} | {estado}")
        if not resultado:
            todas_exitosas = False
    
    print("\n" + "=" * 50)
    
    if todas_exitosas:
        print("🎉 ¡TODAS LAS VERIFICACIONES EXITOSAS!")
        print("\n📋 Próximos pasos:")
        print("1. Subir archivos corregidos a PythonAnywhere")
        print("2. Hacer Reload de la Web App")
        print("3. Probar la aplicación")
    else:
        print("⚠️ ALGUNAS VERIFICACIONES FALLARON")
        print("\n📋 Revisa los errores arriba y:")
        print("1. Corrige los problemas reportados")
        print("2. Ejecuta este script nuevamente")
        print("3. Contacta soporte si persisten errores")

if __name__ == "__main__":
    main()
