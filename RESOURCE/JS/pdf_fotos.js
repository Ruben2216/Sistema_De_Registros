let opencvReady = false; // Variable global para controlar la carga de OpenCV


function verificarOpenCVDisponible() {
    return typeof cv !== 'undefined' && cv.Mat && typeof cv.Mat === 'function';
}

// Inicializar OpenCV cuando esté disponible
function inicializarOpenCV() {
    if (verificarOpenCVDisponible()) {
        opencvReady = true;
        // OpenCV.js está listo en pdf_fotos.js
        
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
        // OpenCV.js no está disponible, usando imagen original
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
        // OpenCV.js no está disponible, generando PDF en modo básico
        // Continuar sin OpenCV, usando imágenes originales
    }

    var fotosWrappers = document.querySelectorAll('#photosContainer .photo-wrapper');
    
    console.log(`🔍 DIAGNÓSTICO: Encontrados ${fotosWrappers.length} elementos con selector '#photosContainer .photo-wrapper'`);
    
    // Si no se encuentran fotos con .photo-wrapper, probar otros selectores
    if (fotosWrappers.length === 0) {
        console.log('🔍 Probando selector alternativo: #photosContainer > div');
        fotosWrappers = document.querySelectorAll('#photosContainer > div');
        console.log(`🔍 Selector alternativo encontró: ${fotosWrappers.length} elementos`);
    }
    
    if (fotosWrappers.length === 0) {
        showMessage('No hay fotos para procesar.');
        return;
    }

    // DIAGNÓSTICO: Verificar imágenes locales disponibles
    var imgElementos = document.querySelectorAll('#photosContainer img.foto-principal');
    // Análisis de imágenes locales disponibles

    // OPTIMIZACIÓN: Garantizar que todas las imágenes tengan versiones locales
    try {
        await garantizarImagenesLocales();
    } catch (error) {
        // Error al garantizar imágenes locales
    }

    // Mostrar el modal de progreso circular al inicio de la generación del PDF
    if (window.pdfProgressManager) {
        window.pdfProgressManager.mostrar();
    }

    // **ACTIVACIÓN CRÍTICA**: Garantizar control total ANTES de cualquier procesamiento
    console.log('🛡️ INICIANDO CONTROL TOTAL PREVENTIVO...');
    
    // **PASO 1**: Verificar que jsPDF esté disponible
    let jsPDFDisponible = false;
    if (window.jsPDF && window.jsPDF.API && window.jsPDF.API.addImage) {
        jsPDFDisponible = true;
        console.log('✅ jsPDF está disponible (window.jsPDF)');
    } else if (window.jspdf && window.jspdf.jsPDF) {
        window.jsPDF = window.jspdf.jsPDF;
        if (window.jsPDF.API && window.jsPDF.API.addImage) {
            jsPDFDisponible = true;
            console.log('✅ jsPDF está disponible (window.jspdf.jsPDF)');
        }
    }
    
    if (!jsPDFDisponible) {
        console.error('❌ jsPDF no está disponible - No se puede activar el control');
        console.error('📋 Estado:', {
            'window.jsPDF': typeof window.jsPDF,
            'window.jspdf': typeof window.jspdf,
            'jsPDF.API': typeof window.jsPDF?.API
        });
        alert('⚠️ Error: Librería jsPDF no cargada. Recarga la página e intenta de nuevo.');
        return;
    }
    
    // **PASO 2**: Crear el PDF primero
    try {
        var { jsPDF } = window.jspdf;
        var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        console.log('✅ PDF creado exitosamente');
    } catch (error) {
        console.error('❌ Error al crear PDF:', error);
        alert('⚠️ Error al crear PDF. Recarga la página e intenta de nuevo.');
        return;
    }
    
    // **EMERGENCIA**: Desactivar sistema de control problemático
    console.log('🚨 EMERGENCIA: Desactivando sistema de control que está bloqueando imágenes');
    console.log('❌ Control DESACTIVADO para resolver problema de imágenes faltantes');
    
    // **PASO 3**: NO activar el control total para evitar interferencias
    /*
    // Activar control total fresco
    if (typeof window.controlarTodasLasImagenesPDF === 'function') {
        const resultado = window.controlarTodasLasImagenesPDF();
        if (resultado === false) {
            console.error('❌ No se pudo activar el control total');
            alert('⚠️ Error al activar el control de tamaño. Recarga la página e intenta de nuevo.');
            return;
        }
        console.log('✅ Control total activado - NINGUNA imagen podrá exceder 5MB');
    } else {
        console.error('❌ FUNCIÓN DE CONTROL NO DISPONIBLE - CARGANDO configuracion_pdf.js...');
        alert('⚠️ Sistema de control no cargado. Recarga la página e intenta de nuevo.');
        return;
    }
    */

    // **PASO 4**: Continuar con el procesamiento normal
    try {
        // Inicializar variables de diagnóstico globales
        window.imagenesFallidasPDF = [];
        window.contadorImagenesExitosas = 0;
        window.contadorImagenesFallidas = 0;
        window.imagenesAñadidasAlPdf = 0; // NUEVO: Contador de imágenes realmente añadidas al PDF
        
        var anchoHoja = 216;
        var altoHoja = 279;
        // SIN LÍMITE DE FOTOS - Se calculará dinámicamente según el espacio
        var columnas = 3;
        var filas = 3;
        var fotosPorHoja = columnas * filas; // Calculado dinámicamente, no es un límite
        
        // MARGEN DE SEGURIDAD para evitar que las imágenes se corten en el borde
        var margenInferior = 5; // 5mm de margen en la parte inferior (aumentado de 2mm)
        var altoHojaUtil = altoHoja - margenInferior; // 274mm útiles en lugar de 277mm
        
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
    var altoCelda = altoHojaUtil / filas; // Usar altura útil (277mm) en lugar de altura total (279mm)
    var anchoCelda = altoCelda * aspectoFoto;
    if (anchoCelda * columnas > anchoHoja) {
        anchoCelda = anchoHoja / columnas;
        altoCelda = anchoCelda / aspectoFoto;
    }
    
    // DIAGNÓSTICO: Mostrar cálculos de dimensiones
    console.log(`\n📐 DIMENSIONES DEL PDF CALCULADAS:`);
    console.log(`   📄 Hoja total: ${anchoHoja}x${altoHoja}mm`);
    console.log(`   📄 Hoja útil: ${anchoHoja}x${altoHojaUtil}mm (margen inferior: ${margenInferior}mm)`);
    console.log(`   🔢 Grilla: ${columnas}x${filas} = ${fotosPorHoja} fotos por página`);
    console.log(`   📏 Celda: ${anchoCelda.toFixed(2)}x${altoCelda.toFixed(2)}mm`);
    console.log(`   📊 Posición máxima Y: ${(filas - 1) * altoCelda}mm (fila 3)`);
    console.log(`   📊 Límite inferior: ${(filas - 1) * altoCelda + altoCelda}mm = ${((filas - 1) * altoCelda + altoCelda).toFixed(2)}mm`);
    console.log(`   ✅ Margen seguro: ${(altoHoja - ((filas - 1) * altoCelda + altoCelda)).toFixed(2)}mm restantes`);
    console.log(`   🔍 VERIFICACIÓN: ¿Imagen 7 cabe? ${((filas - 1) * altoCelda + altoCelda) <= altoHojaUtil ? 'SÍ' : 'NO'}`);
    
    // VALIDACIÓN CRÍTICA: Verificar que todas las imágenes quepan
    const posicionMaximaY = (filas - 1) * altoCelda + altoCelda;
    if (posicionMaximaY > altoHojaUtil) {
        console.warn(`⚠️ PROBLEMA: Las imágenes excederán el límite de página`);
        console.warn(`   Posición máxima calculada: ${posicionMaximaY.toFixed(2)}mm`);
        console.warn(`   Límite de página útil: ${altoHojaUtil.toFixed(2)}mm`);
        console.warn(`   Exceso: ${(posicionMaximaY - altoHojaUtil).toFixed(2)}mm`);
    }
    
    // Obtener solo la versión seleccionada de cada foto PRIORIZANDO IMÁGENES LOCALES
    console.log(`🔍 Revisando ${fotosWrappers.length} foto wrappers`);
    
    for (var i = 0; i < fotosWrappers.length; i++) {
        var imgSeleccionada = fotosWrappers[i].querySelector('img.foto-principal');
        
        console.log(`🔍 Wrapper ${i + 1}: img.foto-principal ${imgSeleccionada ? 'encontrada' : 'NO encontrada'}`);
        
        if (imgSeleccionada) {
            // PRIORIZAR IMÁGENES LOCALES del navegador (evitar solicitudes al servidor)
            var imagenAUsar = null;
            
            // 1. Si el src actual es un data URL, usarlo
            if (imgSeleccionada.src.startsWith('data:')) {
                imagenAUsar = imgSeleccionada.src;
                // Usando src data URL para imagen
            } else {
                // 2. Buscar versiones locales almacenadas en atributos
                imagenAUsar = imgSeleccionada.getAttribute('data-recortada') || 
                             imgSeleccionada.getAttribute('data-mejorada') ||
                             imgSeleccionada.getAttribute('data-contraste') ||
                             imgSeleccionada.getAttribute('data-bordes') ||
                             imgSeleccionada.getAttribute('data-color') ||
                             imgSeleccionada.getAttribute('data-local-image');
                
                if (imagenAUsar && imagenAUsar.startsWith('data:')) {
                    // Usando data URL almacenado para imagen
                } else {
                    // 3. Fallback: usar el src (URL del servidor)
                    imagenAUsar = imgSeleccionada.src;
                    // No hay data URL local, usando URL del servidor para imagen
                }
            }
            
            imagenesSeleccionadas.push(imagenAUsar);
            
            console.log(`📝 Imagen ${i + 1} PREPARADA para procesamiento - Tipo: ${imagenAUsar.startsWith('data:') ? 'Data URL' : 'URL Servidor'} - Tamaño: ${imagenAUsar.length} chars`);
        } else {
            console.log(`❌ Imagen ${i + 1} NO tiene img.foto-principal válida`);
        }
    }
    // AJUSTE CRÍTICO: NO eliminar duplicados cuando el usuario selecciona múltiples imágenes
    // Aunque tengan el mismo DataURL, el usuario las ve como imágenes diferentes en la interfaz
    // y espera que todas aparezcan en el PDF
    var imagenesUnicas = imagenesSeleccionadas; // Mantener todas las imágenes seleccionadas
    
    // DIAGNÓSTICO: Detectar si hay duplicados pero NO eliminarlos
    var duplicadosDetectados = [];
    var contenidosSeen = [];
    imagenesSeleccionadas.forEach(function(imagen, index) {
        if (contenidosSeen.includes(imagen)) {
            duplicadosDetectados.push(`Posición ${index + 1} tiene el mismo contenido que otra imagen`);
        } else {
            contenidosSeen.push(imagen);
        }
    });
    
    // Log para debugging
    console.log(`📸 Total imágenes seleccionadas: ${imagenesSeleccionadas.length}`);
    console.log(`📸 Imágenes a procesar: ${imagenesUnicas.length} (SIN deduplicación)`);
    
    if (duplicadosDetectados.length > 0) {
        console.log(`⚠️ DUPLICADOS DETECTADOS pero MANTENIDOS: ${duplicadosDetectados.length} imágenes con contenido duplicado`);
        console.log(`🔍 Detalles de duplicados:`, duplicadosDetectados.slice(0, 5)); // Solo mostrar primeros 5
        console.log(`✅ TODAS las imágenes se procesarán porque el usuario las seleccionó individualmente`);
    }
    
    // DIAGNÓSTICO FINAL: Mostrar resumen de tipos de imagen
    var imagenesLocales = 0;
    var imagenesServidor = 0;
    imagenesUnicas.forEach(function(imagen, index) {
        if (imagen.startsWith('data:')) {
            imagenesLocales++;
            // Imagen LOCAL (data URL)
        } else {
            imagenesServidor++;
            // Imagen SERVIDOR (URL)
        }
    });
    
    // RESUMEN DE IMÁGENES PARA PDF
    // Análisis de tipos de imágenes completado
    
    if (imagenesServidor > 0) {
        // ATENCIÓN: Se están usando imágenes del servidor
    } else {
        // ¡PERFECTO! Todas las imágenes son locales
    }
    // Revisar si el checkbox global está activado
    var pantallaCompletaGlobal = false;
    var chkGlobal = document.getElementById('pantallaCompletaPDF');
    if (chkGlobal) {
        pantallaCompletaGlobal = chkGlobal.checked;
    }
    // Función para agregar una imagen al PDF con control de tamaño - PRIORIZA IMÁGENES LOCALES + DIAGNÓSTICO MÓVILES
    function agregarImagenAlPDF(imagen, indiceImagen, totalImagenes, callback) {
        console.log(`🔍 INICIANDO procesamiento imagen ${indiceImagen + 1}/${totalImagenes}`);
        console.log(`📄 Tipo de imagen: ${imagen.startsWith('data:') ? 'Data URL' : 'URL del servidor'}`);
        console.log(`📏 Tamaño string: ${imagen.length} caracteres`);
        
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
                // Log eliminado
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
                    // Log eliminado
                }
            } else {
                // Para URLs del servidor, buscar por data-original-url o similares
                var originalUrl = imgEl.getAttribute('data-original-url');
                if (originalUrl === imagen) {
                    coincide = true;
                    imagenEncontrada = true;
                    // Log eliminado
                }
            }
            
            if (coincide) {
                // PRIORIDAD ABSOLUTA: usar imágenes locales del navegador
                // 1. La imagen que se está mostrando actualmente (si es data URL)
                if (imgEl.src.startsWith('data:')) {
                    localDataURL = imgEl.src;
                    // Log eliminado');
                } else {
                    // 2. Buscar versión local en orden de prioridad:
                    localDataURL = imgEl.getAttribute('data-recortada') || 
                                  imgEl.getAttribute('data-mejorada') ||
                                  imgEl.getAttribute('data-contraste') ||
                                  imgEl.getAttribute('data-bordes') ||
                                  imgEl.getAttribute('data-color') ||
                                  imgEl.getAttribute('data-local-image');
                    
                    if (localDataURL) {
                        // Log eliminado
                    }
                }
                break;
            }
        }
        
        // PASO 2: Si no encontramos imagen local, pero la imagen ya es un data URL, usarla
        if (!localDataURL && imagen.startsWith('data:')) {
            localDataURL = imagen;
            imagenEncontrada = true;
            // Log eliminado
        }
        
        // PASO 3: Procesar imagen local si está disponible - MEJORADO PARA MÓVILES
        if (localDataURL && localDataURL.startsWith('data:')) {
            // Log eliminado');
            var img = new window.Image();
            
            // NUEVO: Timeout para evitar cuelgues en móviles
            var timeoutId = setTimeout(function() {
                // Si la imagen no se carga en 10 segundos, usar Plan B
                console.log(`⏰ TIMEOUT: Imagen ${indiceImagen + 1} no se cargó en 10 segundos (móvil), usando Plan B`);
                img.onload = null;
                img.onerror = null;
                usarPlanB();
            }, 10000); // 10 segundos timeout para móviles
            
            img.onload = function() {
                // CRÍTICO: Limpiar timeout cuando la imagen se carga exitosamente
                clearTimeout(timeoutId);
                
                // 🚨 EMERGENCIA: NO usar sistema de control problemático
                console.log(`🚨 PROCESAMIENTO DIRECTO para imagen ${indiceImagen + 1} - SIN sistema de control`);
                
                // PROCESAMIENTO DIRECTO SIN CONTROL (solo compresión básica)
                try {
                    var canvas = document.createElement('canvas');
                    // Reducir tamaño para mantener PDF bajo control
                    var maxWidth = 800;
                    var maxHeight = 600;
                    
                    var ratio = img.naturalWidth / img.naturalHeight;
                    var newWidth = Math.min(maxWidth, img.naturalWidth);
                    var newHeight = Math.min(maxHeight, img.naturalHeight);
                    
                    if (newWidth / newHeight > ratio) {
                        newWidth = newHeight * ratio;
                    } else {
                        newHeight = newWidth / ratio;
                    }
                    
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    
                    // Usar calidad moderada para control de tamaño
                    var dataUrlProcesada = canvas.toDataURL('image/jpeg', 0.7);
                    console.log(`✅ Imagen ${indiceImagen + 1} PROCESADA directamente - Tamaño: ${dataUrlProcesada.length} chars`);
                    callback(dataUrlProcesada);
                } catch (error) {
                    console.log(`❌ Error en procesamiento directo imagen ${indiceImagen + 1}:`, error);
                    callback(null);
                }
                
                /*
                // CÓDIGO ORIGINAL CON SISTEMA DE CONTROL (DESACTIVADO)
                if (typeof window.procesarImagenParaPDF === 'function') {
                    window.procesarImagenParaPDF(img, indiceImagen, totalImagenes, function(dataUrlProcesada) {
                        if (dataUrlProcesada) {
                            // Imagen procesada correctamente por el sistema de control
                            console.log(`✅ Imagen ${indiceImagen + 1} PROCESADA exitosamente por sistema de control`);
                            console.log(`✅ Imagen ${indiceImagen + 1} PROCESADA exitosamente por sistema de control - DataURL válido: ${dataUrlProcesada ? 'SÍ' : 'NO'} - Tamaño: ${dataUrlProcesada ? dataUrlProcesada.length : 0} chars`);
                            callback(dataUrlProcesada);
                        } else {
                            // IMAGEN DESCARTADA POR CONTROL DE TAMAÑO - NO crear fallback
                            console.log(`❌ Imagen ${indiceImagen + 1} DESCARTADA por sistema de control de tamaño - DataURL: ${dataUrlProcesada}`);
                            callback(null);
                        }
                    });
                } else {
                    // Solo si el sistema de control no está disponible
                    try {
                        var canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                        console.log(`✅ Imagen ${indiceImagen + 1} procesada con fallback (sin sistema de control)`);
                        callback(webpDataUrl);
                    } catch (error) {
                        // Fallo en canvas en móvil - usar Plan B
                        console.log(`❌ Error en canvas móvil para imagen ${indiceImagen + 1}, usando Plan B:`, error);
                        usarPlanB();
                    }
                }
                */
            };
            img.onerror = function() {
                // CRÍTICO: Limpiar timeout cuando hay error
                clearTimeout(timeoutId);
                console.log(`❌ ERROR cargando imagen ${indiceImagen + 1} desde data URL, usando Plan B`);
                usarPlanB();
            };
            img.src = localDataURL;
            return;
        }
        
        // PLAN B: Solicitud al servidor (SOLO como último recurso) - MEJORADO PARA MÓVILES
        function usarPlanB() {
            console.log(`🔄 Iniciando Plan B (servidor) para imagen ${indiceImagen + 1}`);
            // Log eliminado');
            // Log eliminado
            // Log eliminado
            
            // NUEVO: Timeout también para fetch en móviles
            const fetchTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout en fetch')), 15000); // 15 segundos
            });
            
            const fetchPromise = fetch(imagen, { credentials: 'include' })
                .then(function(response) { 
                    if (!response.ok) {
                        throw new Error('Error en respuesta del servidor: ' + response.status);
                    }
                    return response.blob(); 
                });
            
            Promise.race([fetchPromise, fetchTimeout])
                .then(function(blob) {
                    // Log eliminado
                    var reader = new FileReader();
                    
                    // NUEVO: Timeout para FileReader
                    var readerTimeoutId = setTimeout(function() {
                        callback(null); // Fallar silenciosamente para no bloquear
                    }, 8000); // 8 segundos para lectura
                    
                    reader.onloadend = function() {
                        clearTimeout(readerTimeoutId);
                        
                        var img = new window.Image();
                        
                        // NUEVO: Timeout para carga de imagen en Plan B
                        var imgTimeoutId = setTimeout(function() {
                            img.onload = null;
                            img.onerror = null;
                            callback(null); // Fallar silenciosamente
                        }, 8000); // 8 segundos para imagen
                        
                        img.onload = function() {
                            clearTimeout(imgTimeoutId);
                            
                            // 🚨 PROCESAMIENTO DIRECTO - NO usar sistema de control
                            try {
                                var canvas = document.createElement('canvas');
                                var maxWidth = 800;
                                var maxHeight = 600;
                                
                                var ratio = img.naturalWidth / img.naturalHeight;
                                var newWidth = Math.min(maxWidth, img.naturalWidth);
                                var newHeight = Math.min(maxHeight, img.naturalHeight);
                                
                                if (newWidth / newHeight > ratio) {
                                    newWidth = newHeight * ratio;
                                } else {
                                    newHeight = newWidth / ratio;
                                }
                                
                                canvas.width = newWidth;
                                canvas.height = newHeight;
                                var ctx = canvas.getContext('2d');
                                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                                
                                var dataUrlProcesada = canvas.toDataURL('image/jpeg', 0.7);
                                console.log(`✅ Imagen ${indiceImagen + 1} procesada directamente (servidor) - Tamaño: ${dataUrlProcesada.length} chars`);
                                callback(dataUrlProcesada);
                            } catch (error) {
                                console.log(`❌ Error procesando imagen ${indiceImagen + 1} del servidor:`, error);
                                callback(null);
                            }
                                // Fallback con manejo de errores mejorado
                                try {
                                    var canvas = document.createElement('canvas');
                                    canvas.width = img.naturalWidth;
                                    canvas.height = img.naturalHeight;
                                    var ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0);
                                    var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                                    callback(webpDataUrl);
                                } catch (error) {
                                    // Fallo final - callback con null
                                    callback(null);
                                }
                            }
                        };
                        img.onerror = function() {
                            clearTimeout(imgTimeoutId);
                            // Log eliminado
                            callback(null);
                        };
                        img.src = reader.result;
                    };
                    
                    reader.onerror = function() {
                        clearTimeout(readerTimeoutId);
                        callback(null);
                    };
                    reader.onerror = function() {
                        // Log eliminado
                        callback(null);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(function(error) {
                    console.log(`❌ Plan B FALLÓ para imagen ${indiceImagen + 1}:`, error.message);
                    callback(null);
                });
        }
        
        // Si llegamos aquí, no encontramos imagen local, usar plan B
        if (!imagenEncontrada) {
            // Log eliminado
            // Log eliminado + (imagen.length > 100 ? '...' : ''));
        } else {
            // Log eliminado
        }
        
        // Última verificación: si la imagen es data URL pero no la detectamos arriba
        if (imagen.startsWith('data:')) {
            // Log eliminado');
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
                // Log eliminado
                usarPlanB();
            };
            img.src = imagen;
        } else {
            usarPlanB();
        }
    }    // **MEJORADO**: Procesar imágenes según configuración individual y global
    function procesarImagenes(indice, imagenesProcesadas, enMosaico, paginasCompletas) {        
        if (indice >= imagenesUnicas.length) {
            // FASE FINAL: Compilación del PDF
            // Log eliminado
            
            // Usar el sistema original de fase final
            if (window.pdfProgressManager) {
                const progresoActual = window.pdfProgressManager.obtenerProgresoActual();
                window.pdfProgressManager.iniciarFaseFinal(progresoActual);
            }
            
            // Continuar con la generación del PDF
            setTimeout(() => {
                // NUEVO: Diagnóstico de resultados del procesamiento
                console.log(`\n📋 RESUMEN DE PROCESAMIENTO DE IMÁGENES:`);
                console.log(`📤 Imágenes originales detectadas: ${imagenesUnicas.length}`);
                console.log(`✅ Imágenes procesadas exitosamente: ${imagenesProcesadas.length}`);
                console.log(`❌ Imágenes que fallaron: ${imagenesUnicas.length - imagenesProcesadas.length}`);
                
                if (imagenesProcesadas.length < imagenesUnicas.length) {
                    console.warn(`⚠️ PROBLEMA DETECTADO: ${imagenesUnicas.length - imagenesProcesadas.length} imágenes fallaron en el procesamiento`);
                    console.warn(`📱 Esto es común en móviles por limitaciones de memoria o timeouts de red`);
                    console.warn(`🔧 Estas imágenes causarán espacios vacíos en el PDF`);
                }
                
                // Log eliminado
                
                // **NUEVO**: Construir PDF respetando el orden original de las imágenes
                // Ordenar imágenes procesadas por su índice original
                imagenesProcesadas.sort(function(a, b) {
                    return a.indice - b.indice;
                });
                
                // DIAGNÓSTICO CRÍTICO: Mapeo exacto de qué imágenes se procesaron
                console.log(`\n🏗️ CONSTRUYENDO PDF - MAPEO DE IMÁGENES:`);
                console.log(`📊 Total imágenes originales: ${imagenesUnicas.length}`);
                console.log(`✅ Imágenes exitosas: ${imagenesProcesadas.length}`);
                
                // Mostrar mapeo exacto
                for (let idx = 0; idx < imagenesUnicas.length; idx++) {
                    const imagenProcesada = imagenesProcesadas.find(img => img.indice === idx);
                    if (imagenProcesada) {
                        console.log(`   📸 Posición ${idx + 1}: ✅ PROCESADA (${imagenProcesada.dataUrl.length} chars)`);
                    } else {
                        console.log(`   📸 Posición ${idx + 1}: ❌ FALTANTE - CAUSARÁ HUECO VACÍO`);
                    }
                }
                
                var imagenesMosaico = [];
                var paginaActualMosaico = 0;
                var posicionEnPagina = 0;
                var esPrimeraPagina = true; // Controlar si es la primera página del PDF
                
                // Log eliminado
                
                for (var i = 0; i < imagenesProcesadas.length; i++) {
                    var imagenInfo = imagenesProcesadas[i];
                    
                    if (imagenInfo.esPantallaCompleta) {
                        // **CORREGIDO**: Agregar página completa en el momento correcto del orden
                        // Log eliminado');
                        
                        // Si hay imágenes de mosaico pendientes, completar la página de mosaico actual
                        if (imagenesMosaico.length > 0) {
                            // Log eliminado
                            // Si no es la primera página, agregar nueva página
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
                                
                                // DIAGNÓSTICO: Verificar que la imagen existe antes de añadirla
                                if (imagenesMosaico[j]) {
                                    console.log(`📄 Añadiendo imagen ${j + 1} al PDF en posición (${x}, ${y}) - Tamaño: ${anchoCelda}x${altoCelda}`);
                                    
                                    // NUEVA VERIFICACIÓN: Validar formato de imagen antes de añadir
                                    try {
                                        const esDataUrlValido = imagenesMosaico[j].startsWith('data:image/');
                                        const tieneContenido = imagenesMosaico[j].includes(',') && imagenesMosaico[j].split(',')[1].length > 50;
                                        
                                        if (esDataUrlValido && tieneContenido) {
                                            pdf.addImage(imagenesMosaico[j], 'WEBP', x, y, anchoCelda, altoCelda);
                                            window.imagenesAñadidasAlPdf++; // Incrementar contador
                                            console.log(`✅ Imagen ${j + 1} añadida exitosamente al PDF (Total en PDF: ${window.imagenesAñadidasAlPdf})`);
                                        } else {
                                            console.log(`❌ Imagen ${j + 1} tiene formato inválido - DataURL válido: ${esDataUrlValido}, Tiene contenido: ${tieneContenido}`);
                                        }
                                    } catch (error) {
                                        console.error(`❌ Error al añadir imagen ${j + 1} al PDF:`, error);
                                    }
                                } else {
                                    console.log(`❌ ERROR: imagenesMosaico[${j}] es undefined o null`);
                                }
                            }
                            
                            imagenesMosaico = []; // Limpiar mosaico
                            posicionEnPagina = 0;
                        }
                        
                        // Agregar nueva página para pantalla completa
                        if (!esPrimeraPagina) {
                            pdf.addPage('letter', 'portrait');
                        }
                        esPrimeraPagina = false;
                        
                        // Agregar imagen en pantalla completa
                        console.log(`\n📺 AÑADIENDO IMAGEN PANTALLA COMPLETA:`);
                        console.log(`   📏 Dimensiones: ${anchoHoja}x${altoHoja}`);
                        console.log(`   📄 DataURL válido: ${imagenInfo.dataUrl && imagenInfo.dataUrl.startsWith('data:')}`);
                        console.log(`   📏 Tamaño: ${imagenInfo.dataUrl ? imagenInfo.dataUrl.length : 'NULL'} chars`);
                        
                        try {
                            if (imagenInfo.dataUrl && imagenInfo.dataUrl.length > 100) {
                                pdf.addImage(imagenInfo.dataUrl, 'WEBP', 0, 0, anchoHoja, altoHoja);
                                window.imagenesAñadidasAlPdf++; // Incrementar contador
                                console.log(`   ✅ Imagen pantalla completa añadida exitosamente (Total en PDF: ${window.imagenesAñadidasAlPdf})`);
                            } else {
                                console.log(`   ❌ IMAGEN PANTALLA COMPLETA INVÁLIDA`);
                            }
                        } catch (error) {
                            console.log(`   💥 ERROR en imagen pantalla completa:`, error);
                        }
                        
                    } else {
                        // **CORREGIDO**: Agregar a mosaico respetando orden (SIMPLIFICADO)
                        imagenesMosaico.push(imagenInfo.dataUrl);
                        
                        /* BLOQUE PROBLEMÁTICO COMENTADO - CAUSA PROCESAMIENTO DOBLE
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
                                
                                console.log(`� Añadiendo imagen ${k + 1} al PDF en posición (${x}, ${y})`);
                                try {
                                    pdf.addImage(imagenesMosaico[k], 'WEBP', x, y, anchoCelda, altoCelda);
                                    window.imagenesAñadidasAlPdf++; // Incrementar contador
                                    console.log(`✅ Imagen ${k + 1} añadida exitosamente (Total en PDF: ${window.imagenesAñadidasAlPdf})`);
                                } catch (error) {
                                    console.error(`❌ Error al añadir imagen ${k + 1}:`, error);
                                }
                            }
                            
                            imagenesMosaico = []; // Limpiar para la siguiente página
                        }
                        FIN BLOQUE PROBLEMÁTICO COMENTADO */
                    }
                }
                
                // **CRÍTICO - CORRECCIÓN DE PAGINACIÓN**:
                // En lugar de ajustar la posición Y cuando una imagen excede el límite,
                // ahora se crea una nueva página cada 9 imágenes (3x3 mosaico).
                // Esto resuelve el problema donde la imagen 10 no aparecía.
                
                // **ÚNICO PROCESAMIENTO**: Procesar TODAS las imágenes de mosaico aquí
                console.log(`\n🏗️ PROCESANDO MOSAICO ÚNICO: ${imagenesMosaico.length} imágenes en total`);
                if (imagenesMosaico.length > 0) {
                    // Log eliminado
                    
                    // Agregar nueva página si es necesario
                    if (!esPrimeraPagina) {
                        pdf.addPage('letter', 'portrait');
                    }
                    
                    // Agregar imágenes restantes con paginación correcta
                    console.log(`🔧 Iniciando procesamiento de ${imagenesMosaico.length} imágenes de mosaico...`);
                    for (var m = 0; m < imagenesMosaico.length; m++) {
                        // Calcular posición en la cuadrícula de la página actual
                        var posicionEnPagina = m % fotosPorHoja; // Posición dentro de la página (0-8)
                        var col = posicionEnPagina % columnas;
                        var fila = Math.floor(posicionEnPagina / columnas);
                        var x = col * anchoCelda;
                        var y = fila * altoCelda;
                    
                        // Si es el inicio de una nueva página (después de 9 imágenes), agregar nueva página
                        if (m > 0 && m % fotosPorHoja === 0) {
                            console.log(`\n📄 CREANDO NUEVA PÁGINA para imagen ${m + 1} (página ${Math.floor(m / fotosPorHoja) + 1})`);
                            pdf.addPage('letter', 'portrait');
                            // Recalcular posición para la nueva página
                            col = 0;
                            fila = 0;
                            x = 0;
                            y = 0;
                        }
                    
                    // DIAGNÓSTICO: Información de la imagen
                    console.log(`\n� AÑADIENDO IMAGEN ${m + 1}:`);
                    console.log(`   � Página: ${Math.floor(m / fotosPorHoja) + 1}`);
                    console.log(`   � Posición en página: ${posicionEnPagina + 1}/9`);
                    console.log(`   📍 Coordenadas: (${x}, ${y})`);
                    console.log(`   📏 Tamaño: ${imagenesMosaico[m] ? imagenesMosaico[m].length : 'NULL'} chars`);
                        
                        try {
                            if (imagenesMosaico[m] && imagenesMosaico[m] !== null && imagenesMosaico[m].length > 100) {
                                const esDataUrlValido = imagenesMosaico[m].startsWith('data:image/');
                                const tieneContenido = imagenesMosaico[m].includes(',') && imagenesMosaico[m].split(',')[1].length > 50;
                                
                                if (esDataUrlValido && tieneContenido) {
                                    pdf.addImage(imagenesMosaico[m], 'WEBP', x, y, anchoCelda, altoCelda);
                                    window.imagenesAñadidasAlPdf++; // Incrementar contador
                                    console.log(`   ✅ Imagen ${m + 1} añadida exitosamente (Total en PDF: ${window.imagenesAñadidasAlPdf})`);
                                } else {
                                    console.log(`   ❌ IMAGEN ${m + 1} RECHAZADA - DataURL inválido`);
                                    
                                    // Marcador visual para imagen inválida
                                    pdf.setFillColor(255, 200, 200);
                                    pdf.rect(x, y, anchoCelda, altoCelda, 'F');
                                    pdf.setTextColor(255, 0, 0);
                                    pdf.setFontSize(6);
                                    pdf.text(`IMG ${m + 1} ERROR`, x + 2, y + 8);
                                    pdf.setTextColor(0, 0, 0);
                                }
                            } else {
                                const razonFallo = !imagenesMosaico[m] ? 'NULL/UNDEFINED' : 
                                                  imagenesMosaico[m] === null ? 'MARCADO COMO NULL' : 
                                                  'TAMAÑO INSUFICIENTE';
                                console.log(`   ❌ IMAGEN ${m + 1} INVÁLIDA - ${razonFallo}`);
                                
                                // Marcador visual para imagen faltante
                                pdf.setFillColor(255, 255, 200);
                                pdf.rect(x, y, anchoCelda, altoCelda, 'F');
                                pdf.setTextColor(255, 140, 0);
                                pdf.setFontSize(6);
                                pdf.text(`SIN IMG ${m + 1}`, x + 2, y + 8);
                                pdf.text(`(${razonFallo})`, x + 2, y + 14);
                                pdf.setTextColor(0, 0, 0);
                            }
                        } catch (error) {
                            console.log(`   💥 ERROR CRÍTICO en imagen ${m + 1}:`, error);
                            
                            // Marcador visual para error
                            pdf.setFillColor(255, 150, 150);
                            pdf.rect(x, y, anchoCelda, altoCelda, 'F');
                            pdf.setTextColor(150, 0, 0);
                            pdf.setFontSize(6);
                            pdf.text(`ERROR ${m + 1}`, x + 2, y + 8);
                            pdf.text(`${error.name}`, x + 2, y + 14);
                            pdf.setTextColor(0, 0, 0);
                        }
                    }
                }
                
                // RESUMEN ESTADÍSTICO FINAL COMPLETO
                console.log(`\n📊 ============ RESUMEN FINAL DE PROCESAMIENTO ============`);
                console.log(`🖼️  Total de imágenes seleccionadas: ${imagenesSeleccionadas.length}`);
                console.log(`✅ Imágenes procesadas exitosamente: ${window.contadorImagenesExitosas || imagenesProcesadas.length}`);
                console.log(`❌ Imágenes que fallaron: ${window.contadorImagenesFallidas || (imagenesUnicas.length - imagenesProcesadas.length)}`);
                console.log(`📄 Total de espacios en PDF: ${imagenesProcesadas.length}`);
                
                // Reporte detallado de imágenes fallidas
                if (window.imagenesFallidasPDF && window.imagenesFallidasPDF.length > 0) {
                    console.log(`\n🚨 ANÁLISIS DETALLADO DE IMÁGENES FALLIDAS:`);
                    window.imagenesFallidasPDF.forEach(img => {
                        console.log(`   💀 Imagen ${img.indice}: ${img.razon}`);
                        console.log(`      📄 Fuente: ${img.imagenOriginal}...`);
                    });
                } else {
                    console.log(`\n✅ ¡EXCELENTE! No se detectaron imágenes fallidas específicas`);
                }
                
                // Análisis detallado basado en el mapeo de imágenes procesadas
                for (let idx = 0; idx < imagenesUnicas.length; idx++) {
                    const imagenProcesada = imagenesProcesadas.find(img => img.indice === idx);
                    if (!imagenProcesada) {
                        console.log(`   🚨 Imagen ${idx + 1}: FALTANTE EN PROCESAMIENTO - Esto causará un espacio vacío`);
                    }
                }
                
                console.log(`📊 ============ FIN RESUMEN ============\n`);
                
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
                // Log eliminado
                
                // Contar páginas completas y de mosaico para el resumen
                var paginasCompletasCount = imagenesProcesadas.filter(function(img) { return img.esPantallaCompleta; }).length;
                var imagenesMosaicoCount = imagenesProcesadas.filter(function(img) { return !img.esPantallaCompleta; }).length;
                var paginasMosaicoCount = Math.ceil(imagenesMosaicoCount / fotosPorHoja);
                
                // Log eliminado');
                // Log eliminado
                
                // Esperar a que el modal complete su animación antes de descargar
                setTimeout(() => {
                    // NUEVO: Obtener estadísticas del control total
                    let estadisticasControl = null;
                    if (typeof window.obtenerReportePDF === 'function') {
                        estadisticasControl = window.obtenerReportePDF();
                        console.log('\n🛡️ ESTADÍSTICAS CONTROL TOTAL:', estadisticasControl);
                    }
                    
                    // NUEVO: Generar blob del PDF para verificación antes de guardar
                    const pdfBlob = pdf.output('blob');
                    
                    // NUEVO: Ejecutar verificación automática de concordancia
                    if (typeof window.verificarConcordanciaPDF === 'function') {
                        console.log('\n🔍 EJECUTANDO VERIFICACIÓN AUTOMÁTICA...');
                        const resultadoVerificacion = window.verificarConcordanciaPDF(pdfBlob);
                        
                        // Mostrar resultado en consola de forma destacada
                        console.log(`\n📊 RESULTADO FINAL: ${resultadoVerificacion.dentro_del_limite ? 'APROBADO' : 'RECHAZADO'}`);
                        console.log(`📄 PDF generado: ${resultadoVerificacion.tamaño_real_mb}MB con ${resultadoVerificacion.imagenes_controladas} fotos`);
                        
                        // Comparar con estadísticas del control total
                        if (estadisticasControl) {
                            console.log(`🛡️ Control total reporta: ${estadisticasControl.tamaño_final_mb}MB con ${estadisticasControl.control_imagenes.imagenes_controladas} imágenes`);
                            console.log(`🚫 Imágenes rechazadas por control: ${estadisticasControl.control_imagenes.imagenes_bloqueadas}`);
                        }
                        
                        if (!resultadoVerificacion.dentro_del_limite) {
                            console.error('🚫 ERROR: PDF excede el límite de 5MB');
                        }
                    }
                    
                    // **VERIFICACIÓN FINAL**: Comprobar tamaño antes de guardar
                    const pdfBlobFinal = pdf.output('blob');
                    const tamañoFinalMB = (pdfBlobFinal.size / (1024 * 1024)).toFixed(2);
                    
                    console.log(`🔍 VERIFICACIÓN FINAL: PDF de ${tamañoFinalMB}MB`);
                    
                    if (pdfBlobFinal.size > (5 * 1024 * 1024)) {
                        console.error(`🚨 ALERTA: PDF excede 5MB (${tamañoFinalMB}MB)`);
                        alert(`⚠️ PROBLEMA: El PDF generado pesa ${tamañoFinalMB}MB, excediendo el límite de 5MB.\n\nEsto indica que hay imágenes no controladas en el sistema.\n\nPor favor:\n1. Recarga la página\n2. Intenta con menos fotos\n3. Reporta este problema`);
                        
                        // Restaurar control
                        if (typeof window.restaurarControlTotal === 'function') {
                            window.restaurarControlTotal();
                        }
                        return;
                    }
                    
                    console.log(`✅ PDF aprobado: ${tamañoFinalMB}MB (dentro del límite)`);
                    
                    // Obtener reporte final del sistema
                    if (typeof window.obtenerReportePDF === 'function') {
                        const reporteFinal = window.obtenerReportePDF();
                        console.log('\n📊 REPORTE FINAL DEL SISTEMA:', reporteFinal);
                    }
                    
                    // Restaurar control total
                    if (typeof window.restaurarControlTotal === 'function') {
                        const statsFinales = window.restaurarControlTotal();
                        console.log('\n📋 RESUMEN FINAL DEL CONTROL:', statsFinales);
                    }
                    
                    // RESUMEN FINAL DE GENERACIÓN DE PDF
                    console.log('\n🎯 RESUMEN FINAL DE GENERACIÓN DE PDF:');
                    console.log(`📤 Imágenes originales seleccionadas: ${imagenesSeleccionadas.length}`);
                    console.log(`🔧 Imágenes únicas después de deduplicación: ${imagenesUnicas.length}`);
                    console.log(`✅ Imágenes procesadas exitosamente: ${window.contadorImagenesExitosas || imagenesProcesadas.length}`);
                    
                    // Contar imágenes realmente añadidas al PDF
                    let imagenesEnPdf = 0;
                    // Este contador debería haber sido incrementado en cada addImage exitoso
                    if (window.imagenesAñadidasAlPdf) {
                        imagenesEnPdf = window.imagenesAñadidasAlPdf;
                        console.log(`📄 Imágenes realmente añadidas al PDF: ${imagenesEnPdf}`);
                        
                        if (imagenesEnPdf < imagenesUnicas.length) {
                            console.warn(`⚠️ ATENCIÓN: ${imagenesUnicas.length - imagenesEnPdf} imágenes NO aparecerán en el PDF`);
                        }
                    }
                    
                    // Ejecutar la descarga solo si pasa todas las verificaciones
                    pdf.save('Formato_Digitalizado_' + fechaActual + reporte + '.pdf');
                    
                    // Restaurar el botón después de un breve delay
                    setTimeout(() => {
                        const btn = document.getElementById('btnGenerarPDF');
                        if (btn) {
                            btn.disabled = false;
                            btn.textContent = 'Generar PDF de fotos';
                        }
                        // Log eliminado
                    }, 500);
                    
                }, 1000); // Esperar 1 segundo para que el modal termine su animación
                
            }, 200);
            return;
        }        
        // Comenzar el procesamiento de esta imagen (progreso controlado)
        // Usar progreso manual en lugar del modo continuo para mayor control
        if (window.pdfProgressManager) {
            // Calcular progreso basado en imagen que está por procesarse
            var progresoInicio = (indice / imagenesUnicas.length) * 80; // 80% para imágenes
            window.pdfProgressManager.actualizarProgreso(progresoInicio + 1);
        }
        
        // Determinar si esta imagen debe ir en pantalla completa usando solo la configuración global
        var esPantallaCompleta = pantallaCompletaGlobal;
        
        console.log(`🔍 PROCESANDO IMAGEN ${indice + 1}: Pantalla completa = ${esPantallaCompleta}`);
        
        agregarImagenAlPDF(imagenesUnicas[indice], indice, imagenesUnicas.length, function(dataUrl) {
            // DIAGNÓSTICO ULTRA-DETALLADO - FORZADO
            console.log(`\n🔍 CALLBACK IMAGEN ${indice + 1}/${imagenesUnicas.length}:`);
            console.log(`   ✓ Recibido dataUrl: ${dataUrl ? 'SÍ' : 'NO (NULL)'}`);
            
            if (dataUrl) {
                console.log(`   📏 Tamaño dataUrl: ${dataUrl.length} chars`);
                console.log(`   🎯 Tipo: ${dataUrl.substring(0, 50)}...`);
                console.log(`   📱 Es válido data URL: ${dataUrl.startsWith('data:image/')}`);
                console.log(`   ✅ IMAGEN ${indice + 1} PROCESADA EXITOSAMENTE`);
                window.contadorImagenesExitosas++;
                
                // **CORREGIDO**: NO agregar inmediatamente al PDF, mantener orden original
                // Guardar información de la imagen procesada con su índice original
                imagenesProcesadas.push({
                    indice: indice,
                    dataUrl: dataUrl,
                    esPantallaCompleta: esPantallaCompleta
                });
                
                console.log(`✅ ÉXITO: Imagen ${indice + 1} procesada correctamente y añadida a la lista (Total: ${imagenesProcesadas.length})`);
            } else {
                console.log(`❌ FALLO CRÍTICO: Imagen ${indice + 1} devolvió NULL`);
                console.log(`   🚨 Esta imagen NO se añadirá al PDF`);
                console.log(`   ⚠️ PERO el espacio puede quedar reservado causando hueco vacío`);
                console.log(`   📍 Índice original: ${indice}, Imagen fuente: ${imagenesUnicas[indice].substring(0, 100)}...`);
                
                // NUEVO: Diagnóstico para imagen fallida - FORZADO SIEMPRE
                console.warn(`💀 IMAGEN ${indice + 1} COMPLETAMENTE FALLIDA - CAUSARÁ ESPACIO VACÍO EN PDF`);
                window.contadorImagenesFallidas++;
                
                // Registrar la imagen fallida para el reporte final
                if (!window.imagenesFallidasPDF) window.imagenesFallidasPDF = [];
                window.imagenesFallidasPDF.push({
                    indice: indice + 1,
                    imagenOriginal: imagenesUnicas[indice].substring(0, 200),
                    razon: 'Callback devolvió NULL'
                });
            }
              
            // Actualizar progreso cuando la imagen se complete
            if (window.pdfProgressManager) {
                // Usar actualizarProgresoDesdeImagenes para mantener el límite del 85%
                window.pdfProgressManager.actualizarProgresoDesdeImagenes(indice, imagenesUnicas.length);
                // Log eliminado
            }
            
            // Continuar procesando la siguiente imagen
            procesarImagenes(indice + 1, imagenesProcesadas, enMosaico, paginasCompletas);
        });}
      // Pequeño delay para que el usuario vea el 0% antes de empezar el procesamiento
    setTimeout(() => {        // Comenzar con 1% para dar feedback inmediato
        if (window.pdfProgressManager) {
            window.pdfProgressManager.iniciarProgreso();
        }
        
        // **NUEVO**: Inicializar con array para mantener orden original
        procesarImagenes(0, [], [], []); // [índice, imagenesProcesadas, enMosaico (no usado), paginasCompletas (no usado)]
    }, 150);
    
    } catch (error) {
        // Log eliminado
        showMessage('Error al generar el PDF: ' + error.message);
        
        // Ocultar el modal de progreso en caso de error
        if (window.pdfProgressManager) {
            window.pdfProgressManager.manejarError();
        }
    }
}

