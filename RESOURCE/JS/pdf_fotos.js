let opencvReady = false; // Variable global para controlar la carga de OpenCV


function verificarOpenCVDisponible() {
    return typeof cv !== 'undefined' && cv.Mat && typeof cv.Mat === 'function';
}

// Inicializar OpenCV cuando esté disponible
function inicializarOpenCV() {
    if (verificarOpenCVDisponible()) {
        opencvReady = true;
        console.log('✅ OpenCV.js está listo en pdf_fotos.js');
        
        // Habilitar botones
        const btn = document.getElementById('btnGenerarPDF');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Generar PDF de fotos';
        }
        
        // Notificar al sistema de envío de correo
        if (typeof habilitarBotonEnvioCorreoCamara === 'function') {
            habilitarBotonEnvioCorreoCamara();
        }
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('opencvReady', { detail: { ready: true } }));
        
        return;
    }
    
    // Si no está disponible, intentar configurar el callback
    if (typeof cv !== 'undefined' && cv.onRuntimeInitialized !== undefined) {
        cv.onRuntimeInitialized = function() {
            inicializarOpenCV();
        };
    } else {
        // Reintentar después de un breve retardo
        setTimeout(inicializarOpenCV, 100);
    }
}

// Inicializar cuando el script se carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarOpenCV);
} else {
    inicializarOpenCV();
}

// También escuchar el evento personalizado del loader de OpenCV
window.addEventListener('opencvReady', function() {
    if (!opencvReady) {
        inicializarOpenCV();
    }
});

// CÓDIGO LEGACY - Mantener compatibilidad con el sistema anterior
// Esto garantiza que todas las funciones de `cv` (como `cv.imread`) estén disponibles.
if (typeof cv !== 'undefined') {
    cv.onRuntimeInitialized = function() {
        opencvReady = true;
        // Habilitar el botón de generar PDF una vez que OpenCV.js esté listo
        const btn = document.getElementById('btnGenerarPDF');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Generar PDF de fotos'; // Restaurar texto si se cambió
        }
        
        // Notificar al sistema de envío de correo que OpenCV está listo
        if (typeof habilitarBotonEnvioCorreoCamara === 'function') {
            habilitarBotonEnvioCorreoCamara();
        }
        
        // Disparar evento personalizado para notificar que OpenCV está listo
        window.dispatchEvent(new CustomEvent('opencvReady', { detail: { ready: true } }));
    };
} else {
    window.addEventListener('DOMContentLoaded', function() {
        function checkOpenCVLoaded() {
            if (typeof cv !== 'undefined' && cv.onRuntimeInitialized) {
                cv.onRuntimeInitialized = function() {
                    opencvReady = true;
                    const btn = document.getElementById('btnGenerarPDF');
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = 'Generar PDF de fotos';
                    }
                    
                    // Notificar al sistema de envío de correo que OpenCV está listo
                    if (typeof habilitarBotonEnvioCorreoCamara === 'function') {
                        habilitarBotonEnvioCorreoCamara();
                    }
                    
                    // Disparar evento personalizado
                    window.dispatchEvent(new CustomEvent('opencvReady', { detail: { ready: true } }));
                };
            } else {
                // Si aún no está, reintentar tras un pequeño retardo
                setTimeout(checkOpenCVLoaded, 100);
            }
        }
        checkOpenCVLoaded();
    });
}

/** para openCV
 * Aplicar un filtro avanzado para mejorar la calidad de fotos de documentos utilizando OpenCV.js.
 * Buscar mejor contraste, fondo más blanco, texto más visible y eliminar ruido.
 * Preservar colores si es necesario, pero la binarización adaptativa es en escala de grises para máxima legibilidad.
 * @param {HTMLImageElement} img - La imagen a procesar.
 * @param {number} calidad - Calidad de la imagen de salida (0.0 a 1.0).
 * @param {number} maxLado - El lado máximo (ancho o alto) de la imagen procesada.
 * @param {function(string):void} callback - Función de retorno que recibe la imagen como Data URL.
 */
