from flask import Flask, send_from_directory, request, jsonify, session, url_for, render_template, redirect # pyright: ignore[reportMissingImports]
import os
import tempfile
import json
import base64
import datetime
import threading
import time
import atexit
import re
import hashlib
import secrets
try:
    # Para Python 3.9+ (estándar en PythonAnywhere)
    from zoneinfo import ZoneInfo
except ImportError:
    # Fallback para entornos locales con Python < 3.9
    from pytz import timezone as ZoneInfo # pyright: ignore[reportMissingModuleSource]
import io
import sys
from functools import wraps
from werkzeug.utils import secure_filename # pyright: ignore[reportMissingImports] #esto es para asegurar nombres de archivos seguros, se usa en la subida de archivos a Google Drive
# --- INICIO LÓGICA DE backend (búsqueda de equipos en MySQL) ---
from flask_cors import CORS 
import mysql.connector  # pyright: ignore[reportMissingImports]
from mysql.connector import Error # pyright: ignore[reportMissingImports]
from dotenv import load_dotenv # pyright: ignore[reportMissingImports]
from kilometro_vida import bp_imgdia
# --- IMPORTACIONES PARA CORREO ---
from flask_mail import Mail, Message # pyright: ignore[reportMissingImports]
import io

# --- CONFIGURACIÓN DE AUTENTICACIÓN ---
TIEMPO_SESION_MINUTOS = 30  # 30 minutos de sesión
TIEMPO_ADVERTENCIA_MINUTOS = 25  # Advertencia a los 25 minutos (5 minutos antes)

# Rutas absolutas a las carpetas en el proyecto. Preferentemente, si se mueven los archivos, verificar aquí las rutas para evitar que se rompan
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_FOLDER = os.path.join(BASE_DIR, 'TEMPLATES')
MANTENIMIENTO_FOLDER = os.path.join(TEMPLATES_FOLDER, 'Mantenimiento')
RESOURCE_FOLDER = os.path.join(BASE_DIR, 'RESOURCE')

# Cargar variables de entorno según el entorno
if os.path.exists('.env.production'):
    load_dotenv('.env.production')  # Producción
else:
    load_dotenv()  # Desarrollo local

app = Flask(__name__, 
            static_url_path='', 
            static_folder=TEMPLATES_FOLDER,
            template_folder=TEMPLATES_FOLDER)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'supersecretkey')  # Usar variable de entorno para mayor seguridad

# Configuración adicional para producción en PythonAnywhere
app.config['SESSION_COOKIE_SECURE'] = False  # PythonAnywhere maneja HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevenir XSS
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Protección CSRF

# --- CONFIGURACIÓN DE CORREO ---
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', 'sistemaregistrocfe@gmail.com')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', 'ytji fwik rftf njxw')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'sistemaregistrocfe@gmail.com')

mail = Mail(app)

# --- FUNCIONES DE AUTENTICACIÓN (DEFINIDAS ANTES DE LAS RUTAS) ---

