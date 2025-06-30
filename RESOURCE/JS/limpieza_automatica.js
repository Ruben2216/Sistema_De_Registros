/**
 * Sistema de Limpieza Automática del LocalStorage
 * Elimina todos los datos del usuario después de 30 minutos de inactividad
 * Funciona de manera completamente silenciosa
 */

(function() {
    'use strict';
    
    // Configuración
    const TIEMPO_LIMITE_MS = 1 * 60 * 1000; // 1 minuto en milisegundos
    const CLAVE_TIMESTAMP = 'rij_timestamp_actividad';
    
    // Claves del localStorage que deben ser limpiadas
    const CLAVES_A_LIMPIAR = [
        'usuario_identificador_rij',
        'ultimo_pdf_rij',
        'rij_pdf_procesado',
        'rij_imagen_url',
        'rij_datos_formulario',
        'rij_fotos_guardadas',
        'rij_sesion_activa',
        CLAVE_TIMESTAMP
    ];
    
    let timerLimpieza = null;
    
    /**
     * Limpia completamente el localStorage del usuario
     */
    function limpiarLocalStorageCompleto() {
        // Eliminar claves específicas del sistema RIJ
        CLAVES_A_LIMPIAR.forEach(function(clave) {
            if (localStorage.getItem(clave) !== null) {
                localStorage.removeItem(clave);
            }
        });
        
        // Buscar y eliminar cualquier otra clave que contenga 'rij'
        const clavesAdicionales = [];
        for (let i = 0; i < localStorage.length; i++) {
            const clave = localStorage.key(i);
            if (clave && clave.toLowerCase().includes('rij') && !CLAVES_A_LIMPIAR.includes(clave)) {
                clavesAdicionales.push(clave);
            }
        }
        
        clavesAdicionales.forEach(function(clave) {
            localStorage.removeItem(clave);
        });
        
        // Redirigir silenciosamente si estamos en página RIJ
        const paginaActual = window.location.pathname;
        if (paginaActual.includes('formato_RIJ.html') || paginaActual.includes('camara.html')) {
            setTimeout(function() {
                window.location.href = '/TEMPLATES/menu.html';
            }, 1000);
        }
    }
    
    /**
     * Actualiza el timestamp de actividad del usuario
     */
    function actualizarTimestampActividad() {
        const ahora = new Date().getTime();
        localStorage.setItem(CLAVE_TIMESTAMP, ahora.toString());
    }
    
    /**
     * Programa la limpieza automática
     */
    function programarLimpieza() {
        if (timerLimpieza) {
            clearTimeout(timerLimpieza);
        }
        
        timerLimpieza = setTimeout(function() {
            limpiarLocalStorageCompleto();
        }, TIEMPO_LIMITE_MS);
    }
    
    /**
     * Verifica si el usuario ha excedido el tiempo límite
     */
    function verificarTiempoLimite() {
        const timestampStr = localStorage.getItem(CLAVE_TIMESTAMP);
        
        if (!timestampStr) {
            actualizarTimestampActividad();
            programarLimpieza();
            return false;
        }
        
        const timestamp = parseInt(timestampStr, 10);
        const ahora = new Date().getTime();
        const tiempoTranscurrido = ahora - timestamp;
        
        if (tiempoTranscurrido >= TIEMPO_LIMITE_MS) {
            limpiarLocalStorageCompleto();
            return true;
        }
        
        const tiempoRestante = TIEMPO_LIMITE_MS - tiempoTranscurrido;
        if (timerLimpieza) {
            clearTimeout(timerLimpieza);
        }
        
        timerLimpieza = setTimeout(function() {
            limpiarLocalStorageCompleto();
        }, tiempoRestante);
        
        return false;
    }
    
    /**
     * Registra actividad del usuario y reinicia el timer
     */
    function registrarActividad() {
        actualizarTimestampActividad();
        programarLimpieza();
    }
    
    /**
     * Inicializa el sistema de limpieza automática
     */
    function inicializar() {
        // Verificar si estamos en una página que debe tener el sistema
        const paginaActual = window.location.pathname;
        const paginasPermitidas = [
            '/TEMPLATES/formato_RIJ.html',
            '/TEMPLATES/camara.html',
            '/formato_RIJ.html',
            '/camara.html'
        ];
        
        const esPaginaPermitida = paginasPermitidas.some(function(pagina) {
            return paginaActual.includes(pagina);
        });
        
        if (!esPaginaPermitida) {
            return;
        }
        
        // Verificar tiempo límite al cargar la página
        if (verificarTiempoLimite()) {
            return;
        }
        
        // Eventos que indican actividad del usuario
        const eventosActividad = [
            'click',
            'keydown',
            'scroll',
            'mousemove',
            'touchstart',
            'focus',
            'change',
            'input'
        ];
        
        // Registrar actividad en eventos del usuario con throttling
        let ultimaActividad = 0;
        const throttleMs = 5000;
        
        eventosActividad.forEach(function(evento) {
            document.addEventListener(evento, function() {
                const ahora = new Date().getTime();
                if (ahora - ultimaActividad > throttleMs) {
                    ultimaActividad = ahora;
                    registrarActividad();
                }
            }, { passive: true });
        });
        
        // Verificar tiempo límite cada 5 minutos
        setInterval(function() {
            verificarTiempoLimite();
        }, 5 * 60 * 1000);
        
        // Actualizar timestamp al salir de la página
        window.addEventListener('beforeunload', function() {
            actualizarTimestampActividad();
        });
        
        // Verificar cuando la página se vuelve visible
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                verificarTiempoLimite();
            }
        });
    }
    
    // Funciones públicas para uso externo
    window.SistemaLimpiezaRIJ = {
        limpiarAhora: limpiarLocalStorageCompleto,
        registrarActividad: registrarActividad,
        verificarTiempo: verificarTiempoLimite,
        obtenerTiempoRestante: function() {
            const timestampStr = localStorage.getItem(CLAVE_TIMESTAMP);
            if (!timestampStr) return TIEMPO_LIMITE_MS;
            
            const timestamp = parseInt(timestampStr, 10);
            const ahora = new Date().getTime();
            const tiempoTranscurrido = ahora - timestamp;
            
            return Math.max(0, TIEMPO_LIMITE_MS - tiempoTranscurrido);
        }
    };
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
    
})();
