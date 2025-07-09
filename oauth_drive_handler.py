
import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
import pickle
import queue
import threading
import time

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DriveOAuthHandler:
    """Manejador de OAuth 2.0 para Google Drive"""
    
    # Alcances requeridos para Google Drive
    SCOPES = ['https://www.googleapis.com/auth/drive.file']
    
    def __init__(self, credentials_file: str = 'credenciales/oauth_credentials.json', 
                 token_file: str = 'credenciales/drive_token.pickle'):
        """
        Inicializa el manejador OAuth.
        
        Args:
            credentials_file: Ruta al archivo de credenciales OAuth
            token_file: Ruta al archivo donde se guardará el token
        """
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.service = None
        self.creds = None
        
        # Cola para archivos pendientes de subir
        self.upload_queue = queue.Queue()
        self.queue_file = 'credenciales/drive_upload_queue.json'
        
        # Configuración de carpetas
        self.base_folder_name = "Programa_mantenimiento"
        self.base_folder_id = None
        
        # Hilo para procesar cola
        self.queue_thread = None
        self.processing_queue = False
        
    def setup_credentials(self) -> bool:
        """
        Configura las credenciales OAuth 2.0.
        
        Returns:
            True si las credenciales están listas, False si hay error
        """
        creds = None
        
        # Cargar token existente si existe
        if os.path.exists(self.token_file):
            try:
                with open(self.token_file, 'rb') as token:
                    creds = pickle.load(token)
                logger.info("Token OAuth cargado desde archivo")
            except Exception as e:
                logger.warning(f"Error al cargar token: {e}")
        
        # Si no hay credenciales válidas, obtenerlas
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                    logger.info("Token OAuth renovado")
                except Exception as e:
                    logger.warning(f"Error al renovar token: {e}")
                    creds = None
            
            if not creds:
                if not os.path.exists(self.credentials_file):
                    logger.error(f"Archivo de credenciales no encontrado: {self.credentials_file}")
                    return False
                
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_file, self.SCOPES)
                    creds = flow.run_local_server(port=0)
                    logger.info("Nuevas credenciales OAuth obtenidas")
                except Exception as e:
                    logger.error(f"Error en flujo OAuth: {e}")
                    return False
            
            # Guardar credenciales
            try:
                os.makedirs(os.path.dirname(self.token_file), exist_ok=True)
                with open(self.token_file, 'wb') as token:
                    pickle.dump(creds, token)
                logger.info("Token OAuth guardado")
            except Exception as e:
                logger.warning(f"Error al guardar token: {e}")
        
        self.creds = creds
        return True
    
    def initialize_drive_service(self) -> bool:
        """
        Inicializa el servicio de Google Drive.
        
        Returns:
            True si el servicio está listo, False si hay error
        """
        if not self.setup_credentials():
            return False
        
        try:
            self.service = build('drive', 'v3', credentials=self.creds)
            logger.info("Servicio Google Drive inicializado")
            return True
        except Exception as e:
            logger.error(f"Error al inicializar servicio Drive: {e}")
            return False
    
    def find_or_create_folder(self, folder_name: str, parent_id: str = None) -> Optional[str]:
        """
        Busca una carpeta por nombre o la crea si no existe.
        
        Args:
            folder_name: Nombre de la carpeta
            parent_id: ID de la carpeta padre (None para raíz)
            
        Returns:
            ID de la carpeta o None si hay error
        """
        if not self.service:
            if not self.initialize_drive_service():
                return None
        
        try:
            # Buscar carpeta existente
            query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
            if parent_id:
                query += f" and '{parent_id}' in parents"
            
            results = self.service.files().list(
                q=query,
                fields="files(id, name)"
            ).execute()
            
            folders = results.get('files', [])
            
            if folders:
                logger.info(f"Carpeta '{folder_name}' encontrada: {folders[0]['id']}")
                return folders[0]['id']
            
            # Crear carpeta si no existe
            folder_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            if parent_id:
                folder_metadata['parents'] = [parent_id]
            
            folder = self.service.files().create(
                body=folder_metadata,
                fields='id'
            ).execute()
            
            folder_id = folder.get('id')
            logger.info(f"Carpeta '{folder_name}' creada: {folder_id}")
            return folder_id
            
        except HttpError as e:
            logger.error(f"Error al buscar/crear carpeta '{folder_name}': {e}")
            return None
    
    def setup_folder_structure(self, year: int, month: int) -> Optional[str]:
        """
        Configura la estructura de carpetas para un año y mes específicos.
        
        Args:
            year: Año
            month: Mes (1-12)
            
        Returns:
            ID de la carpeta de evidencias o None si hay error
        """
        try:
            # Crear/buscar carpeta base
            if not self.base_folder_id:
                self.base_folder_id = self.find_or_create_folder(self.base_folder_name)
                if not self.base_folder_id:
                    return None
            
            # Crear/buscar carpeta del año
            year_folder_id = self.find_or_create_folder(str(year), self.base_folder_id)
            if not year_folder_id:
                return None
            
            # Crear/buscar carpeta del mes
            month_names = [
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ]
            month_name = month_names[month - 1]
            evidence_folder_name = f"Evidencias{month_name}"
            
            evidence_folder_id = self.find_or_create_folder(evidence_folder_name, year_folder_id)
            return evidence_folder_id
            
        except Exception as e:
            logger.error(f"Error al configurar estructura de carpetas: {e}")
            return None
    
    def upload_file_to_drive(self, file_path: str, filename: str = None) -> Dict[str, Any]:
        """
        Sube un archivo a Google Drive.
        
        Args:
            file_path: Ruta local del archivo
            filename: Nombre personalizado para el archivo (opcional)
            
        Returns:
            Diccionario con el resultado de la subida
        """
        if not os.path.exists(file_path):
            return {"success": False, "error": "Archivo no encontrado"}
        
        if not self.service:
            if not self.initialize_drive_service():
                return {"success": False, "error": "No se pudo inicializar servicio Drive"}
        
        try:
            # Determinar año y mes actual
            now = datetime.now()
            year = now.year
            month = now.month
            
            # Configurar estructura de carpetas
            folder_id = self.setup_folder_structure(year, month)
            if not folder_id:
                return {"success": False, "error": "No se pudo configurar estructura de carpetas"}
            
            # Configurar metadatos del archivo
            file_name = filename or os.path.basename(file_path)
            file_metadata = {
                'name': file_name,
                'parents': [folder_id]
            }
            
            # Configurar media upload
            media = MediaFileUpload(file_path, resumable=True)
            
            # Subir archivo
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,name,webViewLink'
            ).execute()
            
            file_id = file.get('id')
            file_link = file.get('webViewLink')
            
            logger.info(f"Archivo subido exitosamente: {file_name} ({file_id})")
            
            return {
                "success": True,
                "file_id": file_id,
                "file_name": file_name,
                "file_link": file_link,
                "folder_id": folder_id
            }
            
        except HttpError as e:
            error_msg = f"Error HTTP al subir archivo: {e}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Error al subir archivo: {e}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
    
    def add_to_queue(self, file_path: str, filename: str = None):
        """
        Agrega un archivo a la cola de subida.
        
        Args:
            file_path: Ruta del archivo
            filename: Nombre personalizado del archivo
        """
        item = {
            "file_path": file_path,
            "filename": filename,
            "timestamp": datetime.now().isoformat()
        }
        
        self.upload_queue.put(item)
        self.save_queue_to_file()
        logger.info(f"Archivo agregado a cola: {file_path}")
    
    def save_queue_to_file(self):
        """Guarda la cola actual en un archivo."""
        try:
            queue_items = []
            temp_queue = queue.Queue()
            
            # Extraer todos los elementos
            while not self.upload_queue.empty():
                item = self.upload_queue.get()
                queue_items.append(item)
                temp_queue.put(item)
            
            # Restaurar la cola
            while not temp_queue.empty():
                self.upload_queue.put(temp_queue.get())
            
            # Guardar en archivo
            os.makedirs(os.path.dirname(self.queue_file), exist_ok=True)
            with open(self.queue_file, 'w', encoding='utf-8') as f:
                json.dump(queue_items, f, indent=2, ensure_ascii=False)
            
        except Exception as e:
            logger.warning(f"Error al guardar cola: {e}")
    
    def load_queue_from_file(self):
        """Carga la cola desde un archivo."""
        try:
            if os.path.exists(self.queue_file):
                with open(self.queue_file, 'r', encoding='utf-8') as f:
                    queue_items = json.load(f)
                
                for item in queue_items:
                    self.upload_queue.put(item)
                
                logger.info(f"Cola cargada: {len(queue_items)} elementos")
        except Exception as e:
            logger.warning(f"Error al cargar cola: {e}")
    
    def process_queue(self):
        """Procesa la cola de archivos pendientes."""
        if self.processing_queue:
            return
        
        self.processing_queue = True
        logger.info("Iniciando procesamiento de cola")
        
        try:
            while not self.upload_queue.empty():
                try:
                    item = self.upload_queue.get()
                    file_path = item["file_path"]
                    filename = item.get("filename")
                    
                    if os.path.exists(file_path):
                        result = self.upload_file_to_drive(file_path, filename)
                        if result["success"]:
                            logger.info(f"Archivo de cola subido: {filename or file_path}")
                        else:
                            # Volver a agregar a la cola si falla
                            self.upload_queue.put(item)
                            logger.warning(f"Error al subir archivo de cola, reagregado: {result['error']}")
                            break
                    else:
                        logger.warning(f"Archivo de cola no encontrado: {file_path}")
                    
                    time.sleep(1)  # Pausa entre subidas
                    
                except Exception as e:
                    logger.error(f"Error al procesar elemento de cola: {e}")
                    break
        
        finally:
            self.processing_queue = False
            self.save_queue_to_file()
            logger.info("Procesamiento de cola finalizado")
    
    def start_queue_processor(self):
        """Inicia el procesador de cola en un hilo separado."""
        if self.queue_thread and self.queue_thread.is_alive():
            return
        
        self.queue_thread = threading.Thread(target=self.process_queue)
        self.queue_thread.daemon = True
        self.queue_thread.start()
    
    def get_queue_status(self) -> Dict[str, Any]:
        """
        Obtiene el estado actual de la cola.
        
        Returns:
            Diccionario con información de la cola
        """
        return {
            "queue_size": self.upload_queue.qsize(),
            "processing": self.processing_queue,
            "drive_service_ready": self.service is not None
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Prueba la conexión con Google Drive.
        
        Returns:
            Diccionario con el resultado de la prueba
        """
        try:
            if not self.service:
                if not self.initialize_drive_service():
                    return {"success": False, "error": "No se pudo inicializar servicio"}
            
            # Hacer una consulta simple para probar la conexión
            about = self.service.about().get(fields="user").execute()
            user_email = about.get('user', {}).get('emailAddress', 'Desconocido')
            
            return {
                "success": True,
                "user_email": user_email,
                "message": "Conexión exitosa con Google Drive"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

# Instancia global del manejador
drive_handler = DriveOAuthHandler()

def upload_pdf_to_drive(file_path: str, filename: str = None) -> Dict[str, Any]:
    """
    Función principal para subir PDF a Drive.
    
    Args:
        file_path: Ruta del archivo PDF
        filename: Nombre personalizado del archivo
        
    Returns:
        Diccionario con el resultado
    """
    # Cargar cola al inicio
    drive_handler.load_queue_from_file()
    
    # Intentar subida directa
    result = drive_handler.upload_file_to_drive(file_path, filename)
    
    if not result["success"]:
        # Agregar a cola si falla
        drive_handler.add_to_queue(file_path, filename)
        return {
            "success": False,
            "queued": True,
            "message": "Error en subida, archivo agregado a cola",
            "error": result["error"]
        }
    
    # Procesar cola si hay elementos pendientes
    if drive_handler.upload_queue.qsize() > 0:
        drive_handler.start_queue_processor()
    
    return result

if __name__ == "__main__":
    # Código de prueba
    handler = DriveOAuthHandler()
    
    # Probar conexión
    print("Probando conexión...")
    connection_result = handler.test_connection()
    print(f"Resultado: {connection_result}")
    
    # Probar creación de estructura de carpetas
    if connection_result["success"]:
        print("Probando estructura de carpetas...")
        folder_id = handler.setup_folder_structure(2024, 12)
        print(f"Carpeta de evidencias: {folder_id}")
