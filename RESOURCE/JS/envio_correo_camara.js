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
        
        if (nombreInput) nombreInput.value = 'Formato RIJ.pdf';
        
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
        console.log('=== INICIO DEBUG GENERACIÓN PDF ===');
        
        // Usar la misma verificación que la función original
        const fotosWrappers = document.querySelectorAll('#photosContainer .photo-wrapper');
        console.log('Fotos wrappers encontrados:', fotosWrappers.length);
        
        if (fotosWrappers.length === 0) {
            mostrarMensajeCamara('No hay fotos para procesar.', 'error');
            return null;
        }

        // Verificar que jsPDF esté disponible
        if (typeof window.jspdf === 'undefined') {
            console.log('ERROR: jsPDF no está disponible');
            mostrarMensajeCamara('jsPDF no está cargado. Asegúrate de incluir la librería jsPDF.', 'error');
            return null;
        }

        console.log('jsPDF disponible:', window.jspdf);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        console.log('PDF creado exitosamente');

        const anchoHoja = 216;
        const altoHoja = 279;
        const fotosPorHoja = 9;
        const columnas = 3;
        const filas = 3;
        
        // Obtener las imágenes principales (igual que en pdf_fotos.js)
        const imagenesSeleccionadas = [];
        let aspectoFoto = 4 / 3;
        
        // Calcular aspecto usando la primera imagen disponible
        for (let i = 0; i < fotosWrappers.length; i++) {
            const imgPrincipal = fotosWrappers[i].querySelector('img.foto-principal');
            if (imgPrincipal && imgPrincipal.src) {
                console.log(`Imagen ${i + 1}:`, {
                    src: imgPrincipal.src.substring(0, 50) + '...',
                    naturalWidth: imgPrincipal.naturalWidth,
                    naturalHeight: imgPrincipal.naturalHeight
                });
                imagenesSeleccionadas.push(imgPrincipal.src);
                
                // Calcular aspecto real de la primera imagen
                if (imgPrincipal.naturalWidth && imgPrincipal.naturalHeight) {
                    aspectoFoto = imgPrincipal.naturalWidth / imgPrincipal.naturalHeight;
                    console.log('Aspecto foto calculado:', aspectoFoto);
                }
            }
        }

        console.log('Total imágenes seleccionadas:', imagenesSeleccionadas.length);

        if (imagenesSeleccionadas.length === 0) {
            mostrarMensajeCamara('No se encontraron imágenes válidas.', 'error');
            return null;
        }

        // Verificar el modo de visualización (pantalla completa o múltiples fotos)
        const pantallaCompleta = document.getElementById('pantallaCompletaPDF')?.checked || false;
        console.log('Modo pantalla completa:', pantallaCompleta);
        
        // VERSIÓN SIMPLIFICADA PARA DEBUG - Usar directamente las imágenes sin procesar
        console.log('=== GENERANDO PDF DIRECTAMENTE (SIN PROCESAMIENTO) ===');
        
        if (pantallaCompleta) {
            // Modo pantalla completa: una foto por página
            for (let i = 0; i < imagenesSeleccionadas.length; i++) {
                console.log(`Agregando imagen ${i + 1} en pantalla completa`);
                
                if (i > 0) {
                    pdf.addPage('letter', 'portrait');
                }
                
                // Calcular dimensiones manteniendo proporción
                const margen = 10;
                let ancho = anchoHoja - (2 * margen);
                let alto = altoHoja - (2 * margen);
                
                // Ajustar proporción
                if (ancho / alto > aspectoFoto) {
                    ancho = alto * aspectoFoto;
                } else {
                    alto = ancho / aspectoFoto;
                }
                
                const x = (anchoHoja - ancho) / 2;
                const y = (altoHoja - alto) / 2;
                
                try {
                    // Usar formato JPEG (más compatible) en lugar de WEBP
                    pdf.addImage(imagenesSeleccionadas[i], 'JPEG', x, y, ancho, alto);
                    console.log(`Imagen ${i + 1} agregada exitosamente`);
                } catch (error) {
                    console.error(`Error agregando imagen ${i + 1}:`, error);
                }
            }
        } else {
            // Modo múltiples fotos: 9 fotos por página (3x3)
            // Calcular dimensiones de celda
            let altoCelda = altoHoja / filas;
            let anchoCelda = altoCelda * aspectoFoto;
            
            if (anchoCelda * columnas > anchoHoja) {
                anchoCelda = anchoHoja / columnas;
                altoCelda = anchoCelda / aspectoFoto;
            }
            
            console.log('Dimensiones celda:', { anchoCelda, altoCelda });
            
            for (let i = 0; i < imagenesSeleccionadas.length; i++) {
                console.log(`Agregando imagen ${i + 1} en mosaico`);
                
                if (i > 0 && i % fotosPorHoja === 0) {
                    pdf.addPage('letter', 'portrait');
                    console.log('Nueva página agregada');
                }
                
                const indicePagina = i % fotosPorHoja;
                const fila = Math.floor(indicePagina / columnas);
                const columna = indicePagina % columnas;
                
                const x = columna * anchoCelda;
                const y = fila * altoCelda;
                
                try {
                    // Usar formato JPEG (más compatible) en lugar de WEBP
                    pdf.addImage(imagenesSeleccionadas[i], 'JPEG', x, y, anchoCelda, altoCelda);
                    console.log(`Imagen ${i + 1} agregada en posición (${x}, ${y})`);
                } catch (error) {
                    console.error(`Error agregando imagen ${i + 1}:`, error);
                }
            }
        }
        
        console.log('=== CONVIRTIENDO PDF A BASE64 ===');
        
        // Convertir PDF a base64
        let pdfBase64 = pdf.output('datauristring');
        
        // CORREGIR FORMATO - jsPDF agrega filename que no es estándar
        if (pdfBase64.includes(';filename=')) {
            pdfBase64 = pdfBase64.replace(/;filename=[^;]+/, '');
            console.log('Formato corregido: eliminado filename del data URI');
        }
        
        console.log('PDF Base64 generado:', {
            length: pdfBase64.length,
            starts_with: pdfBase64.substring(0, 50),
            is_valid_pdf: pdfBase64.startsWith('data:application/pdf;base64,')
        });
        
        // DEBUG: Crear un objeto URL temporal para verificar si el PDF es válido
        try {
            const binaryString = atob(pdfBase64.split(',')[1]);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            console.log('PDF local URL creada para testing:', url);
            
            // Log para verificar si podemos abrir el PDF localmente
            console.log('Para debug: puedes abrir este URL en una nueva pestaña:', url);
            
            // Limpiar después de un tiempo
            setTimeout(() => URL.revokeObjectURL(url), 30000);
        } catch (debugError) {
            console.error('Error en debug del PDF:', debugError);
        }
        
        console.log('=== FIN DEBUG GENERACIÓN PDF ===');
        return pdfBase64;
        
    } catch (error) {
        console.error('ERROR GENERAL en generarPDFParaCorreoCamara:', error);
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
        // TEMPORAL: Usar función de test primero
        console.log('=== INTENTANDO FUNCIÓN DE TEST ===');
        let pdfBase64 = await generarPDFParaCorreoCAMARA_TEST();
        
        if (!pdfBase64) {
            console.log('=== FUNCIÓN DE TEST FALLÓ, INTENTANDO FUNCIÓN PRINCIPAL ===');
            pdfBase64 = await generarPDFParaCorreoCamara();
        }
        
        if (!pdfBase64) {
            mostrarMensajeCamara('Error al generar el PDF. Inténtelo de nuevo.', 'error');
            return;
        }
        
        console.log('PDF FINAL para envío:', {
            length: pdfBase64.length,
            starts_with: pdfBase64.substring(0, 100),
            is_pdf: pdfBase64.includes('PDF')
        });
        
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

// FUNCIÓN DE PRUEBA - Para comparar exactamente con pdf_fotos.js
async function generarPDFParaCorreoCAMARA_TEST() {
    try {
        console.log('=== FUNCIÓN DE PRUEBA - COPIA EXACTA DE pdf_fotos.js ===');
        
        // Copiar EXACTAMENTE la lógica de generarPDFConFotos()
        var fotos = document.querySelectorAll('#photosContainer .photo-wrapper');
        console.log('Fotos encontradas (test):', fotos.length);
        
        if (fotos.length === 0) {
            console.log('ERROR TEST: No hay fotos');
            return null;
        }
        
        if (typeof window.jspdf === 'undefined') {
            console.log('ERROR TEST: jsPDF no disponible');
            return null;
        }
        
        var { jsPDF } = window.jspdf;
        var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        
        var anchoHoja = 216;
        var altoHoja = 279;
        var fotosPorHoja = 9;
        var columnas = 3;
        var filas = 3;
        var anchoCelda, altoCelda;
        var aspectoFoto = 4 / 3;
        
        // Usar la primera imagen seleccionada para calcular el aspecto
        for (var i = 0; i < fotos.length; i++) {
            var imgSeleccionada = fotos[i].querySelector('img.foto-principal');
            if (imgSeleccionada && imgSeleccionada.naturalWidth && imgSeleccionada.naturalHeight) {
                aspectoFoto = imgSeleccionada.naturalWidth / imgSeleccionada.naturalHeight;
                console.log('TEST: Aspecto calculado:', aspectoFoto);
                break;
            }
        }
        
        altoCelda = altoHoja / filas;
        anchoCelda = altoCelda * aspectoFoto;
        if (anchoCelda * columnas > anchoHoja) {
            anchoCelda = anchoHoja / columnas;
            altoCelda = anchoCelda / aspectoFoto;
        }
        
        // Obtener solo la versión seleccionada de cada foto
        var imagenesSeleccionadas = [];
        var pantallaCompletaPorFoto = [];
        for (var i = 0; i < fotos.length; i++) {
            var imgSeleccionada = fotos[i].querySelector('img.foto-principal');
            var checkbox = fotos[i].querySelector('.checkbox-pantalla-completa');
            if (imgSeleccionada) {
                imagenesSeleccionadas.push(imgSeleccionada.src);
                pantallaCompletaPorFoto.push(checkbox && checkbox.checked);
            }
        }
        
        console.log('TEST: Imágenes seleccionadas:', imagenesSeleccionadas.length);
        
        // Eliminar duplicados exactos
        var imagenesUnicas = imagenesSeleccionadas.filter(function(value, index, self) {
            return self.indexOf(value) === index;
        });
        
        var pantallaCompletaUnica = pantallaCompletaPorFoto.filter(function(value, index, self) {
            return imagenesSeleccionadas.indexOf(imagenesUnicas[index]) === index;
        });
        
        // Revisar si el checkbox global está activado
        var pantallaCompletaGlobal = false;
        var chkGlobal = document.getElementById('pantallaCompletaPDF');
        if (chkGlobal) {
            pantallaCompletaGlobal = chkGlobal.checked;
        }
        
        console.log('TEST: Pantalla completa global:', pantallaCompletaGlobal);
        
        // Función simplificada para agregar imagen (sin procesamiento OpenCV)
        function agregarImagenAlPDFSimple(imagen, callback) {
            console.log('TEST: Procesando imagen:', imagen.substring(0, 50) + '...');
            
            // Si ya es un data URL, usarlo directamente
            if (imagen.startsWith('data:')) {
                // Convertir a WebP si no lo es ya
                if (imagen.startsWith('data:image/webp')) {
                    console.log('TEST: Imagen ya es WebP');
                    callback(imagen);
                    return;
                }
                
                // Convertir a WebP
                var img = new Image();
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                    console.log('TEST: Convertido a WebP exitosamente');
                    callback(webpDataUrl);
                };
                img.onerror = function() {
                    console.log('TEST: Error cargando imagen');
                    callback(null);
                };
                img.src = imagen;
                return;
            }
            
            // Si es URL del servidor, usar fetch
            fetch(imagen, { credentials: 'include' })
                .then(function(response) { return response.blob(); })
                .then(function(blob) {
                    var reader = new FileReader();
                    reader.onloadend = function() {
                        var img = new Image();
                        img.onload = function() {
                            var canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            var ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                            console.log('TEST: Imagen del servidor convertida a WebP');
                            callback(webpDataUrl);
                        };
                        img.onerror = function() {
                            console.log('TEST: Error procesando imagen del servidor');
                            callback(null);
                        };
                        img.src = reader.result;
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(function() {
                    console.log('TEST: Error fetching imagen');
                    callback(null);
                });
        }
        
        // Procesar imágenes secuencialmente
        function procesarImagenesTest(indice, imagenesProcesadas, enMosaico) {
            if (indice >= imagenesUnicas.length) {
                console.log('TEST: Todas las imágenes procesadas, generando PDF final');
                
                // Si quedan fotos en mosaico pendientes, agrégalas al final
                if (!pantallaCompletaGlobal && enMosaico.length > 0) {
                    for (var j = 0; j < enMosaico.length; j++) {
                        var i = j;
                        var col = i % columnas;
                        var fila = Math.floor((i % fotosPorHoja) / columnas);
                        var x = col * anchoCelda;
                        var y = fila * altoCelda;
                        pdf.addImage(enMosaico[j], 'WEBP', x, y, anchoCelda, altoCelda);
                        if ((i + 1) % fotosPorHoja === 0 && j !== enMosaico.length - 1) {
                            pdf.addPage('letter', 'portrait');
                        }
                    }
                }
                
                // Convertir PDF a base64
                var pdfBase64 = pdf.output('datauristring');
                
                // CORREGIR FORMATO - jsPDF agrega filename que no es estándar
                if (pdfBase64.includes(';filename=')) {
                    pdfBase64 = pdfBase64.replace(/;filename=[^;]+/, '');
                }
                
                console.log('TEST: PDF generado:', {
                    length: pdfBase64.length,
                    valid: pdfBase64.startsWith('data:application/pdf;base64,'),
                    corrected_format: true
                });
                
                return pdfBase64;
            }
            
            agregarImagenAlPDFSimple(imagenesUnicas[indice], function(dataUrl) {
                if (dataUrl) {
                    if (pantallaCompletaGlobal) {
                        console.log('TEST: Agregando imagen en pantalla completa global');
                        pdf.addImage(dataUrl, 'WEBP', 0, 0, anchoHoja, altoHoja);
                        if (indice !== imagenesUnicas.length - 1) {
                            pdf.addPage('letter', 'portrait');
                        }
                    } else if (pantallaCompletaUnica[indice]) {
                        console.log('TEST: Agregando imagen en pantalla completa individual');
                        // Si hay fotos en mosaico pendientes, agrégalas antes
                        if (enMosaico.length > 0) {
                            for (var j = 0; j < enMosaico.length; j++) {
                                var i = j;
                                var col = i % columnas;
                                var fila = Math.floor((i % fotosPorHoja) / columnas);
                                var x = col * anchoCelda;
                                var y = fila * altoCelda;
                                pdf.addImage(enMosaico[j], 'WEBP', x, y, anchoCelda, altoCelda);
                                if ((i + 1) % fotosPorHoja === 0 && j !== enMosaico.length - 1) {
                                    pdf.addPage('letter', 'portrait');
                                }
                            }
                            enMosaico = [];
                            pdf.addPage('letter', 'portrait');
                        }
                        pdf.addImage(dataUrl, 'WEBP', 0, 0, anchoHoja, altoHoja);
                        if (indice !== imagenesUnicas.length - 1) {
                            pdf.addPage('letter', 'portrait');
                        }
                    } else {
                        console.log('TEST: Agregando imagen a mosaico');
                        enMosaico.push(dataUrl);
                    }
                    imagenesProcesadas.push(dataUrl);
                }
                
                // Continuar procesando la siguiente imagen
                procesarImagenesTest(indice + 1, imagenesProcesadas, enMosaico);
            });
        }
        
        // Comenzar procesamiento
        return new Promise((resolve) => {
            var originalProcessarImagenes = procesarImagenesTest;
            procesarImagenesTest = function(indice, imagenesProcesadas, enMosaico) {
                var result = originalProcessarImagenes(indice, imagenesProcesadas, enMosaico);
                if (result) {
                    resolve(result);
                }
            };
            
            procesarImagenesTest(0, [], []);
        });
        
    } catch (error) {
        console.error('ERROR en función de prueba:', error);
        return null;
    }
}

// FUNCIÓN ALTERNATIVA - Generar PDF como ArrayBuffer y convertir manualmente
async function generarPDFParaCorreoCAMARA_ARRAYBUFFER() {
    try {
        console.log('=== FUNCIÓN ARRAYBUFFER - Control total del formato ===');
        
        var fotos = document.querySelectorAll('#photosContainer .photo-wrapper');
        console.log('Fotos encontradas (arraybuffer):', fotos.length);
        
        if (fotos.length === 0) {
            console.log('ERROR ARRAYBUFFER: No hay fotos');
            return null;
        }
        
        if (typeof window.jspdf === 'undefined') {
            console.log('ERROR ARRAYBUFFER: jsPDF no disponible');
            return null;
        }
        
        var { jsPDF } = window.jspdf;
        var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        
        var anchoHoja = 216;
        var altoHoja = 279;
        var aspectoFoto = 4 / 3;
        
        // Calcular aspecto
        for (var i = 0; i < fotos.length; i++) {
            var imgSeleccionada = fotos[i].querySelector('img.foto-principal');
            if (imgSeleccionada && imgSeleccionada.naturalWidth && imgSeleccionada.naturalHeight) {
                aspectoFoto = imgSeleccionada.naturalWidth / imgSeleccionada.naturalHeight;
                console.log('ARRAYBUFFER: Aspecto calculado:', aspectoFoto);
                break;
            }
        }
        
        // Obtener imágenes
        var imagenesSeleccionadas = [];
        for (var i = 0; i < fotos.length; i++) {
            var imgSeleccionada = fotos[i].querySelector('img.foto-principal');
            if (imgSeleccionada) {
                imagenesSeleccionadas.push(imgSeleccionada.src);
            }
        }
        
        console.log('ARRAYBUFFER: Imágenes seleccionadas:', imagenesSeleccionadas.length);
        
        // Verificar modo pantalla completa
        var pantallaCompletaGlobal = false;
        var chkGlobal = document.getElementById('pantallaCompletaPDF');
        if (chkGlobal) {
            pantallaCompletaGlobal = chkGlobal.checked;
        }
        
        console.log('ARRAYBUFFER: Pantalla completa global:', pantallaCompletaGlobal);
        
        // Procesar todas las imágenes usando Promise.all para ser más eficiente
        var imagenesProcessadas = await Promise.all(
            imagenesSeleccionadas.map(function(imagen, index) {
                return new Promise(function(resolve) {
                    console.log(`ARRAYBUFFER: Procesando imagen ${index + 1}`);
                    
                    if (imagen.startsWith('data:')) {
                        // Convertir a WebP
                        var img = new Image();
                        img.onload = function() {
                            var canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            var ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                            console.log(`ARRAYBUFFER: Imagen ${index + 1} convertida`);
                            resolve(webpDataUrl);
                        };
                        img.onerror = function() {
                            console.log(`ARRAYBUFFER: Error imagen ${index + 1}`);
                            resolve(null);
                        };
                        img.src = imagen;
                    } else {
                        // Fetch desde servidor
                        fetch(imagen, { credentials: 'include' })
                            .then(function(response) { return response.blob(); })
                            .then(function(blob) {
                                var reader = new FileReader();
                                reader.onloadend = function() {
                                    var img = new Image();
                                    img.onload = function() {
                                        var canvas = document.createElement('canvas');
                                        canvas.width = img.naturalWidth;
                                        canvas.height = img.naturalHeight;
                                        var ctx = canvas.getContext('2d');
                                        ctx.drawImage(img, 0, 0);
                                        var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                                        console.log(`ARRAYBUFFER: Imagen ${index + 1} del servidor convertida`);
                                        resolve(webpDataUrl);
                                    };
                                    img.onerror = function() {
                                        console.log(`ARRAYBUFFER: Error procesando imagen ${index + 1}`);
                                        resolve(null);
                                    };
                                    img.src = reader.result;
                                };
                                reader.readAsDataURL(blob);
                            })
                            .catch(function() {
                                console.log(`ARRAYBUFFER: Error fetch imagen ${index + 1}`);
                                resolve(null);
                            });
                    }
                });
            })
        );
        
        // Filtrar imágenes válidas
        imagenesProcessadas = imagenesProcessadas.filter(function(img) { return img !== null; });
        console.log('ARRAYBUFFER: Imágenes procesadas válidas:', imagenesProcessadas.length);
        
        if (imagenesProcessadas.length === 0) {
            console.log('ARRAYBUFFER: No se procesaron imágenes válidas');
            return null;
        }
        
        // Agregar imágenes al PDF
        for (var i = 0; i < imagenesProcessadas.length; i++) {
            if (i > 0) {
                pdf.addPage('letter', 'portrait');
            }
            
            if (pantallaCompletaGlobal) {
                // Pantalla completa
                var margen = 10;
                var ancho = anchoHoja - (2 * margen);
                var alto = altoHoja - (2 * margen);
                
                if (ancho / alto > aspectoFoto) {
                    ancho = alto * aspectoFoto;
                } else {
                    alto = ancho / aspectoFoto;
                }
                
                var x = (anchoHoja - ancho) / 2;
                var y = (altoHoja - alto) / 2;
                
                pdf.addImage(imagenesProcessadas[i], 'WEBP', x, y, ancho, alto);
                console.log(`ARRAYBUFFER: Imagen ${i + 1} agregada en pantalla completa`);
            } else {
                // Mosaico simplificado (una imagen por página por simplicidad)
                pdf.addImage(imagenesProcessadas[i], 'WEBP', 10, 10, anchoHoja - 20, altoHoja - 20);
                console.log(`ARRAYBUFFER: Imagen ${i + 1} agregada en página individual`);
            }
        }
        
        // Generar como ArrayBuffer y convertir manualmente a base64
        var pdfArrayBuffer = pdf.output('arraybuffer');
        console.log('ARRAYBUFFER: PDF generado como ArrayBuffer:', pdfArrayBuffer.byteLength, 'bytes');
        
        // Convertir ArrayBuffer a base64 manualmente
        var bytes = new Uint8Array(pdfArrayBuffer);
        var binary = '';
        for (var i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        var base64 = btoa(binary);
        
        // Construir data URI manualmente
        var pdfBase64 = 'data:application/pdf;base64,' + base64;
        
        console.log('ARRAYBUFFER: PDF convertido a base64:', {
            length: pdfBase64.length,
            valid: pdfBase64.startsWith('data:application/pdf;base64,'),
            manual_conversion: true
        });
        
        return pdfBase64;
        
    } catch (error) {
        console.error('ERROR en función arraybuffer:', error);
        return null;
    }
}