function aplicarFiltroDocumento(img, calidad, maxLado, callback) {
    if (!opencvReady || !verificarOpenCVDisponible()) {
        console.warn('OpenCV.js no está disponible, usando imagen original');
        // En lugar de mostrar error, usar la imagen original
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular dimensiones manteniendo el ratio
        const ratio = img.naturalWidth / img.naturalHeight;
        let nuevoAncho, nuevoAlto;
        
        if (img.naturalWidth > img.naturalHeight) {
            nuevoAncho = Math.min(maxLado, img.naturalWidth);
            nuevoAlto = nuevoAncho / ratio;
        } else {
            nuevoAlto = Math.min(maxLado, img.naturalHeight);
            nuevoAncho = nuevoAlto * ratio;
        }
        
        canvas.width = nuevoAncho;
        canvas.height = nuevoAlto;
        ctx.drawImage(img, 0, 0, nuevoAncho, nuevoAlto);
        
        callback(canvas.toDataURL('image/jpeg', calidad));
        return;
    }

    // Calcular las nuevas dimensiones manteniendo el ratio
    const ratio = img.naturalWidth / img.naturalHeight;
    let nuevoAncho, nuevoAlto;

    if (ratio > 1) { // Horizontal
        nuevoAncho = Math.min(maxLado, img.naturalWidth);
        nuevoAlto = nuevoAncho / ratio;
    } else { // Vertical o Cuadrado
        nuevoAlto = Math.min(maxLado, img.naturalHeight);
        nuevoAncho = nuevoAlto * ratio;
    }

    // Crear un canvas temporal para cargar la imagen en OpenCV.js
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.round(nuevoAncho);
    tempCanvas.height = Math.round(nuevoAlto);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

    // Convertir el canvas a una matriz (Mat) de OpenCV
    let src = cv.imread(tempCanvas);
    let dst = new cv.Mat(); // Crear matriz de destino para el resultado
    let finalDst = null; // Inicializar finalDst a null

    try {
        // --- PROCESAR imagen con OpenCV.js ---

        // 1. Convertir a escala de grises
        // Para binarizar y mejorar contraste de documentos, convertir a escala de grises
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
        src.delete(); // Liberar memoria de src

        // 2. Reducir ruido con filtro Gaussiano
        // Suavizar imagen para eliminar ruido sin perder detalle
        cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

        // 3. Binarizar adaptativamente
        // Lograr fondo blanco y texto negro puro, incluso con iluminación desigual
        cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

        // 4. (Opcional) Invertir si el documento es texto claro sobre fondo oscuro
        // cv.bitwise_not(dst, dst);

        // 5. (Opcional) Realizar operaciones morfológicas para limpiar ruido fino o rellenar huecos
        // let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        // cv.erode(dst, dst, kernel); // Eliminar pequeños puntos blancos de ruido
        // cv.dilate(dst, dst, kernel); // Rellenar pequeños huecos en el texto
        // kernel.delete(); // Liberar memoria del kernel

        // Convertir la imagen procesada (ahora en escala de grises/binaria) a RGBA para exportar
        finalDst = new cv.Mat(); // Asignar a la variable declarada fuera del try
        cv.cvtColor(dst, finalDst, cv.COLOR_GRAY2RGBA, 0);

        // Crear un canvas para el resultado final y dibujar la imagen
        const resultCanvas = document.createElement('canvas');
        cv.imshow(resultCanvas, finalDst); // Dibujar la Mat de OpenCV en el canvas

        // Convertir el canvas a Blob y luego a Data URL
        resultCanvas.toBlob(function(blob) {
            const reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            };
            reader.readAsDataURL(blob);
        }, 'image/webp', calidad);

    } catch (e) {
        showMessage("Error al procesar la imagen con OpenCV.js: " + e.message + ". Se usará la imagen original.");
        // En caso de error, devolver la imagen original para que el PDF no falle completamente
        if (img && img.toDataURL) {
            callback(img.toDataURL('image/webp', calidad));
        } else {
            // Si no es posible, devolver null
            callback(null);
        }
    } finally {
        // Liberar memoria SOLO si las instancias existen y no han sido eliminadas
        if (src && typeof src.delete === 'function') {
            try { src.delete(); } catch (e) { /* Ya eliminada */ }
        }
        if (dst && typeof dst.delete === 'function') {
            try { dst.delete(); } catch (e) { /* Ya eliminada */ }
        }
        if (finalDst && typeof finalDst.delete === 'function') {
            try { finalDst.delete(); } catch (e) { /* Ya eliminada */ }
        }
    }
}

/**
 * Función principal para generar el PDF a partir de las fotos capturadas.
 */
