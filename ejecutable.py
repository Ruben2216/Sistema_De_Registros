from flask import Flask, send_from_directory, request, jsonify, session, url_for, render_template, redirect
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
from functools import wraps
from werkzeug.utils import secure_filename
# --- INICIO LÓGICA DE backend (búsqueda de equipos en MySQL) ---
from flask_cors import CORS 
import mysql.connector 
from mysql.connector import Error
from dotenv import load_dotenv
from kilometro_vida import bp_imgdia
# --- IMPORTACIONES PARA CORREO ---
from flask_mail import Mail, Message
import io

# --- CONFIGURACIÓN DE AUTENTICACIÓN ---
TIEMPO_SESION_MINUTOS = 30  # 30 minutos de sesión
TIEMPO_ADVERTENCIA_MINUTOS = 25  # Advertencia a los 25 minutos (5 minutos antes)

# Rutas absolutas a las carpetas en el proyecto. Preferentemente, si se mueven los archivos, verificar aquí las rutas para evitar que se rompan
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_FOLDER = os.path.join(BASE_DIR, 'TEMPLATES')
MANTENIMIENTO_FOLDER = os.path.join(TEMPLATES_FOLDER, 'Mantenimiento')
RESOURCE_FOLDER = os.path.join(BASE_DIR, 'RESOURCE')

app = Flask(__name__, static_url_path='', static_folder=TEMPLATES_FOLDER)
app.secret_key = 'supersecretkey'  # Necesario para usar session

# --- CONFIGURACIÓN DE CORREO ---
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'sistemaregistrocfe@gmail.com'
app.config['MAIL_PASSWORD'] = 'ytji fwik rftf njxw'  
app.config['MAIL_DEFAULT_SENDER'] = 'sistemaregistrocfe@gmail.com'

mail = Mail(app)

# --- FUNCIONES DE AUTENTICACIÓN (DEFINIDAS ANTES DE LAS RUTAS) ---

