#!/usr/bin/env python3
"""
Archivo WSGI principal para PythonAnywhere
Este archivo es el punto de entrada para la aplicación web en producción
"""

import sys
import os

# Añadir el directorio del proyecto al path de Python
project_home = '/home/CFE/Sistema_Registros'  # Cambiar TU_USUARIO por tu nombre de usuario en PythonAnywhere
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Configurar variables de entorno para producción
os.environ['FLASK_ENV'] = 'production'
os.environ['FLASK_DEBUG'] = 'False'

# Importar la aplicación Flask
from ejecutable import app as application

# Configuración adicional para producción
if __name__ == "__main__":
    # Este bloque no se ejecuta en PythonAnywhere, pero es útil para testing local
    application.run(debug=False)