async function generarPDFConFotos() {
    if (!opencvReady || !verificarOpenCVDisponible()) {
        console.warn('OpenCV.js no está disponible, generando PDF en modo básico');
        // Continuar sin OpenCV, usando imágenes originales
    }

    var fotosWrappers = document.querySelectorAll('#photosContainer .photo-wrapper');
    
    if (fotosWrappers.length === 0) {
        showMessage('No hay fotos para procesar.');
        return;
    }

    // DIAGNÓSTICO: Verificar imágenes locales disponibles
    console.log('🔍 DIAGNÓSTICO DE IMÁGENES LOCALES:');
    var imgElementos = document.querySelectorAll('#photosContainer img.foto-principal');
    imgElementos.forEach(function(imgEl, index) {
        console.log('📸 Imagen', index + 1, ':');
        console.log('  - src:', imgEl.src.substring(0, 50) + (imgEl.src.length > 50 ? '...' : ''));
        console.log('  - es data URL:', imgEl.src.startsWith('data:'));
        console.log('  - data-local-image:', !!imgEl.getAttribute('data-local-image'));
        console.log('  - data-recortada:', !!imgEl.getAttribute('data-recortada'));
        console.log('  - data-mejorada:', !!imgEl.getAttribute('data-mejorada'));
        console.log('  - data-original-url:', imgEl.getAttribute('data-original-url') ? 'SÍ' : 'NO');
    });
    console.log('✅ Total de imágenes encontradas en el navegador:', imgElementos.length);

    // OPTIMIZACIÓN: Garantizar que todas las imágenes tengan versiones locales
    try {
        await garantizarImagenesLocales();
    } catch (error) {
        console.warn('⚠️ Error al garantizar imágenes locales:', error);
    }

    // Mostrar el modal de progreso circular al inicio de la generación del PDF
    if (window.pdfProgressManager) {
        window.pdfProgressManager.mostrar();
    }

    try {
        var { jsPDF } = window.jspdf;
    var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    var anchoHoja = 216;
    var altoHoja = 279;
    var fotosPorHoja = 9;
    var columnas = 3;
    var filas = 3;
    
    let paginaActual = 1;
    
    // **NUEVO**: Agregar imagen RIJ al principio si existe
    const identificador = localStorage.getItem('usuario_identificador_rij');
    if (identificador) {
        try {
            await agregarImagenRIJalPDF(pdf, null);
            pdf.addPage('letter', 'portrait');
            paginaActual = 2;
        } catch (error) {
            // Continuar sin imagen RIJ
        }
    }

    // Obtener las imágenes principales (igual que antes)
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
    // Obtener solo la versión seleccionada de cada foto PRIORIZANDO IMÁGENES LOCALES
    for (var i = 0; i < fotosWrappers.length; i++) {
        var imgSeleccionada = fotosWrappers[i].querySelector('img.foto-principal');
        var checkbox = fotosWrappers[i].querySelector('.checkbox-pantalla-completa');
        if (imgSeleccionada) {
            // PRIORIZAR IMÁGENES LOCALES del navegador (evitar solicitudes al servidor)
            var imagenAUsar = null;
            
            // 1. Si el src actual es un data URL, usarlo
            if (imgSeleccionada.src.startsWith('data:')) {
                imagenAUsar = imgSeleccionada.src;
                console.log('📌 Usando src data URL para imagen', i + 1);
            } else {
                // 2. Buscar versiones locales almacenadas en atributos
                imagenAUsar = imgSeleccionada.getAttribute('data-recortada') || 
                             imgSeleccionada.getAttribute('data-mejorada') ||
                             imgSeleccionada.getAttribute('data-contraste') ||
                             imgSeleccionada.getAttribute('data-bordes') ||
                             imgSeleccionada.getAttribute('data-color') ||
                             imgSeleccionada.getAttribute('data-local-image');
                
                if (imagenAUsar && imagenAUsar.startsWith('data:')) {
                    console.log('📌 Usando data URL almacenado para imagen', i + 1);
                } else {
                    // 3. Fallback: usar el src (URL del servidor)
                    imagenAUsar = imgSeleccionada.src;
                    console.warn('⚠️ No hay data URL local, usando URL del servidor para imagen', i + 1);
                }
            }
            
            imagenesSeleccionadas.push(imagenAUsar);
        }
    }
    // Eliminar duplicados exactos (por si alguna foto se repite)
    var imagenesUnicas = imagenesSeleccionadas.filter(function(value, index, self) {
        return self.indexOf(value) === index;
    });
    
    // DIAGNÓSTICO FINAL: Mostrar resumen de tipos de imagen
    var imagenesLocales = 0;
    var imagenesServidor = 0;
    imagenesUnicas.forEach(function(imagen, index) {
        if (imagen.startsWith('data:')) {
            imagenesLocales++;
            console.log('✅ Imagen', index + 1, ': LOCAL (data URL)');
        } else {
            imagenesServidor++;
            console.log('🚨 Imagen', index + 1, ': SERVIDOR (URL)', imagen.substring(0, 50) + '...');
        }
    });
    
    console.log('📊 RESUMEN DE IMÁGENES PARA PDF:');
    console.log('✅ Imágenes locales (rápidas):', imagenesLocales);
    console.log('🚨 Imágenes del servidor (lentas):', imagenesServidor);
    console.log('📈 Total de imágenes:', imagenesUnicas.length);
    
    if (imagenesServidor > 0) {
        console.warn('⚠️ ATENCIÓN: Se están usando', imagenesServidor, 'imágenes del servidor. Esto es menos eficiente.');
    } else {
        console.log('🎉 ¡PERFECTO! Todas las imágenes son locales, generación rápida sin solicitudes al servidor.');
    }
    // Revisar si el checkbox global está activado
    var pantallaCompletaGlobal = false;
    var chkGlobal = document.getElementById('pantallaCompletaPDF');
    if (chkGlobal) {
        pantallaCompletaGlobal = chkGlobal.checked;
    }
    // Función para agregar una imagen al PDF con control de tamaño - PRIORIZA IMÁGENES LOCALES
    function agregarImagenAlPDF(imagen, indiceImagen, totalImagenes, callback) {
        console.log('🖼️ Procesando imagen:', indiceImagen + 1, 'de', totalImagenes);
        console.log('📌 URL imagen:', imagen.substring(0, 100) + (imagen.length > 100 ? '...' : ''));
        
        // Buscar si existe una versión local de la imagen en el DOM
        var imgElementos = document.querySelectorAll('#photosContainer img.foto-principal');
        var localDataURL = null;
        var imagenEncontrada = false;
        
        // PASO 1: Buscar imagen local en elementos del DOM
        for (var i = 0; i < imgElementos.length; i++) {
            var imgEl = imgElementos[i];
            
            // Verificar si esta imagen coincide con la que se va a procesar
            var coincide = false;
            
            if (imgEl.src === imagen) {
                coincide = true;
                imagenEncontrada = true;
                console.log('✅ Imagen encontrada por src directo');
            } else if (imagen.startsWith('data:')) {
                // Si la imagen es un data URL, verificar si coincide con alguna versión almacenada
                var originalUrl = imgEl.getAttribute('data-original-url');
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
                    console.log('✅ Imagen encontrada por data URL coincidente');
                }
            } else {
                // Para URLs del servidor, buscar por data-original-url o similares
                var originalUrl = imgEl.getAttribute('data-original-url');
                if (originalUrl === imagen) {
                    coincide = true;
                    imagenEncontrada = true;
                    console.log('✅ Imagen encontrada por data-original-url');
                }
            }
            
            if (coincide) {
                // PRIORIDAD ABSOLUTA: usar imágenes locales del navegador
                // 1. La imagen que se está mostrando actualmente (si es data URL)
                if (imgEl.src.startsWith('data:')) {
                    localDataURL = imgEl.src;
                    console.log('🎯 Usando imagen mostrada actualmente (data URL)');
                } else {
                    // 2. Buscar versión local en orden de prioridad:
                    localDataURL = imgEl.getAttribute('data-recortada') || 
                                  imgEl.getAttribute('data-mejorada') ||
                                  imgEl.getAttribute('data-contraste') ||
                                  imgEl.getAttribute('data-bordes') ||
                                  imgEl.getAttribute('data-color') ||
                                  imgEl.getAttribute('data-local-image');
                    
                    if (localDataURL) {
                        console.log('🎯 Usando versión local almacenada');
                    }
                }
                break;
            }
        }
        
        // PASO 2: Si no encontramos imagen local, pero la imagen ya es un data URL, usarla
        if (!localDataURL && imagen.startsWith('data:')) {
            localDataURL = imagen;
            imagenEncontrada = true;
            console.log('🎯 Usando data URL directo');
        }
        
        // PASO 3: Procesar imagen local si está disponible
        if (localDataURL && localDataURL.startsWith('data:')) {
            console.log('✅ Procesando imagen LOCAL del navegador (SIN solicitud al servidor)');
            var img = new window.Image();
            img.onload = function() {
                // Usar el sistema de control de tamaño para procesar la imagen
                if (typeof window.procesarImagenParaPDF === 'function') {
                    window.procesarImagenParaPDF(img, indiceImagen, totalImagenes, function(dataUrlProcesada) {
                        if (dataUrlProcesada) {
                            console.log('✅ Imagen procesada con control de tamaño');
                            callback(dataUrlProcesada);
                        } else {
                            console.log('⚠️ Control de tamaño falló, usando fallback');
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
                    console.log('📝 Usando procesamiento básico (sin control de tamaño)');
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
                console.error('❌ Error al cargar imagen local, intentando plan B');
                usarPlanB();
            };
            img.src = localDataURL;
            return;
        }
        
        // PLAN B: Solicitud al servidor (SOLO como último recurso)
        function usarPlanB() {
            console.warn('🚨 PLAN B: Haciendo solicitud al servidor (menos eficiente)');
            console.warn('📡 URL del servidor:', imagen);
            console.warn('💡 SUGERENCIA: Esta imagen debería tener una versión local para evitar esta solicitud');
            
            fetch(imagen, { credentials: 'include' })
                .then(function(response) { 
                    if (!response.ok) {
                        throw new Error('Error en respuesta del servidor: ' + response.status);
                    }
                    return response.blob(); 
                })
                .then(function(blob) {
                    console.log('📦 Blob recibido del servidor, tamaño:', blob.size, 'bytes');
                    var reader = new FileReader();
                    reader.onloadend = function() {
                        var img = new window.Image();
                        img.onload = function() {
                            console.log('✅ Imagen del servidor cargada exitosamente');
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
                            console.error('❌ Error al procesar imagen del servidor');
                            callback(null);
                        };
                        img.src = reader.result;
                    };
                    reader.onerror = function() {
                        console.error('❌ Error al leer blob del servidor');
                        callback(null);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(function(error) {
                    console.error('❌ Error en fetch al servidor:', error);
                    callback(null);
                });
        }
        
        // Si llegamos aquí, no encontramos imagen local, usar plan B
        if (!imagenEncontrada) {
            console.warn('⚠️ No se encontró imagen local en el navegador');
            console.warn('🔍 Imagen buscada:', imagen.substring(0, 100) + (imagen.length > 100 ? '...' : ''));
        } else {
            console.warn('⚠️ Imagen encontrada pero sin data URL local válido');
        }
        
        // Última verificación: si la imagen es data URL pero no la detectamos arriba
        if (imagen.startsWith('data:')) {
            console.log('🎯 Procesando data URL directo (detección tardía)');
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
                console.error('❌ Error con data URL directo, usando plan B');
                usarPlanB();
            };
            img.src = imagen;
        } else {
            usarPlanB();
        }
    }    // Procesar imágenes según el modo global o por foto
    function procesarImagenes(indice, imagenesProcesadas, enMosaico, mosaicoPendiente) {        
        if (indice >= imagenesUnicas.length) {
            // FASE FINAL: Compilación del PDF
            console.log('📄 Iniciando fase final: compilación del PDF...');
            
            // Usar el sistema original de fase final
            if (window.pdfProgressManager) {
                const progresoActual = window.pdfProgressManager.obtenerProgresoActual();
                window.pdfProgressManager.iniciarFaseFinal(progresoActual);
            }
            
            // Continuar con la generación del PDF
            setTimeout(() => {
                console.log('📝 Agregando imágenes al PDF...');
                
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
                
                // Generar nombre con reporte de tamaño
                var hoy = new Date();
                var año = hoy.getFullYear();
                var mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
                var dia = hoy.getDate().toString().padStart(2, '0');
                var fechaActual = dia + '-' + mes + '-' + año;
                
                // Obtener reporte del controlador de tamaño
                var reporte = '';
                if (typeof window.obtenerReportePDF === 'function') {
                    var estadisticas = window.obtenerReportePDF();
                    reporte = '_' + estadisticas.tamaño_final_mb + 'MB';
                }
                
                // MOSTRAR ESTADÍSTICAS DE OPTIMIZACIÓN
                var stats = mostrarEstadisticasOptimizacion();
                console.log('📄 PDF generado exitosamente con', stats.porcentajeOptimizado + '% de optimización');
                
                // Esperar a que el modal complete su animación antes de descargar
                setTimeout(() => {
                    // Ejecutar la descarga
                    pdf.save('Formato_Digitalizado_' + fechaActual + reporte + '.pdf');
                    
                    // Restaurar el botón después de un breve delay
                    setTimeout(() => {
                        const btn = document.getElementById('btnGenerarPDF');
                        if (btn) {
                            btn.disabled = false;
                            btn.textContent = 'Generar PDF de fotos';
                        }
                        console.log('✅ Proceso de PDF completado exitosamente');
                    }, 500);
                    
                }, 1000); // Esperar 1 segundo para que el modal termine su animación
                
            }, 200);
            return;
        }        // Comenzar el procesamiento de esta imagen (progreso controlado)
        // Usar progreso manual en lugar del modo continuo para mayor control
        if (window.pdfProgressManager) {
            // Calcular progreso basado en imagen que está por procesarse
            var progresoInicio = (indice / imagenesUnicas.length) * 80; // 80% para imágenes
            window.pdfProgressManager.actualizarProgreso(progresoInicio + 1);
        }
        
        agregarImagenAlPDF(imagenesUnicas[indice], indice, imagenesUnicas.length, function(dataUrl) {
            if (dataUrl) {
                if (pantallaCompletaGlobal) {
                    pdf.addImage(dataUrl, 'WEBP', 0, 0, anchoHoja, altoHoja);
                    if (indice !== imagenesUnicas.length - 1) {
                        pdf.addPage('letter', 'portrait');
                    }
                } else {
                    enMosaico.push(dataUrl);
                }                imagenesProcesadas.push(dataUrl);
            }
              // Actualizar progreso cuando la imagen se complete
            if (window.pdfProgressManager) {
                // Usar actualizarProgresoDesdeImagenes para mantener el límite del 85%
                window.pdfProgressManager.actualizarProgresoDesdeImagenes(indice, imagenesUnicas.length);
                console.log('✅ Imagen', indice + 1, 'de', imagenesUnicas.length, 'procesada');
            }
            
            // Continuar procesando la siguiente imagen
            procesarImagenes(indice + 1, imagenesProcesadas, enMosaico);
        });}
      // Pequeño delay para que el usuario vea el 0% antes de empezar el procesamiento
    setTimeout(() => {        // Comenzar con 1% para dar feedback inmediato
        if (window.pdfProgressManager) {
            window.pdfProgressManager.iniciarProgreso();
        }
        procesarImagenes(0, [], [], []);
    }, 150);
    
    } catch (error) {
        console.error('Error durante la generación del PDF:', error);
        showMessage('Error al generar el PDF: ' + error.message);
        
        // Ocultar el modal de progreso en caso de error
        if (window.pdfProgressManager) {
            window.pdfProgressManager.manejarError();
        }
    }
}

// **NUEVO**: Función para agregar imagen RIJ al PDF
async function agregarImagenRIJalPDF(pdf, urlImagen) {
    return new Promise((resolve, reject) => {
        // Buscar imagen RIJ por identificador
        const identificador = localStorage.getItem('usuario_identificador_rij');
        const imagenDisponible = localStorage.getItem('rij_imagen_url');
        
        if (!identificador && !imagenDisponible) {
            resolve(); // No hay identificador, continuar sin imagen
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            try {
                // Calcular dimensiones para ajustar a página completa
                const anchoHoja = 216; // mm
                const altoHoja = 279; // mm
                
                // Usar toda la página para la imagen RIJ
                pdf.addImage(img, 'PNG', 0, 0, anchoHoja, altoHoja);
                resolve();
            } catch (error) {
                resolve(); // Continuar aunque falle
            }
        };
        
        img.onerror = function() {
            resolve(); // Continuar aunque no se pueda cargar
        };
        
        // Intentar diferentes rutas de imagen
        const rutasImagen = [
            imagenDisponible,
            `/RESOURCE/IMG/img RIJ/${identificador}.png`,
            urlImagen
        ].filter(Boolean); // Filtrar valores null/undefined
        
        if (rutasImagen.length > 0) {
            img.src = rutasImagen[0];
        } else {
            resolve(); // No hay rutas válidas
        }
    });
}

/**
 * Función para asignar el evento de generación de PDF al botón correspondiente.
 */
function asignarEventoPDF() {
    var botonPDF = document.getElementById('btnGenerarPDF');
    if (botonPDF) {
        botonPDF.removeEventListener('click', generarPDFConFotos); // Evitar duplicados
        botonPDF.addEventListener('click', generarPDFConFotos);
        // Solo deshabilitar el botón si OpenCV no está listo
        if (!opencvReady) {
            botonPDF.disabled = true;
            botonPDF.textContent = 'Cargando OpenCV.js...';
        } else {
            botonPDF.disabled = false;
            botonPDF.textContent = 'Generar PDF de fotos';
        }
    }
}

function obtenerPreferenciaPantallaCompleta() {
    // Lee la preferencia del usuario desde localStorage (por defecto: false)
    var valor = localStorage.getItem('pdfPantallaCompleta');
    if (valor === null) {
        return false;
    }
    return valor === 'true';
}

function guardarPreferenciaPantallaCompleta(valor) {
    localStorage.setItem('pdfPantallaCompleta', valor ? 'true' : 'false');
}

// Al cargar la página, sincronizar el checkbox con la preferencia guardada
window.addEventListener('DOMContentLoaded', function() {
    var chk = document.getElementById('pantallaCompletaPDF');
    if (chk) {
        chk.checked = obtenerPreferenciaPantallaCompleta();
        chk.addEventListener('change', function() {
            guardarPreferenciaPantallaCompleta(chk.checked);
        });
    }
});

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', asignarEventoPDF);
} else {
    asignarEventoPDF();
}

/**
 * Versión 3: Documentos con fondos de color o hojas no blancas MEJORADA
 * Implementación avanzada con múltiples filtros para separar texto del fondo colorido
 */
function aplicarFiltroContrasteAutomatico(img, calidad, maxLado, callback) {
    if (!opencvReady) {
        showMessage('OpenCV.js aún no está cargado. Por favor, espera y vuelve a intentarlo.');
        callback(null);
        return;
    }

    // Calcular las nuevas dimensiones manteniendo el ratio
    const ratio = img.naturalWidth / img.naturalHeight;
    let nuevoAncho, nuevoAlto;

    if (ratio > 1) { // Horizontal
        nuevoAncho = Math.min(maxLado, img.naturalWidth);
        nuevoAlto = nuevoAncho / ratio;
    } else { // Vertical o Cuadrado
        nuevoAlto = Math.min(maxLado, img.naturalHeight);
        nuevoAncho = nuevoAlto * ratio;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.round(nuevoAncho);
    tempCanvas.height = Math.round(nuevoAlto);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

    let src = cv.imread(tempCanvas);
    let gray = new cv.Mat();
    let hsv = new cv.Mat();
    let finalDst = new cv.Mat();

    try {
        // === PASO 1: ANÁLISIS DE COLOR PARA SEPARAR FONDO ===
        
        // 1.1. Convertir a HSV para mejor análisis de color
        cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
        
        // 1.2. Separar canales HSV
        let hsvChannels = new cv.MatVector();
        cv.split(hsv, hsvChannels);
        let h = hsvChannels.get(0); // Matiz
        let s = hsvChannels.get(1); // Saturación
        let v = hsvChannels.get(2); // Valor (brillo)
        
        // === PASO 2: DETECCIÓN INTELIGENTE DE FONDO COLOREADO ===
        
        // 2.1. Crear máscara de áreas saturadas (fondo de color)
        let saturatedMask = new cv.Mat();
        cv.threshold(s, saturatedMask, 30, 255, cv.THRESH_BINARY);
        
        // 2.2. Crear máscara de áreas muy claras u oscuras (posible texto)
        let textMask = new cv.Mat();
        cv.threshold(v, textMask, 200, 255, cv.THRESH_BINARY); // Áreas muy claras
        let darkMask = new cv.Mat();
        cv.threshold(v, darkMask, 80, 255, cv.THRESH_BINARY_INV); // Áreas oscuras
        cv.bitwise_or(textMask, darkMask, textMask);
        
        // === PASO 3: NORMALIZACIÓN DE ILUMINACIÓN AVANZADA ===
        
        // 3.1. Convertir a escala de grises para análisis de luminancia
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        
        // 3.2. Estimación de fondo mediante filtro muy grande
        let background = new cv.Mat();
        cv.GaussianBlur(gray, background, new cv.Size(71, 71), 0);
        
        // 3.3. Corrección de iluminación mediante división normalizada
        let illuminationCorrected = new cv.Mat();
        // Simular división: (imagen - fondo) + offset
        cv.subtract(gray, background, illuminationCorrected);
        cv.convertScaleAbs(illuminationCorrected, illuminationCorrected, 2.0, 128);
        
        // === PASO 4: MEJORA DE CONTRASTE ADAPTATIVO ===
        
        // 4.1. CLAHE agresivo para mejorar contraste local
        let claheFilter = new cv.CLAHE(4.0, new cv.Size(6, 6));
        let claheResult = new cv.Mat();
        claheFilter.apply(illuminationCorrected, claheResult);
        
        // 4.2. Segundo pase de CLAHE más suave
        let claheFilter2 = new cv.CLAHE(2.0, new cv.Size(12, 12));
        let claheResult2 = new cv.Mat();
        claheFilter2.apply(claheResult, claheResult2);
        
        // === PASO 5: SEPARACIÓN AVANZADA DE TEXTO ===
        
        // 5.1. Detección de bordes para identificar texto
        let edges = new cv.Mat();
        cv.Canny(claheResult2, edges, 40, 120, 3, false);
        
        // 5.2. Operaciones morfológicas para conectar texto
        let textKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 1));
        cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, textKernel);
        
        // 5.3. Dilatación horizontal para unir letras
        let horizontalKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 1));
        cv.dilate(edges, edges, horizontalKernel);
        
        // === PASO 6: BINARIZACIÓN INTELIGENTE ===
        
        // 6.1. Threshold adaptativo con parámetros optimizados
        let adaptive1 = new cv.Mat();
        cv.adaptiveThreshold(claheResult2, adaptive1, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 8);
        
        // 6.2. Threshold OTSU como alternativa
        let otsu = new cv.Mat();
        cv.threshold(claheResult2, otsu, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
        
        // 6.3. Combinar ambos métodos tomando el mejor resultado por píxel
        let combined = new cv.Mat();
        cv.bitwise_and(adaptive1, otsu, combined);
        
        // === PASO 7: REFINAMIENTO FINAL ===
        
        // 7.1. Eliminar ruido pequeño
        let denoiseKernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(2, 2));
        cv.morphologyEx(combined, combined, cv.MORPH_OPEN, denoiseKernel);
        
        // 7.2. Cerrar pequeños huecos en letras
        let closeKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        cv.morphologyEx(combined, combined, cv.MORPH_CLOSE, closeKernel);
        
        // 7.3. Aplicar filtro de mediana para suavizar
        cv.medianBlur(combined, combined, 3);
        
        // === PASO 8: MEJORA FINAL DE NITIDEZ ===
        
        // 8.1. Kernel de afilado para texto más nítido
        let sharpenKernel = cv.matFromArray(3, 3, cv.CV_32FC1, [
            -0.5, -1, -0.5,
            -1,   6,  -1,
            -0.5, -1, -0.5
        ]);
        
        let sharpened = new cv.Mat();
        cv.filter2D(combined, sharpened, cv.CV_8U, sharpenKernel);
        
        // 8.2. Combinar resultado afilado con original
        cv.addWeighted(combined, 0.7, sharpened, 0.3, 0, combined);
        
        // Convertir resultado final a RGBA
        cv.cvtColor(combined, finalDst, cv.COLOR_GRAY2RGBA, 0);

        const resultCanvas = document.createElement('canvas');
        cv.imshow(resultCanvas, finalDst);

        resultCanvas.toBlob(function(blob) {
            const reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            };
            reader.readAsDataURL(blob);
        }, 'image/webp', calidad);

        // Liberar memoria
        hsvChannels.delete();
        saturatedMask.delete();
        textMask.delete();
        darkMask.delete();
        background.delete();
        illuminationCorrected.delete();
        claheFilter.delete();
        claheResult.delete();
        claheFilter2.delete();
        claheResult2.delete();
        edges.delete();
        textKernel.delete();
        horizontalKernel.delete();
        adaptive1.delete();
        otsu.delete();
        combined.delete();
        denoiseKernel.delete();
        closeKernel.delete();
        sharpenKernel.delete();
        sharpened.delete();

    } catch (e) {
        showMessage("Error al procesar la imagen: " + e.message);
        callback(null);
    } finally {
        if (src && typeof src.delete === 'function') { try { src.delete(); } catch (e) {} }
        if (gray && typeof gray.delete === 'function') { try { gray.delete(); } catch (e) {} }
        if (hsv && typeof hsv.delete === 'function') { try { hsv.delete(); } catch (e) {} }
        if (finalDst && typeof finalDst.delete === 'function') { try { finalDst.delete(); } catch (e) {} }
    }
}

