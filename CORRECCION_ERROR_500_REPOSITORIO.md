# DIAGNÓSTICO Y CORRECCIÓN: Error 500 en guardar_pdf_mantenimiento

## 🐛 ERROR IDENTIFICADO

```
POST https://192.168.100.30:8000/api/evidencia/guardar_pdf_mantenimiento 500 (INTERNAL SERVER ERROR)
Error: argument of type 'NoneType' is not iterable
```

## 🔍 CAUSA RAÍZ ENCONTRADA

El error ocurre cuando el campo `nombre_archivo` llega como `None` o `undefined` desde el JavaScript, y el backend intenta procesarlo con `secure_filename()` sin validación previa.

### Flujo del problema:
1. **JavaScript**: `requestPDFFilename()` puede pasar `null` o `undefined` al callback
2. **Backend**: `secure_filename(None)` causa el error "argument of type 'NoneType' is not iterable"
3. **Resultado**: Error 500 y PDF no se guarda en repositorio

## ✅ CORRECCIONES IMPLEMENTADAS

### **A. Backend** (`ejecutable.py`)

```python
@app.route('/api/evidencia/guardar_pdf_mantenimiento', methods=['POST'])
def guardar_pdf_mantenimiento():
    # ✅ Logging detallado agregado
    print(f"[DEBUG] Iniciando guardar_pdf_mantenimiento...")
    
    # ✅ Validación de datos antes de procesamiento
    if not data:
        return jsonify({'success': False, 'error': 'No se recibieron datos'}), 400
    
    # ✅ Validación específica de nombre_archivo
    if nombre_archivo is None:
        return jsonify({'success': False, 'error': 'Nombre de archivo no puede ser None'}), 400
    
    # ✅ Conversión segura a string antes de secure_filename
    nombre_archivo_seguro = secure_filename(str(nombre_archivo))
    
    # ✅ Verificación de directorio temporal
    if not os.path.exists(PDFS_MANTENIMIENTO_DIR):
        os.makedirs(PDFS_MANTENIMIENTO_DIR, exist_ok=True)
```

### **B. Frontend** (`evidencia_helper.js`)

```javascript
async function guardarPDFEnRepositorioEvidencia(docPDF, nombreArchivo, tipoMantenimiento) {
    // ✅ Validación de parámetros agregada
    if (!docPDF) {
        console.error('[DEBUG] Error: docPDF es null o undefined');
        return;
    }
    
    if (!nombreArchivo || nombreArchivo.trim() === '') {
        console.error('[DEBUG] Error: nombreArchivo está vacío');
        return;
    }
    
    // ✅ Datos sanitizados antes de envío
    const datosRepositorio = {
        pdf_base64: pdfBase64,
        nombre_archivo: nombreArchivo.trim(),  // ← trim() agregado
        tipo_mantenimiento: tipoMantenimiento || 'general'
    };
}
```

### **C. Función de procesamiento** (`evidencia_helper.js`)

```javascript
function procesarPDFMantenimiento(docPDF, nombreArchivo, tipoMantenimiento, mostrarModal = true) {
    // ✅ Validación temprana de parámetros
    if (!nombreArchivo || nombreArchivo.trim() === '') {
        console.error('[DEBUG] Error: nombreArchivo está vacío en procesarPDFMantenimiento');
        alert('Error: No se pudo determinar el nombre del archivo PDF');
        return;
    }
    
    if (!docPDF) {
        console.error('[DEBUG] Error: docPDF es null en procesarPDFMantenimiento');
        alert('Error: No se pudo generar el documento PDF');
        return;
    }
}
```

### **D. Sistema de nombrado** (`pdfNombradoArchivos.js`)

```javascript
confirmarNombrado() {
    // ✅ Validación del elemento DOM
    const campoEntrada = document.getElementById('pdf-filename-input');
    let nombreArchivo = campoEntrada ? campoEntrada.value.trim() : '';
    
    // ✅ Validación del nombre final
    if (!nombreFinal || nombreFinal.trim() === '' || nombreFinal === '.pdf') {
        console.error('[DEBUG] Error: nombreFinal está vacío o es inválido');
        alert('Error: No se pudo generar un nombre válido para el archivo PDF');
        return;
    }
    
    // ✅ Validación del callback
    if (this.onConfirmCallback && typeof this.onConfirmCallback === 'function') {
        console.log('[DEBUG] Ejecutando callback con nombreFinal:', nombreFinal);
        this.onConfirmCallback(nombreFinal);
    }
}
```

## 🛠️ DEBUGGING AGREGADO

### **Logs en Backend**:
- Estado de datos recibidos
- Validación de campos requeridos
- Proceso de decodificación de PDF
- Creación de directorios
- Estado de guardado de archivos

### **Logs en Frontend**:
- Parámetros recibidos en funciones
- Estado de validaciones
- Datos enviados al servidor
- Respuestas del servidor

## 🧪 DIAGNÓSTICO REALIZADO

1. **✅ Directorio temporal**: Existe y tiene permisos correctos
2. **⚠️ Conexión al servidor**: Detectada pero rechaza peticiones (posible reinicio necesario)
3. **✅ Validaciones**: Implementadas en todos los puntos críticos
4. **✅ Logging**: Agregado para diagnóstico detallado

## 🚀 PRÓXIMOS PASOS

1. **Reiniciar el servidor** para aplicar los cambios
2. **Probar la funcionalidad** con un PDF de mantenimiento real
3. **Revisar logs** en la consola del navegador y terminal del servidor
4. **Verificar** que los archivos PDF se guardan correctamente en el repositorio

## 📝 ARCHIVOS MODIFICADOS

- ✅ `ejecutable.py` - Endpoint con validación robusta
- ✅ `evidencia_helper.js` - Validaciones y logging
- ✅ `pdfNombradoArchivos.js` - Validación de nombres de archivo

**El error debería estar resuelto después de reiniciar el servidor.**
