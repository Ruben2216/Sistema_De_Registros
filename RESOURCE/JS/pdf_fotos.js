let opencvReady = false; // Variable global para controlar la carga de OpenCV

// Esto garantiza que todas las funciones de `cv` (como `cv.imread`) estén disponibles.
if (typeof cv !== 'undefined') {
    cv.onRuntimeInitialized = function() {
        opencvReady = true;
        console.log('OpenCV.js está completamente listo (onRuntimeInitialized).');
        // Habilitar el botón de generar PDF una vez que OpenCV.js esté listo
        const btn = document.getElementById('btnGenerarPDF');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Generar PDF de fotos'; // Restaurar texto si se cambió
        }
    };
} else {
    // Si cv no está definido aún, esperar a que el script de OpenCV.js lo defina
    window.addEventListener('DOMContentLoaded', function() {
        function checkOpenCVLoaded() {
            if (typeof cv !== 'undefined' && cv.onRuntimeInitialized) {
                cv.onRuntimeInitialized = function() {
                    opencvReady = true;
                    console.log('OpenCV.js está completamente listo (onRuntimeInitialized, fallback).');
                    const btn = document.getElementById('btnGenerarPDF');
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = 'Generar PDF de fotos';
                    }
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
    if (!opencvReady) {
        // Mostrar mensaje si OpenCV.js no está cargado
        showMessage('OpenCV.js aún no está cargado. Por favor, espera y vuelve a intentarlo.');
        callback(null); // Retornar null para indicar que el procesamiento falló
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
        console.error("Error durante el procesamiento OpenCV.js:", e);
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
function generarPDFConFotos() {
    var fotos = document.querySelectorAll('#photosContainer .photo-wrapper');
    if (fotos.length === 0) {
        showMessage('No hay fotos para exportar. Por favor, toma algunas imágenes.');
        return;
    }
    
    // Deshabilitar el botón y mostrar el modal de progreso
    const btn = document.getElementById('btnGenerarPDF');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Generando PDF...';
    }    // Mostrar el modal de progreso circular
    if (window.pdfProgressManager) {
        window.pdfProgressManager.reiniciar(); // Asegurar estado limpio
        window.pdfProgressManager.mostrar();
    }
    
    if (typeof window.jspdf === 'undefined') {
        showMessage('jsPDF no está cargado. Asegúrate de incluir la librería jsPDF en tu HTML.');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Generar PDF de fotos';
        }        // Ocultar el modal de progreso
        if (window.pdfProgressManager) {
            window.pdfProgressManager.manejarError();
        }
        return;
    }
    var { jsPDF } = window.jspdf;
    var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });    var anchoHoja = 216;
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
            break;
        }
    }
    altoCelda = altoHoja / filas;
    anchoCelda = altoCelda * aspectoFoto;
    if (anchoCelda * columnas > anchoHoja) {
        anchoCelda = anchoHoja / columnas;
        altoCelda = anchoCelda / aspectoFoto;
    }
    // Obtener solo la versión seleccionada de cada foto (la que se muestra en grande)
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
    // Eliminar duplicados exactos (por si alguna foto se repite)
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
    // Función para agregar una imagen al PDF
    function agregarImagenAlPDF(imagen, callback) {
        if (imagen.startsWith('data:image/webp')) {
            callback(imagen);
            return;
        }
        if (imagen.startsWith('data:')) {
            var img = new window.Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                callback(webpDataUrl);
            };
            img.src = imagen;
            return;
        }
        fetch(imagen, { credentials: 'include' })
            .then(function(response) { return response.blob(); })
            .then(function(blob) {
                var reader = new FileReader();
                reader.onloadend = function() {
                    var img = new window.Image();
                    img.onload = function() {
                        var canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                        callback(webpDataUrl);
                    };
                    img.src = reader.result;
                };
                reader.readAsDataURL(blob);
            })
            .catch(function() {
                callback(null);
            });
    }    // Procesar imágenes según el modo global o por foto
    function procesarImagenes(indice, imagenesProcesadas, enMosaico, mosaicoPendiente) {        
        if (indice >= imagenesUnicas.length) {            // Entrar en fase final de generación con progreso fluido
            if (window.pdfProgressManager) {
                const progresoActual = window.pdfProgressManager.obtenerProgresoActual();
                window.pdfProgressManager.iniciarFaseFinal(progresoActual);
            }
            
            // Continuar con la generación del PDF sin delays adicionales
            // (el progreso ya está siendo manejado automáticamente)
            setTimeout(() => {
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
                    }                }
                
                // Guardar PDF (el progreso se maneja automáticamente en las fases)
                var hoy = new Date();
                var año = hoy.getFullYear();
                var mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
                var dia = hoy.getDate().toString().padStart(2, '0');
                var fechaActual = dia + '-' + mes + '-' + año;
                pdf.save('Formato_Digitalizado_' + fechaActual + '.pdf');
                
                // Restaurar el botón (el modal se ocultará automáticamente)
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Generar PDF de fotos';
                }
                
            }, 200); // Pequeño delay solo para permitir que se vea la transición de fase
            return;
        }        // Comenzar el procesamiento de esta imagen (progreso continuo)
        if (window.pdfProgressManager) {
            window.pdfProgressManager.iniciarProcesamientoImagen(indice, imagenesUnicas.length);
        }
        
        agregarImagenAlPDF(imagenesUnicas[indice], function(dataUrl) {
            if (dataUrl) {
                if (pantallaCompletaGlobal) {
                    pdf.addImage(dataUrl, 'WEBP', 0, 0, anchoHoja, altoHoja);
                    if (indice !== imagenesUnicas.length - 1) {
                        pdf.addPage('letter', 'portrait');
                    }
                } else if (pantallaCompletaUnica[indice]) {
                    // Si hay fotos en mosaico pendientes, agrégalas antes de la hoja completa
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
                    enMosaico.push(dataUrl);
                }                imagenesProcesadas.push(dataUrl);
            }
              // Finalizar el progreso de esta imagen específica
            if (window.pdfProgressManager) {
                window.pdfProgressManager.finalizarProcesamientoImagen(indice, imagenesUnicas.length);
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
}

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
        console.error("Error en filtro mejorado para documentos con fondo de color:", e);
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
        console.error("Error en filtro para documentos con colores:", e);
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
        console.error("Error en filtro para documentos con mala iluminación:", e);
        showMessage("Error al procesar la imagen: " + e.message);
        callback(null);
    } finally {
        if (src && typeof src.delete === 'function') { try { src.delete(); } catch (e) {} }
        if (gray && typeof gray.delete === 'function') { try { gray.delete(); } catch (e) {} }
        if (finalDst && typeof finalDst.delete === 'function') { try { finalDst.delete(); } catch (e) {} }
    }
}


