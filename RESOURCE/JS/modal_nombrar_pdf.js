/**
 * Sistema para nombrar archivos PDF generados en cámara
 * Permite al usuario elegir el nombre del archivo antes de la descarga
 */

// Variable global para almacenar el PDF generado temporalmente
let pdfGeneradoTemporal = null;

/**
 * Obtiene la fecha actual en formato dd-mm-yyyy
 * Utiliza la función del sistema global de fechas
 */
function obtenerFechaParaPDF() {
    // Verificar si existe la función global de fechas
    if (typeof obtenerFecha === 'function') {
        return obtenerFecha().replace(/\//g, '-');
    }
    
    // Función de respaldo si no está disponible la función global
    const fecha = new Date();
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}-${mes}-${anio}`;
}

/**
 * Genera el nombre por defecto para el archivo PDF
 */
function generarNombrePorDefecto() {
    const fechaActual = obtenerFechaParaPDF();
    return `Formato_RIJ_(${fechaActual})`;
}

/**
 * Muestra el modal para nombrar el archivo PDF
 * @param {jsPDF} pdf - El objeto PDF generado
 */
function mostrarModalNombrarPDF(pdf) {
    // Almacenar el PDF temporalmente
    pdfGeneradoTemporal = pdf;
    
    // Configurar el nombre por defecto
    const inputNombre = document.getElementById('nombre-archivo-pdf-descarga');
    if (inputNombre) {
        inputNombre.value = generarNombrePorDefecto();
        // Seleccionar el texto para facilitar la edición
        setTimeout(() => {
            inputNombre.select();
        }, 100);
    }
    
    // Mostrar el modal usando las clases CSS correctas
    const modal = document.getElementById('modal-nombrar-pdf');
    if (modal) {
        modal.classList.add('firma-modal--visible');
    }
}

/**
 * Oculta el modal de nombrar archivo PDF
 */
function ocultarModalNombrarPDF() {
    const modal = document.getElementById('modal-nombrar-pdf');
    if (modal) {
        modal.classList.remove('firma-modal--visible');
    }
    
    // Limpiar PDF temporal
    pdfGeneradoTemporal = null;
}

/**
 * Confirma la descarga del PDF con el nombre elegido
 */
function confirmarDescargaPDF() {
    const inputNombre = document.getElementById('nombre-archivo-pdf-descarga');
    
    if (!inputNombre || !inputNombre.value.trim()) {
        if (typeof showMessage === 'function') {
            showMessage('Por favor, ingrese un nombre para el archivo.');
        } else {
            alert('Por favor, ingrese un nombre para el archivo.');
        }
        return;
    }
    
    if (!pdfGeneradoTemporal) {
        if (typeof showMessage === 'function') {
            showMessage('Error: PDF no disponible. Intente generar el PDF nuevamente.');
        } else {
            alert('Error: PDF no disponible. Intente generar el PDF nuevamente.');
        }
        ocultarModalNombrarPDF();
        return;
    }
    
    // Obtener el nombre del archivo
    let nombreArchivo = inputNombre.value.trim();
    
    // Agregar extensión .pdf si no la tiene
    if (!nombreArchivo.toLowerCase().endsWith('.pdf')) {
        nombreArchivo += '.pdf';
    }
    
    try {
        // Descargar el PDF con el nombre elegido
        pdfGeneradoTemporal.save(nombreArchivo);
        
        // Ocultar el modal
        ocultarModalNombrarPDF();
        
        // Restaurar el botón de generar PDF
        setTimeout(() => {
            const btn = document.getElementById('btnGenerarPDF');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Generar PDF de fotos';
            }
        }, 500);
        
        // Mensaje de éxito
        if (typeof showMessage === 'function') {
            showMessage(`PDF descargado exitosamente como: ${nombreArchivo}`);
        }
        
        // Disparar evento personalizado de descarga completada
        window.dispatchEvent(new CustomEvent('pdfDescargaCompleta', {
            detail: { nombreArchivo: nombreArchivo }
        }));
        
    } catch (error) {
        console.error('Error al descargar PDF:', error);
        if (typeof showMessage === 'function') {
            showMessage('Error al descargar el PDF. Intente nuevamente.');
        } else {
            alert('Error al descargar el PDF. Intente nuevamente.');
        }
    }
}

/**
 * Cancela la descarga del PDF
 */
function cancelarDescargaPDF() {
    ocultarModalNombrarPDF();
    
    // Restaurar el botón de generar PDF
    setTimeout(() => {
        const btn = document.getElementById('btnGenerarPDF');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Generar PDF de fotos';
        }
    }, 100);
}

/**
 * Inicializar eventos del modal cuando se carga el DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    // Botón confirmar descarga
    const btnConfirmar = document.getElementById('btn-confirmar-descarga-pdf');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarDescargaPDF);
    }
    
    // Botón cancelar descarga
    const btnCancelar = document.getElementById('btn-cancelar-descarga-pdf');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarDescargaPDF);
    }
    
    // Permitir confirmar con Enter en el input
    const inputNombre = document.getElementById('nombre-archivo-pdf-descarga');
    if (inputNombre) {
        inputNombre.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                confirmarDescargaPDF();
            }
        });
    }
    
    // Cerrar modal con clic fuera del contenido
    const modal = document.getElementById('modal-nombrar-pdf');
    if (modal) {
        modal.addEventListener('click', function(event) {
            // Solo cerrar si se hace clic en el fondo del modal, no en el contenido
            if (event.target === modal) {
                cancelarDescargaPDF();
            }
        });
    }
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modal = document.getElementById('modal-nombrar-pdf');
            if (modal && modal.classList.contains('firma-modal--visible')) {
                cancelarDescargaPDF();
            }
        }
    });
});

// Función pública para ser llamada desde pdf_fotos.js
window.mostrarModalNombrarPDF = mostrarModalNombrarPDF;
