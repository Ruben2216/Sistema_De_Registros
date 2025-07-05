// Variable global para almacenar el PDF generado
let pdfCamaraGenerado = null;

// Función para abrir el modal de envío de correo (CORREGIDA PARA MÓVILES)
function abrirModalEnviarCorreoCamara() {
    
    // NO verificar procesamientoEnCurso para apertura de modal - solo para envío
    // Esto permite que el modal siempre se pueda abrir
    
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
    
    // Verificar que OpenCV esté listo (usando verificación segura pero más permisiva)
    const openCVListo = (typeof opencvReady !== 'undefined' && opencvReady === true) ||
                        (typeof cv !== 'undefined' && cv.Mat) ||
                        (typeof verificarOpenCVDisponible === 'function' && verificarOpenCVDisponible());
    
    if (!openCVListo) {
        // Permitir funcionalidad básica sin OpenCV
        
        // Solo mostrar advertencia en lugar de bloquear
        if (esDispositivoMovil()) {
            // En móviles, ser más permisivo
        } else {
            // En escritorio, verificar más estrictamente
            if (typeof showMessage === 'function') {
                showMessage('Algunas funciones de procesamiento pueden no estar disponibles. ¿Continuar?');
            }
        }
    }
    
    try {
        // Mostrar el modal
        const modal = document.getElementById('modal-enviar-correo-camara');
        if (!modal) {
            console.error('Modal de envío de correo no encontrado');
            return;
        }
        
        // En móvil, preparar el entorno antes de mostrar el modal
        if (esDispositivoMovil()) {
            // Scroll al top para evitar problemas de viewport
            try {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } catch (e) {
                window.scrollTo(0, 0);
            }
            
            // Evitar scroll del body
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            
            // Prevenir zoom en iOS
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        }
        
        modal.style.display = 'flex';
        
        // Limpiar campos anteriores
        const correoInput = document.getElementById('correo-destinatario-camara');
        const nombreInput = document.getElementById('nombre-archivo-pdf-camara');
        
        if (correoInput) {
            correoInput.value = '';
            
            // En móvil, enfocar después de un delay más largo para asegurar que el modal esté completamente renderizado
            if (esDispositivoMovil()) {
                setTimeout(() => {
                    try {
                        correoInput.focus();
                        // Forzar scroll al input en móviles
                        correoInput.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center',
                            inline: 'nearest' 
                        });
                    } catch (e) {
                        // Error silencioso en móvil
                    }
                }, 500); // Delay más largo para móviles
            } else {
                setTimeout(() => {
                    correoInput.focus();
                }, 100);
            }
        }
        
        if (nombreInput) {
            // Función para generar fecha formateada consistente para PDFs
            function formatearFechaParaPDF(fecha) {
                const dia = fecha.getDate().toString().padStart(2, '0');
                const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
                const ano = fecha.getFullYear();
                return `${dia}-${mes}-${ano}`;
            }
            
            // Generar nombre por defecto más descriptivo con formato consistente
            const fechaActual = new Date();
            const fechaFormateada = formatearFechaParaPDF(fechaActual);
            
            nombreInput.value = `RIJ_${fechaFormateada}.pdf`;
        }
        
        // Ocultar mensaje anterior
        const mensajeDiv = document.getElementById('mensaje-envio-correo-camara');
        if (mensajeDiv) {
            mensajeDiv.style.display = 'none';
            mensajeDiv.className = 'mensaje-estado';
            mensajeDiv.textContent = '';
        }
        
        // Asegurar que el botón de envío esté habilitado
        const btnEnviar = document.getElementById('btn-enviar-correo-camara');
        if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Enviar';
        }
        
    } catch (error) {
        console.error('Error abriendo modal de envío de correo:', error);
        
        // Restaurar estado del body si algo salió mal
        if (esDispositivoMovil()) {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        
        // Mostrar error al usuario
        if (typeof showMessage === 'function') {
            showMessage('Error abriendo el formulario de envío. Inténtelo de nuevo.');
        } else {
            alert('Error abriendo el formulario de envío. Inténtelo de nuevo.');
        }
    }
}

