/**
 * Configuración dinámica de API para Sistema RIJ
 * Se adapta automáticamente al entorno (desarrollo local vs PythonAnywhere)
 */

// Función para detectar el entorno y configurar las URLs base
function configurarAPIUrls() {
    // Obtener el dominio y protocolo actual
    const protocolo = window.location.protocol;
    const host = window.location.host;
    
    // Detectar entorno
    const esDesarrolloLocal = host.includes('localhost') || 
                             host.includes('127.0.0.1') || 
                             host.includes('192.168.') || 
                             host.includes('10.0.') ||
                             host.includes(':8000') ||
                             host.includes(':5000');
    
    const esPythonAnywhere = host.includes('pythonanywhere.com');
    
    let baseUrl;
    
    if (esPythonAnywhere) {
        // Producción en PythonAnywhere
        baseUrl = `${protocolo}//${host}`;
        console.log(' Entorno detectado: PythonAnywhere');
    } else if (esDesarrolloLocal) {
        // Desarrollo local
        baseUrl = `${protocolo}//${host}`;
        console.log(' Entorno detectado: Desarrollo Local');
    } else {
        // Fallback - usar el host actual
        baseUrl = `${protocolo}//${host}`;
        console.log(' Entorno detectado: Otro dominio');
    }
    
    // URLs de API configuradas dinámicamente
    const API_URLS = {
        // Endpoints de autoguardado y fotos
        FOTOS: `${baseUrl}/api/rij/fotos`,
        AUTOGUARDADO: `${baseUrl}/api/rij/autoguardado`,
        UPLOAD_FOTO: `${baseUrl}/api/rij/upload_foto`,
        LISTA_FOTOS: `${baseUrl}/api/rij/lista_fotos`,
        BORRAR_FOTO: `${baseUrl}/api/rij/borrar_foto`,
        LIMPIAR_SESION: `${baseUrl}/api/rij/limpiar_sesion`,
        
        // Endpoints de imágenes RIJ
        GUARDAR_IMAGEN: `${baseUrl}/api/rij/guardar_imagen`,
        OBTENER_IMAGEN: `${baseUrl}/api/rij/obtener_imagen`,
        
        // Endpoints de PDF y correo
        ENVIAR_CORREO: `${baseUrl}/api/rij/enviar_correo`,
        
        // Endpoints de actividad
        REGISTRAR_ACTIVIDAD: `${baseUrl}/api/rij/registrar_actividad`,
        USUARIOS_ACTIVOS: `${baseUrl}/api/rij/usuarios_activos`,
        
        // Recursos estáticos
        RESOURCE: `${baseUrl}/RESOURCE`,
        TEMPLATES: `${baseUrl}/TEMPLATES`,
        STATIC_IMAGENES: `${baseUrl}/static/imagenes`,
        
        // Base para construcción de URLs dinámicas
        BASE: baseUrl
    };
    
    console.log('🔧 URLs de API configuradas:', API_URLS);
    
    return API_URLS;
}

// Configurar URLs al cargar el script
const API_CONFIG = configurarAPIUrls();

// Función de utilidad para construir URLs dinámicamente
function construirURL(endpoint, parametros = '') {
    const baseUrl = API_CONFIG.BASE;
    return `${baseUrl}${endpoint}${parametros}`;
}

// Función de utilidad para fetch con configuración automática
function fetchAPI(endpoint, opciones = {}) {
    // Configuración por defecto
    const configDefecto = {
        credentials: 'include', // Incluir cookies de sesión
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // Combinar configuraciones
    const configFinal = {
        ...configDefecto,
        ...opciones,
        headers: {
            ...configDefecto.headers,
            ...(opciones.headers || {})
        }
    };
    
    return fetch(endpoint, configFinal);
}

// Exportar configuración globalmente
window.API_CONFIG = API_CONFIG;
window.construirURL = construirURL;
window.fetchAPI = fetchAPI;

console.log(' Configuración de API cargada correctamente');
console.log(` Entorno: ${API_CONFIG.BASE}`);
