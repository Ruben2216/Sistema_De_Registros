#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test específico para secure_filename con el nombre problemático
"""

from werkzeug.utils import secure_filename

def probar_secure_filename():
    """Prueba secure_filename con el nombre que está causando problema"""
    
    nombre_problemático = "SEQUI_QUIS_RERUM_CUL.pdf"
    
    print(f"Probando secure_filename con: {nombre_problemático}")
    print(f"Tipo: {type(nombre_problemático)}")
    print(f"Es string: {isinstance(nombre_problemático, str)}")
    print(f"Es None: {nombre_problemático is None}")
    
    try:
        resultado = secure_filename(nombre_problemático)
        print(f"Resultado: {resultado}")
        print(f"Tipo resultado: {type(resultado)}")
        print(f"¿Cambió?: {nombre_problemático != resultado}")
        
        # Probrar también con str()
        resultado_str = secure_filename(str(nombre_problemático))
        print(f"Resultado con str(): {resultado_str}")
        
        return True
        
    except Exception as e:
        print(f"ERROR en secure_filename: {e}")
        import traceback
        traceback.print_exc()
        return False

def probar_con_none():
    """Prueba que pasa si secure_filename recibe None"""
    print("\n" + "="*50)
    print("Probando secure_filename con None")
    
    try:
        resultado = secure_filename(None)
        print(f"Resultado con None: {resultado}")
    except Exception as e:
        print(f"ERROR con None: {e}")
        import traceback
        traceback.print_exc()

def probar_patron_validacion():
    """Prueba el patrón de validación que agregamos"""
    print("\n" + "="*50)
    print("Probando función es_nombre_archivo_seguro")
    
    # Simular la función que agregamos
    import re
    
    def es_nombre_archivo_seguro(nombre):
        if nombre is None or not isinstance(nombre, str) or not nombre.strip():
            print(f"[DEBUG] Nombre inválido en es_nombre_archivo_seguro: {nombre}")
            return False
        
        patron_permitido = re.compile(r'^[a-zA-Z0-9\s\-_\.]+$')
        return patron_permitido.match(nombre) is not None
    
    nombres_prueba = [
        "SEQUI_QUIS_RERUM_CUL.pdf",
        None,
        "",
        "   ",
        "archivo con espacios.pdf",
        "archivo-con-guiones.pdf",
        "archivo_con_underscore.pdf",
        "archivo123.pdf"
    ]
    
    for nombre in nombres_prueba:
        resultado = es_nombre_archivo_seguro(nombre)
        print(f"'{nombre}' -> {resultado}")

if __name__ == "__main__":
    print("Test de secure_filename y validación de nombres")
    print("="*60)
    
    probar_secure_filename()
    probar_con_none()
    probar_patron_validacion()
