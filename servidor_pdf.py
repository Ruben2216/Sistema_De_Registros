#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor HTTP simple para servir archivos PDF y HTML
Ejecuta este archivo para iniciar un servidor local que permita visualizar PDFs
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import unquote

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    Manejador personalizado para servir archivos con las cabeceras correctas
    """
    
    def end_headers(self):
        """
        Añade cabeceras CORS para permitir la carga de archivos PDF
        """
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def guess_type(self, path):
        """
        Determina el tipo MIME del archivo basándose en su extensión
        """
        # Asegurar que los PDFs se sirvan con el tipo MIME correcto
        if path.lower().endswith('.pdf'):
            return 'application/pdf', None
        elif path.lower().endswith('.html'):
            return 'text/html; charset=utf-8', None
        elif path.lower().endswith('.js'):
            return 'application/javascript', None
        elif path.lower().endswith('.css'):
            return 'text/css', None
        
        # Para otros tipos, usar el método padre
        return super().guess_type(path)
    
    def do_GET(self):
        """
        Maneja las peticiones GET
        """
        # Decodificar la URL para manejar caracteres especiales y espacios
        self.path = unquote(self.path)
        
        print(f"Sirviendo archivo: {self.path}")
        
        # Llamar al método padre para servir el archivo
        super().do_GET()

def iniciar_servidor(puerto=8000):
    """
    Inicia el servidor HTTP en el puerto especificado
    
    Args:
        puerto (int): Puerto en el que se ejecutará el servidor
    """
    
    # Cambiar al directorio del script para servir archivos desde allí
    directorio_actual = os.path.dirname(os.path.abspath(__file__))
    os.chdir(directorio_actual)
    
    print(f"Directorio de trabajo: {directorio_actual}")
    print(f"Iniciando servidor en puerto {puerto}...")
    print(f"Servidor disponible en: http://localhost:{puerto}")
    print(f"Para ver el visor PDF: http://localhost:{puerto}/pdf.html")
    print("\nPresiona Ctrl+C para detener el servidor")
    
    try:
        with socketserver.TCPServer(("", puerto), CustomHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario")
        sys.exit(0)
    except OSError as e:
        if e.errno == 10048:  # Puerto en uso
            print(f"Error: El puerto {puerto} ya está en uso")
            print(f"Intenta con otro puerto ejecutando: python servidor_pdf.py {puerto + 1}")
        else:
            print(f"Error al iniciar el servidor: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Permitir especificar el puerto como argumento de línea de comandos
    puerto = 8000
    
    if len(sys.argv) > 1:
        try:
            puerto = int(sys.argv[1])
            if puerto < 1024 or puerto > 65535:
                raise ValueError("Puerto fuera de rango válido")
        except ValueError:
            print("Error: Especifica un puerto válido (1024-65535)")
            print("Uso: python servidor_pdf.py [puerto]")
            sys.exit(1)
    
    iniciar_servidor(puerto)