/**
 * Versión 4: Documentos con texto de colores, logos e imágenes
 * Preserva colores importantes mientras mejora la legibilidad del texto
 */
function aplicarFiltroDeteccionBordes(img, calidad, maxLado, callback) {
    if (!opencvReady) {
        showMessage('OpenCV.js aún no está cargado. Por favor, espera y vuelve a intentarlo.');
        callback(null);
        return;
    }

    // Calcular las nuevas dimensiones manteniendo el ratio
    const ratio = img.naturalWidth / img.naturalHeight;
    let nuevoAncho, nuevoAlto;

    if (ratio > 1) { // Horizontal
        nuevoAncho = Math.min(maxLado, img.naturalWidth);
        nuevoAlto = nuevoAncho / ratio;
    } else { // Vertical o Cuadrado
        nuevoAlto = Math.min(maxLado, img.naturalHeight);
        nuevoAncho = nuevoAlto * ratio;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.round(nuevoAncho);
    tempCanvas.height = Math.round(nuevoAlto);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

    let src = cv.imread(tempCanvas);
    let hsv = new cv.Mat();
    let finalDst = new cv.Mat();

    try {
        // 1. Convertir a espacio de color HSV para preservar información de color
        cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
        
        // 2. Separar canales HSV
        let hsvChannels = new cv.MatVector();
        cv.split(hsv, hsvChannels);
        let h = hsvChannels.get(0); // Matiz (color)
        let s = hsvChannels.get(1); // Saturación
        let v = hsvChannels.get(2); // Valor (brillo)
        
        // 3. Mejorar el canal de saturación para colores más vivos
        let enhancedS = new cv.Mat();
        cv.convertScaleAbs(s, enhancedS, 1.3, 0);
        
        // 4. Aplicar CLAHE al canal de valor para mejor contraste
        let claheFilter = new cv.CLAHE(2.0, new cv.Size(8, 8));
        let enhancedV = new cv.Mat();
        claheFilter.apply(v, enhancedV);
        
        // 5. Detectar texto mediante análisis de bordes en el canal de valor
        let edges = new cv.Mat();
        cv.Canny(enhancedV, edges, 30, 80, 3, false);
        
        // 6. Aplicar operaciones morfológicas para conectar letras
        let textKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 1));
        cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, textKernel);
        
        // 7. Detectar áreas de texto mediante contornos
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        // 8. Crear máscara para áreas de texto
        let textMask = cv.Mat.zeros(edges.rows, edges.cols, cv.CV_8UC1);
        for (let i = 0; i < contours.size(); i++) {
            let contour = contours.get(i);
            let area = cv.contourArea(contour);
            let rect = cv.boundingRect(contour);
            let aspectRatio = rect.width / rect.height;
            
            // Filtrar contornos que parecen texto (área y aspecto adecuados)
            if (area > 50 && area < 5000 && aspectRatio > 0.1 && aspectRatio < 10) {
                cv.drawContours(textMask, contours, i, new cv.Scalar(255), -1);
            }
        }
        
        // 9. Aplicar afilado solo en áreas de texto
        let sharpenKernel = cv.matFromArray(3, 3, cv.CV_32FC1, [0, -1, 0, -1, 5, -1, 0, -1, 0]);
        let sharpened = new cv.Mat();
        cv.filter2D(enhancedV, sharpened, cv.CV_8U, sharpenKernel);
        
        // 10. Combinar valor original con valor afilado usando la máscara de texto
        let finalV = new cv.Mat();
        enhancedV.copyTo(finalV);
        sharpened.copyTo(finalV, textMask);
        
        // 11. Recombinar canales HSV mejorados
        let finalHSV = new cv.Mat();
        let finalChannels = new cv.MatVector();
        finalChannels.push_back(h);
        finalChannels.push_back(enhancedS);
        finalChannels.push_back(finalV);
        cv.merge(finalChannels, finalHSV);
        
        // 12. Convertir de vuelta a RGB y luego a RGBA
        let rgb = new cv.Mat();
        cv.cvtColor(finalHSV, rgb, cv.COLOR_HSV2RGB);
        cv.cvtColor(rgb, finalDst, cv.COLOR_RGB2RGBA);

        const resultCanvas = document.createElement('canvas');
        cv.imshow(resultCanvas, finalDst);

        resultCanvas.toBlob(function(blob) {
            const reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            };
            reader.readAsDataURL(blob);
        }, 'image/webp', calidad);

        // Liberar memoria
        hsvChannels.delete();
        enhancedS.delete();
        claheFilter.delete();
        enhancedV.delete();
        edges.delete();
        textKernel.delete();
        contours.delete();
        hierarchy.delete();
        textMask.delete();
        sharpenKernel.delete();
        sharpened.delete();
        finalV.delete();
        finalChannels.delete();
        finalHSV.delete();
        rgb.delete();

    } catch (e) {
        showMessage("Error al procesar la imagen: " + e.message);
        callback(null);
    } finally {
        if (src && typeof src.delete === 'function') { try { src.delete(); } catch (e) {} }
        if (hsv && typeof hsv.delete === 'function') { try { hsv.delete(); } catch (e) {} }
        if (finalDst && typeof finalDst.delete === 'function') { try { finalDst.delete(); } catch (e) {} }
    }
}

