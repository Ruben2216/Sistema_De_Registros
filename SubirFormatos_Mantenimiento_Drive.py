"""
Sistema de Subida Automática de Formatos de Mantenimiento a Google Drive
Autor: Sistema de Mantenimiento CFE
Fecha: Diciembre 2024 - Actualizado para OAuth 2.0

Este módulo maneja la subida automática de PDFs de mantenimiento a Google Drive
con la estructura de carpetas: Programa_mantenimiento/[AÑO]/Evidencias[MES]/
También maneja una cola de pendientes cuando no hay conexión a internet.

MIGRADO A OAUTH 2.0: Utiliza autenticación OAuth en lugar de service account
para acceso a cuenta personal de Google Drive sin limitaciones de cuota.
"""

import os
import json
import datetime
import requests
import threading
import time
import logging
from pathlib import Path

# Importar el manejador OAuth
from oauth_drive_handler import drive_handler, upload_pdf_to_drive

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración de directorios
COLA_PENDIENTES_DIR = 'cola_drive_pendientes'
COLA_PENDIENTES_FILE = os.path.join(COLA_PENDIENTES_DIR, 'cola_pdfs.json')

# Asegurar que existe el directorio de cola
os.makedirs(COLA_PENDIENTES_DIR, exist_ok=True)

# Variables globales para el hilo de procesamiento
hilo_procesamiento_activo = False
lock_cola = threading.Lock()

def verificar_conexion_internet():
    """
    Verifica si hay conexión a internet haciendo una petición a un sitio confiable.
    Esto es más compatible con PythonAnywhere que una conexión de socket directa.
    """
    try:
        # Esta es una forma más fiable de comprobar la conectividad en ese entorno.
        requests.get("https://www.google.com", timeout=5)
        return True
    except (requests.ConnectionError, requests.Timeout):
        return False

def obtener_nombre_mes(numero_mes):
    """
    Convierte número de mes a nombre en español
    
    Args:
        numero_mes (int): Número del mes (1-12)
    
    Returns:
        str: Nombre del mes en español
    """
    meses = {
        1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
        5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
        9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
    }
    return meses.get(numero_mes, "Desconocido")

