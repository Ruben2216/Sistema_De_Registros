// Archivo JavaScript para manejar el envío de PDF de fotos por correo electrónico desde la página de cámara

// Variable global para almacenar el PDF generado
let pdfCamaraGenerado = null;

// Función para abrir el modal de envío de correo (mejorada para móvil)
function abrirModalEnviarCorreoCamara() {
    // Usar la misma verificación que generarPDFConFotos()
    const fotosWrappers = document.querySelectorAll('#photosContainer .photo-wrapper');
    
    if (fotosWrappers.length === 0) {
        // Usar la función showMessage del sistema existente si está disponible
        if (typeof showMessage === 'function') {
            showMessage('No hay fotos para enviar. Por favor, toma algunas fotografías primero.');
        } else {
            alert('No hay fotos para enviar. Por favor, toma algunas fotografías primero.');
        }
        return;
    }
    
    // Verificar que OpenCV esté listo (usando verificación segura)
    const openCVListo = (typeof opencvReady !== 'undefined' && opencvReady === true);
    if (!openCVListo) {
        // Verificación adicional: si cv está disponible pero opencvReady no está definido
        if (typeof cv !== 'undefined' && cv.Mat) {
            // OpenCV parece estar disponible, continuando
        } else {
            if (typeof showMessage === 'function') {
                showMessage('OpenCV.js aún no está cargado. Por favor, espera y vuelve a intentarlo.');
            } else {
                alert('OpenCV.js aún no está cargado. Por favor, espera y vuelve a intentarlo.');
            }
            return;
        }
    }
    
    // Mostrar el modal
    const modal = document.getElementById('modal-enviar-correo-camara');
    if (modal) {
        // En móvil, evitar problemas de viewport
        if (esDispositivoMovil()) {
            // Scroll al top para evitar problemas de viewport
            window.scrollTo(0, 0);
            document.body.style.overflow = 'hidden';
        }
        
        modal.style.display = 'flex';
        
        // Limpiar campos anteriores
        const correoInput = document.getElementById('correo-destinatario-camara');
        const nombreInput = document.getElementById('nombre-archivo-pdf-camara');
        
        if (correoInput) {
            correoInput.value = '';
            // En móvil, enfocar después de un pequeño delay
            if (esDispositivoMovil()) {
                setTimeout(() => {
                    correoInput.focus();
                }, 300);
            } else {
                correoInput.focus();
            }
        }
        
        if (nombreInput) nombreInput.value = 'Evidencias_Fotograficas.pdf';
        
        // Ocultar mensaje anterior
        const mensajeDiv = document.getElementById('mensaje-envio-correo-camara');
        if (mensajeDiv) {
            mensajeDiv.style.display = 'none';
            mensajeDiv.className = 'mensaje-estado';
        }
        
    }
}

// Función para cerrar el modal de envío de correo (mejorada para móvil)
function cerrarModalEnviarCorreoCamara() {
    const modal = document.getElementById('modal-enviar-correo-camara');
    if (modal) {
        modal.style.display = 'none';
        
        // Restaurar overflow del body en móvil
        if (esDispositivoMovil()) {
            document.body.style.overflow = '';
        }
    }
    
    // Limpiar el PDF almacenado
    pdfCamaraGenerado = null;
}

// Función para obtener las fotos de la cámara (mejorada para ser más compatible)
function obtenerFotosCamara() {
    try {
        // Usar la misma lógica que generarPDFConFotos()
        const fotosWrappers = document.querySelectorAll('#photosContainer .photo-wrapper');
        
        if (fotosWrappers.length === 0) {
            // Fallback: buscar imágenes directamente
            const imagenesDirectas = document.querySelectorAll('#photosContainer img');
            const fotosDirectas = [];
            
            imagenesDirectas.forEach(function(img) {
                if (img.src && img.src.startsWith('data:image')) {
                    fotosDirectas.push(img.src);
                }
            });
            
            return fotosDirectas;
        }
        
        // Obtener las imágenes principales de cada wrapper (igual que en pdf_fotos.js)
        const imagenesSeleccionadas = [];
        fotosWrappers.forEach(function(wrapper) {
            const imgPrincipal = wrapper.querySelector('img.foto-principal');
            if (imgPrincipal && imgPrincipal.src && imgPrincipal.src.startsWith('data:image')) {
                imagenesSeleccionadas.push(imgPrincipal.src);
            }
        });
        
        return imagenesSeleccionadas;
        
    } catch (error) {
        return [];
    }
}