def get_db_connection():
    """Crea y devuelve una conexión a la base de datos MySQL."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        return None

def generar_token_sesion():
    """Genera un token único y seguro para la sesión"""
    return secrets.token_urlsafe(32)

def hash_password(password):
    """Genera un hash de la contraseña (para uso futuro)"""
    return hashlib.sha256(password.encode()).hexdigest()

def crear_sesion_usuario(password, ip_cliente, user_agent):
    """
    Crea una nueva sesión autenticada en la base de datos
    Retorna el token de sesión si es exitoso, None si falla
    """
    eliminar_sesiones_expiradas()  # Elimina sesiones expiradas antes de crear una nueva
    try:
        conn = get_db_connection()
        if conn is None:
            return None
        
        cursor = conn.cursor()
        
        # Primero verificar que la contraseña existe
        query_verificar = "SELECT id FROM usuario WHERE password = %s"
        cursor.execute(query_verificar, (password,))
        resultado = cursor.fetchone()
        
        if not resultado:
            return None
        
        usuario_id = resultado[0]
        
        # Generar token único
        token_sesion = generar_token_sesion()
        
        # Calcular fecha de expiración
        fecha_expiracion = datetime.datetime.now() + datetime.timedelta(minutes=TIEMPO_SESION_MINUTOS)
        
        # Insertar sesión en la base de datos
        query_insertar = """
        INSERT INTO sesiones_usuario (session_token, usuario_id, fecha_expiracion, ip_cliente, user_agent, activa)
        VALUES (%s, %s, %s, %s, %s, TRUE)
        """
        cursor.execute(query_insertar, (token_sesion, usuario_id, fecha_expiracion, ip_cliente, user_agent))
        conn.commit()
        
        return token_sesion
        
    except Error as e:
        return None
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def verificar_sesion_activa(token_sesion):
    """
    Verifica si una sesión es válida y activa
    Retorna True si es válida, False si no
    """
    eliminar_sesiones_expiradas()  # Elimina sesiones expiradas antes de verificar
    try:
        conn = get_db_connection()
        if conn is None:
            return False
        
        cursor = conn.cursor()
        
        # Verificar token y que no haya expirado
        query = """
        SELECT id, fecha_expiracion FROM sesiones_usuario 
        WHERE session_token = %s AND activa = TRUE
        """
        cursor.execute(query, (token_sesion,))
        resultado = cursor.fetchone()
        
        if not resultado:
            return False
        
        sesion_id, fecha_expiracion = resultado
        
        # Verificar si la sesión ha expirado
        if datetime.datetime.now() > fecha_expiracion:
            # Marcar sesión como inactiva
            query_inactivar = "UPDATE sesiones_usuario SET activa = FALSE WHERE id = %s"
            cursor.execute(query_inactivar, (sesion_id,))
            conn.commit()
            return False
        
        return True
        
    except Error as e:
        return False
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def obtener_tiempo_restante_sesion(token_sesion):
    """
    Obtiene el tiempo restante de una sesión en minutos
    Retorna None si la sesión no existe o ha expirado
    """
    eliminar_sesiones_expiradas()  # Elimina sesiones expiradas antes de consultar
    try:
        conn = get_db_connection()
        if conn is None:
            return None
        
        cursor = conn.cursor()
        
        query = """
        SELECT fecha_expiracion FROM sesiones_usuario 
        WHERE session_token = %s AND activa = TRUE
        """
        cursor.execute(query, (token_sesion,))
        resultado = cursor.fetchone()
        
        if not resultado:
            return None
        
        fecha_expiracion = resultado[0]
        tiempo_restante = fecha_expiracion - datetime.datetime.now()
        
        if tiempo_restante.total_seconds() <= 0:
            return 0
        
        return int(tiempo_restante.total_seconds() / 60)  # Retornar en minutos
        
    except Error as e:
        return None
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def cerrar_sesion(token_sesion):
    """Cierra una sesión específica"""
    eliminar_sesiones_expiradas()  # Elimina sesiones expiradas antes de cerrar
    try:
        conn = get_db_connection()
        if conn is None:
            return False
        
        cursor = conn.cursor()
        
        query = "UPDATE sesiones_usuario SET activa = FALSE WHERE session_token = %s"
        cursor.execute(query, (token_sesion,))
        conn.commit()
        
        return True
        
    except Error as e:
        return False
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def limpiar_sesiones_expiradas():
    """
    Tarea de limpieza que marca como inactivas las sesiones expiradas
    """
    try:
        conn = get_db_connection()
        if conn is None:
            return
        
        cursor = conn.cursor()
        
        query = """
        UPDATE sesiones_usuario 
        SET activa = FALSE 
        WHERE fecha_expiracion < NOW() AND activa = TRUE
        """
        cursor.execute(query)
        conn.commit()
        
    except Error as e:
        pass
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
    # Además, eliminar físicamente las sesiones expiradas
    eliminar_sesiones_expiradas()

def eliminar_sesiones_expiradas():
    """
    Elimina físicamente las sesiones expiradas de la base de datos.
    """
    try:
        conn = get_db_connection()
        if conn is None:
            return
        cursor = conn.cursor()
        query = "DELETE FROM sesiones_usuario WHERE fecha_expiracion < NOW()"
        cursor.execute(query)
        conn.commit()
    except Error as e:
        pass
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def iniciar_limpieza_sesiones():
    """Inicia la tarea de limpieza de sesiones en un hilo separado"""
    def ejecutar_limpieza():
        while True:
            try:
                limpiar_sesiones_expiradas()
                time.sleep(300)  # Ejecutar cada 5 minutos
            except Exception as e:
                time.sleep(60)  # Esperar 1 minuto antes de reintentar
    
    hilo_limpieza = threading.Thread(target=ejecutar_limpieza, daemon=True)
    hilo_limpieza.start()

def requiere_autenticacion(f):
    """
    Decorador para requerir autenticación en las rutas
    """
    @wraps(f)
    def decorador(*args, **kwargs):
        token_sesion = session.get('session_token')
        
        if not token_sesion or not verificar_sesion_activa(token_sesion):
            # Si es una petición AJAX o con Content-Type JSON, devolver JSON
            if (request.is_json or 
                'application/json' in request.headers.get('Content-Type', '') or
                'application/json' in request.headers.get('Accept', '')):
                return jsonify({
                    'success': False,
                    'error': 'Sesión expirada o no válida',
                    'redirect': '/TEMPLATES/login.html'
                }), 401
            
            # Si es una petición normal, redirigir al login
            return redirect('/TEMPLATES/login.html')
        
        return f(*args, **kwargs)
    return decorador

# --- FIN FUNCIONES DE AUTENTICACIÓN ---

# Aquí se define la ruta principal con el archivo HTML que se desplegará, como por ejemplo 'menu.html'.
@app.route('/')
def index():
    # Verificar autenticación manualmente
    token_sesion = session.get('session_token')
    if not token_sesion or not verificar_sesion_activa(token_sesion):
        return redirect('/TEMPLATES/login.html')
    # Asegúrate de que 'menu.html' exista en la carpeta TEMPLATES
    return send_from_directory(TEMPLATES_FOLDER, 'menu.html')

@app.route('/TEMPLATES/<path:filename>')
def templates_root(filename):
    # Validar que el filename no sea null, vacío o inválido
    if not filename or filename.lower() in ['null', 'undefined', 'none', '']:
        return jsonify({'error': 'Archivo no válido'}), 400
    
    # Permitir acceso al login sin autenticación
    if filename == 'login.html':
        return send_from_directory(TEMPLATES_FOLDER, filename)
    
    # Todas las demás páginas requieren autenticación
    token_sesion = session.get('session_token')
    if not token_sesion or not verificar_sesion_activa(token_sesion):
        return redirect('/TEMPLATES/login.html')
    
    # Registrar actividad automáticamente para páginas RIJ y cámara
    if 'formato_RIJ.html' in filename or 'camara.html' in filename:
        registrar_actividad_usuario()
    
    return send_from_directory(TEMPLATES_FOLDER, filename)

# Archivos dentro de /TEMPLATES/Mantenimiento/
@app.route('/TEMPLATES/Mantenimiento/<path:filename>')
def mantenimiento(filename):
    # Verificar autenticación manualmente
    token_sesion = session.get('session_token')
    if not token_sesion or not verificar_sesion_activa(token_sesion):
        return redirect('/TEMPLATES/login.html')

    # Procesar la cola de pendientes de Drive solo una vez por sesión
    if not session.get('cola_drive_procesada'):
        try:
            from SubirFormatos_Mantenimiento_Drive import procesar_cola_pendientes
            resultado_cola = procesar_cola_pendientes()
            # Puedes registrar logs o manejar el resultado si lo deseas
        except Exception as e:
            import traceback
            traceback.print_exc()
        session['cola_drive_procesada'] = True

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
        # Registrar actividad del usuario para sistema de limpieza
        registrar_actividad_usuario()
        return jsonify({'ok': True, 'msg': 'Datos guardados temporalmente'}), 200
    else:
        datos = session.get('rij_datos')
        # Registrar actividad del usuario para sistema de limpieza
        registrar_actividad_usuario()
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
        # Registrar actividad del usuario para sistema de limpieza
        registrar_actividad_usuario()
        return jsonify({'ok': True, 'msg': 'Fotos guardadas temporalmente'}), 200
    else:
        # Registrar actividad del usuario para sistema de limpieza
        registrar_actividad_usuario()
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return jsonify(data), 200
        else:
            return jsonify({'fotos': []}), 404

FOTOS_RIJ_DIR = os.path.join(RESOURCE_FOLDER, 'IMG', 'Evidencias')
os.makedirs(FOTOS_RIJ_DIR, exist_ok=True)

# Directorio de imágenes RIJ predefinidas
IMG_RIJ_DIR = os.path.join(RESOURCE_FOLDER, 'IMG', 'img RIJ')
os.makedirs(IMG_RIJ_DIR, exist_ok=True)

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
    # Registrar actividad del usuario para sistema de limpieza
    registrar_actividad_usuario()
    filename = f"rij_{sid}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S%f')}.{ext}"
    filepath = os.path.join(FOTOS_RIJ_DIR, filename)
    # Guardar archivo
    with open(filepath, 'wb') as f:
        f.write(base64.b64decode(b64data))
    # Construir URL pública
    url = url_for('resource_files', filename=f'IMG/Evidencias/{filename}', _external=True)
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
        filename = url.split('/IMG/Evidencias/')[-1]
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
        sid = session.get('sid')
        
        # Usar la función de limpieza completa del sistema automático
        if sid:
            limpiar_datos_usuario_completo(sid)
        
        # Limpiar datos de sesión adicionales por compatibilidad
        session.pop('rij_datos', None)
        session.pop('rij_fotos', [])
        
        return jsonify({'success': True, 'msg': 'Sesión y todas las fotos eliminadas completamente'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- ENDPOINTS PARA IMPORTAR IMÁGENES PREDEFINIDAS ---
# Directorio de imágenes RIJ predefinidas
IMG_RIJ_DIR = os.path.join(RESOURCE_FOLDER, 'IMG', 'img RIJ')
os.makedirs(IMG_RIJ_DIR, exist_ok=True)

# --- ENDPOINT PARA ENVIAR PDF POR CORREO ---
@app.route('/api/rij/enviar_correo', methods=['POST'])
def enviar_pdf_correo():
    """
    Envía un PDF generado por correo electrónico al destinatario especificado
    """
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        correo_destinatario = data.get('correo')
        pdf_base64 = data.get('pdf_base64')
        nombre_archivo = data.get('nombre_archivo', 'RIJ_Verificacion.pdf')
        
        if not correo_destinatario:
            return jsonify({'success': False, 'error': 'Correo del destinatario no proporcionado'}), 400
            
        if not pdf_base64:
            return jsonify({'success': False, 'error': 'Archivo PDF no proporcionado'}), 400
        
        # Validar formato de correo básico
        if '@' not in correo_destinatario or '.' not in correo_destinatario:
            return jsonify({'success': False, 'error': 'Formato de correo electrónico inválido'}), 400
        
        # Decodificar el PDF desde base64
        try:
            
            # Si el PDF viene con prefijo data:application/pdf;base64,
            if pdf_base64.startswith('data:application/pdf;base64,'):
                pdf_base64 = pdf_base64.split(',')[1]
            elif pdf_base64.startswith('data:application/pdf;'):
                # Manejar formatos alternativos que jsPDF podría generar
                parts = pdf_base64.split(',')
                if len(parts) >= 2:
                    pdf_base64 = parts[-1]  # Tomar la última parte después de la última coma
            
            
            pdf_data = base64.b64decode(pdf_base64)
            
            # Verificar que es un PDF válido
            if not pdf_data.startswith(b'%PDF'):
                raise Exception("El archivo decodificado no es un PDF válido")
            
        except Exception as e:
            return jsonify({'success': False, 'error': f'Error al decodificar el archivo PDF: {str(e)}'}), 400
        
        # Crear el mensaje de correo
        asunto = f"RIJ - Lista de Verificación - {datetime.datetime.now().strftime('%d/%m/%Y')}"
        
        # Mensaje de texto para el cuerpo del correo
        mensaje_texto = (
            "Hola,\n\n"
            "Este mensaje ha sido enviado automáticamente desde el sistema de evidencias de CFE  "
            "(sistemaregistrocfe@gmail.com).\n\n"
            
            "Si usted no solicitó este documento, por favor ignore este mensaje.\n\n"
            
            "Saludos cordiales,\n\n\n"
            "Sistema de Evidencias CFE"
        )
        
        msg = Message(
            subject=asunto,
            recipients=[correo_destinatario],
            body=mensaje_texto,
            sender=app.config['MAIL_DEFAULT_SENDER']
        )
        
        # Adjuntar el PDF
        msg.attach(
            filename=nombre_archivo,
            content_type='application/pdf',
            data=pdf_data
        )
        
        # Enviar el correo
        with app.app_context():
            mail.send(msg)
        
        return jsonify({
            'success': True, 
            'message': f'PDF enviado exitosamente a {correo_destinatario}'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': f'Error al enviar el correo: {str(e)}'
        }), 500

@app.route('/api/rij/guardar_imagen', methods=['POST'])
def guardar_imagen_rij():
    """
    Guarda la imagen convertida del PDF RIJ
    """
    try:
        # Obtener el archivo y el identificador
        archivo = request.files.get('imagen')
        identificador = request.form.get('identificador')
        
        if not archivo or not identificador:
            return jsonify({
                'success': False, 
                'error': 'Archivo de imagen o identificador no proporcionado'
            }), 400
        
        # Crear directorio si no existe
        directorio_imagenes = os.path.join(RESOURCE_FOLDER, 'IMG', 'img RIJ')
        os.makedirs(directorio_imagenes, exist_ok=True)
        
        # Usar solo el identificador como nombre (sin timestamp para consistencia)
        nombre_archivo = f"{identificador}.png"
        ruta_archivo = os.path.join(directorio_imagenes, nombre_archivo)
        
        # Guardar archivo
        archivo.save(ruta_archivo)
        
        # URL relativa para acceder a la imagen
        url_imagen = f"/RESOURCE/IMG/img RIJ/{nombre_archivo}"
        
        return jsonify({
            'success': True,
            'message': 'Imagen guardada exitosamente',
            'url': url_imagen,
            'identificador': identificador
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': f'Error al guardar imagen: {str(e)}'
        }), 500

@app.route('/api/rij/obtener_imagen/<identificador>', methods=['GET'])
def obtener_imagen_rij(identificador):
    """
    Busca la imagen RIJ del usuario por identificador
    """
    try:
        directorio_imagenes = os.path.join(RESOURCE_FOLDER, 'IMG', 'img RIJ')
        
        # Buscar archivos que coincidan con el identificador
        if os.path.exists(directorio_imagenes):
            archivos = os.listdir(directorio_imagenes)
            for archivo in archivos:
                if archivo.startswith(identificador):
                    url_imagen = f"/RESOURCE/IMG/img RIJ/{archivo}"
                    return jsonify({
                        'success': True,
                        'url': url_imagen,
                        'identificador': identificador
                    })
        
        return jsonify({
            'success': False,
            'error': 'Imagen no encontrada'
        }), 404
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': f'Error al buscar imagen: {str(e)}'
        }), 500

@app.route('/api/rij/convertir_pdf_imagen', methods=['POST'])
def convertir_pdf_a_imagen():
    """
    Convierte un PDF base64 a imagen PNG y la guarda en el servidor
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No se recibieron datos'
            }), 400
        
        pdf_base64 = data.get('pdf_base64')
        identificador = data.get('identificador')
        
        if not pdf_base64 or not identificador:
            return jsonify({
                'success': False,
                'error': 'PDF o identificador no proporcionado'
            }), 400
        
        # Registrar actividad del usuario para sistema de limpieza
        registrar_actividad_usuario()
        
        # Limpiar el base64 - manejar diferentes formatos
        if pdf_base64.startswith('data:application/pdf;base64,'):
            pdf_base64 = pdf_base64.split(',')[1]
        elif pdf_base64.startswith('data:'):
            # Buscar la coma y tomar todo después de ella
            comma_index = pdf_base64.find(',')
            if comma_index != -1:
                pdf_base64 = pdf_base64[comma_index + 1:]
        
        # Decodificar PDF
        try:
            pdf_data = base64.b64decode(pdf_base64)
            
            # Verificar que es un PDF válido
            if not pdf_data.startswith(b'%PDF'):
                return jsonify({
                    'success': False,
                    'error': 'El archivo no es un PDF válido'
                }), 400
                
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al decodificar PDF: {str(e)}'
            }), 400
        
        # Crear directorio si no existe
        directorio_imagenes = os.path.join(RESOURCE_FOLDER, 'IMG', 'img RIJ')
        os.makedirs(directorio_imagenes, exist_ok=True)
        
        # Crear archivo temporal para el PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
            temp_pdf.write(pdf_data)
            temp_pdf_path = temp_pdf.name
        
        try:
            # Ruta de imagen destino
            imagen_path = os.path.join(directorio_imagenes, f"{identificador}.png")
            
            try:
                import fitz  # pyright: ignore[reportMissingImports] # PyMuPDF
                
                # Abrir PDF con PyMuPDF
                doc = fitz.open(temp_pdf_path)
                
                if doc.page_count == 0:
                    raise Exception("El PDF no tiene páginas")
                
                page = doc[0]  # Primera página
                
                # Renderizar como imagen con alta calidad
                mat = fitz.Matrix(3.0, 3.0)  # Escala 3x para muy buena calidad
                pix = page.get_pixmap(matrix=mat)
                
                # Guardar como PNG
                pix.save(imagen_path)
                
                doc.close()
                
            except ImportError:
                # Fallback usando PIL
                from PIL import Image, ImageDraw, ImageFont
                
                img = Image.new('RGB', (800, 1000), color='white')
                draw = ImageDraw.Draw(img)
                
                try:
                    font = ImageFont.truetype("arial.ttf", 24)
                except:
                    font = ImageFont.load_default()
                
                draw.text((50, 50), "Formulario RIJ", fill='black', font=font)
                draw.text((50, 100), f"ID: {identificador}", fill='black', font=font)
                draw.text((50, 150), "PDF Real Procesado", fill='black', font=font)
                draw.rectangle([(10, 10), (790, 990)], outline='black', width=2)
                
                img.save(imagen_path, 'PNG')
            
            # URL pública de la imagen
            url_imagen = f'/RESOURCE/IMG/img RIJ/{identificador}.png'
            
            return jsonify({
                'success': True,
                'url': url_imagen,
                'identificador': identificador,
                'message': 'PDF convertido a imagen correctamente'
            })
            
        finally:
            # Limpiar archivo temporal
            if os.path.exists(temp_pdf_path):
                os.unlink(temp_pdf_path)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al convertir PDF: {str(e)}'
        }), 500

