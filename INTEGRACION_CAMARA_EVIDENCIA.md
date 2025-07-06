# Integración del Sistema de Cámara con Evidencia de Mantenimiento

## Descripción General

El sistema de evidencia de mantenimiento ahora está completamente integrado con el sistema de cámara existente (`camara.html`), permitiendo a los usuarios:

1. **Abrir la cámara directamente** desde el sistema de evidencia
2. **Tomar fotos** usando la interfaz de cámara familiar
3. **Importar automáticamente** las fotos tomadas
4. **Sincronizar en tiempo real** el estado de las fotos disponibles

## Funcionalidades Principales

### 1. Abrir Cámara
- **Botón**: "📷 Abrir Cámara"
- **Función**: Abre `camara.html` en una nueva ventana
- **Contexto**: Preserva la información del PDF seleccionado
- **Estado Visual**: El botón cambia a "📷 Cámara Abierta" cuando está activa

### 2. Indicador de Estado
- **Ubicación**: Aparece automáticamente cuando hay actividad de cámara
- **Estados**:
  - 🔄 **Sincronizando**: Cuando se están procesando fotos
  - 📷 **Conectada**: Cuando la cámara está abierta
  - 📋 **Fotos Disponibles**: Cuando hay fotos listas para importar
- **Contador**: Muestra el número de fotos disponibles

### 3. Importación de Fotos
- **Botón Básico**: "📥 Importar de Cámara"
- **Botón Dinámico**: "📥 Importar (X fotos)" cuando hay fotos disponibles
- **Proceso**: Descarga y convierte automáticamente las fotos del sistema de cámara

### 4. Sincronización Automática
- **Botón**: "🔄 Sincronizar Fotos" (aparece solo cuando hay fotos disponibles)
- **Función**: Utiliza la API optimizada del backend para transferencia más rápida
- **Limpieza**: Limpia automáticamente las fotos de la cámara después de sincronizar

## Flujo de Trabajo Recomendado

### Opción 1: Importación Manual
1. Seleccionar un PDF de mantenimiento
2. Hacer clic en "📷 Abrir Cámara"
3. Tomar las fotos necesarias en la ventana de cámara
4. Cerrar la ventana de cámara
5. Hacer clic en "📥 Importar de Cámara"
6. Confirmar si desea limpiar las fotos de la cámara

### Opción 2: Sincronización Automática
1. Seleccionar un PDF de mantenimiento
2. Hacer clic en "📷 Abrir Cámara"
3. Tomar las fotos necesarias
4. Regresar a la ventana de evidencia (sin cerrar la cámara)
5. Hacer clic en "🔄 Sincronizar Fotos" cuando aparezca
6. Las fotos se importan y limpian automáticamente

## Características Técnicas

### Frontend (JavaScript)
- **Verificación de Estado**: Cada 3 segundos cuando hay un PDF seleccionado
- **Gestión de Estados**: Control visual del estado de conexión y sincronización
- **Indicadores Visuales**: Botones que cambian color/texto según disponibilidad
- **Manejo de Errores**: Mensajes claros para diferentes tipos de errores

### Backend (Python/Flask)
- **API de Estado**: `/api/evidencia/estado_camara` - Verifica fotos disponibles
- **API de Sincronización**: `/api/evidencia/sincronizar_fotos_camara` - Transfiere fotos optimizadamente
- **Compatibilidad**: Reutiliza las APIs existentes del sistema RIJ
- **Limpieza Automática**: Gestiona la limpieza de fotos después de importar

### Estilos CSS
- **Estados Visuales**: Colores diferenciados para cada estado
- **Animaciones**: Indicadores de carga y progreso
- **Responsive**: Diseño adaptable para dispositivos móviles
- **Consistencia**: Mantiene el diseño existente del sistema

## Beneficios de la Integración

1. **Experiencia Unificada**: Los usuarios no necesitan aprender un nuevo sistema
2. **Contexto Preservado**: El PDF seleccionado se mantiene durante todo el proceso
3. **Feedback Visual**: Estado claro de la conexión y disponibilidad de fotos
4. **Eficiencia**: Sincronización automática y limpieza opcional
5. **Compatibilidad**: Funciona con el sistema de cámara existente sin modificaciones

## Solución de Problemas

### Cámara no se abre
- Verificar que no estén bloqueadas las ventanas emergentes
- Comprobar que se haya seleccionado un PDF primero

### Fotos no aparecen para importar
- Asegurarse de haber tomado fotos en la cámara
- Verificar que la sesión de usuario esté activa
- Esperar unos segundos para que se actualice el estado

### Error de sincronización
- Verificar conexión a internet
- Intentar cerrar y reabrir la cámara
- Usar la opción de importación manual como alternativa

## Notas de Desarrollo

- La integración reutiliza completamente el sistema de cámara existente
- No requiere modificaciones en `camara.html`
- Compatible con el sistema de limpieza automática existente
- Mantiene la compatibilidad con el flujo de trabajo original del RIJ
