from flask import Flask, send_from_directory, render_template, request, jsonify
import os
# --- INICIO DE IMPORTS PARA BASE DE DATOS ---
from flask_cors import CORS #INSTALAR -- pip install Flask-CORS (dentro de env)
import mysql.connector #INSTALAR -- pip install mysql-connector-python (dentro de env)
from mysql.connector import Error

# Rutas absolutas a las carpetas en el proyecto. Preferentemente, si se mueven los archivos, verificar aquí las rutas para evitar que se rompan
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_FOLDER = os.path.join(BASE_DIR, 'TEMPLATES')
MANTENIMIENTO_FOLDER = os.path.join(TEMPLATES_FOLDER, 'Mantenimiento')
RESOURCE_FOLDER = os.path.join(BASE_DIR, 'RESOURCE')

app = Flask(__name__, static_url_path='', static_folder=TEMPLATES_FOLDER)
CORS(app)

# --- configuración a la base de datos ---
DB_CONFIG = {
    'host': 'localhost',      
    'user': 'root',  
    'password': '1234', 
    'database': 'sistema_registros' 
}

def get_db_connection():
    """Crea y devuelve una conexión a la base de datos MySQL."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

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

# --- INICIO DE RUTAS DE backend.py ---
@app.route('/mantenimiento/computo')
def pagina_computo():
    # Sirve el formulario de cómputo
    return send_from_directory(os.path.join(TEMPLATES_FOLDER, 'Mantenimiento'), 'computo.html')

@app.route('/buscar_equipo')
def buscar_equipo():
    numero_serie = request.args.get('serie', '')
    if not numero_serie:
        return jsonify({'error': 'Número de serie no proporcionado'}), 400
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'No se pudo conectar a la base de datos'}), 500
    equipo = None
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM prueba_datos WHERE Numero_Serie = %s"
        cursor.execute(query, (numero_serie,)) 
        equipo = cursor.fetchone()
    except Error as e:
        print(f"Error en la consulta: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()
    if equipo is None:
        return jsonify({})
    else:
        datos_para_frontend = {
            'numero_inventario': equipo.get('Numero_Inventario'),
            'nombre_responsable': equipo.get('Nombre_Responsable'),
            'marca': equipo.get('Marca'),
            'modelo': equipo.get('Modelo'),
            'nombre_division': equipo.get('Nombre_Division'),
            'centro_trabajo': equipo.get('Centro_Trabajo'),
            'tipo_uso': equipo.get('Tipo_Uso')
        }
        return jsonify(datos_para_frontend)
# --- FIN DE RUTAS DE backend.py ---

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