# --- INICIO DE BACKEND ---
load_dotenv()

CORS(app) 
# --- configuración a la base de datos (.env) ---
DB_CONFIG = {
    'host': os.getenv('DB_HOST'),      
    'user': os.getenv('DB_USER'),  
    'password': os.getenv('DB_PASSWORD'), 
    'database': os.getenv('DB_NAME') 
}

# conectar a la base de datos
# OBTENER LA META RIJ
def obtener_meta_actual():
    meta_diaria = "No hay meta de seguridad programada para hoy." # Mensaje por defecto
    conn = get_db_connection() 
    if conn is None:
        return "Error: No se pudo conectar a la base de datos."
    
    try:
        cursor = conn.cursor()
        fecha_hoy = datetime.date.today() # fecha de hoy 
        
        # buscar la meta de hoy
        query = "SELECT meta FROM metas WHERE fecha_meta = %s"
        cursor.execute(query, (fecha_hoy,))
        
        resultado = cursor.fetchone() 
        
        if resultado:
            meta_diaria = resultado[0] 

    except Error as e:
        meta_diaria = "Error al consultar la meta del día."
        
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()
            
    return meta_diaria

@app.route('/formato_RIJ.html')
def pagina_rij():
    try:
        # Registrar actividad automáticamente
        sid = registrar_actividad_usuario()
    except Exception as e:
        import traceback
        traceback.print_exc()
    
    meta_del_dia = obtener_meta_actual()
    # --- Lógica para imagen del día ---
    from kilometro_vida import obtener_servicio_drive, buscar_archivo_por_fecha, descargar_archivo, CARPETA_ONEDRIVE, LOCAL_IMG_FOLDER
    servicio = obtener_servicio_drive()
    hoy = datetime.date.today().strftime('%d-%m-%Y')
    archivo_id = buscar_archivo_por_fecha(servicio, CARPETA_ONEDRIVE, hoy)
    imagen_url = None
    mensaje_img = None
    if archivo_id:
        nombre_archivo = f"{hoy}.jpg"
        ruta_local = os.path.join(LOCAL_IMG_FOLDER, nombre_archivo)
        if not os.path.exists(ruta_local):
            exito = descargar_archivo(servicio, archivo_id, ruta_local)
            if exito:
                imagen_url = f"/static/imagenes/{nombre_archivo}"
            else:
                mensaje_img = "No se pudo descargar la imagen del día."
        else:
            imagen_url = f"/static/imagenes/{nombre_archivo}"
    else:
        mensaje_img = "No hay imagen disponible para el día de hoy."
    return render_template('formato_RIJ.html', meta_para_mostrar=meta_del_dia, imagen_url=imagen_url, mensaje_img=mensaje_img) 

# Redirección para acceder a formato_RIJ.html desde TEMPLATES que esta todo configurado para que se acceda desde la carpeta TEMPLATES
# Esto permite que la lógica de obtener la meta se ejecute correctamente al acceder a la ruta, OSEA LA FUNCION DE MOSTRAR LA META DEL DÍA
@app.route('/TEMPLATES/formato_RIJ.html')
def redirigir_formato_rij():
    return redirect('/formato_RIJ.html')

