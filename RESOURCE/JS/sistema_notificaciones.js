
class SistemaNotificaciones {
    constructor() {
        this.contenedor = null;
        this.crearContenedor();
    }

    crearContenedor() {
        if (document.getElementById('sistema-notificaciones')) {
            this.contenedor = document.getElementById('sistema-notificaciones');
            return;
        }

        const contenedor = document.createElement('div');
        contenedor.id = 'sistema-notificaciones';
        contenedor.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 350px;
            pointer-events: none;
        `;
        
        document.body.appendChild(contenedor);
        this.contenedor = contenedor;
    }

    mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
        const notificacion = document.createElement('div');
        
        const colores = {
            'info': { bg: '#3498db', border: '#2980b9' },
            'success': { bg: '#27ae60', border: '#229954' },
            'warning': { bg: '#f39c12', border: '#e67e22' },
            'error': { bg: '#e74c3c', border: '#c0392b' }
        };
        
        const color = colores[tipo] || colores.info;
        
        notificacion.style.cssText = `
            background: ${color.bg};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 4px solid ${color.border};
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        notificacion.textContent = mensaje;
        
        // Agregar botón de cerrar
        const btnCerrar = document.createElement('span');
        btnCerrar.innerHTML = '×';
        btnCerrar.style.cssText = `
            float: right;
            margin-left: 10px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
        `;
        btnCerrar.onclick = () => this.cerrarNotificacion(notificacion);
        notificacion.appendChild(btnCerrar);
        
        this.contenedor.appendChild(notificacion);
        
        // Animar entrada
        setTimeout(() => {
            notificacion.style.opacity = '1';
            notificacion.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-cerrar
        if (duracion > 0) {
            setTimeout(() => this.cerrarNotificacion(notificacion), duracion);
        }
        
        return notificacion;
    }

    cerrarNotificacion(notificacion) {
        if (!notificacion || !notificacion.parentElement) return;
        
        notificacion.style.opacity = '0';
        notificacion.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (notificacion.parentElement) {
                notificacion.remove();
            }
        }, 300);
    }

    limpiarNotificaciones() {
        const notificaciones = this.contenedor.querySelectorAll('div');
        notificaciones.forEach(notif => this.cerrarNotificacion(notif));
    }
}

// Instancia global
window.sistemaNotificaciones = new SistemaNotificaciones();

// Mejorar la función showMessage existente
const showMessageOriginal = window.showMessage;

window.showMessage = function(mensaje, tipo = 'info') {
    // Usar el sistema de notificaciones si está disponible
    if (window.sistemaNotificaciones) {
        window.sistemaNotificaciones.mostrarNotificacion(mensaje, tipo);
    } else if (showMessageOriginal) {
        showMessageOriginal(mensaje);
    } else {
        console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
        alert(mensaje);
    }
};

// Función específica para estados de carga
window.mostrarEstadoCarga = function(mensaje, progreso = null) {
    const loader = window.opencvLoader;
    if (loader && loader.mensajeProgreso) {
        loader.actualizarMensaje(mensaje);
    } else {
        window.sistemaNotificaciones.mostrarNotificacion(mensaje, 'info', 0);
    }
};

// Función para ocultar estados de carga
window.ocultarEstadoCarga = function() {
    const loader = window.opencvLoader;
    if (loader) {
        loader.ocultarModal();
    }
    window.sistemaNotificaciones.limpiarNotificaciones();
};

// Función para mostrar errores de manera más elegante
window.mostrarError = function(mensaje, detalles = null) {
    console.error('Error:', mensaje, detalles);
    window.sistemaNotificaciones.mostrarNotificacion(mensaje, 'error', 8000);
};

// Función para mostrar éxitos
window.mostrarExito = function(mensaje) {
    window.sistemaNotificaciones.mostrarNotificacion(mensaje, 'success', 3000);
};

// Función para mostrar advertencias
window.mostrarAdvertencia = function(mensaje) {
    window.sistemaNotificaciones.mostrarNotificacion(mensaje, 'warning', 5000);
};

// Integración con el sistema de OpenCV
document.addEventListener('DOMContentLoaded', function() {
    // Escuchar eventos del sistema de OpenCV
    window.addEventListener('opencvReady', function() {
        window.mostrarExito('Sistema de procesamiento de imágenes listo');
    });
    
    // Mostrar estado inicial
    if (!window.opencvLoader || !window.opencvLoader.cargaExitosa) {
        window.mostrarEstadoCarga('Inicializando sistema de cámara...');
    }
});

// Función de compatibilidad para ocultar modales legacy
window.ocultarModalProgreso = function() {
    const modales = [
        'opencv-loader-modal',
        'pdfProgressModal',
        'modal-tomar-foto'
    ];
    
    modales.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
        }
    });
};
