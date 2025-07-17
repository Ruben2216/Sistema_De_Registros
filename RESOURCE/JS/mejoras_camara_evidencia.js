
function mostrarNotificacionCamara(mensaje, tipo = 'info', duracion = 5000) {
    const notificacion = document.getElementById('notificacion');
    if (!notificacion) return;
    
    // Añadir clase especial para notificaciones de cámara
    notificacion.className = `notificacion ${tipo} camara`;
    notificacion.textContent = mensaje;
    notificacion.classList.remove('oculto');
    
    // Auto-ocultar después del tiempo especificado
    setTimeout(() => {
        notificacion.classList.add('oculto');
    }, duracion);
}

// === GESTIÓN AVANZADA DE VENTANA DE CÁMARA ===
let ventanaCamaraReferencia = null;

function abrirCamaraAvanzada() {
    if (!pdfSeleccionado) {
        mostrarNotificacionCamara('Debe seleccionar un PDF primero', 'warning');
        return;
    }
    
    // Cerrar ventana anterior si existe
    if (ventanaCamaraReferencia && !ventanaCamaraReferencia.closed) {
        ventanaCamaraReferencia.close();
    }
    
    // Configurar parámetros para la ventana de cámara
    const parametrosVentana = {
        width: Math.min(1000, window.screen.width * 0.8),
        height: Math.min(800, window.screen.height * 0.8),
        left: (window.screen.width - 1000) / 2,
        top: (window.screen.height - 800) / 2
    };
    
    const configuracionVentana = `
        width=${parametrosVentana.width},
        height=${parametrosVentana.height},
        left=${parametrosVentana.left},
        top=${parametrosVentana.top},
        scrollbars=yes,
        resizable=yes,
        toolbar=no,
        menubar=no,
        location=no,
        status=no
    `.replace(/\s+/g, '');
    
    // Guardar contexto extendido
    const contextoAvanzado = {
        pdfSeleccionado: pdfSeleccionado,
        timestamp: Date.now(),
        origen: 'evidencia_mantenimiento',
        ventanaPadre: window.name || 'evidencia_principal',
        configuracion: {
            autoImport: true,
            autoClean: false,
            notificarCambios: true
        }
    };
    
    localStorage.setItem('evidencia_contexto_avanzado', JSON.stringify(contextoAvanzado));
    
    // Abrir ventana
    ventanaCamaraReferencia = window.open(
        '/TEMPLATES/camara.html?origen=evidencia&pdf_id=' + pdfSeleccionado.id,
        'camara_evidencia_' + Date.now(),
        configuracionVentana
    );
    
    if (ventanaCamaraReferencia) {
        mostrarNotificacionCamara('Cámara abierta. Tome las fotos y las importaremos automáticamente.', 'success');
        
        // Configurar comunicación entre ventanas
        configurarComunicacionVentanas();
        
        // Actualizar UI
        actualizarUIVentanaAbierta();
    } else {
        mostrarNotificacionCamara('Error al abrir la cámara. Verifique configuración de ventanas emergentes.', 'error');
    }
}

function configurarComunicacionVentanas() {
    // Escuchar mensajes de la ventana de cámara
    window.addEventListener('message', function(event) {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.tipo === 'camara_foto_tomada') {
            mostrarNotificacionCamara(`Foto tomada: ${event.data.numeroFoto}`, 'info', 3000);
            // Actualizar contador en tiempo real
            verificarEstadoCamara();
        }
        
        if (event.data.tipo === 'camara_cerrada') {
            actualizarUICamaraCerrada();
            // Verificar fotos disponibles una última vez
            setTimeout(verificarEstadoCamara, 1000);
        }
    });
}

function actualizarUIVentanaAbierta() {
    const btnCamara = document.querySelector('.btn-camara');
    if (btnCamara) {
        btnCamara.classList.add('conectado');
        btnCamara.innerHTML = '📷 Cámara Activa';
        btnCamara.disabled = true; // Evitar abrir múltiples ventanas
    }
    
    estadoCamara.conectada = true;
    actualizarEstadoCamara();
}

function actualizarUICamaraCerrada() {
    const btnCamara = document.querySelector('.btn-camara');
    if (btnCamara) {
        btnCamara.classList.remove('conectado');
        btnCamara.innerHTML = '📷 Abrir Cámara';
        btnCamara.disabled = false;
    }
    
    estadoCamara.conectada = false;
    ventanaCamaraReferencia = null;
    actualizarEstadoCamara();
}

