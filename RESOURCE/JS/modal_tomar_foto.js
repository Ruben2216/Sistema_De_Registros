// Funciones globales para el modal de tomar foto

// Se crea un modal para el evento de tomar foto
function mostrarModalTomarFoto() {
    const modal = document.getElementById('modal-tomar-foto');
    const mensaje = document.getElementById('mensaje-tomar-foto');
    
    if (modal && mensaje) {
        mensaje.textContent = 'Tomando foto...';
        modal.style.display = 'flex';
        
        // Evitar scroll en móvil
        if (typeof esDispositivoMovil === 'function' && esDispositivoMovil()) {
            document.body.style.overflow = 'hidden';
        } else if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
    }
}

function actualizarModalTomarFoto(mensaje) {
    const mensajeElemento = document.getElementById('mensaje-tomar-foto');
    if (mensajeElemento) {
        mensajeElemento.textContent = mensaje;
    }
}

function ocultarModalTomarFoto() {
    const modal = document.getElementById('modal-tomar-foto');
    
    if (modal) {
        modal.style.display = 'none';
        
        // Restaurar overflow del body
        if (typeof esDispositivoMovil === 'function' && esDispositivoMovil()) {
            document.body.style.overflow = '';
        } else if (window.innerWidth <= 768) {
            document.body.style.overflow = '';
        }
    }
}

// Funciones para el overlay del video
function mostrarOverlayVideo(mensaje) {
    const overlay = document.getElementById('video-overlay');
    const mensajeElemento = overlay ? overlay.querySelector('.overlay-message') : null;
    
    if (overlay) {
        if (mensajeElemento && mensaje) {
            mensajeElemento.textContent = mensaje;
        }
        overlay.style.display = 'flex';
    }
}

function actualizarOverlayVideo(mensaje) {
    const overlay = document.getElementById('video-overlay');
    const mensajeElemento = overlay ? overlay.querySelector('.overlay-message') : null;
    
    if (mensajeElemento && mensaje) {
        mensajeElemento.textContent = mensaje;
    }
}

function ocultarOverlayVideo() {
    const overlay = document.getElementById('video-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Hacer las funciones disponibles globalmente
window.mostrarModalTomarFoto = mostrarModalTomarFoto;
window.actualizarModalTomarFoto = actualizarModalTomarFoto;
window.ocultarModalTomarFoto = ocultarModalTomarFoto;
window.mostrarOverlayVideo = mostrarOverlayVideo;
window.actualizarOverlayVideo = actualizarOverlayVideo;
window.ocultarOverlayVideo = ocultarOverlayVideo;
