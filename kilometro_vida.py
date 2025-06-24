from flask import Blueprint, render_template
import datetime
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import googleapiclient.http
import io

# Configuración de Google Drive
SERVICE_ACCOUNT_FILE = os.path.join('credenciales', 'service_account.json')
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CARPETA_ONEDRIVE = 'Mensajes_Seguridad_2025'
LOCAL_IMG_FOLDER = os.path.join('static', 'imagenes')
os.makedirs(LOCAL_IMG_FOLDER, exist_ok=True)

bp_imgdia = Blueprint('imgdia', __name__)

def obtener_servicio_drive():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build('drive', 'v3', credentials=creds)
    return service

def buscar_archivo_por_fecha(service, carpeta_nombre, fecha_str):
    try:
        query_carpeta = f"name = '{carpeta_nombre}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
        resultado_carpeta = service.files().list(q=query_carpeta, spaces='drive', fields='files(id, name)').execute()
        carpetas = resultado_carpeta.get('files', [])
        if not carpetas:
            return None
        carpeta_id = carpetas[0]['id']
        nombre_archivo = f"{fecha_str}.jpg"
        query_archivo = f"'{carpeta_id}' in parents and name = '{nombre_archivo}' and trashed = false"
        resultado_archivo = service.files().list(q=query_archivo, spaces='drive', fields='files(id, name)').execute()
        archivos = resultado_archivo.get('files', [])
        if not archivos:
            return None
        archivo_id = archivos[0]['id']
        return archivo_id
    except HttpError:
        return None

def descargar_archivo(service, file_id, ruta_local):
    try:
        request = service.files().get_media(fileId=file_id)
        fh = io.FileIO(ruta_local, 'wb')
        downloader = googleapiclient.http.MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        fh.close()
        return True
    except HttpError:
        return False

@bp_imgdia.route('/imgdia')
def mostrar_imgdia():
    servicio = obtener_servicio_drive()
    hoy = datetime.date.today().strftime('%d-%m-%Y')
    archivo_id = buscar_archivo_por_fecha(servicio, CARPETA_ONEDRIVE, hoy)
    if not archivo_id:
        return render_template('formato_RIJ.html', imagen_url=None)
    nombre_archivo = f"{hoy}.jpg"
    ruta_local = os.path.join(LOCAL_IMG_FOLDER, nombre_archivo)
    if not os.path.exists(ruta_local):
        exito = descargar_archivo(servicio, archivo_id, ruta_local)
        if not exito:
            return render_template('formato_RIJ.html', imagen_url=None)
    url_imagen = f"/static/imagenes/{nombre_archivo}"
    return render_template('formato_RIJ.html', imagen_url=url_imagen)