# Ruta para un equipo por número de inventario o serie (usadO por el botón)
@app.route('/buscar_equipo')
def buscar_equipo(): 
    inventario = request.args.get('inventario')
    serie = request.args.get('serie')

    if not inventario and not serie:
        return jsonify({'error': 'Número identificador no proporcionado'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'No se pudo conectar a la base de datos'}), 500

    equipo = None
    try:
        cursor = conn.cursor(dictionary=True)
        if inventario:
            try:
                search_value = int(inventario) 
                query = "SELECT * FROM prueba_datos WHERE Numero_Inventario = %s"
                cursor.execute(query, (search_value,))
                equipo = cursor.fetchone()
            except ValueError:
                return jsonify({'error': 'Número de inventario inválido'}), 400
        elif serie:
            search_value = serie
            query = "SELECT * FROM prueba_datos WHERE Numero_Serie = %s" 
            cursor.execute(query, (search_value,))
            equipo = cursor.fetchone()
    except Error as e:
        pass
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

    if equipo is None:
        return jsonify({}) 
    else:
        datos_para_frontend = {
            'numero_inventario': equipo.get('Numero_Inventario'),
            'numero_serie': equipo.get('Numero_Serie'),
            'nombre_responsable': equipo.get('Nombre_Responsable'),
            'marca': equipo.get('Marca'),
            'modelo': equipo.get('Modelo'),
            'nombre_division': equipo.get('Nombre_Division'),
            'centro_trabajo': equipo.get('Centro_Trabajo'),
            'tipo_uso': equipo.get('Tipo_Uso'),
            'procesos': equipo.get('Procesos')
        }
        return jsonify(datos_para_frontend)

# SUGERENCIAS DE AUTOCOMPLETADO 
@app.route('/buscar_sugerencias_serie')
def buscar_sugerencias_serie():
    query_param = request.args.get('q', '')

    if len(query_param) < 3:
        return jsonify([])

    conn = get_db_connection()
    if conn is None:
        return jsonify([])

    sugerencias = []
    try:
        cursor = conn.cursor(dictionary=True)
        sql_query = "SELECT * FROM prueba_datos WHERE Numero_Serie LIKE %s LIMIT 10"
        search_value = f"{query_param}%"
        
        cursor.execute(sql_query, (search_value,))
        resultados = cursor.fetchall()

        for equipo in resultados:
            sugerencias.append({
                'numero_inventario': equipo.get('Numero_Inventario'),
                'numero_serie': equipo.get('Numero_Serie'),
                'nombre_responsable': equipo.get('Nombre_Responsable'),
                'marca': equipo.get('Marca'),
                'modelo': equipo.get('Modelo'),
                'nombre_division': equipo.get('Nombre_Division'),
                'centro_trabajo': equipo.get('Centro_Trabajo'),
                'tipo_uso': equipo.get('Tipo_Uso'),
                'procesos': equipo.get('procesos')
            })

    except Error as e:
        pass
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

    return jsonify(sugerencias)

# Registrar el blueprint para la imagen del día
app.register_blueprint(bp_imgdia)

@app.route('/static/imagenes/<path:filename>')
def static_imagenes(filename):
    """
    Sirve archivos de la carpeta static/imagenes para asegurar que Flask los entregue correctamente.
    """
    ruta = os.path.join(BASE_DIR, 'static', 'imagenes')
    return send_from_directory(ruta, filename)

# --- FIN LÓGICA DE BACKEND ---

# --- INICIO SISTEMA DE LIMPIEZA AUTOMÁTICA ---
# Archivo para persistir usuarios activos entre reinicios del servidor
USUARIOS_ACTIVOS_FILE = os.path.join(tempfile.gettempdir(), 'rij_usuarios_activos.json')
lock_usuarios = threading.Lock()