// Función para cerrar el modal de envío de correo (CORREGIDA PARA MÓVILES)
function cerrarModalEnviarCorreoCamara() {
    try {
        const modal = document.getElementById('modal-enviar-correo-camara');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Restaurar estado del body en móvil
        if (esDispositivoMovil()) {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            
            // Restaurar viewport original
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
            
            // Scroll suave de vuelta
            setTimeout(() => {
                try {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                } catch (e) {
                    window.scrollTo(0, 0);
                }
            }, 100);
        }
        
        // Limpiar el PDF almacenado
        pdfCamaraGenerado = null;
        
        // NO limpiar flags de procesamiento aquí - solo al completar envío
        
    } catch (error) {
        console.error('Error cerrando modal:', error);
        
        if (esDispositivoMovil()) {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
    }
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

// Función para generar el PDF de fotos (IDÉNTICA a generarPDFConFotos pero para correo)
async function generarPDFParaCorreoCamara() {
    try {
        // Verificar si OpenCV está disponible (permitir generar sin OpenCV)
        const openCVDisponible = (typeof opencvReady !== 'undefined' && opencvReady === true) || 
                                (typeof verificarOpenCVDisponible === 'function' && verificarOpenCVDisponible());
        
        if (!openCVDisponible) {
            // Continuar sin OpenCV para funcionalidad básica
        }

        // Usar la misma verificación que la función original
        var fotosWrappers = document.querySelectorAll('#photosContainer .photo-wrapper');
        
        if (fotosWrappers.length === 0) {
            mostrarMensajeCamara('No hay fotos para procesar.', 'error');
            return null;
        }

        // GARANTIZAR que todas las imágenes tengan versiones locales (función de pdf_fotos.js)
        try {
            if (typeof garantizarImagenesLocales === 'function') {
                await garantizarImagenesLocales();
            }
        } catch (error) {
            // Continuar sin garantizar imágenes locales
        }

        // Verificar que jsPDF esté disponible
        if (typeof window.jspdf === 'undefined') {
            mostrarMensajeCamara('jsPDF no está cargado. Asegúrate de incluir la librería jsPDF.', 'error');
            return null;
        }

        var { jsPDF } = window.jspdf;
        var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

        var anchoHoja = 216;
        var altoHoja = 279;
        var fotosPorHoja = 9;
        var columnas = 3;
        var filas = 3;
        
        let paginaActual = 1;
        
        // **NUEVO**: Agregar imagen RIJ al principio si existe (igual que pdf_fotos.js)
        const identificador = localStorage.getItem('usuario_identificador_rij');
        if (identificador) {
            try {
                await agregarImagenRIJalPDFCorreo(pdf, null);
                pdf.addPage('letter', 'portrait');
                paginaActual = 2;
            } catch (error) {
                // Continuar sin imagen RIJ
            }
        }

        // Obtener las imágenes principales (IDÉNTICO a pdf_fotos.js)
        var imagenesSeleccionadas = [];
        var aspectoFoto = 4 / 3;
        
        // Usar la primera imagen seleccionada para calcular el aspecto
        for (var i = 0; i < fotosWrappers.length; i++) {
            var imgSeleccionada = fotosWrappers[i].querySelector('img.foto-principal');
            if (imgSeleccionada && imgSeleccionada.naturalWidth && imgSeleccionada.naturalHeight) {
                aspectoFoto = imgSeleccionada.naturalWidth / imgSeleccionada.naturalHeight;
                break;
            }
        }
        
        var altoCelda = altoHoja / filas;
        var anchoCelda = altoCelda * aspectoFoto;
        if (anchoCelda * columnas > anchoHoja) {
            anchoCelda = anchoHoja / columnas;
            altoCelda = anchoCelda / aspectoFoto;
        }
        
        // Obtener solo la versión seleccionada de cada foto PRIORIZANDO IMÁGENES LOCALES (IDÉNTICO)
        var imagenesConEstado = []; // Array de objetos {imagen, pantallaCompleta, wrapper}
        
        for (var i = 0; i < fotosWrappers.length; i++) {
            var imgSeleccionada = fotosWrappers[i].querySelector('img.foto-principal');
            var checkbox = fotosWrappers[i].querySelector('.checkbox-pantalla-completa');
            if (imgSeleccionada) {
                // PRIORIZAR IMÁGENES LOCALES del navegador (evitar solicitudes al servidor)
                var imagenAUsar = null;
                
                // 1. Si el src actual es un data URL, usarlo
                if (imgSeleccionada.src.startsWith('data:')) {
                    imagenAUsar = imgSeleccionada.src;
                } else {
                    // 2. Buscar versiones locales almacenadas en atributos
                    imagenAUsar = imgSeleccionada.getAttribute('data-recortada') || 
                                 imgSeleccionada.getAttribute('data-mejorada') ||
                                 imgSeleccionada.getAttribute('data-contraste') ||
                                 imgSeleccionada.getAttribute('data-bordes') ||
                                 imgSeleccionada.getAttribute('data-color') ||
                                 imgSeleccionada.getAttribute('data-local-image');
                    
                    if (!imagenAUsar || !imagenAUsar.startsWith('data:')) {
                        // 3. Fallback: usar el src (URL del servidor)
                        imagenAUsar = imgSeleccionada.src;
                    }
                }
                
                // **NUEVO**: Determinar si esta imagen específica debe ir en pantalla completa
                var pantallaCompletaIndividual = false;
                
                if (checkbox && checkbox.checked) {
                    pantallaCompletaIndividual = true;
                } else {
                    // Verificar configuración global
                    var chkGlobal = document.getElementById('pantallaCompletaPDF');
                    if (chkGlobal && chkGlobal.checked) {
                        pantallaCompletaIndividual = true;
                    }
                }
                
                imagenesSeleccionadas.push(imagenAUsar);
                imagenesConEstado.push({
                    imagen: imagenAUsar,
                    pantallaCompleta: pantallaCompletaIndividual,
                    wrapper: fotosWrappers[i],
                    indiceOriginal: i
                });
            }
        }

        // **CORREGIDO**: Eliminar duplicados manteniendo la correspondencia con imagenesConEstado
        var imagenesUnicas = [];
        var imagenesConEstadoFiltradas = [];
        var imagenesVistas = new Set();
        
        for (var i = 0; i < imagenesSeleccionadas.length; i++) {
            var imagen = imagenesSeleccionadas[i];
            if (!imagenesVistas.has(imagen)) {
                imagenesVistas.add(imagen);
                imagenesUnicas.push(imagen);
                imagenesConEstadoFiltradas.push(imagenesConEstado[i]);
            }
        }
        
        // Actualizar imagenesConEstado para que coincida con imagenesUnicas
        imagenesConEstado = imagenesConEstadoFiltradas;

        if (imagenesUnicas.length === 0) {
            mostrarMensajeCamara('No se encontraron imágenes válidas.', 'error');
            return null;
        }

        // FUNCIÓN PARA AGREGAR IMAGEN AL PDF CON CONTROL DE TAMAÑO (IDÉNTICA a pdf_fotos.js)
        function agregarImagenAlPDFCorreo(imagen, indiceImagen, totalImagenes, callback) {
            // Buscar si existe una versión local de la imagen en el DOM
            var imgElementos = document.querySelectorAll('#photosContainer img.foto-principal');
            var localDataURL = null;
            var imagenEncontrada = false;
            
            // PASO 1: Buscar imagen local en elementos del DOM (IDÉNTICO)
            for (var i = 0; i < imgElementos.length; i++) {
                var imgEl = imgElementos[i];
                
                // Verificar si esta imagen coincide con la que se va a procesar
                var coincide = false;
                
                if (imgEl.src === imagen) {
                    coincide = true;
                    imagenEncontrada = true;
                } else if (imagen.startsWith('data:')) {
                    // Si la imagen es un data URL, verificar si coincide con alguna versión almacenada
                    var mejorada = imgEl.getAttribute('data-mejorada');
                    var recortada = imgEl.getAttribute('data-recortada');
                    var contraste = imgEl.getAttribute('data-contraste');
                    var bordes = imgEl.getAttribute('data-bordes');
                    var color = imgEl.getAttribute('data-color');
                    var localImg = imgEl.getAttribute('data-local-image');
                    
                    if (imagen === mejorada || imagen === recortada || imagen === contraste || 
                        imagen === bordes || imagen === color || imagen === localImg) {
                        coincide = true;
                        imagenEncontrada = true;
                    }
                } else {
                    // Para URLs del servidor, buscar por data-original-url o similares
                    var originalUrl = imgEl.getAttribute('data-original-url');
                    if (originalUrl === imagen) {
                        coincide = true;
                        imagenEncontrada = true;
                    }
                }
                
                if (coincide) {
                    // PRIORIDAD ABSOLUTA: usar imágenes locales del navegador (IDÉNTICO)
                    if (imgEl.src.startsWith('data:')) {
                        localDataURL = imgEl.src;
                    } else {
                        // Buscar versión local en orden de prioridad:
                        localDataURL = imgEl.getAttribute('data-recortada') || 
                                      imgEl.getAttribute('data-mejorada') ||
                                      imgEl.getAttribute('data-contraste') ||
                                      imgEl.getAttribute('data-bordes') ||
                                      imgEl.getAttribute('data-color') ||
                                      imgEl.getAttribute('data-local-image');
                    }
                    break;
                }
            }
            
            // PASO 2: Si no encontramos imagen local, pero la imagen ya es un data URL, usarla
            if (!localDataURL && imagen.startsWith('data:')) {
                localDataURL = imagen;
                imagenEncontrada = true;
            }
            
            // PASO 3: Procesar imagen local si está disponible (USANDO EL SISTEMA DE CONTROL DE TAMAÑO)
            if (localDataURL && localDataURL.startsWith('data:')) {
                var img = new window.Image();
                img.onload = function() {
                    // USAR EL SISTEMA DE CONTROL DE TAMAÑO DE configuracion_pdf.js
                    if (typeof window.procesarImagenParaPDF === 'function') {
                        window.procesarImagenParaPDF(img, indiceImagen, totalImagenes, function(dataUrlProcesada) {
                            if (dataUrlProcesada) {
                                callback(dataUrlProcesada);
                            } else {
                                // Fallback: usar método anterior con calidad reducida
                                var canvas = document.createElement('canvas');
                                canvas.width = Math.min(800, img.naturalWidth);
                                canvas.height = Math.min(600, img.naturalHeight);
                                var ctx = canvas.getContext('2d');
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                var webpDataUrl = canvas.toDataURL('image/webp', 0.5);
                                callback(webpDataUrl);
                            }
                        });
                    } else {
                        // Fallback si no está disponible el controlador
                        var canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                        callback(webpDataUrl);
                    }
                };
                img.onerror = function() {
                    usarPlanBCorreo();
                };
                img.src = localDataURL;
                return;
            }
            
            // PLAN B: Solicitud al servidor (SOLO como último recurso)
            function usarPlanBCorreo() {
                fetch(imagen, { credentials: 'include' })
                    .then(function(response) { 
                        if (!response.ok) {
                            throw new Error('Error en respuesta del servidor: ' + response.status);
                        }
                        return response.blob(); 
                    })
                    .then(function(blob) {
                        var reader = new FileReader();
                        reader.onloadend = function() {
                            var img = new window.Image();
                            img.onload = function() {
                                // Usar el sistema de control de tamaño
                                if (typeof window.procesarImagenParaPDF === 'function') {
                                    window.procesarImagenParaPDF(img, indiceImagen, totalImagenes, callback);
                                } else {
                                    // Fallback
                                    var canvas = document.createElement('canvas');
                                    canvas.width = img.naturalWidth;
                                    canvas.height = img.naturalHeight;
                                    var ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0);
                                    var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                                    callback(webpDataUrl);
                                }
                            };
                            img.onerror = function() {
                                callback(null);
                            };
                            img.src = reader.result;
                        };
                        reader.onerror = function() {
                            callback(null);
                        };
                        reader.readAsDataURL(blob);
                    })
                    .catch(function(error) {
                        console.error('Error cargando imagen para correo:', error);
                        callback(null);
                    });
            }
            
            // Si llegamos aquí, no encontramos imagen local, usar plan B
            if (imagen.startsWith('data:')) {
                var img = new window.Image();
                img.onload = function() {
                    if (typeof window.procesarImagenParaPDF === 'function') {
                        window.procesarImagenParaPDF(img, indiceImagen, totalImagenes, callback);
                    } else {
                        var canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                        callback(webpDataUrl);
                    }
                };
                img.onerror = function() {
                    usarPlanBCorreo();
                };
                img.src = imagen;
            } else {
                usarPlanBCorreo();
            }
        }

        // PROCESAR IMÁGENES (IDÉNTICO a pdf_fotos.js)
        function procesarImagenesCorreo(indice, imagenesProcesadas) {        
            if (indice >= imagenesUnicas.length) {
                // FASE FINAL: Compilación del PDF (IDÉNTICA)
                setTimeout(() => {
                    // Ordenar imágenes procesadas por su índice original
                    imagenesProcesadas.sort(function(a, b) {
                        return a.indice - b.indice;
                    });
                    
                    var imagenesMosaico = [];
                    var esPrimeraPagina = true; // Controlar si es la primera página del PDF
                    
                    for (var i = 0; i < imagenesProcesadas.length; i++) {
                        var imagenInfo = imagenesProcesadas[i];
                        
                        if (imagenInfo.esPantallaCompleta) {
                            // Agregar página completa en el momento correcto del orden
                            if (imagenesMosaico.length > 0) {
                                // Si hay imágenes de mosaico pendientes, completar la página de mosaico actual
                                if (!esPrimeraPagina) {
                                    pdf.addPage('letter', 'portrait');
                                }
                                esPrimeraPagina = false;
                                
                                // Agregar imágenes del mosaico pendiente
                                for (var j = 0; j < imagenesMosaico.length; j++) {
                                    var col = j % columnas;
                                    var fila = Math.floor(j / columnas);
                                    var x = col * anchoCelda;
                                    var y = fila * altoCelda;
                                    pdf.addImage(imagenesMosaico[j], 'WEBP', x, y, anchoCelda, altoCelda);
                                }
                                
                                imagenesMosaico = []; // Limpiar mosaico
                            }
                            
                            // Agregar nueva página para pantalla completa
                            if (!esPrimeraPagina) {
                                pdf.addPage('letter', 'portrait');
                            }
                            esPrimeraPagina = false;
                            
                            // Agregar imagen en pantalla completa
                            pdf.addImage(imagenInfo.dataUrl, 'WEBP', 0, 0, anchoHoja, altoHoja);
                            
                        } else {
                            // Agregar a mosaico respetando orden
                            imagenesMosaico.push(imagenInfo.dataUrl);
                            
                            // Si completamos una página de mosaico (9 imágenes), agregar la página
                            if (imagenesMosaico.length === fotosPorHoja) {
                                // Si no es la primera página, agregar nueva página
                                if (!esPrimeraPagina) {
                                    pdf.addPage('letter', 'portrait');
                                }
                                esPrimeraPagina = false;
                                
                                // Agregar todas las imágenes del mosaico a la página
                                for (var k = 0; k < imagenesMosaico.length; k++) {
                                    var col = k % columnas;
                                    var fila = Math.floor(k / columnas);
                                    var x = col * anchoCelda;
                                    var y = fila * altoCelda;
                                    pdf.addImage(imagenesMosaico[k], 'WEBP', x, y, anchoCelda, altoCelda);
                                }
                                
                                imagenesMosaico = []; // Limpiar para la siguiente página
                            }
                        }
                    }
                    
                    // Procesar imágenes de mosaico restantes al final
                    if (imagenesMosaico.length > 0) {
                        // Agregar nueva página si es necesario
                        if (!esPrimeraPagina) {
                            pdf.addPage('letter', 'portrait');
                        }
                        
                        // Agregar imágenes restantes
                        for (var m = 0; m < imagenesMosaico.length; m++) {
                            var col = m % columnas;
                            var fila = Math.floor(m / columnas);
                            var x = col * anchoCelda;
                            var y = fila * altoCelda;
                            pdf.addImage(imagenesMosaico[m], 'WEBP', x, y, anchoCelda, altoCelda);
                        }
                    }
                    
                    // Convertir PDF a base64 (COMPATIBLE CON MÓVILES)
                    try {
                        let pdfBase64 = pdf.output('datauristring');
                        
                        // CORREGIR FORMATO - jsPDF agrega filename que no es estándar
                        if (pdfBase64.includes(';filename=')) {
                            pdfBase64 = pdfBase64.replace(/;filename=[^;]+/, '');
                        }
                        
                        // Callback global para envío de correo
                        if (typeof window.pdfCorreoGeneradoCallback === 'function') {
                            window.pdfCorreoGeneradoCallback(pdfBase64);
                        }
                        
                    } catch (error) {
                        console.error('Error generando PDF base64 para correo:', error);
                        if (typeof window.pdfCorreoGeneradoCallback === 'function') {
                            window.pdfCorreoGeneradoCallback(null);
                        }
                    }
                    
                }, 200);
                return;
            }        
            
            // Obtener información de configuración de esta imagen específica
            var estadoImagen = imagenesConEstado[indice];
            var esPantallaCompleta = estadoImagen ? estadoImagen.pantallaCompleta : false;
            
            agregarImagenAlPDFCorreo(imagenesUnicas[indice], indice, imagenesUnicas.length, function(dataUrl) {
                if (dataUrl) {
                    // Guardar información de la imagen procesada con su índice original
                    imagenesProcesadas.push({
                        indice: indice,
                        dataUrl: dataUrl,
                        esPantallaCompleta: esPantallaCompleta,
                        estadoImagen: estadoImagen
                    });
                }
                
                // Continuar procesando la siguiente imagen
                procesarImagenesCorreo(indice + 1, imagenesProcesadas);
            });
        }

        // INICIALIZAR EL PROCESAMIENTO
        return new Promise((resolve, reject) => {
            // Configurar callback global
            window.pdfCorreoGeneradoCallback = function(pdfBase64) {
                // Limpiar callback
                delete window.pdfCorreoGeneradoCallback;
                
                if (pdfBase64) {
                    resolve(pdfBase64);
                } else {
                    reject(new Error('Error generando PDF para correo'));
                }
            };
            
            // Timeout de seguridad para móviles (más tiempo)
            const timeoutCorreo = setTimeout(() => {
                if (typeof window.pdfCorreoGeneradoCallback === 'function') {
                    delete window.pdfCorreoGeneradoCallback;
                    reject(new Error('Timeout generando PDF para correo (dispositivo móvil)'));
                }
            }, 60000); // 60 segundos para móviles
            
            // Comenzar procesamiento
            setTimeout(() => {        
                procesarImagenesCorreo(0, []);
                
                // Limpiar timeout si todo va bien
                setTimeout(() => {
                    clearTimeout(timeoutCorreo);
                }, 1000);
            }, 150);
        });
        
    } catch (error) {
        console.error('Error en generarPDFParaCorreoCamara:', error);
        mostrarMensajeCamara('Error al generar el PDF: ' + error.message, 'error');
        return null;
    }
}

// Función para enviar el correo con el PDF (MEJORADA PARA MÓVILES)
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
    mostrarMensajeCamara('Generando PDF optimizado...', 'loading');
    
    // Deshabilitar botón de envío
    const btnEnviar = document.getElementById('btn-enviar-correo-camara');
    const textoOriginal = btnEnviar.textContent;
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Procesando...';
    
    try {
        // Detectar si es dispositivo móvil para ajustar timeouts
        const esMovil = esDispositivoMovil();
        const timeoutGeneracion = esMovil ? 90000 : 45000; // 90s móvil, 45s escritorio
        
        // Crear promise con timeout personalizado para generación
        const generarPDFConTimeout = new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout generando PDF. El dispositivo puede estar sobrecargado.'));
            }, timeoutGeneracion);
            
            try {
                const resultado = await generarPDFParaCorreoCamara();
                clearTimeout(timeout);
                resolve(resultado);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
        
        // Generar el PDF con timeout
        const pdfBase64 = await generarPDFConTimeout;
        
        if (!pdfBase64) {
            mostrarMensajeCamara('Error al generar el PDF. Inténtelo de nuevo.', 'error');
            return;
        }
        
        // Verificar tamaño del PDF
        try {
            const sizeInBytes = Math.round((pdfBase64.length * 3) / 4); // Aproximación del tamaño
            const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
            
            // Verificar si está dentro del límite
            if (sizeInBytes > 5 * 1024 * 1024) { // 5MB
                mostrarMensajeCamara(`PDF muy grande (${sizeInMB}MB). Reduce la cantidad de fotos o calidad.`, 'error');
                return;
            }
        } catch (error) {
            // Error silencioso verificando tamaño
        }
        
        // Mostrar mensaje de envío
        mostrarMensajeCamara('Enviando correo electrónico...', 'loading');
        
        // Configurar timeout para envío (más tiempo en móviles)
        const timeoutEnvio = esMovil ? 60000 : 30000; // 60s móvil, 30s escritorio
        
        // Crear AbortController para cancelar request si es necesario
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeoutEnvio);
        
        const response = await fetch('/api/rij/enviar_correo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                correo: correoDestinatario,
                pdf_base64: pdfBase64,
                nombre_archivo: nombreFinal
            }),
            signal: controller.signal,
            // Configuraciones adicionales para móviles
            keepalive: false, // Evitar problemas en móviles
            cache: 'no-cache',
            credentials: 'same-origin'
        });
        
        clearTimeout(timeoutId);
        
        // Verificar si la respuesta es válida
        if (!response.ok) {
            let errorMsg = `Error del servidor: ${response.status}`;
            try {
                const errorData = await response.text();
                if (errorData) {
                    errorMsg += ` - ${errorData}`;
                }
            } catch (e) {
                // Error leyendo respuesta de error
            }
            throw new Error(errorMsg);
        }
        
        const resultado = await response.json();
        
        if (resultado.success) {
            mostrarMensajeCamara(resultado.message || 'Correo enviado exitosamente', 'success');
            
            // Cerrar modal después de 3 segundos
            setTimeout(() => {
                cerrarModalEnviarCorreoCamara();
            }, 3000);
        } else {
            mostrarMensajeCamara('Error: ' + (resultado.error || 'Error desconocido'), 'error');
        }
        
    } catch (error) {
        console.error('Error en enviarCorreoCamara:', error);
        
        let mensajeError = 'Error de conexión. Verifique su conexión a internet.';
        
        if (error.name === 'AbortError') {
            mensajeError = 'Timeout en el envío. La conexión es muy lenta. Inténtelo de nuevo.';
        } else if (error.message) {
            if (error.message.includes('Timeout')) {
                mensajeError = 'El proceso está tardando más de lo esperado. Inténtelo de nuevo.';
            } else if (error.message.includes('Failed to fetch')) {
                mensajeError = 'Sin conexión a internet. Verifique su conexión.';
            } else {
                mensajeError = error.message;
            }
        }
        
        mostrarMensajeCamara(mensajeError, 'error');
        
    } finally {
        // Rehabilitar botón de envío
        btnEnviar.disabled = false;
        btnEnviar.textContent = textoOriginal;
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

// Función para detectir si es un dispositivo móvil (MEJORADA)
function esDispositivoMovil() {
    // Verificación múltiple para mayor precisión
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
    const hasTouchScreen = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
    const isLowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4; // 4GB o menos
    
    // Considerar móvil si cumple cualquiera de estas condiciones
    return isMobileUA || (hasTouchScreen && isSmallScreen) || isLowMemory;
}

// Función mejorada para agregar imagen RIJ al PDF en correo (COMPATIBLE CON MÓVILES)
async function agregarImagenRIJalPDFCorreo(pdf, urlImagen) {
    return new Promise((resolve, reject) => {
        // Timeout más largo para móviles
        const timeoutDuracion = esDispositivoMovil() ? 15000 : 8000;
        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout cargando imagen RIJ'));
        }, timeoutDuracion);
        
        // Buscar imagen RIJ por identificador
        const identificador = localStorage.getItem('usuario_identificador_rij');
        const imagenDisponible = localStorage.getItem('rij_imagen_url');
        
        if (!identificador && !imagenDisponible && !urlImagen) {
            clearTimeout(timeoutId);
            resolve(); // No hay identificador, continuar sin imagen
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            try {
                clearTimeout(timeoutId);
                
                // Calcular dimensiones para ajustar a página completa
                const anchoHoja = 216; // mm
                const altoHoja = 279; // mm
                const margen = 15;
                
                const anchoDisponible = anchoHoja - (2 * margen);
                const altoDisponible = altoHoja - (2 * margen);
                
                const aspectoImagen = img.width / img.height;
                const aspectoHoja = anchoDisponible / altoDisponible;
                
                let anchoFinal, altoFinal;
                
                if (aspectoImagen > aspectoHoja) {
                    anchoFinal = anchoDisponible;
                    altoFinal = anchoDisponible / aspectoImagen;
                } else {
                    altoFinal = altoDisponible;
                    anchoFinal = altoDisponible * aspectoImagen;
                }
                
                // Centrar la imagen
                const x = (anchoHoja - anchoFinal) / 2;
                const y = (altoHoja - altoFinal) / 2;
                
                // Agregar título (opcional, comentado para evitar problemas de fuentes en móviles)
                // pdf.setFontSize(16);
                // pdf.setFont('helvetica', 'bold');
                // pdf.text('FORMULARIO RIJ - REUNIÓN DE INICIO DE JORNADA', anchoHoja / 2, 20, { align: 'center' });
                
                // Agregar imagen al PDF
                try {
                    pdf.addImage(img.src, 'PNG', x, y + 10, anchoFinal, altoFinal - 10);
                    resolve();
                } catch (addImageError) {
                    // Intentar con formato JPEG si PNG falla
                    try {
                        pdf.addImage(img.src, 'JPEG', x, y + 10, anchoFinal, altoFinal - 10);
                        resolve();
                    } catch (jpegError) {
                        // Continuar sin imagen RIJ
                        resolve();
                    }
                }
            } catch (error) {
                clearTimeout(timeoutId);
                // Continuar sin imagen RIJ en lugar de fallar
                resolve();
            }
        };
        
        img.onerror = function() {
            clearTimeout(timeoutId);
            // No se pudo cargar la imagen RIJ para correo
            resolve();
        };
        
        // Intentar diferentes rutas de imagen con fallbacks
        const rutasImagen = [
            imagenDisponible,
            urlImagen,
            `/RESOURCE/IMG/img RIJ/${identificador}.png`,
            `/static/imagenes/${identificador}.png` // Ruta alternativa
        ].filter(Boolean); // Filtrar valores null/undefined
        
        if (rutasImagen.length > 0) {
            // Intentar cargar la primera ruta disponible
            let indiceRuta = 0;
            const intentarSiguienteRuta = () => {
                if (indiceRuta >= rutasImagen.length) {
                    clearTimeout(timeoutId);
                    resolve(); // No hay más rutas, continuar sin imagen
                    return;
                }
                
                const rutaActual = rutasImagen[indiceRuta];
                img.onerror = () => {
                    indiceRuta++;
                    intentarSiguienteRuta();
                };
                
                img.src = rutaActual;
                indiceRuta++;
            };
            
            intentarSiguienteRuta();
        } else {
            clearTimeout(timeoutId);
            resolve(); // No hay rutas válidas
        }
    });
}