// Función para generar el PDF de fotos (adaptada de pdf_fotos.js)
async function generarPDFParaCorreoCamara() {
    try {
        // Usar la misma verificación que la función original
        const fotosWrappers = document.querySelectorAll('#photosContainer .photo-wrapper');
        if (fotosWrappers.length === 0) {
            mostrarMensajeCamara('No hay fotos para procesar.', 'error');
            return null;
        }

        // Verificar que jsPDF esté disponible
        if (typeof window.jspdf === 'undefined') {
            mostrarMensajeCamara('jsPDF no está cargado. Asegúrate de incluir la librería jsPDF.', 'error');
            return null;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

        const anchoHoja = 216;
        const altoHoja = 279;
        const fotosPorHoja = 9;
        const columnas = 3;
        const filas = 3;
        
        // Obtener las imágenes principales (igual que en pdf_fotos.js)
        const imagenesSeleccionadas = [];
        fotosWrappers.forEach(function(wrapper) {
            const imgPrincipal = wrapper.querySelector('img.foto-principal');
            if (imgPrincipal && imgPrincipal.src) {
                imagenesSeleccionadas.push(imgPrincipal.src);
            }
        });

        if (imagenesSeleccionadas.length === 0) {
            mostrarMensajeCamara('No se encontraron imágenes válidas.', 'error');
            return null;
        }

        // Verificar el modo de visualización (pantalla completa o múltiples fotos)
        const pantallaCompleta = document.getElementById('pantallaCompletaPDF')?.checked || false;
        
        if (pantallaCompleta) {
            // Modo pantalla completa: una foto por página
            for (let i = 0; i < imagenesSeleccionadas.length; i++) {
                if (i > 0) {
                    pdf.addPage('letter', 'portrait');
                }
                
                // Calcular dimensiones manteniendo proporción
                const margen = 10;
                let ancho = anchoHoja - (2 * margen);
                let alto = altoHoja - (2 * margen);
                
                // Ajustar proporción (asumiendo aspecto 4:3 para fotos de cámara)
                const aspectoFoto = 4 / 3;
                if (ancho / alto > aspectoFoto) {
                    ancho = alto * aspectoFoto;
                } else {
                    alto = ancho / aspectoFoto;
                }
                
                const x = (anchoHoja - ancho) / 2;
                const y = (altoHoja - alto) / 2;
                
                pdf.addImage(imagenesSeleccionadas[i], 'JPEG', x, y, ancho, alto);
            }
        } else {
            // Modo múltiples fotos: 9 fotos por página (3x3)
            let aspectoFoto = 4 / 3; // Aspecto por defecto
            
            // Calcular dimensiones de celda
            let altoCelda = altoHoja / filas;
            let anchoCelda = altoCelda * aspectoFoto;
            
            if (anchoCelda * columnas > anchoHoja) {
                anchoCelda = anchoHoja / columnas;
                altoCelda = anchoCelda / aspectoFoto;
            }
            
            for (let i = 0; i < imagenesSeleccionadas.length; i++) {
                if (i > 0 && i % fotosPorHoja === 0) {
                    pdf.addPage('letter', 'portrait');
                }
                
                const indicePagina = i % fotosPorHoja;
                const fila = Math.floor(indicePagina / columnas);
                const columna = indicePagina % columnas;
                
                const x = columna * anchoCelda;
                const y = fila * altoCelda;
                
                pdf.addImage(imagenesSeleccionadas[i], 'JPEG', x, y, anchoCelda, altoCelda);
            }
        }
        
        // Convertir PDF a base64
        const pdfBase64 = pdf.output('datauristring');
        return pdfBase64;
        
    } catch (error) {
        mostrarMensajeCamara('Error al generar el PDF: ' + error.message, 'error');
        return null;
    }
}

// Función para enviar el correo con el PDF
async function enviarCorreoCamara() {
    const correoDestinatario = document.getElementById('correo-destinatario-camara').value.trim();
    const nombreArchivo = document.getElementById('nombre-archivo-pdf-camara').value.trim();
    
    // Validaciones
    if (!correoDestinatario) {
        mostrarMensajeCamara('Por favor, ingrese el correo del destinatario.', 'error');
        return;
    }
    
    if (!nombreArchivo) {
        mostrarMensajeCamara('Por favor, ingrese el nombre del archivo.', 'error');
        return;
    }
    
    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoDestinatario)) {
        mostrarMensajeCamara('Por favor, ingrese un correo electrónico válido.', 'error');
        return;
    }
    
    // Asegurar que el archivo tenga extensión .pdf
    const nombreFinal = nombreArchivo.endsWith('.pdf') ? nombreArchivo : nombreArchivo + '.pdf';
    
    // Mostrar mensaje de generación
    mostrarMensajeCamara('Generando PDF...', 'loading');
    
    // Deshabilitar botón de envío
    const btnEnviar = document.getElementById('btn-enviar-correo-camara');
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Procesando...';
    
    try {
        // Generar el PDF
        const pdfBase64 = await generarPDFParaCorreoCamara();
        
        if (!pdfBase64) {
            mostrarMensajeCamara('Error al generar el PDF. Inténtelo de nuevo.', 'error');
            return;
        }
        
        // Mostrar mensaje de envío
        mostrarMensajeCamara('Enviando correo...', 'loading');
        
        const response = await fetch('/api/rij/enviar_correo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                correo: correoDestinatario,
                pdf_base64: pdfBase64,
                nombre_archivo: nombreFinal
            })
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            mostrarMensajeCamara(resultado.message, 'success');
            
            // Cerrar modal después de 3 segundos
            setTimeout(() => {
                cerrarModalEnviarCorreoCamara();
            }, 3000);
        } else {
            mostrarMensajeCamara('Error: ' + resultado.error, 'error');
        }
        
    } catch (error) {
        mostrarMensajeCamara('Error de conexión. Verifique su conexión a internet.', 'error');
    } finally {
        // Rehabilitar botón de envío
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar';
    }
}

