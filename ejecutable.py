from flask import Flask, send_from_directory, request, jsonify, session, url_for
import os
import tempfile
import json
import base64
from datetime import datetime

# Rutas absolutas a las carpetas en el proyecto. Preferentemente, si se mueven los archivos, verificar aquí las rutas para evitar que se rompan
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_FOLDER = os.path.join(BASE_DIR, 'TEMPLATES')
MANTENIMIENTO_FOLDER = os.path.join(TEMPLATES_FOLDER, 'Mantenimiento')
RESOURCE_FOLDER = os.path.join(BASE_DIR, 'RESOURCE')

app = Flask(__name__, static_url_path='', static_folder=TEMPLATES_FOLDER)
app.secret_key = 'supersecretkey'  # Necesario para usar session

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

# --- ENDPOINTS DE AUTOGUARDADO TEMPORAL ---
# Guardar y recuperar datos ligeros (texto) en session
@app.route('/api/rij/autoguardado', methods=['GET', 'POST'])
def autoguardado_rij():
    import sys
    if request.method == 'POST':
        datos = request.get_json()
        session['rij_datos'] = datos
        print(f"[POST] Guardando datos en sesión: {datos}", file=sys.stderr)
        print(f"[POST] session.sid: {session.get('sid')}", file=sys.stderr)
        return jsonify({'ok': True, 'msg': 'Datos guardados temporalmente'}), 200
    else:
        datos = session.get('rij_datos')
        print(f"[GET] Recuperando datos de sesión: {datos}", file=sys.stderr)
        print(f"[GET] session.sid: {session.get('sid')}", file=sys.stderr)
        if datos:
            return jsonify(datos), 200
        else:
            return jsonify({}), 200  # <-- Cambiado de 404 a 200

# Guardar y recuperar fotos (base64) en un archivo temporal por sesión
FOTOS_TMP_DIR = os.path.join(tempfile.gettempdir(), 'rij_fotos')
os.makedirs(FOTOS_TMP_DIR, exist_ok=True)

def get_fotos_path():
    # Un archivo por sesión (usuario)
    sid = session.get('sid')
    if not sid:
        sid = os.urandom(8).hex()
        session['sid'] = sid
    return os.path.join(FOTOS_TMP_DIR, f'fotos_{sid}.json')

@app.route('/api/rij/fotos', methods=['GET', 'POST'])
def autoguardado_fotos():
    path = get_fotos_path()
    if request.method == 'POST':
        fotos = request.get_json().get('fotos', [])
        with open(path, 'w', encoding='utf-8') as f:
            json.dump({'fotos': fotos}, f)
        return jsonify({'ok': True, 'msg': 'Fotos guardadas temporalmente'}), 200
    else:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return jsonify(data), 200
        else:
            return jsonify({'fotos': []}), 404

FOTOS_RIJ_DIR = os.path.join(RESOURCE_FOLDER, 'IMG', 'fotos_rij')
os.makedirs(FOTOS_RIJ_DIR, exist_ok=True)

@app.route('/api/rij/upload_foto', methods=['POST'])
def upload_foto():
    data = request.get_json()
    img_b64 = data.get('foto_base64')
    if not img_b64 or not img_b64.startswith('data:image'):
        return jsonify({'error': 'Formato de imagen inválido'}), 400
    # Extraer el tipo de imagen
    header, b64data = img_b64.split(',', 1)
    ext = 'png' if 'png' in header else 'jpg'
    # Nombre único por fecha y sesión
    sid = session.get('sid') or os.urandom(8).hex()
    session['sid'] = sid
    filename = f"rij_{sid}_{datetime.now().strftime('%Y%m%d%H%M%S%f')}.{ext}"
    filepath = os.path.join(FOTOS_RIJ_DIR, filename)
    # Guardar archivo
    with open(filepath, 'wb') as f:
        f.write(base64.b64decode(b64data))
    # Construir URL pública
    url = url_for('resource_files', filename=f'IMG/fotos_rij/{filename}', _external=True)
    # guardar la lista de fotos en la sesión o en un archivo JSON
    fotos = session.get('rij_fotos', [])
    fotos.append(url)
    session['rij_fotos'] = fotos
    return jsonify({'url': url}), 200