// **NUEVO**: Función para agregar imagen RIJ al PDF - MANTIENE FUNCIONALIDAD ORIGINAL
async function agregarImagenRIJalPDF(pdf, urlImagen) {
    return new Promise((resolve, reject) => {
        // Buscar imagen RIJ por identificador
        const identificador = localStorage.getItem('usuario_identificador_rij');
        const imagenDisponible = localStorage.getItem('rij_imagen_url');
        
        if (!identificador && !imagenDisponible) {
            console.log('🚫 No hay imagen RIJ para agregar');
            resolve(); // No hay identificador, continuar sin imagen
            return;
        }

        console.log('📋 AGREGANDO IMAGEN RIJ AL PDF...');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            try {
                // Calcular dimensiones para ajustar a página completa
                const anchoHoja = 216; // mm
                const altoHoja = 279; // mm
                
                // **MANTENER FUNCIONALIDAD ORIGINAL**: Si no hay sistema de control, usar método original
                if (typeof window.procesarImagenParaPDF !== 'function' || !window.pdfSizeController) {
                    console.log('� Usando método original para imagen RIJ (sin control de tamaño)');
                    pdf.addImage(img, 'PNG', 0, 0, anchoHoja, altoHoja);
                    resolve();
                    return;
                }
                
                // **NUEVO**: Solo aplicar control de tamaño si está disponible Y es necesario
                const espacioUsado = window.pdfSizeController.estadisticas.tamaño_actual_bytes;
                const espacioDisponible = (5 * 1024 * 1024) - espacioUsado;
                
                // Si hay mucho espacio disponible (>3MB), usar calidad alta sin compresión extrema
                if (espacioDisponible > 3 * 1024 * 1024) {
                    console.log('📋 Mucho espacio disponible, usando calidad alta para RIJ');
                    
                    // Crear canvas con tamaño optimizado pero sin compresión extrema
                    const canvas = document.createElement('canvas');
                    const maxSize = 1500; // Tamaño más generoso
                    const ratio = img.naturalWidth / img.naturalHeight;
                    
                    if (img.naturalWidth > img.naturalHeight) {
                        canvas.width = Math.min(img.naturalWidth, maxSize);
                        canvas.height = canvas.width / ratio;
                    } else {
                        canvas.height = Math.min(img.naturalHeight, maxSize);
                        canvas.width = canvas.height * ratio;
                    }
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Usar calidad alta (0.9) para RIJ
                    canvas.toBlob((blob) => {
                        if (blob) {
                            console.log(`✅ Imagen RIJ procesada con calidad alta: ${(blob.size/1024).toFixed(1)}KB`);
                            window.pdfSizeController.estadisticas.tamaño_actual_bytes += blob.size;
                            
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                pdf.addImage(reader.result, 'JPEG', 0, 0, anchoHoja, altoHoja);
                                resolve();
                            };
                            reader.readAsDataURL(blob);
                        } else {
                            // Fallback al método original
                            console.log('⚠️  Fallback al método original para RIJ');
                            pdf.addImage(img, 'PNG', 0, 0, anchoHoja, altoHoja);
                            resolve();
                        }
                    }, 'image/jpeg', 0.9);
                    
                } else if (espacioDisponible > 1 * 1024 * 1024) {
                    // Si hay espacio moderado (1-3MB), aplicar compresión moderada
                    console.log('📋 Espacio moderado, aplicando compresión moderada a RIJ');
                    
                    const canvas = document.createElement('canvas');
                    const maxSize = 1000;
                    const ratio = img.naturalWidth / img.naturalHeight;
                    
                    if (img.naturalWidth > img.naturalHeight) {
                        canvas.width = Math.min(img.naturalWidth, maxSize);
                        canvas.height = canvas.width / ratio;
                    } else {
                        canvas.height = Math.min(img.naturalHeight, maxSize);
                        canvas.width = canvas.height * ratio;
                    }
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            console.log(`✅ Imagen RIJ con compresión moderada: ${(blob.size/1024).toFixed(1)}KB`);
                            window.pdfSizeController.estadisticas.tamaño_actual_bytes += blob.size;
                            
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                pdf.addImage(reader.result, 'JPEG', 0, 0, anchoHoja, altoHoja);
                                resolve();
                            };
                            reader.readAsDataURL(blob);
                        } else {
                            pdf.addImage(img, 'PNG', 0, 0, anchoHoja, altoHoja);
                            resolve();
                        }
                    }, 'image/jpeg', 0.7);
                    
                } else {
                    // Si hay poco espacio (<1MB), aplicar compresión agresiva
                    console.log('⚠️  Poco espacio disponible, aplicando compresión agresiva a RIJ');
                    
                    const canvas = document.createElement('canvas');
                    const maxSize = 600; // Tamaño más pequeño
                    const ratio = img.naturalWidth / img.naturalHeight;
                    
                    if (img.naturalWidth > img.naturalHeight) {
                        canvas.width = Math.min(img.naturalWidth, maxSize);
                        canvas.height = canvas.width / ratio;
                    } else {
                        canvas.height = Math.min(img.naturalHeight, maxSize);
                        canvas.width = canvas.height * ratio;
                    }
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            console.log(`✅ Imagen RIJ comprimida: ${(blob.size/1024).toFixed(1)}KB`);
                            window.pdfSizeController.estadisticas.tamaño_actual_bytes += blob.size;
                            
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                pdf.addImage(reader.result, 'JPEG', 0, 0, anchoHoja, altoHoja);
                                resolve();
                            };
                            reader.readAsDataURL(blob);
                        } else {
                            pdf.addImage(img, 'PNG', 0, 0, anchoHoja, altoHoja);
                            resolve();
                        }
                    }, 'image/jpeg', 0.4);
                }
                
            } catch (error) {
                console.log('❌ Error procesando imagen RIJ, usando método original:', error);
                // Fallback al método original
                pdf.addImage(img, 'PNG', 0, 0, anchoHoja, altoHoja);
                resolve();
            }
        };
        
        img.onerror = function() {
            console.log('❌ Error cargando imagen RIJ');
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
    // Log eliminado
    
    var imgElementos = document.querySelectorAll('#photosContainer img.foto-principal');
    var promesasConversion = [];
    
    imgElementos.forEach(function(imgEl, index) {
        // Verificar si ya tiene una versión local
        var tieneVersionLocal = imgEl.src.startsWith('data:') ||
                               imgEl.getAttribute('data-local-image') ||
                               imgEl.getAttribute('data-recortada') ||
                               imgEl.getAttribute('data-mejorada');
        
        if (!tieneVersionLocal) {
            // Log eliminado
            
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
                        // Log eliminado
                        resolve();
                    };
                }
            });
            
            promesasConversion.push(promesa);
        } else {
            // Log eliminado
        }
    });
    
    if (promesasConversion.length > 0) {
        // Log eliminado
        await Promise.all(promesasConversion);
        // Log eliminado
    } else {
        // Log eliminado
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
        
        // Log eliminado
        callback();
    } catch (error) {
        // Log eliminado
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
    
    // Log eliminado
    // Log eliminado
    // Log eliminado
    // Log eliminado
    // Log eliminado * 100) + '%');
    
    if (imagenesSinVersionLocal === 0) {
        // Log eliminado
    } else {
        // Log eliminado
    }
    
    return {
        total: imagenesEncontradas,
        optimizadas: imagenesConVersionLocal,
        sinOptimizar: imagenesSinVersionLocal,
        porcentajeOptimizado: Math.round((imagenesConVersionLocal / imagenesEncontradas) * 100)
    };
}