// Función para mostrar mensajes de estado en la cámara
function mostrarMensajeCamara(mensaje, tipo) {
    const mensajeDiv = document.getElementById('mensaje-envio-correo-camara');
    if (mensajeDiv) {
        mensajeDiv.textContent = mensaje;
        mensajeDiv.className = `mensaje-estado ${tipo}`;
        mensajeDiv.style.display = 'block';
    }
}

// Función para habilitar/deshabilitar el botón de enviar correo cuando OpenCV esté listo
function habilitarBotonEnvioCorreoCamara() {
    const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
    if (btnEnviarCorreo) {
        // Verificar si opencvReady está definido y es true
        const openCVListo = (typeof opencvReady !== 'undefined' && opencvReady === true);
        
        if (openCVListo) {
            btnEnviarCorreo.disabled = false;
            btnEnviarCorreo.textContent = 'Enviar a correo';
        } else {
            btnEnviarCorreo.disabled = true;
            btnEnviarCorreo.textContent = 'Cargando...';
        }
    }
}

// Función para detectir si es un dispositivo móvil
function esDispositivoMovil() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
}

// Variable para evitar dobles eventos en móvil
let ultimoEventoCorreo = 0;

// Función mejorada para manejar eventos en móvil y escritorio
function manejarEventoBoton(callback, tiempoEspera = 300) {
    return function(e) {
        const ahora = Date.now();
        
        // Evitar eventos duplicados
        if (ahora - ultimoEventoCorreo < tiempoEspera) {
            return;
        }
        
        ultimoEventoCorreo = ahora;
        e.preventDefault();
        e.stopPropagation();
        
        callback();
    };
}