@app.route('/api/rij/lista_fotos', methods=['GET'])
def lista_fotos():
    # Devuelve la lista de URLs de fotos de la sesión
    fotos = session.get('rij_fotos', [])
    return jsonify({'fotos': fotos}), 200

@app.route('/api/rij/borrar_foto', methods=['POST'])
def borrar_foto():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({'success': False, 'error': 'URL no proporcionada'}), 400
    # Buscar el nombre de archivo a partir de la URL
    try:
        # Solo permitimos borrar archivos dentro de la carpeta de fotos
        filename = url.split('/IMG/fotos_rij/')[-1]
        filepath = os.path.join(FOTOS_RIJ_DIR, filename)
        if not os.path.isfile(filepath):
            return jsonify({'success': False, 'error': 'Archivo no encontrado'}), 404
        os.remove(filepath)
        # Eliminar la URL de la lista de sesión
        fotos = session.get('rij_fotos', [])
        fotos = [f for f in fotos if f != url]
        session['rij_fotos'] = fotos
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- ENDPOINT PARA LIMPIAR SESIÓN Y FOTOS ---
@app.route('/api/rij/limpiar_sesion', methods=['POST'])
def limpiar_sesion():
    # Borra datos de sesión y elimina fotos físicas
    try:
        # Borrar datos de formulario
        session.pop('rij_datos', None)
        # Borrar lista de fotos de sesión
        fotos = session.pop('rij_fotos', [])
        # Borrar archivo temporal de fotos
        sid = session.get('sid')
        if sid:
            fotos_tmp_path = os.path.join(tempfile.gettempdir(), 'rij_fotos', f'fotos_{sid}.json')
            if os.path.exists(fotos_tmp_path):
                os.remove(fotos_tmp_path)
        # Borrar fotos físicas listadas en la sesión (por compatibilidad)
        for url in fotos:
            filename = url.split('/IMG/fotos_rij/')[-1]
            filepath = os.path.join(FOTOS_RIJ_DIR, filename)
            if os.path.isfile(filepath):
                try:
                    os.remove(filepath)
                except Exception as e:
                    print(f"No se pudo borrar {filepath}: {e}")
        # Borrar todas las fotos físicas restantes en la carpeta (garantiza limpieza total SOLO de este usuario)
        # Solo borrar archivos que empiecen con el sid del usuario
        if sid:
            for nombre_archivo in os.listdir(FOTOS_RIJ_DIR):
                if nombre_archivo.startswith(f"rij_{sid}_"):
                    ruta_archivo = os.path.join(FOTOS_RIJ_DIR, nombre_archivo)
                    if os.path.isfile(ruta_archivo):
                        try:
                            os.remove(ruta_archivo)
                        except Exception as e:
                            print(f"No se pudo borrar {ruta_archivo}: {e}")
        return jsonify({'success': True, 'msg': 'Sesión y todas las fotos eliminadas'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- INICIO LÓGICA DE backend.py (búsqueda de equipos en MySQL) ---
from flask_cors import CORS #INSTALAR -- pip install Flask-CORS (dentro de env)
import mysql.connector #INSTALAR -- pip install mysql-connector-python (dentro de env)
from mysql.connector import Error

# Habilitar CORS para toda la app (si ya está habilitado, omitir esta línea)
CORS(app)

# --- configuración a la base de datos ---
DB_CONFIG = {
    'host': 'localhost',      
    'user': 'root',  
    'password': '1234', 
    'database': 'sistema_registros' 
}

# conectar a la base de datos

def get_db_connection():
    """Crea y devuelve una conexión a la base de datos MySQL."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

# Ruta para servir el formulario de cómputo (puedes ajustar la ruta si ya existe)
@app.route('/mantenimiento/computo')
def pagina_computo():
    # Sirve el formulario de cómputo cuando se visita la ruta
    return send_from_directory(os.path.join(TEMPLATES_FOLDER, 'Mantenimiento'), 'computo.html')

# Ruta de la API para buscar un equipo por número de serie
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
        equipo = cursor.fetchone() # fetchone() obtiene el primer (y único) resultado
    except Error as e:
        print(f"Error en la consulta: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

    if equipo is None:
        # si no se encuentra, devolvemos un JSON vacío
        return jsonify({})
    else:
        # si se encuentra, se devuelve como JSON
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
# --- FIN LÓGICA DE backend.py ---

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
