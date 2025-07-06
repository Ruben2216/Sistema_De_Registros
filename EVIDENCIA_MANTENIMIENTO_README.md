# Sistema de Evidencia de Mantenimiento

## Descripción
Sistema completo que permite a los usuarios añadir evidencia fotográfica a los PDFs de mantenimiento generados. Funciona como un repositorio temporal donde se almacenan los PDFs de mantenimiento y se pueden enriquecer con imágenes de evidencia.

## Características
- **Repositorio temporal de PDFs**: Los PDFs de mantenimiento se guardan automáticamente al generarse
- **Interfaz de evidencia fotográfica**: Permite arrastrar y soltar imágenes o seleccionarlas manualmente
- **Generación de PDF combinado**: Crea un nuevo PDF que incluye el formato original + las evidencias fotográficas
- **Acceso desde menú hamburguesa**: Disponible desde todos los formularios de mantenimiento
- **Notificaciones en tiempo real**: Informa al usuario sobre el estado de las operaciones

## Archivos Modificados/Creados

### Frontend
- **HTML Templates**: Todos los archivos de mantenimiento (`computo.html`, `tableta.html`, etc.)
  - Añadido menú hamburguesa con opción "Evidencia de mantenimiento"
  - Incluido script helper para evidencias

- **JavaScript**:
  - `evidencia_mantenimiento.js`: Lógica principal del repositorio de evidencias
  - `evidencia_helper.js`: Funciones auxiliares reutilizables
  - `pdf_compus.js`: Modificado para guardar PDFs automáticamente en el repositorio

- **CSS**: 
  - `evidencia_mantenimiento.css`: Estilos para la interfaz de evidencias (ya existía)

### Backend
- **ejecutable.py**: Nuevas rutas API:
  - `/api/evidencia/obtener_pdfs_mantenimiento`: Lista PDFs disponibles
  - `/api/evidencia/guardar_pdf_mantenimiento`: Guarda PDF en repositorio
  - `/api/evidencia/generar_pdf_con_evidencia`: Combina PDF + evidencias
  - `/api/evidencia/ver_pdf/<nombre>`: Sirve PDFs para visualización
  - `/api/evidencia/descargar_pdf/<nombre>`: Descarga PDFs generados

## Flujo de Usuario

1. **Generar PDF de Mantenimiento**:
   - Usuario completa cualquier formulario de mantenimiento
   - Al generar PDF, se descarga automáticamente Y se guarda en el repositorio
   - Aparece notificación con opción de añadir evidencia

2. **Añadir Evidencia Fotográfica**:
   - Usuario accede a "Evidencia de mantenimiento" desde el menú hamburguesa
   - Ve lista de PDFs disponibles en el repositorio
   - Selecciona un PDF y puede añadir imágenes arrastrando o seleccionando archivos
   - Vista previa de imágenes con opción de eliminar individualmente

3. **Generar PDF Final**:
   - Usuario hace clic en "Generar PDF con Evidencia"
   - Sistema combina PDF original + imágenes de evidencia
   - Se descarga el PDF final con todo incluido

## Configuración de Directorios

```python
# Directorios automáticamente creados:
PDFS_MANTENIMIENTO_DIR = os.path.join(tempfile.gettempdir(), 'pdfs_mantenimiento')
EVIDENCIAS_MANTENIMIENTO_DIR = os.path.join(RESOURCE_FOLDER, 'IMG', 'Evidencias_Mantenimiento')
```

## Dependencias
- **PyMuPDF (fitz)**: Para manipulación de PDFs (opcional, con fallback a reportlab)
- **reportlab**: Fallback para generación de PDFs
- **jsPDF**: Frontend para generación de PDFs (ya existía)

## Notas de Implementación
- Sistema escalable: Funciona con todos los tipos de mantenimiento
- Repositorio temporal: PDFs se limpian automáticamente por el sistema de limpieza existente
- Compatible con producción: No rompe funcionalidades existentes
- Notificaciones elegantes: Sistema de notificaciones no intrusivo
- Responsive: Funciona en diferentes tamaños de pantalla

## Seguridad
- Validación de archivos: Solo acepta imágenes válidas
- Sanitización de nombres: Uso de `secure_filename()`
- Gestión de sesiones: Integrado con el sistema de limpieza automática existente
- Límites de tamaño: Imágenes se muestran con información de tamaño

## Uso en Desarrollo vs Producción
El sistema está diseñado para funcionar tanto en desarrollo local como en PythonAnywhere sin modificaciones adicionales. Los directorios temporales se crean automáticamente y se integran con el sistema de limpieza existente.