/**
 * Versión 5: Documentos con mala iluminación, sombras y reflejos
 * Corrige iluminación desigual típica en fotos de documentos con flash o luz natural
 */
function aplicarFiltroCorreccionColor(img, calidad, maxLado, callback) {
    if (!opencvReady) {
        showMessage('OpenCV.js aún no está cargado. Por favor, espera y vuelve a intentarlo.');
        callback(null);
        return;
    }

    // Calcular las nuevas dimensiones manteniendo el ratio
    const ratio = img.naturalWidth / img.naturalHeight;
    let nuevoAncho, nuevoAlto;

    if (ratio > 1) { // Horizontal
        nuevoAncho = Math.min(maxLado, img.naturalWidth);
        nuevoAlto = nuevoAncho / ratio;
    } else { // Vertical o Cuadrado
        nuevoAlto = Math.min(maxLado, img.naturalHeight);
        nuevoAncho = nuevoAlto * ratio;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.round(nuevoAncho);
    tempCanvas.height = Math.round(nuevoAlto);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

    let src = cv.imread(tempCanvas);
    let gray = new cv.Mat();
    let finalDst = new cv.Mat();

    try {
        // 1. Convertir a escala de grises para análisis de iluminación
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        
        // 2. Estimar el fondo usando filtro Gaussiano muy grande
        let background = new cv.Mat();
        cv.GaussianBlur(gray, background, new cv.Size(101, 101), 0);
        
        // 3. Normalizar la iluminación dividiendo por el fondo estimado
        let normalized = new cv.Mat();
        // Simular división mediante operaciones disponibles
        cv.convertScaleAbs(background, background, -1, 255); // Invertir
        cv.add(gray, background, normalized); // Sumar (simula división parcial)
        
        // 4. Aplicar CLAHE para mejorar contraste local
        let claheFilter = new cv.CLAHE(4.0, new cv.Size(8, 8));
        let claheResult = new cv.Mat();
        claheFilter.apply(normalized, claheResult);
        
        // 5. Detectar y eliminar reflejos mediante threshold
        let reflections = new cv.Mat();
        cv.threshold(gray, reflections, 240, 255, cv.THRESH_BINARY);
        
        // 6. Crear máscara para áreas de reflejo
        let reflectionKernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
        cv.morphologyEx(reflections, reflections, cv.MORPH_CLOSE, reflectionKernel);
        
        // 7. Aplicar inpainting para rellenar reflejos (usando dilatación como alternativa)
        let inpainted = new cv.Mat();
        claheResult.copyTo(inpainted);
        let dilateKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        cv.dilate(inpainted, inpainted, dilateKernel);
        
        // 8. Combinar resultado usando máscara de reflejos invertida
        let reflectionsInv = new cv.Mat();
        cv.bitwise_not(reflections, reflectionsInv);
        let combined = new cv.Mat();
        claheResult.copyTo(combined);
        inpainted.copyTo(combined, reflections);
        
        // 9. Aplicar filtro de mediana para reducir ruido
        let denoised = new cv.Mat();
        cv.medianBlur(combined, denoised, 3);
        
        // 10. Corrección final de contraste y brillo
        let final = new cv.Mat();
        cv.convertScaleAbs(denoised, final, 1.1, 15);
        
        // 11. Aplicar threshold adaptativo para texto muy claro
        cv.adaptiveThreshold(final, final, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 5);
        
        // 12. Operaciones morfológicas finales para limpiar
        let cleanKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        cv.morphologyEx(final, final, cv.MORPH_OPEN, cleanKernel);
        cv.morphologyEx(final, final, cv.MORPH_CLOSE, cleanKernel);
          // Convertir a RGBA
        cv.cvtColor(final, finalDst, cv.COLOR_GRAY2RGBA, 0);

        const resultCanvas = document.createElement('canvas');
        cv.imshow(resultCanvas, finalDst);

        resultCanvas.toBlob(function(blob) {
            const reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            };
            reader.readAsDataURL(blob);
        }, 'image/webp', calidad);

        // Liberar memoria
        background.delete();
        normalized.delete();
        claheFilter.delete();
        claheResult.delete();
        reflections.delete();
        reflectionKernel.delete();
        inpainted.delete();
        dilateKernel.delete();
        reflectionsInv.delete();
        combined.delete();
        denoised.delete();
        final.delete();
        cleanKernel.delete();    } catch (e) {
        showMessage("Error al procesar la imagen: " + e.message);
        callback(null);
    } finally {
        if (src && typeof src.delete === 'function') { try { src.delete(); } catch (e) {} }
        if (gray && typeof gray.delete === 'function') { try { gray.delete(); } catch (e) {} }
        if (finalDst && typeof finalDst.delete === 'function') { try { finalDst.delete(); } catch (e) {} }
    }
}

