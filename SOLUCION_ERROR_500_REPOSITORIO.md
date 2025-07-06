# SOLUCIÓN AL ERROR 500 EN REPOSITORIO DE EVIDENCIA

## DESCRIPCIÓN DEL PROBLEMA

**Error reportado:** `argument of type 'NoneType' is not iterable`
**Endpoint afectado:** `/api/evidencia/guardar_pdf_mantenimiento`
**Status Code:** 500 (Internal Server Error)

### Contexto del Error
El error ocurría cuando el frontend intentaba guardar PDFs de evidencia de mantenimiento en el repositorio. Los logs mostraban que el error se producía en la función `registrar_actividad_usuario()` específicamente en la línea:

```python
if sid not in usuarios_activos:
```

### Causa Raíz
La función `cargar_usuarios_activos()` tenía un error de sintaxis/formato que causaba que devolviera `None` en lugar de un diccionario vacío `{}` cuando ocurría una excepción. Esto provocaba que `usuarios_activos` fuera `None`, y al intentar hacer `sid not in None` se generaba el error "argument of type 'NoneType' is not iterable".

**Código problemático:**
```python
def cargar_usuarios_activos():
    try:
        # ... código de carga ...
        return data
    except Exception as e:        return {}  # ← Error de formato
```

## SOLUCIÓN APLICADA

### 1. Corrección de la función `cargar_usuarios_activos()`

Se corrigió la función para que siempre devuelva un diccionario válido:

```python
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
        return {}
    except Exception as e:
        print(f"[DEBUG] Error cargando usuarios activos: {e}")
        return {}
```

### 2. Validación adicional en `registrar_actividad_usuario()`

Se agregó una validación extra para asegurar que `usuarios_activos` nunca sea `None`:

```python
with lock_usuarios:
    usuarios_activos = get_usuarios_activos()
    
    # Validar que usuarios_activos no sea None
    if usuarios_activos is None:
        print(f"[DEBUG] ADVERTENCIA: usuarios_activos es None, inicializando diccionario vacío")
        usuarios_activos = {}
    
    print(f"[DEBUG] usuarios_activos tipo: {type(usuarios_activos)}")
    print(f"[DEBUG] usuarios_activos keys: {list(usuarios_activos.keys()) if usuarios_activos else 'None'}")
```

### 3. Validaciones adicionales en endpoints relacionados

También se mejoraron las validaciones en otros endpoints para prevenir errores similares:

- **`ver_pdf_mantenimiento()`:** Validación de parámetros `None` antes de usar `secure_filename`
- **`descargar_pdf_evidencia()`:** Validación adicional de nombres de archivo inválidos
- **`es_nombre_archivo_seguro()`:** Validación de entrada `None` o vacía

## PRUEBAS Y VERIFICACIÓN

### Casos de Prueba Ejecutados
✅ Nombre de archivo normal: `SEQUI_QUIS_RERUM_CUL.pdf`
✅ Nombres con espacios: `evidencia test con espacios.pdf`
✅ Nombres con guiones: `evidencia-con-guiones.pdf`
✅ Nombres con underscores: `evidencia_con_underscore.pdf`
✅ Caracteres especiales: `archivo_ñ_especial.pdf`
✅ Valor `None`: Error controlado (400 Bad Request)
✅ String vacío: Procesado correctamente

### Resultados
- **Antes:** Error 500 en todos los casos (excepto `None`)
- **Después:** Status 200 en casos válidos, 400 en casos inválidos

## ARCHIVOS MODIFICADOS

1. **`ejecutable.py`**
   - Función `cargar_usuarios_activos()` (líneas ~726-742)
   - Función `registrar_actividad_usuario()` (líneas ~762-785)
   - Función `ver_pdf_mantenimiento()` (líneas ~1035-1055)
   - Función `descargar_pdf_evidencia()` (líneas ~1455-1485)
   - Función `es_nombre_archivo_seguro()` (líneas ~1445-1454)

## LOGS DE VERIFICACIÓN

```
[DEBUG] usuarios_activos tipo: <class 'dict'>
[DEBUG] usuarios_activos keys: ['eed45fb6f7bc5b2f']
[DEBUG] SID usuario: 7d31d289f8ef7714
[DEBUG] PDF base64 limpio, longitud: 616
[DEBUG] PDF decodificado correctamente, tamaño: 460 bytes
[DEBUG] Nombre final: computo_20250706_131859_7d31d289.pdf
[DEBUG] PDF guardado exitosamente
Status: 200 - {"success": true, "message": "PDF guardado correctamente"}
```

## ESTADO ACTUAL

✅ **ERROR 500 CORREGIDO**
✅ **Endpoint funcional**
✅ **Validaciones robustas implementadas**
✅ **Logging detallado para debugging**

El sistema ahora puede:
- Recibir PDFs del frontend
- Procesar nombres de archivos correctamente
- Guardar PDFs en el repositorio temporal
- Manejar casos edge con validaciones apropiadas
- Proporcionar respuestas consistentes

## FECHA DE CORRECCIÓN
6 de julio de 2025

## IMPACTO
- **Usuarios:** Ahora pueden guardar PDFs de evidencia sin errores
- **Sistema:** Mayor estabilidad y robustez en manejo de sesiones
- **Desarrollo:** Logging mejorado para futuras debugging
