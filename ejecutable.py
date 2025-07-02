from flask import Flask, send_from_directory, request, jsonify, session, url_for, render_template, redirect
import os
import tempfile
import json
import base64
import datetime
import threading
import time
import atexit
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

# Aquí se define la ruta principal con el archivo HTML que se desplegará, como por ejemplo 'menu.html'.
@app.route('/')
def index():
    # Asegúrate de que 'menu.html' exista en la carpeta TEMPLATES
    return send_from_directory(TEMPLATES_FOLDER, 'menu.html')

@app.route('/TEMPLATES/<path:filename>')
def templates_root(filename):
    # Validar que el filename no sea null, vacío o inválido
    if not filename or filename.lower() in ['null', 'undefined', 'none', '']:
        print(f"🚨 Intento de acceso a archivo inválido en TEMPLATES: '{filename}'")
        return jsonify({'error': 'Archivo no válido'}), 400
    
    # Registrar actividad automáticamente para páginas RIJ y cámara
    if 'formato_RIJ.html' in filename or 'camara.html' in filename:
        registrar_actividad_usuario()
    
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
        
        mensaje_texto = f"""
        Ya carga la mmd,
        
{datetime.datetime.now().strftime('%d de %B de %Y')}. #dia actual pero ingles
        

        """         
        
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
def get_db_connection():
    """Crea y devuelve una conexión a la base de datos MySQL."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None
    
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

def cargar_usuarios_activos():
    """Carga el diccionario de usuarios activos desde archivo"""
    try:
        if os.path.exists(USUARIOS_ACTIVOS_FILE):
            with open(USUARIOS_ACTIVOS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Convertir timestamps de string a datetime
                for sid, info in data.items():
                    if 'timestamp' in info:
                        info['timestamp'] = datetime.datetime.fromisoformat(info['timestamp'])
                return data
    except Exception as e:        return {}

def guardar_usuarios_activos(usuarios):
    """Guarda el diccionario de usuarios activos en archivo"""
    try:
        # Convertir timestamps a string para serialización JSON
        data_to_save = {}
        for sid, info in usuarios.items():
            data_to_save[sid] = dict(info)
            if 'timestamp' in data_to_save[sid]:
                data_to_save[sid]['timestamp'] = info['timestamp'].isoformat()
        
        with open(USUARIOS_ACTIVOS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, indent=2)
    except Exception as e:
        pass

def get_usuarios_activos():
    """Obtiene el diccionario actual de usuarios activos"""
    return cargar_usuarios_activos()

def set_usuarios_activos(usuarios):
    """Actualiza el diccionario de usuarios activos"""
    guardar_usuarios_activos(usuarios)

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
            else:
                pass
        else:
            pass
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
    
    return sid

def limpiar_datos_usuario_completo(sid):
    """
    Limpia TODOS los datos de un usuario específico silenciosamente
    """
    try:
        # 1. Limpiar archivos temporales de fotos
        fotos_tmp_path = os.path.join(tempfile.gettempdir(), 'rij_fotos', f'fotos_{sid}.json')
        if os.path.exists(fotos_tmp_path):
            os.remove(fotos_tmp_path)
        
        # 2. Limpiar todas las fotos físicas del usuario en carpeta de evidencias
        if os.path.exists(FOTOS_RIJ_DIR):
            for nombre_archivo in os.listdir(FOTOS_RIJ_DIR):
                if (nombre_archivo.startswith(f"rij_{sid}_") or 
                    nombre_archivo.startswith(f"importada_{sid}_")):
                    ruta_archivo = os.path.join(FOTOS_RIJ_DIR, nombre_archivo)
                    if os.path.isfile(ruta_archivo):
                        try:
                            os.remove(ruta_archivo)
                        except Exception:
                            pass
        
        # 3. Limpiar imágenes de PDF generadas en img RIJ
        directorio_imagenes = os.path.join(RESOURCE_FOLDER, 'IMG', 'img RIJ')
        if os.path.exists(directorio_imagenes):
            for nombre_archivo in os.listdir(directorio_imagenes):
                if sid in nombre_archivo and nombre_archivo.endswith('.png'):
                    ruta_archivo = os.path.join(directorio_imagenes, nombre_archivo)
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
            'sid': sid[:8] + '...',
            'message': 'Actividad registrada correctamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# --- FIN SISTEMA DE LIMPIEZA AUTOMÁTICA ---

if __name__ == '__main__':
    # --- INICIO DE MODIFICACIONES PARA HTTPS ---
    # Configuración para habilitar HTTPS en el servidor Flask.

    # Inicializar sistema de limpieza automática
    iniciar_sistema_limpieza()

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