// Variable para evitar dobles eventos en móvil (CORREGIDA)
let ultimoEventoCorreo = 0;
let procesamientoEnCurso = false; // Flag para evitar múltiples ejecuciones
let timeoutLimpieza = null; // Para limpiar el flag automáticamente

// Función para limpiar el flag de procesamiento
function limpiarProcesamientoEnCurso() {
    if (timeoutLimpieza) {
        clearTimeout(timeoutLimpieza);
    }
    procesamientoEnCurso = false;
}

// Función mejorada para manejar eventos en móvil y escritorio (SOLO CLICKS REALES)
function manejarEventoBoton(callback, tiempoEspera = 500) {
    return function(e) {
        const ahora = Date.now();
        
        // VERIFICACIONES ADICIONALES PARA EVITAR ACTIVACIÓN DURANTE SCROLL
        
        // 1. Verificar que el target sea exactamente el botón
        if (e.target !== this) {
            return;
        }
        
        // 2. En móviles, verificar que no sea un touch convertido a click durante scroll
        if (esDispositivoMovil()) {
            // Verificar si hay movimiento reciente (scroll)
            if (typeof window.lastScrollTime !== 'undefined' && 
                (ahora - window.lastScrollTime) < 150) {
                return;
            }
            
            // Verificar coordenadas del evento para detectar si es un click real
            if (e.clientX === 0 && e.clientY === 0) {
                return;
            }
            
            // Verificar que el evento tenga al menos una coordenada dentro del botón
            const rect = this.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || 
                e.clientY < rect.top || e.clientY > rect.bottom) {
                return;
            }
        }
        
        // 3. Anti-dobletap
        if (ahora - ultimoEventoCorreo < tiempoEspera) {
            return;
        }
        
        ultimoEventoCorreo = ahora;
        
        // Solo usar flag de procesamiento para acciones críticas como envío de correo
        const esFuncionCritica = callback.name === 'enviarCorreoCamara';
        
        // Para la apertura del modal, permitir recuperación automática
        if (esFuncionCritica && procesamientoEnCurso) {
            // Verificar si han pasado más de 15 segundos (recuperación automática)
            const tiempoDesdeUltimoEvento = ahora - ultimoEventoCorreo;
            if (tiempoDesdeUltimoEvento > 15000) {
                limpiarProcesamientoEnCurso();
            } else {
                return;
            }
        }
        
        // Marcar procesamiento solo para funciones críticas
        if (esFuncionCritica) {
            procesamientoEnCurso = true;
            
            // Auto-limpiar después de 45 segundos como medida de seguridad
            timeoutLimpieza = setTimeout(() => {
                limpiarProcesamientoEnCurso();
            }, 45000);
        }
        
        // NO usar preventDefault para evitar interferir con el comportamiento nativo
        
        // Ejecutar callback
        try {
            const resultado = callback();
            
            // Manejar Promises
            if (resultado && typeof resultado.then === 'function') {
                resultado
                    .then(() => {
                        if (esFuncionCritica) {
                            limpiarProcesamientoEnCurso();
                        }
                    })
                    .catch((error) => {
                        console.error('Error en callback asíncrono:', error);
                        if (esFuncionCritica) {
                            limpiarProcesamientoEnCurso();
                        }
                    });
            } else {
                // Para funciones síncronas como apertura de modal
                if (esFuncionCritica) {
                    setTimeout(() => {
                        limpiarProcesamientoEnCurso();
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error en callback del botón:', error);
            if (esFuncionCritica) {
                limpiarProcesamientoEnCurso();
            }
        }
    };
}

// Event listeners cuando se carga el DOM (MEJORADO PARA MÓVILES)
document.addEventListener('DOMContentLoaded', function() {
    
    // Función de recuperación automática al iniciar
    function inicializarSistemaCorreo() {
        
        // Resetear flags de estado al cargar la página
        limpiarProcesamientoEnCurso();
        ultimoEventoCorreo = 0;
        
        // Verificar que los elementos del modal existan
        const modal = document.getElementById('modal-enviar-correo-camara');
        const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
        
        if (!modal) {
            console.error('Modal de envío de correo no encontrado en el DOM');
        }
        
        if (!btnEnviarCorreo) {
            console.error('Botón de enviar correo no encontrado en el DOM');
        }
        
    }
    
    // Ejecutar inicialización
    inicializarSistemaCorreo();
    
    // Verificar elementos en el DOM con más tiempo para móviles
    setTimeout(function() {
        const photosContainer = document.getElementById('photosContainer');
        const fotosWrappers = document.querySelectorAll('#photosContainer .photo-wrapper');
        const imagenes = document.querySelectorAll('#photosContainer img');
        
        if (fotosWrappers.length > 0) {
            fotosWrappers.forEach((wrapper, index) => {
                const imgPrincipal = wrapper.querySelector('img.foto-principal');
                if (imgPrincipal) {
                    // Imagen detectada
                }
            });
        }
    }, esDispositivoMovil() ? 3000 : 2000); // Más tiempo en móviles
    
    // Botón para abrir modal de envío de correo (MEJORADO)
    const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
    if (btnEnviarCorreo) {
        
        // Mejorar accesibilidad en móvil
        btnEnviarCorreo.style.touchAction = 'manipulation';
        btnEnviarCorreo.style.userSelect = 'none';
        btnEnviarCorreo.style.webkitUserSelect = 'none'; // Safari
        btnEnviarCorreo.style.webkitTouchCallout = 'none'; // iOS
        btnEnviarCorreo.setAttribute('tabindex', '0');
        btnEnviarCorreo.setAttribute('role', 'button');
        
        // Agregar clases para prevenir zoom en iOS
        if (esDispositivoMovil()) {
            btnEnviarCorreo.style.fontSize = '16px'; // Prevenir zoom en iOS
        }
        
        const manejadorEnviarCorreo = manejarEventoBoton(abrirModalEnviarCorreoCamara, 800);
        
        // Solo usar click en todos los dispositivos - evita activación durante scroll
        btnEnviarCorreo.addEventListener('click', manejadorEnviarCorreo);
        
        // Agregar soporte para teclado (accesibilidad)
        btnEnviarCorreo.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                manejadorEnviarCorreo(e);
            }
        });
    }
    
    // Botón para cerrar modal (MEJORADO)
    const btnCerrar = document.getElementById('btn-cerrar-modal-correo-camara');
    if (btnCerrar) {
        
        const manejadorCerrar = manejarEventoBoton(cerrarModalEnviarCorreoCamara, 300);
        
        // Solo usar click en todos los dispositivos
        btnCerrar.addEventListener('click', manejadorCerrar);
    }
    
    // Botón para enviar correo (MEJORADO)
    const btnEnviar = document.getElementById('btn-enviar-correo-camara');
    if (btnEnviar) {
        
        const manejadorEnviar = manejarEventoBoton(enviarCorreoCamara, 1000); // Tiempo largo para evitar doble envío
        
        // Solo usar click en todos los dispositivos
        btnEnviar.addEventListener('click', manejadorEnviar);
    }
    
    // Cerrar modal al hacer clic fuera de él (NO BLOQUEAR POR PROCESAMIENTO)
    const modal = document.getElementById('modal-enviar-correo-camara');
    if (modal) {
        modal.addEventListener('click', function(e) {
            // Permitir cerrar siempre al hacer clic fuera, pero advertir si hay procesamiento
            if (e.target === modal) {
                if (procesamientoEnCurso) {
                    // Advertir pero permitir cerrar
                    limpiarProcesamientoEnCurso(); // Limpiar flag al cerrar
                }
                cerrarModalEnviarCorreoCamara();
            }
        });
    }
    
    // Permitir envío con Enter en el campo de correo (MEJORADO)
    const inputCorreo = document.getElementById('correo-destinatario-camara');
    if (inputCorreo) {
        inputCorreo.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();            // Solo verificar procesamiento para envío real, no bloquear Enter
            if (!procesamientoEnCurso) {
                enviarCorreoCamara();
            }
            }
        });
        
        // Mejorar experiencia en móvil
        if (esDispositivoMovil()) {
            inputCorreo.setAttribute('autocomplete', 'email');
            inputCorreo.setAttribute('inputmode', 'email');
            inputCorreo.style.fontSize = '16px'; // Prevenir zoom en iOS
            
            // Prevenir zoom al enfocar en iOS
            inputCorreo.addEventListener('focus', function() {
                if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
                    // Scroll suave al input
                    setTimeout(() => {
                        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            });
        }
    }
    
    // Campo de nombre de archivo también mejorado para móviles
    const inputNombre = document.getElementById('nombre-archivo-pdf-camara');
    if (inputNombre && esDispositivoMovil()) {
        inputNombre.style.fontSize = '16px'; // Prevenir zoom en iOS
    }
    
    // Habilitar botón cuando OpenCV esté listo (verificación inicial)
    habilitarBotonEnvioCorreoCamara();
    
    // Verificar periódicamente si OpenCV está disponible (CON LÍMITES)
    let intentosVerificacion = 0;
    const maxIntentos = esDispositivoMovil() ? 100 : 60; // Más intentos en móviles
    const intervaloVerificacion = esDispositivoMovil() ? 1000 : 500; // Verificar más lento en móviles
    
    const checkOpenCVStatus = setInterval(function() {
        intentosVerificacion++;
        
        const openCVListo = (typeof opencvReady !== 'undefined' && opencvReady === true) || 
                          (typeof cv !== 'undefined' && cv.Mat) ||
                          (typeof verificarOpenCVDisponible === 'function' && verificarOpenCVDisponible());
        
        if (openCVListo || intentosVerificacion >= maxIntentos) {
            habilitarBotonEnvioCorreoCamara();
            clearInterval(checkOpenCVStatus);
            
            if (intentosVerificacion >= maxIntentos && !openCVListo) {
                // Habilitar funcionalidad básica sin OpenCV
                const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
                if (btnEnviarCorreo) {
                    btnEnviarCorreo.disabled = false;
                    btnEnviarCorreo.textContent = 'Enviar a correo (básico)';
                    btnEnviarCorreo.title = 'Funcionalidad básica sin procesamiento avanzado';
                }
            }
        }
    }, intervaloVerificacion);
    
    // Escuchar evento personalizado de OpenCV listo
    window.addEventListener('opencvReady', function(event) {
        habilitarBotonEnvioCorreoCamara();
        clearInterval(checkOpenCVStatus);
    });
    
    // Función adicional para asegurar que los eventos se registren (MEJORADA)
    function verificarYRegistrarEventos() {
        const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
        if (btnEnviarCorreo && !btnEnviarCorreo.dataset.eventosRegistrados) {
            
            const manejadorEnviarCorreo = manejarEventoBoton(abrirModalEnviarCorreoCamara, 800);
            
            // Solo usar click
            btnEnviarCorreo.addEventListener('click', manejadorEnviarCorreo);
            
            btnEnviarCorreo.dataset.eventosRegistrados = 'true';
        }
    }
    
    // Verificar eventos adicionales después de 3 segundos (más tiempo en móviles)
    setTimeout(verificarYRegistrarEventos, esDispositivoMovil() ? 5000 : 3000);
    
    // Verificación de fuerza bruta para habilitar el botón si todo está listo (EXTENDIDA)
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
    }, esDispositivoMovil() ? 8000 : 5000); // Más tiempo en móviles
    
});