// Event listeners cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    
    // Verificar elementos en el DOM
    setTimeout(function() {
        const photosContainer = document.getElementById('photosContainer');
        const fotosWrappers = document.querySelectorAll('#photosContainer .photo-wrapper');
        const imagenes = document.querySelectorAll('#photosContainer img');
        
        
        if (fotosWrappers.length > 0) {
            fotosWrappers.forEach((wrapper, index) => {
                const imgPrincipal = wrapper.querySelector('img.foto-principal');
            });
        }
    }, 2000);
    
    // Botón para abrir modal de envío de correo
    const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
    if (btnEnviarCorreo) {
        
        // Mejorar accesibilidad en móvil
        btnEnviarCorreo.style.touchAction = 'manipulation';
        btnEnviarCorreo.style.userSelect = 'none';
        btnEnviarCorreo.setAttribute('tabindex', '0');
        btnEnviarCorreo.setAttribute('role', 'button');
        
        const manejadorEnviarCorreo = manejarEventoBoton(abrirModalEnviarCorreoCamara);
        
        btnEnviarCorreo.addEventListener('click', manejadorEnviarCorreo);
        
        // Agregar soporte para teclado (accesibilidad)
        btnEnviarCorreo.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                manejadorEnviarCorreo(e);
            }
        });
    }
    
    // Botón para cerrar modal
    const btnCerrar = document.getElementById('btn-cerrar-modal-correo-camara');
    if (btnCerrar) {
        
        const manejadorCerrar = manejarEventoBoton(cerrarModalEnviarCorreoCamara);
        
        btnCerrar.addEventListener('click', manejadorCerrar);
    }
    
    // Botón para enviar correo
    const btnEnviar = document.getElementById('btn-enviar-correo-camara');
    if (btnEnviar) {
        
        const manejadorEnviar = manejarEventoBoton(enviarCorreoCamara);
        
        btnEnviar.addEventListener('click', manejadorEnviar);
    }
    
    // Cerrar modal al hacer clic fuera de él
    const modal = document.getElementById('modal-enviar-correo-camara');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModalEnviarCorreoCamara();
            }
        });
    }
    
    // Permitir envío con Enter en el campo de correo
    const inputCorreo = document.getElementById('correo-destinatario-camara');
    if (inputCorreo) {
        inputCorreo.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                enviarCorreoCamara();
            }
        });
        
        // Mejorar experiencia en móvil
        if (esDispositivoMovil()) {
            inputCorreo.setAttribute('autocomplete', 'email');
            inputCorreo.setAttribute('inputmode', 'email');
        }
    }
    
    // Habilitar botón cuando OpenCV esté listo (verificación inicial)
    habilitarBotonEnvioCorreoCamara();
    
    // Verificar periódicamente si OpenCV está disponible
    const checkOpenCVStatus = setInterval(function() {
        const openCVListo = (typeof opencvReady !== 'undefined' && opencvReady === true) || 
                          (typeof cv !== 'undefined' && cv.Mat);
        
        if (openCVListo) {
            habilitarBotonEnvioCorreoCamara();
            clearInterval(checkOpenCVStatus);
        } else {
            // OpenCV no está listo, seguir verificando
        }
    }, 500); // Verificar cada 500ms
    
    // Limpiar el intervalo después de 30 segundos para evitar bucles infinitos
    setTimeout(function() {
        clearInterval(checkOpenCVStatus);
    }, 30000);
    
    // Escuchar evento personalizado de OpenCV listo
    window.addEventListener('opencvReady', function(event) {
        habilitarBotonEnvioCorreoCamara();
    });
    
    // Función adicional para asegurar que los eventos se registren
    // (útil si algunos elementos se cargan de forma asíncrona)
    function verificarYRegistrarEventos() {
        const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
        if (btnEnviarCorreo && !btnEnviarCorreo.dataset.eventosRegistrados) {
            
            const manejadorEnviarCorreo = manejarEventoBoton(abrirModalEnviarCorreoCamara);
            
            btnEnviarCorreo.addEventListener('click', manejadorEnviarCorreo);
            
            btnEnviarCorreo.dataset.eventosRegistrados = 'true';
        }
    }
    
    // Verificar eventos adicionales después de 3 segundos
    setTimeout(verificarYRegistrarEventos, 3000);
    
    // Verificación de fuerza bruta para habilitar el botón si todo está listo
    setTimeout(function() {
        const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
        const btnGenerarPDF = document.getElementById('btnGenerarPDF');
        
        // Si el botón de PDF está habilitado pero el de correo no, forzar habilitación
        if (btnEnviarCorreo && btnGenerarPDF) {
            if (!btnGenerarPDF.disabled && btnEnviarCorreo.disabled) {
                btnEnviarCorreo.disabled = false;
                btnEnviarCorreo.textContent = 'Enviar a correo';
            }
        }
    }, 5000);
    
});