// FUNCIÓN OPTIMIZACIÓN: Garantizar que todas las imágenes tengan versiones locales
async function garantizarImagenesLocales() {
    console.log('🔧 Verificando y corrigiendo imágenes para evitar solicitudes al servidor...');
    
    var imgElementos = document.querySelectorAll('#photosContainer img.foto-principal');
    var promesasConversion = [];
    
    imgElementos.forEach(function(imgEl, index) {
        // Verificar si ya tiene una versión local
        var tieneVersionLocal = imgEl.src.startsWith('data:') ||
                               imgEl.getAttribute('data-local-image') ||
                               imgEl.getAttribute('data-recortada') ||
                               imgEl.getAttribute('data-mejorada');
        
        if (!tieneVersionLocal) {
            console.log('🔄 Convirtiendo imagen', index + 1, 'a versión local...');
            
            // Crear promesa para convertir esta imagen
            var promesa = new Promise(function(resolve) {
                // Si la imagen ya está cargada, convertirla inmediatamente
                if (imgEl.complete && imgEl.naturalHeight !== 0) {
                    convertirImagenALocal(imgEl, resolve);
                } else {
                    // Si no está cargada, esperar a que se cargue
                    imgEl.onload = function() {
                        convertirImagenALocal(imgEl, resolve);
                    };
                    imgEl.onerror = function() {
                        console.warn('❌ Error al cargar imagen', index + 1, 'para conversión local');
                        resolve();
                    };
                }
            });
            
            promesasConversion.push(promesa);
        } else {
            console.log('✅ Imagen', index + 1, 'ya tiene versión local');
        }
    });
    
    if (promesasConversion.length > 0) {
        console.log('⏳ Esperando conversión de', promesasConversion.length, 'imágenes...');
        await Promise.all(promesasConversion);
        console.log('✅ Todas las imágenes convertidas a versiones locales');
    } else {
        console.log('🎉 Todas las imágenes ya tenían versiones locales');
    }
}

