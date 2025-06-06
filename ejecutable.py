from flask import Flask, send_from_directory
import os

# Rutas absolutas a las carpetas en el proyecto. Preferentemente, si se mueven los archivos, verificar aquí las rutas para evitar que se rompan
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_FOLDER = os.path.join(BASE_DIR, 'TEMPLATES')
MANTENIMIENTO_FOLDER = os.path.join(TEMPLATES_FOLDER, 'Mantenimiento')
RESOURCE_FOLDER = os.path.join(BASE_DIR, 'RESOURCE')

app = Flask(__name__, static_url_path='', static_folder=TEMPLATES_FOLDER)

# Aquí se define la ruta principal con el archivo HTML que se desplegará, como por ejemplo 'menu.html'.
@app.route('/')
def index():
    # Asegúrate de que 'menu.html' exista en la carpeta TEMPLATES
    return send_from_directory(TEMPLATES_FOLDER, 'menu.html')

@app.route('/TEMPLATES/<path:filename>')
def templates_root(filename):
    return send_from_directory(TEMPLATES_FOLDER, filename)

# Archivos dentro de /TEMPLATES/Mantenimiento/
@app.route('/TEMPLATES/Mantenimiento/<path:filename>')
def mantenimiento(filename):
    return send_from_directory(MANTENIMIENTO_FOLDER, filename)

# Archivos dentro de /RESOURCE/ para obtener los archivos js, css o imágenes
@app.route('/RESOURCE/<path:filename>')
def resource_files(filename):
    return send_from_directory(RESOURCE_FOLDER, filename)

if __name__ == '__main__':
    # --- INICIO DE MODIFICACIONES PARA HTTPS ---
    # Configuración para habilitar HTTPS en el servidor Flask.

    # Rutas a tus archivos de certificado y clave privada
    cert_path = os.path.join(BASE_DIR, 'cert.pem')
    key_path = os.path.join(BASE_DIR, 'key.pem')

    # Verificar si los archivos existen antes de intentar usarlos 
    if not os.path.exists(cert_path):
        print(f"Error: No se encontró el archivo del certificado en '{cert_path}'")
        print("Asegúrate de haber ejecutado 'openssl req ...' correctamente.")
        exit(1)
    if not os.path.exists(key_path):
        print(f"Error: No se encontró el archivo de la clave privada en '{key_path}'")
        print("Asegúrate de haber ejecutado 'openssl genrsa ...' correctamente.")
        exit(1)

    # Crea el contexto SSL/TLS usando los archivos
    ssl_context_tuple = (cert_path, key_path)

    # Define la IP donde Flask escuchará (0.0.0.0 para acceso desde otras IPs en tu red)
    HOST_IP = '0.0.0.0'
    PORT = 8000

    print(f"\n--- INICIANDO SERVIDOR FLASK HTTPS ---")
    print(f"La aplicación se ejecutará en: https://{HOST_IP}:{PORT}")
    print(f"Acceso desde otros dispositivos: https://192.168.100.30:{PORT}")
    print(f"-------------------------------------\n")

    # Ejecuta la aplicación Flask con el contexto SSL/TLS
    app.run(host=HOST_IP, port=PORT, ssl_context=ssl_context_tuple, debug=True)