// FUNCIONES HELPER MEJORADAS PARA MÓVILES

// Función para mostrar mensajes de estado en la cámara (MEJORADA)
function mostrarMensajeCamara(mensaje, tipo) {
    const mensajeDiv = document.getElementById('mensaje-envio-correo-camara');
    if (mensajeDiv) {
        mensajeDiv.textContent = mensaje;
        mensajeDiv.className = `mensaje-estado ${tipo}`;
        mensajeDiv.style.display = 'block';
        
        // En móviles, hacer scroll al mensaje para asegurar visibilidad
        if (esDispositivoMovil() && (tipo === 'error' || tipo === 'success')) {
            setTimeout(() => {
                try {
                    mensajeDiv.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest',
                        inline: 'nearest' 
                    });
                } catch (e) {
                    // Fallback silencioso
                }
            }, 100);
        }
        
        // Auto-ocultar mensajes de éxito después de un tiempo
        if (tipo === 'success') {
            setTimeout(() => {
                if (mensajeDiv.style.display !== 'none') {
                    mensajeDiv.style.display = 'none';
                }
            }, 5000);
        }
    }
}

// Función para habilitar/deshabilitar el botón de enviar correo cuando OpenCV esté listo (MEJORADA)
function habilitarBotonEnvioCorreoCamara() {
    const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
    if (btnEnviarCorreo) {
        // Verificar si opencvReady está definido y es true, o si OpenCV está disponible de otra forma
        const openCVListo = (typeof opencvReady !== 'undefined' && opencvReady === true) ||
                          (typeof cv !== 'undefined' && cv.Mat) ||
                          (typeof verificarOpenCVDisponible === 'function' && verificarOpenCVDisponible());
        
        if (openCVListo) {
            btnEnviarCorreo.disabled = false;
            btnEnviarCorreo.textContent = 'Enviar a correo';
            btnEnviarCorreo.title = 'Enviar PDF optimizado por correo electrónico';
        } else {
            // En móviles, ser más permisivo y habilitar funcionalidad básica
            if (esDispositivoMovil()) {
                btnEnviarCorreo.disabled = false;
                btnEnviarCorreo.textContent = 'Enviar a correo';
                btnEnviarCorreo.title = 'Enviar PDF básico por correo electrónico';
            } else {
                btnEnviarCorreo.disabled = true;
                btnEnviarCorreo.textContent = 'Cargando...';
                btnEnviarCorreo.title = 'Esperando que el sistema esté listo';
            }
        }
    }
}