// Función auxiliar para convertir una imagen a data URL local
function convertirImagenALocal(imgEl, callback) {
    try {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        
        canvas.width = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
        
        ctx.drawImage(imgEl, 0, 0);
        
        // Usar WEBP con alta calidad para mejor compresión
        var dataURL = canvas.toDataURL('image/webp', 0.9);
        
        // Almacenar la versión local
        imgEl.setAttribute('data-local-image', dataURL);
        
        console.log('✅ Imagen convertida a versión local exitosamente');
        callback();
    } catch (error) {
        console.warn('❌ Error al convertir imagen a versión local:', error);
        callback();
    }
}

// ESTADÍSTICAS DE OPTIMIZACIÓN: Mostrar resumen de rendimiento
function mostrarEstadisticasOptimizacion() {
    var imagenesEncontradas = document.querySelectorAll('#photosContainer img.foto-principal').length;
    var imagenesConVersionLocal = 0;
    var imagenesSinVersionLocal = 0;
    
    document.querySelectorAll('#photosContainer img.foto-principal').forEach(function(imgEl) {
        var tieneVersionLocal = imgEl.src.startsWith('data:') ||
                               imgEl.getAttribute('data-local-image') ||
                               imgEl.getAttribute('data-recortada') ||
                               imgEl.getAttribute('data-mejorada');
        
        if (tieneVersionLocal) {
            imagenesConVersionLocal++;
        } else {
            imagenesSinVersionLocal++;
        }
    });
    
    console.log('📊 ESTADÍSTICAS DE OPTIMIZACIÓN:');
    console.log('📈 Total de imágenes:', imagenesEncontradas);
    console.log('✅ Con versión local:', imagenesConVersionLocal);
    console.log('🚨 Sin versión local:', imagenesSinVersionLocal);
    console.log('🎯 Porcentaje optimizado:', Math.round((imagenesConVersionLocal / imagenesEncontradas) * 100) + '%');
    
    if (imagenesSinVersionLocal === 0) {
        console.log('🎉 ¡PERFECTO! Todas las imágenes están optimizadas para generación rápida de PDF');
    } else {
        console.warn('⚠️ ATENCIÓN:', imagenesSinVersionLocal, 'imágenes requieren solicitudes al servidor');
    }
    
    return {
        total: imagenesEncontradas,
        optimizadas: imagenesConVersionLocal,
        sinOptimizar: imagenesSinVersionLocal,
        porcentajeOptimizado: Math.round((imagenesConVersionLocal / imagenesEncontradas) * 100)
    };
}