// === IMPORTACIÓN AUTOMÁTICA ===
function configurarImportacionAutomatica() {
    if (!pdfSeleccionado) return;
    
    let ultimoConteoFotos = 0;
    
    const verificadorAutomatico = setInterval(async () => {
        if (!pdfSeleccionado || estadoCamara.sincronizando) {
            clearInterval(verificadorAutomatico);
            return;
        }
        
        try {
            const response = await fetch('/api/evidencia/estado_camara');
            const data = await response.json();
            
            if (data.success && data.fotos_disponibles > ultimoConteoFotos) {
                ultimoConteoFotos = data.fotos_disponibles;
                
                // Si la configuración permite importación automática
                const contexto = JSON.parse(localStorage.getItem('evidencia_contexto_avanzado') || '{}');
                if (contexto.configuracion?.autoImport) {
                    mostrarNotificacionCamara('Nuevas fotos detectadas. Importando automáticamente...', 'info');
                    await sincronizarFotosCamara();
                } else {
                    mostrarNotificacionCamara(`${data.fotos_disponibles} fotos disponibles para importar`, 'info');
                }
            }
        } catch (error) {
            console.error('Error en verificación automática:', error);
        }
    }, 4000); // Verificar cada 4 segundos
    
    // Limpiar verificador después de 10 minutos
    setTimeout(() => clearInterval(verificadorAutomatico), 600000);
}

// === PREVISUALIZACIÓN RÁPIDA ===
function previsualizarUltimaFoto() {
    if (imagenesEvidencia.length === 0) return;
    
    const ultimaImagen = imagenesEvidencia[imagenesEvidencia.length - 1];
    
    // Crear mini-modal de previsualización
    const miniModal = document.createElement('div');
    miniModal.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 200px;
        height: 200px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 9999;
        overflow: hidden;
        border: 3px solid #4caf50;
        animation: slideIn 0.3s ease-out;
    `;
    
    miniModal.innerHTML = `
        <div style="position: relative; height: 100%;">
            <img src="${ultimaImagen.data}" 
                 style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; 
                       background: rgba(0,0,0,0.8); color: white; padding: 5px; 
                       font-size: 12px; text-align: center;">
                ✅ Foto importada
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="position: absolute; top: 5px; right: 5px; 
                           background: rgba(255,255,255,0.9); border: none; 
                           border-radius: 50%; width: 25px; height: 25px; 
                           cursor: pointer; font-size: 14px;">×</button>
        </div>
    `;
    
    // Añadir animación CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(miniModal);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (miniModal.parentElement) {
            miniModal.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => miniModal.remove(), 300);
        }
    }, 5000);
}

// === FUNCIÓN DE INICIALIZACIÓN MEJORADA ===
function inicializarMejorasAvanzadas() {
    // Solo ejecutar si estamos en la página de evidencia
    if (!document.getElementById('seccion-evidencia')) return;
    
    
    // Configurar importación automática si hay PDF seleccionado
    if (pdfSeleccionado) {
        configurarImportacionAutomatica();
    }
    
    // Escuchar cambios en la selección de PDF
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'seccion-evidencia' && 
                mutation.target.style.display === 'block' && 
                pdfSeleccionado) {
                configurarImportacionAutomatica();
            }
        });
    });
    
    const seccionEvidencia = document.getElementById('seccion-evidencia');
    if (seccionEvidencia) {
        observer.observe(seccionEvidencia, { 
            attributes: true, 
            attributeFilter: ['style'] 
        });
    }
    
    // Configurar atajos de teclado
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 'k': // Ctrl+K para abrir cámara
                    event.preventDefault();
                    if (pdfSeleccionado) abrirCamaraAvanzada();
                    break;
                case 'i': // Ctrl+I para importar
                    event.preventDefault();
                    if (pdfSeleccionado && estadoCamara.fotosDisponibles > 0) {
                        importarFotosCamara();
                    }
                    break;
                case 's': // Ctrl+S para sincronizar
                    event.preventDefault();
                    if (pdfSeleccionado && estadoCamara.fotosDisponibles > 0) {
                        sincronizarFotosCamara();
                    }
                    break;
            }
        }
    });
    
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarMejorasAvanzadas);
} else {
    inicializarMejorasAvanzadas();
}