def get_db_connection():
    """Crea y devuelve una conexión a la base de datos MySQL."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
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
        print(f"Error al crear sesión: {e}")
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
        print(f"Error al verificar sesión: {e}")
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
        print(f"Error al obtener tiempo restante: {e}")
        return None
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def cerrar_sesion(token_sesion):
    """Cierra una sesión específica"""
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
        print(f"Error al cerrar sesión: {e}")
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
        print(f"Error al limpiar sesiones expiradas: {e}")
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
                print(f"Error en limpieza de sesiones: {e}")
                time.sleep(60)  # Esperar 1 minuto antes de reintentar
    
    hilo_limpieza = threading.Thread(target=ejecutar_limpieza, daemon=True)
    hilo_limpieza.start()

def requiere_autenticacion(f):

    @wraps(f)
    def decorador(*args, **kwargs):
        token_sesion = session.get('session_token')
        
        if not token_sesion or not verificar_sesion_activa(token_sesion):
            # Si es una petición AJAX, devolver JSON
            if request.is_json or 'application/json' in request.headers.get('Content-Type', ''):
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
        print(f"🚨 Intento de acceso a archivo inválido en TEMPLATES: '{filename}'")
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
        print(f"[POST] Guardando datos en sesión: {datos}", file=sys.stderr)
        print(f"[POST] session.sid: {session.get('sid')}", file=sys.stderr)
        return jsonify({'ok': True, 'msg': 'Datos guardados temporalmente'}), 200
    else:
        datos = session.get('rij_datos')
        # Registrar actividad del usuario para sistema de limpieza
        registrar_actividad_usuario()
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
        print(f"Error al enviar correo: {str(e)}")
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
        print(f"Error al guardar imagen RIJ: {str(e)}")
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
                import fitz  # PyMuPDF
                
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
        print(f"Error al obtener la meta del día: {e}")
        meta_diaria = "Error al consultar la meta del día."
        
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()
            
    return meta_diaria

# Endpoint de prueba para debugging
@app.route('/test_debug')
def test_debug():
    print(f"[TEST] === INICIO TEST DEBUG ===")
    print(f"[TEST] Request: {request}")
    print(f"[TEST] Session: {dict(session)}")
    try:
        print(f"[TEST] Llamando a registrar_actividad_usuario...")
        sid = registrar_actividad_usuario()
        print(f"[TEST] registrar_actividad_usuario completado, SID: {sid}")
        return f"Test exitoso, SID: {sid}"
    except Exception as e:
        print(f"[TEST] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return f"Error: {e}"

@app.route('/formato_RIJ.html')
def pagina_rij():
    print(f"[DEBUG] === ACCESO A PÁGINA RIJ ===")
    try:
        # Registrar actividad automáticamente
        print(f"[DEBUG] Llamando a registrar_actividad_usuario...")
        sid = registrar_actividad_usuario()
        print(f"[DEBUG] registrar_actividad_usuario completado, SID: {sid}")
    except Exception as e:
        print(f"[DEBUG] ERROR en registrar_actividad_usuario: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"[DEBUG] Continuando con lógica de la página...")
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
    print(f"[DEBUG] Retornando render_template...")
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
        print(f"Error en la consulta de sugerencias: {e}")
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
        print(f"Error al leer usuarios activos: {e}")
        return {}

def set_usuarios_activos(usuarios_dict):
    """
    Guarda la lista de usuarios activos en el archivo JSON
    """
    try:
        with open(USUARIOS_ACTIVOS_FILE, 'w', encoding='utf-8') as f:
            json.dump(usuarios_dict, f, default=str, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error al guardar usuarios activos: {e}")

def registrar_actividad_usuario():
    """
    Registra el inicio de sesión del usuario (NO actualiza el timestamp en actividades posteriores)
    """
    print(f"[DEBUG] === INICIO REGISTRO ACTIVIDAD ===")
    print(f"[DEBUG] Request endpoint: {request.endpoint}")
    print(f"[DEBUG] Request path: {request.path}")
    print(f"[DEBUG] Session antes: {dict(session)}")
    
    sid = session.get('sid')
    print(f"[DEBUG] SID actual en session: {sid}")
    
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
                print(f"[DEBUG] Nuevo usuario registrado: {sid}")
            else:
                print(f"[DEBUG] Usuario ya existe en diccionario: {sid}")
        else:
            # Verificar si está en el diccionario
            if sid in usuarios_activos:
                print(f"[DEBUG] Usuario encontrado en diccionario activos")
            else:
                print(f"[DEBUG] Usuario NO encontrado en diccionario activos, re-registrando...")
                timestamp_inicio = datetime.datetime.now()
                usuarios_activos[sid] = {
                    'timestamp': timestamp_inicio,
                    'datos_sesion': True,
                    'fotos_guardadas': True,
                    'pdf_generado': True
                }
                set_usuarios_activos(usuarios_activos)
    
    print(f"[DEBUG] === FIN REGISTRO ACTIVIDAD ===")
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

def tarea_limpieza_automatica():
    """
    Ejecuta la limpieza automática de usuarios que han excedido el tiempo límite
    """
    try:
        tiempo_limite = datetime.timedelta(minutes=5)
        tiempo_actual = datetime.datetime.now()
        usuarios_a_limpiar = []
        
        with lock_usuarios:
            usuarios_activos = get_usuarios_activos()
            
            for sid, datos in usuarios_activos.items():
                tiempo_transcurrido = tiempo_actual - datos['timestamp']
                if tiempo_transcurrido >= tiempo_limite:
                    usuarios_a_limpiar.append(sid)
        
        # Limpiar usuarios fuera del lock para evitar bloqueos
        for sid in usuarios_a_limpiar:
            limpiar_datos_usuario_completo(sid)
    
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
                tiempo_transcurrido = tiempo_actual - datos['timestamp']
                tiempo_restante = datetime.timedelta(minutes=1) - tiempo_transcurrido
                
                info_usuarios.append({
                    'sid': sid[:8] + '...',  # Solo mostrar parte del SID por seguridad
                    'tiempo_transcurrido_minutos': int(tiempo_transcurrido.total_seconds() / 60),
                    'tiempo_restante_minutos': max(0, int(tiempo_restante.total_seconds() / 60)),
                    'estado': 'próximo_a_limpiar' if tiempo_restante.total_seconds() < 300 else 'activo'
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

# Directorio para almacenar PDFs de mantenimiento temporalmente
PDFS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
os.makedirs(PDFS_MANTENIMIENTO_DIR, exist_ok=True)

# Directorio para evidencias fotográficas de mantenimiento
EVIDENCIAS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'evidencias_mantenimiento')
os.makedirs(EVIDENCIAS_MANTENIMIENTO_DIR, exist_ok=True)

@app.route('/api/evidencia/listar_pdfs', methods=['GET'])
def listar_pdfs_mantenimiento():
    """
    Lista todos los PDFs de mantenimiento disponibles
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
                    fecha_creacion = datetime.datetime.fromtimestamp(stat.st_ctime)
                    
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
                        'fecha': fecha_creacion.isoformat(),
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
        print(f"Error al obtener PDFs de mantenimiento: {e}")
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

# --- FIN RUTAS PARA SISTEMA DE EVIDENCIA DE MANTENIMIENTO ---

# --- CONFIGURACIÓN DE INICIO ---

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
        print(f"Error en login: {e}")
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
        print(f"Error al verificar sesión: {e}")
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
        print(f"Error al cerrar sesión: {e}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

# --- FIN ENDPOINTS DE AUTENTICACIÓN ---

if __name__ == '__main__':
    # --- INICIO DE MODIFICACIONES PARA HTTPS ---
    # Configuración para habilitar HTTPS en el servidor Flask.

    # Inicializar sistema de limpieza automática original
    iniciar_sistema_limpieza()
    
    # Inicializar sistema de limpieza de sesiones autenticadas
    iniciar_limpieza_sesiones()

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

    # Ejecuta la aplicación Flask con el contexto SSL/TLS
    app.run(host=HOST_IP, port=PORT, ssl_context=ssl_context_tuple, debug=False)