def get_usuarios_activos():
    """
    Obtiene la lista de usuarios activos desde el archivo JSON
    """
    try:
        if os.path.exists(USUARIOS_ACTIVOS_FILE):
            with open(USUARIOS_ACTIVOS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
        return {}
    except Exception as e:
        return {}

def set_usuarios_activos(usuarios_dict):
    """
    Guarda la lista de usuarios activos en el archivo JSON
    """
    try:
        with open(USUARIOS_ACTIVOS_FILE, 'w', encoding='utf-8') as f:
            json.dump(usuarios_dict, f, default=str, ensure_ascii=False, indent=2)
    except Exception as e:
        pass

def registrar_actividad_usuario():
    """
    Registra el inicio de sesión del usuario (NO actualiza el timestamp en actividades posteriores)
    """
    
    sid = session.get('sid')
    
    with lock_usuarios:
        usuarios_activos = get_usuarios_activos()
        
        if not sid:
            sid = os.urandom(8).hex()
            session['sid'] = sid
            
            # Solo registrar timestamp la PRIMERA vez que se crea el usuario
            if sid not in usuarios_activos:
                timestamp_inicio = datetime.datetime.now()
                usuarios_activos[sid] = {
                    'timestamp': timestamp_inicio,  # Timestamp fijo desde el inicio
                    'datos_sesion': True,
                    'fotos_guardadas': True,
                    'pdf_generado': True
                }
                set_usuarios_activos(usuarios_activos)
            else:
                pass
        else:
            # Verificar si está en el diccionario
            if sid in usuarios_activos:
                pass
            else:
                timestamp_inicio = datetime.datetime.now()
                usuarios_activos[sid] = {
                    'timestamp': timestamp_inicio,
                    'datos_sesion': True,
                    'fotos_guardadas': True,
                    'pdf_generado': True
                }
                set_usuarios_activos(usuarios_activos)
    
    return sid

def limpiar_datos_usuario_completo(sid):
    """
    Limpia TODOS los datos de un usuario específico silenciosamente
    """
    try:
        # 1. Limpiar archivos temporales de fotos
        fotos_path = os.path.join(FOTOS_TMP_DIR, f'fotos_{sid}.json')
        if os.path.exists(fotos_path):
            try:
                os.remove(fotos_path)
            except Exception:
                pass
        
        # 2. Limpiar fotos físicas de evidencia
        directorio_evidencias = FOTOS_RIJ_DIR
        if os.path.exists(directorio_evidencias):
            archivos = os.listdir(directorio_evidencias)
            for archivo in archivos:
                if f'rij_{sid}_' in archivo:
                    ruta_archivo = os.path.join(directorio_evidencias, archivo)
                    if os.path.isfile(ruta_archivo):
                        try:
                            os.remove(ruta_archivo)
                        except Exception:
                            pass
        
        # 3. Limpiar imágenes RIJ generadas
        directorio_imagenes = os.path.join(RESOURCE_FOLDER, 'IMG', 'img RIJ')
        if os.path.exists(directorio_imagenes):
            archivos = os.listdir(directorio_imagenes)
            for archivo in archivos:
                if sid in archivo:
                    ruta_archivo = os.path.join(directorio_imagenes, archivo)
                    if os.path.isfile(ruta_archivo):
                        try:
                            os.remove(ruta_archivo)
                        except Exception:
                            pass
        
        # 4. Remover usuario del diccionario de usuarios activos
        with lock_usuarios:
            usuarios_activos = get_usuarios_activos()
            if sid in usuarios_activos:
                del usuarios_activos[sid]
                set_usuarios_activos(usuarios_activos)
        
    except Exception:
        pass

def limpiar_pdfs_mantenimiento_y_static_imagenes():
    """
    Elimina TODOS los archivos de las carpetas Evidencias_Mantenimiento, static/imagenes y RESOURCE/IMG/img RIJ cada domingo.
    Solo ejecuta la limpieza una vez por día para evitar saturar el servidor.
    """
    import datetime
    import os
    import json
    import shutil
    hoy = datetime.datetime.now()
    if hoy.weekday() == 6:  # 6 es domingo
        control_path = os.path.join(PDFS_MANTENIMIENTO_DIR, '.limpieza_control.json')
        fecha_hoy_str = hoy.strftime('%Y-%m-%d')
        ultima_limpieza = None
        if os.path.exists(control_path):
            try:
                with open(control_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    ultima_limpieza = data.get('fecha')
            except Exception:
                pass
        if ultima_limpieza == fecha_hoy_str:
            return
        # Borrar todos los archivos y carpetas dentro de Evidencias_Mantenimiento
        carpeta1 = PDFS_MANTENIMIENTO_DIR
        if os.path.exists(carpeta1):
            archivos = os.listdir(carpeta1)
            for archivo in archivos:
                ruta = os.path.join(carpeta1, archivo)
                try:
                    if os.path.isfile(ruta) or os.path.islink(ruta):
                        os.remove(ruta)
                    elif os.path.isdir(ruta):
                        shutil.rmtree(ruta)
                except Exception:
                    pass
        # Borrar todos los archivos y carpetas dentro de static/imagenes
        carpeta2 = os.path.join(BASE_DIR, 'static', 'imagenes')
        if os.path.exists(carpeta2):
            archivos = os.listdir(carpeta2)
            for archivo in archivos:
                ruta = os.path.join(carpeta2, archivo)
                try:
                    if os.path.isfile(ruta) or os.path.islink(ruta):
                        os.remove(ruta)
                    elif os.path.isdir(ruta):
                        shutil.rmtree(ruta)
                except Exception:
                    pass
        # Borrar todos los archivos y carpetas dentro de RESOURCE/IMG/img RIJ
        carpeta3 = os.path.join(RESOURCE_FOLDER, 'IMG', 'img RIJ')
        if os.path.exists(carpeta3):
            archivos = os.listdir(carpeta3)
            for archivo in archivos:
                ruta = os.path.join(carpeta3, archivo)
                try:
                    if os.path.isfile(ruta) or os.path.islink(ruta):
                        os.remove(ruta)
                    elif os.path.isdir(ruta):
                        shutil.rmtree(ruta)
                except Exception:
                    pass
        # Guardar la fecha de la última limpieza
        try:
            with open(control_path, 'w', encoding='utf-8') as f:
                json.dump({'fecha': fecha_hoy_str}, f)
        except Exception:
            pass

def tarea_limpieza_automatica():
    """
    Ejecuta la limpieza automática de usuarios que han excedido el tiempo límite
    y limpia los PDFs viejos de mantenimiento y las imágenes de static si corresponde.
    """
    try:
        tiempo_limite = datetime.timedelta(minutes=30)  
        tiempo_actual = datetime.datetime.now()
        usuarios_a_limpiar = []
        with lock_usuarios:
            usuarios_activos = get_usuarios_activos()
            for sid, datos in usuarios_activos.items():
                # Convertir timestamp de string a datetime si es necesario
                timestamp_usuario = datos['timestamp']
                if isinstance(timestamp_usuario, str):
                    timestamp_usuario = datetime.datetime.fromisoformat(timestamp_usuario)
                tiempo_transcurrido = tiempo_actual - timestamp_usuario
                if tiempo_transcurrido >= tiempo_limite:
                    usuarios_a_limpiar.append(sid)
        # Limpiar usuarios fuera del lock para evitar bloqueos
        for sid in usuarios_a_limpiar:
            limpiar_datos_usuario_completo(sid)
        # Llamar limpieza unificada de PDFs y static/imagenes
        limpiar_pdfs_mantenimiento_y_static_imagenes()
    except Exception as e:
        pass

def iniciar_sistema_limpieza():
    """
    Inicia el sistema de limpieza automática en un hilo separado
    """
    def ejecutar_limpieza_periodica():
        while True:
            try:
                tarea_limpieza_automatica()
                time.sleep(10)  # Verificar cada 10 segundos para que sea dinámico
            except Exception:
                time.sleep(5)  # Esperar 5 segundos antes de reintentar
    
    hilo_limpieza = threading.Thread(target=ejecutar_limpieza_periodica, daemon=True)
    hilo_limpieza.start()

# Endpoint para forzar limpieza inmediata (útil para pruebas)
@app.route('/api/rij/forzar_limpieza', methods=['POST'])
def forzar_limpieza_inmediata():
    """
    Fuerza la limpieza inmediata de todos los usuarios que han excedido el tiempo
    """
    try:
        tarea_limpieza_automatica()
        return jsonify({
            'success': True,
            'message': 'Limpieza forzada ejecutada correctamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Endpoint para obtener información de usuarios activos (para monitoreo)
@app.route('/api/rij/usuarios_activos', methods=['GET'])
def obtener_usuarios_activos():
    """
    Devuelve información sobre usuarios activos y sus tiempos
    """
    try:
        tiempo_actual = datetime.datetime.now()
        info_usuarios = []
        
        with lock_usuarios:
            usuarios_activos = get_usuarios_activos()
            for sid, datos in usuarios_activos.items():
                # Convertir timestamp de string a datetime si es necesario
                timestamp_usuario = datos['timestamp']
                if isinstance(timestamp_usuario, str):
                    timestamp_usuario = datetime.datetime.fromisoformat(timestamp_usuario)
                
                tiempo_transcurrido = tiempo_actual - timestamp_usuario
                tiempo_restante = datetime.timedelta(minutes=1) - tiempo_transcurrido
                
                info_usuarios.append({
                    'sid': sid[:8] + '...',  # Solo mostrar parte del SID por seguridad
                    'tiempo_activo_minutos': tiempo_transcurrido.total_seconds() / 60,
                    'tiempo_restante_minutos': max(0, tiempo_restante.total_seconds() / 60),
                    'estado': 'próximo_a_limpiar' if tiempo_restante.total_seconds() < 60 else 'activo'
                })
        
        return jsonify({
            'usuarios_activos': len(info_usuarios),
            'usuarios': info_usuarios
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Endpoint específico para registrar actividad de usuario
@app.route('/api/rij/registrar_actividad', methods=['POST'])
def endpoint_registrar_actividad():
    """
    Endpoint específico para registrar la actividad del usuario
    """
    try:
        sid = registrar_actividad_usuario()
        return jsonify({
            'success': True,
            'sid': sid[:8] + '...'  # Solo mostrar parte del SID por seguridad
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# --- FIN SISTEMA DE LIMPIEZA AUTOMÁTICA ---

# --- RUTAS PARA SISTEMA DE EVIDENCIA DE MANTENIMIENTO ---

# Directorio para almacenar PDFs de mantenimiento (persistente para producción)
PDFS_MANTENIMIENTO_DIR = os.path.join('Evidencias_Mantenimiento')
os.makedirs(PDFS_MANTENIMIENTO_DIR, exist_ok=True)

# Directorio para evidencias fotográficas de mantenimiento
EVIDENCIAS_MANTENIMIENTO_DIR = os.path.join(RESOURCE_FOLDER, 'IMG', 'Evidencias_Mantenimiento')
os.makedirs(EVIDENCIAS_MANTENIMIENTO_DIR, exist_ok=True)

@app.route('/api/evidencia/obtener_pdfs_mantenimiento', methods=['GET'])
def obtener_pdfs_mantenimiento():
    """
    Endpoint para obtener los PDFs de mantenimiento disponibles (ruta requerida por el JavaScript)
    """
    try:
        # Registrar actividad del usuario
        registrar_actividad_usuario()
        
        pdfs_disponibles = []
        
        if os.path.exists(PDFS_MANTENIMIENTO_DIR):
            archivos = os.listdir(PDFS_MANTENIMIENTO_DIR)
            
            for archivo in archivos:
                if archivo.endswith('.pdf'):
                    ruta_archivo = os.path.join(PDFS_MANTENIMIENTO_DIR, archivo)
                    stat = os.stat(ruta_archivo)
                    
                    fecha_creacion_utc = datetime.datetime.fromtimestamp(stat.st_ctime, tz=datetime.timezone.utc)
                    
                    tz_mexico = ZoneInfo("America/Mexico_City")
                    fecha_creacion_local = fecha_creacion_utc.astimezone(tz_mexico)
                    
                    # Determinar tipo de mantenimiento según el nombre
                    tipo_mantenimiento = "Mantenimiento General"
                    if "computo" in archivo.lower():
                        tipo_mantenimiento = "Equipo de Cómputo"
                    elif "tableta" in archivo.lower():
                        tipo_mantenimiento = "Tabletas"
                    elif "celular" in archivo.lower() or "dolphin" in archivo.lower():
                        tipo_mantenimiento = "Dolphin"
                    elif "telecomunicaciones" in archivo.lower():
                        tipo_mantenimiento = "Telecomunicaciones"
                    elif "impresora" in archivo.lower():
                        tipo_mantenimiento = "Impresoras"
                    elif "tps" in archivo.lower() or "honeywell" in archivo.lower():
                        tipo_mantenimiento = "TPS Honeywell"
                    
                    pdfs_disponibles.append({
                        'id': archivo.replace('.pdf', ''),
                        'nombre': archivo.replace('.pdf', ''),  # Mantener el nombre exacto sin modificaciones
                        'fecha': fecha_creacion_local.isoformat(), # Enviar fecha con zona horaria correcta
                        'tipo': tipo_mantenimiento,
                        'ruta': f'/api/evidencia/ver_pdf/{archivo}'
                    })
        
        # Ordenar por fecha de creación (más recientes primero)
        pdfs_disponibles.sort(key=lambda x: x['fecha'], reverse=True)
        
        return jsonify({
            'success': True,
            'pdfs': pdfs_disponibles
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/evidencia/ver_pdf/<nombre_archivo>')
def ver_pdf_mantenimiento(nombre_archivo):
    """
    Sirve un PDF de mantenimiento para visualización
    """
    try:
        # Sanitizar nombre del archivo
        nombre_archivo = secure_filename(nombre_archivo)
        if not nombre_archivo.endswith('.pdf'):
            nombre_archivo += '.pdf'
        
        ruta_archivo = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_archivo)
        
        if not os.path.exists(ruta_archivo):
            return jsonify({'error': 'PDF no encontrado'}), 404
        
        return send_from_directory(PDFS_MANTENIMIENTO_DIR, nombre_archivo)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/evidencia/subir_pdf_mantenimiento', methods=['POST'])
@requiere_autenticacion
def subir_pdf_mantenimiento():
    """
    Endpoint para subir PDFs de mantenimiento
    """
    try:
        registrar_actividad_usuario()
        
        if 'archivo' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No se proporcionó archivo'
            }), 400
        
        archivo = request.files['archivo']
        if archivo.filename == '':
            return jsonify({
                'success': False,
                'error': 'No se seleccionó archivo'
            }), 400
        
        if archivo and archivo.filename.lower().endswith('.pdf'):
            # Generar nombre único para el archivo
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            nombre_archivo = f"{timestamp}_{secure_filename(archivo.filename)}"
            ruta_archivo = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_archivo)
            
            # Guardar archivo
            archivo.save(ruta_archivo)
            
            return jsonify({
                'success': True,
                'message': 'PDF subido correctamente',
                'archivo': nombre_archivo
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Solo se permiten archivos PDF'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/evidencia/guardar_pdf_mantenimiento', methods=['POST'])
def guardar_pdf_mantenimiento():
    """
    Guarda un PDF de mantenimiento en el repositorio temporal
    """
    try:
        data = request.get_json()
        
        if not data or 'pdf_base64' not in data or 'nombre_archivo' not in data:
            return jsonify({
                'success': False,
                'error': 'Datos requeridos no proporcionados'
            }), 400
        
        pdf_base64 = data['pdf_base64']
        nombre_archivo = secure_filename(data['nombre_archivo'])
        tipo_mantenimiento = data.get('tipo_mantenimiento', 'general')
        
        # Registrar actividad del usuario
        sid = registrar_actividad_usuario()
        
        # Limpiar el base64
        if pdf_base64.startswith('data:application/pdf;base64,'):
            pdf_base64 = pdf_base64.split(',')[1]
        elif pdf_base64.startswith('data:'):
            comma_index = pdf_base64.find(',')
            if comma_index != -1:
                pdf_base64 = pdf_base64[comma_index + 1:]
        
        # Decodificar PDF
        try:
            pdf_data = base64.b64decode(pdf_base64)
            
            if not pdf_data.startswith(b'%PDF'):
                raise Exception("El archivo no es un PDF válido")
                
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error al decodificar PDF: {str(e)}'
            }), 400
        
        # Usar el nombre de archivo proporcionado por el usuario, manteniendo solo caracteres seguros
        nombre_base = nombre_archivo
        if nombre_base.endswith('.pdf'):
            nombre_base = nombre_base[:-4]
        
        # Sanitizar el nombre base quitando solo caracteres problemáticos pero manteniendo espacios
        import re
        nombre_base_limpio = re.sub(r'[<>:"/\\|?*]', '', nombre_base)
        nombre_base_limpio = nombre_base_limpio.strip()
        
        # Si después de la limpieza no queda nada válido, usar fallback
        if not nombre_base_limpio or len(nombre_base_limpio) < 1:
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            nombre_base_limpio = f"{tipo_mantenimiento}_{timestamp}"
        
        # Generar nombre final único (agregar timestamp solo si ya existe)
        nombre_final = f"{nombre_base_limpio}.pdf"
        contador = 1
        while os.path.exists(os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_final)):
            nombre_final = f"{nombre_base_limpio}_{contador}.pdf"
            contador += 1
        ruta_archivo = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_final)
        
        # Guardar PDF
        with open(ruta_archivo, 'wb') as f:
            f.write(pdf_data)
        
        return jsonify({
            'success': True,
            'message': 'PDF guardado correctamente',
            'pdf_id': nombre_final.replace('.pdf', ''),
            'nombre_archivo': nombre_final,
            'nombre_guardado': nombre_final.replace('.pdf', '')  # Devolver el nombre exacto guardado
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/evidencia/generar_pdf_con_evidencia', methods=['POST'])
def generar_pdf_con_evidencia():
    """
    Genera un nuevo PDF combinando el PDF de mantenimiento con las evidencias fotográficas
    """
    try:
        data = request.get_json()
        
        if not data or 'pdfSeleccionado' not in data or 'imagenes' not in data:
            return jsonify({
                'success': False,
                'error': 'Datos requeridos no proporcionados'
            }), 400
        
        pdf_seleccionado = data['pdfSeleccionado']
        imagenes = data['imagenes']
        
        if not imagenes:
            return jsonify({
                'success': False,
                'error': 'Se requiere al menos una imagen de evidencia'
            }), 400
        
        # Registrar actividad del usuario
        sid = registrar_actividad_usuario()
        
        # Obtener el PDF original
        nombre_pdf = pdf_seleccionado['id'] + '.pdf'
        ruta_pdf_original = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_pdf)
        
        # Listar archivos disponibles para debug
        if os.path.exists(PDFS_MANTENIMIENTO_DIR):
            archivos_disponibles = os.listdir(PDFS_MANTENIMIENTO_DIR)
        else:
            pass
        
        if not os.path.exists(ruta_pdf_original):
            return jsonify({
                'success': False,
                'error': f'PDF original no encontrado: {nombre_pdf}'
            }), 404
        
        # Generar PDF combinado
        # Remover .pdf del nombre original si existe
        nombre_base = pdf_seleccionado['nombre'].replace('.pdf', '')
        nombre_pdf_final = f"{nombre_base}_Evidencias.pdf"
        ruta_pdf_final = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_pdf_final)
        
        try:
            # Intentar usar PyMuPDF para mejor calidad
            import fitz # pyright: ignore[reportMissingImports]
            
            # Abrir PDF original
            doc_original = fitz.open(ruta_pdf_original)
            doc_final = fitz.open()  # Documento nuevo
            
            # Copiar todas las páginas del PDF original
            doc_final.insert_pdf(doc_original)
            
            # Añadir páginas con evidencias fotográficas (layout 2x3)
            # Configuración del layout
            imagenes_por_pagina = 6  # 2 columnas x 3 filas
            margen_lateral = 57  # 2 cm en puntos (1 cm = 28.35 puntos)
            margen_superior = 80
            margen_inferior = 57
            
            # Calcular dimensiones disponibles
            ancho_pagina = 595  # A4 ancho
            alto_pagina = 842   # A4 alto
            ancho_disponible = ancho_pagina - (2 * margen_lateral)
            alto_disponible = alto_pagina - margen_superior - margen_inferior
            
            # Dimensiones por imagen
            ancho_imagen = (ancho_disponible - 20) / 2  # 2 columnas con espacio entre ellas
            alto_imagen = (alto_disponible - 40) / 3    # 3 filas con espacio entre ellas
            espacio_horizontal = 20
            espacio_vertical = 20
            
            # Procesar imágenes en grupos de 6
            total_imagenes = len(imagenes)
            for pagina_idx in range(0, total_imagenes, imagenes_por_pagina):
                # Crear nueva página para evidencia
                page = doc_final.new_page(width=595, height=842)
                
                # Título de la página
                page.insert_text(
                    (50, 50),
                    "Evidencia Fotográfica",
                    fontsize=16,
                    color=(0, 0, 0)
                )
                
                # Obtener imágenes para esta página
                imagenes_pagina = imagenes[pagina_idx:pagina_idx + imagenes_por_pagina]
                
                # Posicionar imágenes en layout 2x3
                for i, imagen in enumerate(imagenes_pagina):
                    # Calcular posición en la grilla (columna, fila)
                    columna = i % 2
                    fila = i // 2
                    
                    # Calcular coordenadas
                    x = margen_lateral + columna * (ancho_imagen + espacio_horizontal)
                    y = margen_superior + fila * (alto_imagen + espacio_vertical)
                    
                    # Decodificar imagen
                    img_data = imagen['data']
                    if img_data.startswith('data:image'):
                        img_data = img_data.split(',')[1]
                    
                    try:
                        img_bytes = base64.b64decode(img_data)
                        
                        # Definir rectángulo para la imagen
                        img_rect = fitz.Rect(x, y, x + ancho_imagen, y + alto_imagen)
                        
                        # Insertar imagen manteniendo proporción
                        page.insert_image(img_rect, stream=img_bytes, keep_proportion=True)
                        
                    except Exception as img_error:
                        # En caso de error, mostrar un rectángulo con texto de error
                        error_rect = fitz.Rect(x, y, x + ancho_imagen, y + alto_imagen)
                        page.draw_rect(error_rect, color=(0.8, 0.8, 0.8), width=1)
                        page.insert_text(
                            (x + 10, y + alto_imagen/2),
                            "Error al\ncargar imagen",
                            fontsize=10,
                            color=(0.8, 0, 0)
                        )
            
            # Guardar PDF final
            doc_final.save(ruta_pdf_final)
            doc_final.close()
            doc_original.close()
            
        except ImportError:
            # Fallback usando reportlab si PyMuPDF no está disponible
            from reportlab.pdfgen import canvas # pyright: ignore[reportMissingModuleSource]
            from reportlab.lib.pagesizes import A4 # pyright: ignore[reportMissingModuleSource]
            from reportlab.lib.utils import ImageReader # pyright: ignore[reportMissingModuleSource]
            from reportlab.lib import colors # pyright: ignore[reportMissingModuleSource]
            from reportlab.pdfgen.canvas import Canvas # pyright: ignore[reportMissingModuleSource]
            import shutil
            
            # Copiar PDF original como base
            shutil.copy2(ruta_pdf_original, ruta_pdf_final)
            
            # Crear páginas adicionales con evidencias (layout 2x3)
            pdf_evidencias = os.path.join(PDFS_MANTENIMIENTO_DIR, f"temp_evidencias_{sid}.pdf")
            c = canvas.Canvas(pdf_evidencias, pagesize=A4)
            width, height = A4
            
            # Configuración del layout
            imagenes_por_pagina = 6  # 2 columnas x 3 filas
            margen_lateral = 57  # 2 cm en puntos
            margen_superior = 80
            margen_inferior = 57
            
            # Calcular dimensiones disponibles
            ancho_disponible = width - (2 * margen_lateral)
            alto_disponible = height - margen_superior - margen_inferior
            
            # Dimensiones por imagen
            ancho_imagen = (ancho_disponible - 20) / 2  # 2 columnas con espacio
            alto_imagen = (alto_disponible - 40) / 3    # 3 filas con espacio
            espacio_horizontal = 20
            espacio_vertical = 20
            
            # Procesar imágenes en grupos de 6
            total_imagenes = len(imagenes)
            pagina_actual = 0
            
            for pagina_idx in range(0, total_imagenes, imagenes_por_pagina):
                if pagina_actual > 0:
                    c.showPage()
                
                # Título de la página
                c.setFont("Helvetica-Bold", 16)
                c.drawString(50, height - 50, "Evidencia Fotográfica")
                
                # Obtener imágenes para esta página
                imagenes_pagina = imagenes[pagina_idx:pagina_idx + imagenes_por_pagina]
                
                # Posicionar imágenes en layout 2x3
                for i, imagen in enumerate(imagenes_pagina):
                    # Calcular posición en la grilla
                    columna = i % 2
                    fila = i // 2
                    
                    # Calcular coordenadas (en reportlab Y=0 está abajo)
                    x = margen_lateral + columna * (ancho_imagen + espacio_horizontal)
                    y = height - margen_superior - (fila + 1) * (alto_imagen + espacio_vertical)
                    
                    try:
                        img_data = imagen['data']
                        if img_data.startswith('data:image'):
                            img_data = img_data.split(',')[1]
                        
                        img_bytes = base64.b64decode(img_data)
                        img_reader = ImageReader(io.BytesIO(img_bytes))
                        
                        # Insertar imagen en la posición calculada
                        c.drawImage(
                            img_reader, 
                            x, y, 
                            width=ancho_imagen, 
                            height=alto_imagen, 
                            preserveAspectRatio=True
                        )
                        
                    except Exception as img_error:
                        # Dibujar rectángulo de error
                        c.setStrokeColor(colors.red)
                        c.rect(x, y, ancho_imagen, alto_imagen, stroke=1, fill=0)
                        c.setFont("Helvetica", 10)
                        c.drawString(x + 10, y + alto_imagen/2, "Error al cargar imagen")
                
                pagina_actual += 1
            
            c.save()
            
            # Combinar PDFs (esto requeriría PyPDF2 o similar)
            # Por simplicidad, usamos solo el PDF de evidencias
            os.rename(pdf_evidencias, ruta_pdf_final)
        
        # URL para descargar el PDF final
        url_descarga = f'/api/evidencia/descargar_pdf/{nombre_pdf_final}'
        
        if os.path.exists(ruta_pdf_final):
            stat = os.stat(ruta_pdf_final)
        
        return jsonify({
            'success': True,
            'message': 'PDF con evidencia generado correctamente',
            'urlPdf': url_descarga,
            'nombreArchivo': nombre_pdf_final
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def es_nombre_archivo_seguro(nombre):
    """
    Verifica si un nombre de archivo es seguro sin modificarlo
    Permite letras, números, espacios, guiones, puntos y underscore
    """
    import re
    # Permitir caracteres seguros incluyendo espacios
    patron_permitido = re.compile(r'^[a-zA-Z0-9\s\-_\.]+$')
    return patron_permitido.match(nombre) is not None

@app.route('/api/evidencia/descargar_pdf/<path:nombre_archivo>')
def descargar_pdf_evidencia(nombre_archivo):
    """
    Permite descargar un PDF con evidencia generado
    """
    try:
        # Decodificar URL (para manejar %20 -> espacio)
        from urllib.parse import unquote
        nombre_archivo_decodificado = unquote(nombre_archivo)
        
        # Validar seguridad sin modificar el nombre
        if not es_nombre_archivo_seguro(nombre_archivo_decodificado):
            return jsonify({'error': 'Nombre de archivo no válido'}), 400
        
        ruta_archivo = os.path.join(PDFS_MANTENIMIENTO_DIR, nombre_archivo_decodificado)
        
        # Listar archivos disponibles para debug
        if os.path.exists(PDFS_MANTENIMIENTO_DIR):
            archivos_disponibles = [f for f in os.listdir(PDFS_MANTENIMIENTO_DIR) if '_Evidencia.pdf' in f]
            for archivo in archivos_disponibles:
                pass
        
        if not os.path.exists(ruta_archivo):
            return jsonify({
                'error': 'PDF no encontrado',
                'nombre_buscado': nombre_archivo_decodificado,
                'archivos_disponibles': archivos_disponibles
            }), 404
        
        return send_from_directory(
            PDFS_MANTENIMIENTO_DIR,
            nombre_archivo_decodificado,
            as_attachment=True,
            download_name=nombre_archivo_decodificado
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/evidencia/sincronizar_fotos_camara', methods=['POST'])
def sincronizar_fotos_camara():
    """
    Sincroniza fotos del sistema de cámara con el sistema de evidencia
    """
    try:
        data = request.get_json()
        pdf_id = data.get('pdf_id')
        
        if not pdf_id:
            return jsonify({
                'success': False,
                'error': 'ID del PDF no proporcionado'
            }), 400
        
        # Registrar actividad del usuario
        sid = registrar_actividad_usuario()
        
        # Obtener fotos del sistema RIJ
        fotos_camara = session.get('rij_fotos', [])
        
        if not fotos_camara:
            return jsonify({
                'success': True,
                'message': 'No hay fotos en la cámara para sincronizar',
                'fotos_sincronizadas': 0
            }), 200
        
        fotos_procesadas = []
        fotos_exitosas = 0
        
        for i, foto_url in enumerate(fotos_camara):
            try:
                # Extraer nombre de archivo de la URL
                nombre_archivo = foto_url.split('/')[-1]
                ruta_foto = os.path.join(FOTOS_RIJ_DIR, nombre_archivo)
                
                if os.path.exists(ruta_foto):
                    # Leer archivo y convertir a base64
                    with open(ruta_foto, 'rb') as f:
                        foto_data = f.read()
                    
                    foto_base64 = f"data:image/jpeg;base64,{base64.b64encode(foto_data).decode()}"
                    
                    # Información de la foto procesada
                    foto_info = {
                        'id': f"camara_{sid}_{i}_{int(time.time())}",
                        'nombre': f"Evidencia_Camara_{i+1}.jpg",
                        'tipo': 'image/jpeg',
                        'tamaño': len(foto_data),
                        'data': foto_base64,
                        'fecha': datetime.datetime.now().isoformat(),
                        'origen': 'camara'
                    }
                    
                    fotos_procesadas.append(foto_info)
                    fotos_exitosas += 1
                    
            except Exception as e:
                continue
        
        return jsonify({
            'success': True,
            'message': f'{fotos_exitosas} fotos sincronizadas correctamente',
            'fotos_sincronizadas': fotos_exitosas,
            'fotos': fotos_procesadas
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/evidencia/estado_camara', methods=['GET'])
def obtener_estado_camara():
    """
    Obtiene el estado actual de las fotos en el sistema de cámara
    """
    try:
        # Registrar actividad del usuario
        registrar_actividad_usuario()
        
        fotos_camara = session.get('rij_fotos', [])
        
        return jsonify({
            'success': True,
            'total_fotos': len(fotos_camara),
            'fotos_disponibles': len(fotos_camara),
            'urls': fotos_camara
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# --- FIN RUTAS PARA SISTEMA DE EVIDENCIA DE MANTENIMIENTO ---

# --- ENDPOINTS DE AUTENTICACIÓN ---

@app.route('/api/login', methods=['POST'])
def login():
    """
    Endpoint mejorado de login con gestión de sesiones en base de datos
    """
    try:
        data = request.get_json()
        if not data or 'password' not in data:
            return jsonify({
                'success': False,
                'message': 'Contraseña requerida'
            }), 400
        
        password = data['password'].strip()
        if not password:
            return jsonify({
                'success': False,
                'message': 'La contraseña no puede estar vacía'
            }), 400
        
        # Obtener información del cliente
        ip_cliente = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        user_agent = request.headers.get('User-Agent', 'unknown')
        
        # Crear sesión autenticada
        token_sesion = crear_sesion_usuario(password, ip_cliente, user_agent)
        
        if token_sesion:
            # Guardar token en la sesión de Flask
            session['session_token'] = token_sesion
            session['authenticated'] = True
            session['login_time'] = datetime.datetime.now().isoformat()
            
            # También registrar en el sistema de limpieza de datos
            registrar_actividad_usuario()
            
            return jsonify({
                'success': True,
                'message': 'Acceso autorizado',
                'tiempo_sesion_minutos': TIEMPO_SESION_MINUTOS
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Contraseña incorrecta'
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@app.route('/api/verificar_sesion', methods=['GET'])
def verificar_sesion_endpoint():
    """
    Verifica el estado actual de la sesión y devuelve información
    """
    try:
        token_sesion = session.get('session_token')
        
        if not token_sesion:
            return jsonify({
                'success': False,
                'autenticado': False,
                'mensaje': 'No hay sesión activa'
            }), 200
        
        # Verificar si la sesión sigue siendo válida
        if verificar_sesion_activa(token_sesion):
            tiempo_restante = obtener_tiempo_restante_sesion(token_sesion)
            
            return jsonify({
                'success': True,
                'autenticado': True,
                'tiempo_restante_minutos': tiempo_restante,
                'debe_mostrar_advertencia': tiempo_restante <= (TIEMPO_SESION_MINUTOS - TIEMPO_ADVERTENCIA_MINUTOS)
            }), 200
        else:
            # Limpiar sesión local si ya expiró
            session.clear()
            return jsonify({
                'success': False,
                'autenticado': False,
                'mensaje': 'Sesión expirada'
            }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """
    Cierra la sesión del usuario
    """
    try:
        token_sesion = session.get('session_token')
        
        if token_sesion:
            # Cerrar sesión en la base de datos
            cerrar_sesion(token_sesion)
        
        # Limpiar sesión local
        session.clear()
        
        return jsonify({
            'success': True,
            'message': 'Sesión cerrada correctamente'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

# --- FIN ENDPOINTS DE AUTENTICACIÓN ---

# --- INICIO ENDPOINTS PARA GOOGLE DRIVE ---
try:
    from SubirFormatos_Mantenimiento_Drive import (
        subir_pdf_mantenimiento, 
        obtener_estado_cola,
        procesar_cola_pendientes,
        verificar_conexion_internet,
        verificar_configuracion_oauth
    )
    
    @app.route('/api/drive/subir_pdf_mantenimiento', methods=['POST'])
    def api_subir_pdf_drive():
        """
        Endpoint para subir PDFs de mantenimiento a Google Drive usando OAuth
        """
        try:
            datos = request.get_json()
            
            if not datos:
                return jsonify({
                    'success': False,
                    'error': 'No se recibieron datos'
                }), 400
            
            archivo_pdf_relativo = datos.get('archivo_pdf')
            nombre_personalizado = datos.get('nombre_personalizado')
            
            if not archivo_pdf_relativo:
                return jsonify({
                    'success': False,
                    'error': 'Falta el parámetro archivo_pdf'
                }), 400
            
            # Convertir ruta relativa a absoluta
            archivo_pdf_absoluto = os.path.abspath(archivo_pdf_relativo)
            
            # Verificar que el archivo existe
            if not os.path.exists(archivo_pdf_absoluto):
                return jsonify({
                    'success': False,
                    'error': f'El archivo no existe: {archivo_pdf_absoluto}'
                }), 400
            
            # Subir PDF usando OAuth
            resultado = subir_pdf_mantenimiento(archivo_pdf_absoluto, nombre_personalizado)
            
            # Convertir formato de respuesta para compatibilidad
            if resultado.get('exito'):
                return jsonify({
                    'success': True,
                    'mensaje': resultado.get('mensaje'),
                    'file_id': resultado.get('id_drive'),
                    'file_name': resultado.get('nombre_final'),
                    'file_link': resultado.get('enlace_drive'),
                   
                    'folder_id': resultado.get('carpeta_id')
                })
            else:
                return jsonify({
                    'success': False,
                    'error': resultado.get('error'),
                    'queued': resultado.get('agregado_a_cola', False)
                })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error interno del servidor: {e}'
            }), 500
    
    @app.route('/api/drive/estado_cola', methods=['GET'])
    def api_estado_cola_drive():
        """
        Endpoint para obtener el estado de la cola de pendientes
        """
        try:
            estado = obtener_estado_cola()
            return jsonify({
                'success': True,
                'estado_cola': estado
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error interno del servidor: {e}'
            }), 500
    
    @app.route('/api/drive/procesar_cola', methods=['POST'])
    def api_procesar_cola_drive():
        """
        Endpoint para forzar el procesamiento de la cola de pendientes
        """
        try:
            resultado = procesar_cola_pendientes()
            return jsonify({
                'success': True,
                'resultado': resultado
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error interno del servidor: {e}'
            }), 500
    
    @app.route('/api/drive/estado_conexion', methods=['GET'])
    def api_estado_conexion():
        """
        Endpoint para verificar el estado de la conexión a internet
        """
        try:
            tiene_conexion = verificar_conexion_internet()
            return jsonify({
                'success': True,
                'tiene_conexion': tiene_conexion
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error interno del servidor: {e}'
            }), 500
    
    @app.route('/api/drive/verificar_oauth', methods=['GET'])
    def api_verificar_oauth():
        """
        Endpoint para verificar la configuración OAuth de Google Drive
        """
        try:
            resultado = verificar_configuracion_oauth()
            return jsonify({
                'success': True,
                'oauth_status': resultado
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error interno del servidor: {e}'
            }), 500

except ImportError as e:
    # Endpoints de fallback que devuelven error
    @app.route('/api/drive/subir_pdf_mantenimiento', methods=['POST'])
    def api_subir_pdf_drive_fallback():
        return jsonify({
            'success': False,
            'error': 'Módulo de Google Drive no disponible'
        }), 503
    
    @app.route('/api/drive/estado_cola', methods=['GET'])
    def api_estado_cola_drive_fallback():
        return jsonify({
            'success': False,
            'error': 'Módulo de Google Drive no disponible'
        }), 503
    
    @app.route('/api/drive/procesar_cola', methods=['POST'])
    def api_procesar_cola_drive_fallback():
        return jsonify({
            'success': False,
            'error': 'Módulo de Google Drive no disponible'
        }), 503
    
    @app.route('/api/drive/estado_conexion', methods=['GET'])
    def api_estado_conexion_fallback():
        return jsonify({
            'success': False,
            'error': 'Módulo de Google Drive no disponible'
        }), 503

# --- FIN ENDPOINTS PARA GOOGLE DRIVE ---

cert_path = os.path.join(BASE_DIR, 'cert.pem')
key_path = os.path.join(BASE_DIR, 'key.pem')

ssl_context_tuple = (cert_path, key_path)

# --- INICIO DE MODIFICACIONES PARA PRODUCCIÓN EN PYTHONANYWHERE ---
# Inicializar sistema de limpieza automática original
iniciar_sistema_limpieza()

# Inicializar sistema de limpieza de sesiones autenticadas
iniciar_limpieza_sesiones()

if __name__ == '__main__':
    
    app.run(host='0.0.0.0', port=8000,ssl_context=ssl_context_tuple, debug=False)

# --- FIN DE MODIFICACIONES PARA PRODUCCIÓN ---