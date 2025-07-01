
const CONFIGURACION_PAGINA = {
    // Páginas que deben redirigir al menú después de la limpieza
    paginasConRedireccion: [
        '/TEMPLATES/formato_RIJ.html',
        '/TEMPLATES/camara.html',
        '/formato_RIJ.html',
        '/camara.html'
    ],
    
    // SOLO estas páginas tienen el sistema de limpieza activado
    paginasConSistema: [
        '/TEMPLATES/formato_RIJ.html',
        '/TEMPLATES/camara.html',
        '/formato_RIJ.html',
        '/camara.html'
    ]
};


function despuesLimpieza() {
    const paginaActual = window.location.pathname;
    
    // Verificar si esta página debe redirigir
    const debeRedirigir = CONFIGURACION_PAGINA.paginasConRedireccion.some(function(pagina) {
        return paginaActual.includes(pagina);
    });
    
    if (debeRedirigir) {
        // Redirigir silenciosamente al menú después de 2 segundos
        setTimeout(function() {
            window.location.href = '/TEMPLATES/menu.html';
        }, 2000);
    }
}


function registrarActividadPagina() {
    // Registrar en el sistema de limpieza local
    if (window.SistemaLimpiezaRIJ) {
        window.SistemaLimpiezaRIJ.registrarActividad();
    }
    
    // IMPORTANTE: Registrar también en el backend
    fetch('/api/rij/registrar_actividad', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    }).then(function(response) {
        return response.json();
    }).then(function(data) {
        if (data.success) {
            console.log('[DEBUG] Usuario registrado en backend:', data.sid);
        }
    }).catch(function(error) {
        console.log('[DEBUG] Error registrando actividad:', error);
    });
}

/**
 * Configuración específica según la página actual
 */
function configurarPaginaEspecifica() {
    const paginaActual = window.location.pathname;
    
    // Configuración para formato_RIJ.html
    if (paginaActual.includes('formato_RIJ.html')) {
        // Registrar actividad cuando se modifiquen campos del formulario
        const campos = document.querySelectorAll('input, select, textarea');
        campos.forEach(function(campo) {
            campo.addEventListener('change', registrarActividadPagina, { passive: true });
            campo.addEventListener('input', registrarActividadPagina, { passive: true });
        });
        
        // Registrar actividad al hacer scroll
        let ultimoScroll = 0;
        window.addEventListener('scroll', function() {
            const ahora = Date.now();
            if (ahora - ultimoScroll > 10000) { // Solo cada 10 segundos
                ultimoScroll = ahora;
                registrarActividadPagina();
            }
        }, { passive: true });
    }
    
    // Configuración para camara.html
    if (paginaActual.includes('camara.html')) {
        // Registrar actividad cuando se tomen fotos
        const botonesDeAccion = document.querySelectorAll('button[onclick*="foto"], button[onclick*="camara"]');
        botonesDeAccion.forEach(function(boton) {
            boton.addEventListener('click', registrarActividadPagina, { passive: true });
        });
    }
}

/**
 * Inicialización del sistema de integración
 */
function inicializarIntegracion() {
    // Verificar si esta página debe tener el sistema de limpieza
    const paginaActual = window.location.pathname;
    const tieneSistema = CONFIGURACION_PAGINA.paginasConSistema.some(function(pagina) {
        return paginaActual.includes(pagina);
    });
    
    if (!tieneSistema) {
        return;
    }
    
    // Esperar a que el sistema de limpieza esté disponible
    function esperarSistemaLimpieza() {
        if (window.SistemaLimpiezaRIJ) {
            // Configurar página específica
            configurarPaginaEspecifica();
            
            // Registrar actividad inicial
            registrarActividadPagina();
            
        } else {
            setTimeout(esperarSistemaLimpieza, 500);
        }
    }
    
    esperarSistemaLimpieza();
}

// Inicializar cuando esté disponible
if (window.SistemaLimpiezaRIJ) {
    inicializarIntegracion();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(inicializarIntegracion, 1000);
    });
}

// Exportar solo función esencial
window.IntegracionLimpiezaRIJ = {
    registrarActividad: registrarActividadPagina
};
