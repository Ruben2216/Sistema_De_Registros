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

    const btn = document.getElementById('btnGenerarPDF');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Procesando imágenes...';
    }

    if (typeof window.jspdf === 'undefined') {
        showMessage('jsPDF no está cargado. Asegúrate de incluir la librería jsPDF en tu HTML.');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Generar PDF de fotos';
        }
        return;
    }

    var { jsPDF } = window.jspdf;
    var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    var anchoHoja = 216;
    var altoHoja = 279;
    var fotosPorHoja = 6;
    var columnas = 2;
    var filas = 3;
    var anchoCelda, altoCelda;

    var aspectoFoto = 4 / 3;
    // Usar la primera imagen seleccionada para calcular el aspecto
    var primeraSeleccionada = null;
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
    for (var i = 0; i < fotos.length; i++) {
        var imgSeleccionada = fotos[i].querySelector('img.foto-principal');
        if (imgSeleccionada) {
            imagenesSeleccionadas.push(imgSeleccionada.src);
        }
    }

    // Eliminar duplicados exactos (por si alguna foto se repite)
    var imagenesUnicas = imagenesSeleccionadas.filter(function(value, index, self) {
        return self.indexOf(value) === index;
    });

    function agregarImagenAlPDF(imagen, callback) {
        if (imagen.startsWith('data:')) {
            callback(imagen);
        } else {
            fetch(imagen, { credentials: 'include' })
                .then(function(response) { return response.blob(); })
                .then(function(blob) {
                    var reader = new FileReader();
                    reader.onloadend = function() {
                        callback(reader.result);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(function() {
                    callback(null);
                });
        }
    }

    function procesarTodasLasImagenes(indice, imagenesProcesadas) {
        if (indice >= imagenesUnicas.length) {
            if (imagenesProcesadas.length <= 3) {
                for (let j = 0; j < imagenesProcesadas.length; j++) {
                    pdf.addImage(imagenesProcesadas[j], 'WEBP', 0, 0, anchoHoja, altoHoja);
                    if (j !== imagenesProcesadas.length - 1) {
                        pdf.addPage('letter', 'portrait');
                    }
                }
            } else {
                for (let i = 0; i < imagenesProcesadas.length; i++) {
                    let col = i % columnas;
                    let fila = Math.floor((i % fotosPorHoja) / columnas);
                    let x = col * anchoCelda;
                    let y = fila * altoCelda;
                    pdf.addImage(imagenesProcesadas[i], 'WEBP', x, y, anchoCelda, altoCelda);
                    if ((i + 1) % fotosPorHoja === 0 && i !== imagenesProcesadas.length - 1) {
                        pdf.addPage('letter', 'portrait');
                    }
                }
            }
            var hoy = new Date();
            var año = hoy.getFullYear();
            var mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
            var dia = hoy.getDate().toString().padStart(2, '0');
            var fechaActual = dia + '-' + mes + '-' + año;
            pdf.save('Formato_Digitalizado_' + fechaActual + '.pdf');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Generar PDF de fotos';
            }
            return;
        }
        agregarImagenAlPDF(imagenesUnicas[indice], function(dataUrl) {
            if (dataUrl) {
                imagenesProcesadas.push(dataUrl);
            }
            procesarTodasLasImagenes(indice + 1, imagenesProcesadas);
        });
    }

    procesarTodasLasImagenes(0, []);
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

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', asignarEventoPDF);
} else {
    asignarEventoPDF();
}