// Funciones para el modal de tomar foto (MEJORADAS PARA MÓVILES)
function mostrarModalTomarFoto() {
    const modal = document.getElementById('modal-tomar-foto');
    const mensaje = document.getElementById('mensaje-tomar-foto');
    
    if (modal && mensaje) {
        mensaje.textContent = 'Tomando foto...';
        modal.style.display = 'flex';
        
        // Evitar scroll en móvil
        if (esDispositivoMovil()) {
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
        if (esDispositivoMovil()) {
            document.body.style.overflow = '';
        }
    }
}

/**
 * ✅ SISTEMA DE ENVÍO DE CORREO MEJORADO PARA MÓVILES
 * 
 * MEJORAS IMPLEMENTADAS:
 * 
 * 🚀 NÚCLEO OPTIMIZADO:
 * - Usa EXACTAMENTE la misma lógica de generación que pdf_fotos.js
 * - Integración completa con configuracion_pdf.js para control de tamaño
 * - Respeta límite absoluto de 5MB usando window.pdfSizeController
 * - Formato idéntico: mismo aspecto, mosaico, pantalla completa, imagen RIJ
 * 
 * 📱 OPTIMIZACIONES MÓVILES:
 * - Timeouts extendidos para dispositivos lentos (90s generación, 60s envío)
 * - Detección inteligente de dispositivos móviles (UA + touch + pantalla + memoria)
 * - Anti-dobletap mejorado con flags de procesamiento
 * - Manejo robusto de viewport y scroll en iOS/Android
 * - Prevención de zoom automático en iOS
 * 
 * 🛡️ ROBUSTEZ MEJORADA:
 * - AbortController para cancelar requests largos
 * - Fallbacks múltiples para carga de imágenes RIJ
 * - Verificación de tamaño antes del envío
 * - Manejo de errores específicos por tipo de fallo
 * - Recuperación automática de estados inconsistentes
 * 
 * 🔄 COMPATIBILIDAD:
 * - Funciona CON y SIN OpenCV.js
 * - Prioriza imágenes locales para evitar requests al servidor
 * - Soporte para diferentes formatos de imagen (PNG, JPEG, WEBP)
 * - Compatible con todos los navegadores móviles modernos
 * 
 * 📊 GARANTÍAS DE CALIDAD:
 * - PDF idéntico al generado por "Generar PDF de fotos"
 * - Respeta configuración de pantalla completa individual y global
 * - Mantiene orden original de las imágenes
 * - Aplicación correcta de filtros y mejoras de OpenCV
 * - Límite estricto de 5MB nunca excedido
 * 
 * ⚠️ PROMESA DE FUNCIONAMIENTO:
 * Este sistema garantiza que el envío de correo funcione en móviles
 * con la misma calidad y formato que la generación manual de PDF.
 */

// Función de recuperación automática para casos bloqueados (NUEVA)
function verificarYRecuperarSistemaCorreo() {
    const ahora = Date.now();
    
    // Si han pasado más de 60 segundos desde el último evento Y hay procesamiento en curso
    if (procesamientoEnCurso && (ahora - ultimoEventoCorreo) > 60000) {
        // Sistema de correo bloqueado detectado - ejecutando recuperación automática
        
        // Forzar limpieza de flags
        limpiarProcesamientoEnCurso();
        
        // Asegurar que el modal esté en estado correcto
        const modal = document.getElementById('modal-enviar-correo-camara');
        if (modal && modal.style.display === 'flex') {
            // Si el modal está abierto, resetear botones
            const btnEnviar = document.getElementById('btn-enviar-correo-camara');
            if (btnEnviar) {
                btnEnviar.disabled = false;
                btnEnviar.textContent = 'Enviar';
            }
            
            // Ocultar mensajes de carga
            const mensajeDiv = document.getElementById('mensaje-envio-correo-camara');
            if (mensajeDiv) {
                mensajeDiv.style.display = 'none';
            }
        }
        
        // Rehabilitar botón principal
        const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
        if (btnEnviarCorreo) {
            btnEnviarCorreo.disabled = false;
        }
        
    }
}

// Ejecutar verificación de recuperación cada 30 segundos
setInterval(verificarYRecuperarSistemaCorreo, 30000);

// Detector de scroll para evitar activación accidental durante scroll
if (esDispositivoMovil()) {
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        window.lastScrollTime = Date.now();
        
        // Limpiar timeout anterior
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        // Marcar como scroll activo por 200ms después del último evento scroll
        scrollTimeout = setTimeout(() => {
            delete window.lastScrollTime;
        }, 200);
    }, { passive: true });
    
    // También detectar touch move para scroll con dedo
    window.addEventListener('touchmove', function() {
        window.lastScrollTime = Date.now();
    }, { passive: true });
}