def agregar_a_cola_pendientes(archivo_pdf, nombre_personalizado=None):
    """
    Agrega un archivo PDF a la cola de pendientes para subir cuando haya conexión
    
    Args:
        archivo_pdf (str): Ruta del archivo PDF
        nombre_personalizado (str, optional): Nombre personalizado para el archivo
    """
    try:
        with lock_cola:
            # Cargar cola existente o crear nueva
            cola_actual = []
            if os.path.exists(COLA_PENDIENTES_FILE):
                with open(COLA_PENDIENTES_FILE, 'r', encoding='utf-8') as f:
                    cola_actual = json.load(f)
            
            # Agregar nuevo elemento
            nuevo_elemento = {
                'archivo_pdf': archivo_pdf,
                'nombre_personalizado': nombre_personalizado,
                'fecha_agregado': datetime.datetime.now().isoformat(),
                'intentos': 0
            }
            
            cola_actual.append(nuevo_elemento)
            
            # Guardar cola actualizada
            with open(COLA_PENDIENTES_FILE, 'w', encoding='utf-8') as f:
                json.dump(cola_actual, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Archivo agregado a cola de pendientes: {archivo_pdf}")
            
            # También agregar a la cola del manejador OAuth
            drive_handler.add_to_queue(archivo_pdf, nombre_personalizado)
            
    except Exception as e:
        logger.error(f"Error al agregar archivo a cola de pendientes: {e}")

def obtener_estado_cola():
    """
    Obtiene el estado actual de la cola de pendientes
    
    Returns:
        dict: Información del estado de la cola
    """
    try:
        # Estado de la cola local
        cola_local = []
        if os.path.exists(COLA_PENDIENTES_FILE):
            with open(COLA_PENDIENTES_FILE, 'r', encoding='utf-8') as f:
                cola_local = json.load(f)
        
        # Estado de la cola OAuth
        estado_oauth = drive_handler.get_queue_status()
        
        return {
            'cola_local_size': len(cola_local),
            'cola_oauth_size': estado_oauth.get('queue_size', 0),
            'procesando': estado_oauth.get('processing', False),
            'servicio_listo': estado_oauth.get('drive_service_ready', False),
            'conexion_internet': verificar_conexion_internet()
        }
    except Exception as e:
        logger.error(f"Error al obtener estado de cola: {e}")
        return {
            'cola_local_size': 0,
            'cola_oauth_size': 0,
            'procesando': False,
            'servicio_listo': False,
            'conexion_internet': False,
            'error': str(e)
        }

def procesar_cola_pendientes():
    """
    Procesa la cola de archivos pendientes de subir
    """
    global hilo_procesamiento_activo
    
    if hilo_procesamiento_activo:
        return {"mensaje": "Ya hay un proceso de cola activo"}
    
    hilo_procesamiento_activo = True
    
    try:
        with lock_cola:
            if not os.path.exists(COLA_PENDIENTES_FILE):
                return {"mensaje": "No hay archivos en cola"}
            
            with open(COLA_PENDIENTES_FILE, 'r', encoding='utf-8') as f:
                cola_actual = json.load(f)
            
            if not cola_actual:
                return {"mensaje": "Cola vacía"}
            
            # Verificar conexión
            if not verificar_conexion_internet():
                return {"error": "Sin conexión a internet"}
            
            archivos_procesados = 0
            archivos_fallidos = []
            cola_actualizada = []
            
            for elemento in cola_actual:
                try:
                    archivo_pdf = elemento['archivo_pdf']
                    nombre_personalizado = elemento.get('nombre_personalizado')
                    
                    # Verificar que el archivo existe
                    if not os.path.exists(archivo_pdf):
                        logger.warning(f"Archivo no encontrado, removiendo de cola: {archivo_pdf}")
                        continue
                    
                    # Intentar subir usando OAuth
                    resultado = upload_pdf_to_drive(archivo_pdf, nombre_personalizado)
                    
                    if resultado.get('success'):
                        logger.info(f"Archivo de cola subido exitosamente: {archivo_pdf}")
                        archivos_procesados += 1
                    else:
                        # Incrementar intentos y volver a agregar si no excede límite
                        elemento['intentos'] += 1
                        if elemento['intentos'] < 3:
                            cola_actualizada.append(elemento)
                        else:
                            archivos_fallidos.append(archivo_pdf)
                        logger.warning(f"Error al subir archivo de cola: {resultado.get('error')}")
                
                except Exception as e:
                    logger.error(f"Error al procesar elemento de cola: {e}")
                    elemento['intentos'] += 1
                    if elemento['intentos'] < 3:
                        cola_actualizada.append(elemento)
                    else:
                        archivos_fallidos.append(elemento.get('archivo_pdf', 'Desconocido'))
            
            # Actualizar archivo de cola
            with open(COLA_PENDIENTES_FILE, 'w', encoding='utf-8') as f:
                json.dump(cola_actualizada, f, indent=2, ensure_ascii=False)
            
            # También procesar cola OAuth
            drive_handler.start_queue_processor()
            
            return {
                "mensaje": "Procesamiento de cola completado",
                "archivos_procesados": archivos_procesados,
                "archivos_fallidos": len(archivos_fallidos),
                "archivos_pendientes": len(cola_actualizada)
            }
    
    except Exception as e:
        logger.error(f"Error al procesar cola de pendientes: {e}")
        return {"error": f"Error al procesar cola: {e}"}
    
    finally:
        hilo_procesamiento_activo = False

def subir_pdf_mantenimiento(archivo_pdf, nombre_personalizado=None):
    """
    Función principal para subir un PDF de mantenimiento a Google Drive
    
    Args:
        archivo_pdf (str): Ruta del archivo PDF a subir
        nombre_personalizado (str, optional): Nombre personalizado para el archivo
    
    Returns:
        dict: Resultado de la operación de subida
    """
    try:
        # Verificar que el archivo existe
        if not os.path.exists(archivo_pdf):
            return {
                "exito": False,
                "error": "El archivo PDF no existe",
                "archivo": archivo_pdf
            }
        
        # Verificar conexión a internet
        if not verificar_conexion_internet():
            # Sin conexión, agregar a cola
            agregar_a_cola_pendientes(archivo_pdf, nombre_personalizado)
            return {
                "exito": False,
                "error": "Sin conexión a internet",
                "agregado_a_cola": True,
                "archivo": archivo_pdf
            }
        
        # Intentar subida directa usando OAuth
        resultado = upload_pdf_to_drive(archivo_pdf, nombre_personalizado)
        
        if resultado.get('success'):
            # Subida exitosa
            logger.info(f"PDF subido exitosamente a Google Drive: {archivo_pdf}")
            
            # Procesar cola pendiente si hay elementos
            estado_cola = obtener_estado_cola()
            if estado_cola['cola_local_size'] > 0 or estado_cola['cola_oauth_size'] > 0:
                # Iniciar procesamiento de cola en hilo separado
                threading.Thread(target=procesar_cola_pendientes, daemon=True).start()
            
            return {
                "exito": True,
                "mensaje": "Archivo subido exitosamente a Google Drive",
                "archivo": archivo_pdf,
                "nombre_final": resultado.get('file_name'),
                "id_drive": resultado.get('file_id'),
                "enlace_drive": resultado.get('file_link'),
                "carpeta_id": resultado.get('folder_id')
            }
        
        else:
            # Error en subida, agregar a cola
            agregar_a_cola_pendientes(archivo_pdf, nombre_personalizado)
            return {
                "exito": False,
                "error": resultado.get('error', 'Error desconocido en subida'),
                "agregado_a_cola": True,
                "archivo": archivo_pdf
            }
    
    except Exception as e:
        logger.error(f"Error en subir_pdf_mantenimiento: {e}")
        # En caso de error, agregar a cola como medida de seguridad
        agregar_a_cola_pendientes(archivo_pdf, nombre_personalizado)
        return {
            "exito": False,
            "error": f"Error inesperado: {e}",
            "agregado_a_cola": True,
            "archivo": archivo_pdf
        }

def verificar_configuracion_oauth():
    """
    Verifica que la configuración OAuth esté correcta
    
    Returns:
        dict: Resultado de la verificación
    """
    try:
        # Probar conexión con OAuth
        resultado_conexion = drive_handler.test_connection()
        
        if resultado_conexion.get('success'):
            return {
                "configurado": True,
                "mensaje": "Configuración OAuth correcta",
                "usuario_email": resultado_conexion.get('user_email'),
                "conexion_internet": verificar_conexion_internet()
            }
        else:
            return {
                "configurado": False,
                "error": resultado_conexion.get('error'),
                "mensaje": "Error en configuración OAuth"
            }
    
    except Exception as e:
        return {
            "configurado": False,
            "error": str(e),
            "mensaje": "Error al verificar configuración OAuth"
        }

# Función de compatibilidad con código existente
def subir_formato_mantenimiento_drive(archivo_pdf, nombre_personalizado=None):
    """
    Función de compatibilidad para código existente
    
    Args:
        archivo_pdf (str): Ruta del archivo PDF
        nombre_personalizado (str, optional): Nombre personalizado
    
    Returns:
        dict: Resultado de la subida
    """
    return subir_pdf_mantenimiento(archivo_pdf, nombre_personalizado)
