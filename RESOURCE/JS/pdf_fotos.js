// /RESOURCE/JS/pdf_fotos.js

// Asegúrate de que jsPDF y OpenCV.js estén cargados antes de usarlo.
// jsPDF se carga a través de un script tag en el HTML.
// OpenCV.js se carga de forma asíncrona, y necesitamos esperar a que esté listo.

let opencvReady = false; // Variable global para controlar la carga de OpenCV

// Definir el callback onRuntimeInitialized para OpenCV.js.
// Este callback se ejecuta cuando el módulo WebAssembly de OpenCV.js
// y su entorno de ejecución están completamente cargados e inicializados.
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

/**
 * Aplica un filtro avanzado para mejorar la calidad de fotos de documentos utilizando OpenCV.js.
 * Este filtro busca: mejor contraste, fondo más blanco, texto más visible y eliminación de ruido.
 * Preserva colores si es necesario, pero la binarización adaptativa es en escala de grises para máxima legibilidad.
 * @param {HTMLImageElement} img - La imagen a procesar.
 * @param {number} calidad - Calidad de la imagen de salida (0.0 a 1.0).
 * @param {number} maxLado - El lado máximo (ancho o alto) de la imagen procesada.
 * @param {function(string):void} callback - Función de retorno que recibe la imagen como Data URL.
 */
function aplicarFiltroDocumento(img, calidad, maxLado, callback) {
    if (!opencvReady) {
        // Aunque el botón esté deshabilitado, esta verificación extra es buena
        showMessage('OpenCV.js aún no está cargado. Por favor, espera y vuelve a intentarlo.');
        callback(null); // Retorna null para indicar que el procesamiento falló
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
    let dst = new cv.Mat(); // Matriz de destino para el resultado
    let finalDst = null; // Inicializar finalDst a null

    try {
        // --- PROCESAMIENTO DE IMAGEN CON OPENCV.JS ---

        // 1. Convertir a escala de grises
        // Para la binarización adaptativa y la mejora del contraste de documentos,
        // la conversión a escala de grises es esencial para un resultado óptimo.
        // Si necesitas mantener los colores (aunque no es lo ideal para "documentos"),
        // puedes omitir este paso y ajustar los parámetros de brillo/contraste globalmente.
        // Sin embargo, para texto nítido y fondo blanco puro, escala de grises es superior.
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
        src.delete(); // Liberar memoria de src

        // 2. Reducción de ruido con filtro Gaussiano
        // Suaviza la imagen para eliminar el ruido sin perder demasiado detalle.
        // Ajusta el tamaño del kernel (e.g., new cv.Size(5, 5)) según la cantidad de ruido.
        cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

        // 3. Binarización adaptativa
        // Esta es la clave para un fondo blanco y texto negro puro, incluso con iluminación desigual.
        // cv.ADAPTIVE_THRESH_GAUSSIAN_C: El umbral es la media ponderada gaussiana de los vecinos.
        // cv.THRESH_BINARY: Convierte píxeles por encima del umbral a valor máximo (255) y por debajo a 0.
        // blockSize: Tamaño de la vecindad para calcular el umbral (debe ser impar).
        // C: Constante sustraída de la media o media ponderada. Ajusta este valor para el contraste.
        cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

        // Opcional: Invertir si el documento es texto claro sobre fondo oscuro (ej. modo noche)
        // cv.bitwise_not(dst, dst);

        // 4. Operaciones morfológicas (opcional, para limpiar ruido fino o rellenar huecos)
        // Puedes agregar estos pasos si observas ruido residual o pequeños huecos en el texto.
        // let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        // cv.erode(dst, dst, kernel); // Eliminar pequeños puntos blancos de ruido
        // cv.dilate(dst, dst, kernel); // Rellenar pequeños huecos en el texto

        // kernel.delete(); // Liberar memoria del kernel

        // Convertir la imagen procesada (que ahora está en escala de grises/binaria)
        // de nuevo a RGBA para que pueda ser mostrada en el canvas y exportada.
        // Los píxeles binarios (0 o 255) se mapearán a blanco y negro puro.
        finalDst = new cv.Mat(); // Asignar a la variable declarada fuera del try
        cv.cvtColor(dst, finalDst, cv.COLOR_GRAY2RGBA, 0);


        // Crear un canvas para el resultado final y dibujarlo
        const resultCanvas = document.createElement('canvas');
        cv.imshow(resultCanvas, finalDst); // Dibuja la Mat de OpenCV en el canvas

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
        // En caso de error, voy a devolver la imagen original para que el PDF no falle completamente.
        // Es importante que la imagen 'img' sea un elemento HTMLImageElement válido.
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
 * Ahora aplica el filtro de mejora de calidad con OpenCV.js a todas las imágenes.
 */
function generarPDFConFotos() {
    var fotos = document.querySelectorAll('#photosContainer img');
    if (fotos.length === 0) {
        showMessage('No hay fotos para exportar. Por favor, toma algunas imágenes.');
        return;
    }

    // Deshabilita el botón mientras se procesan las imágenes para evitar clics múltiples
    const btn = document.getElementById('btnGenerarPDF');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Procesando imágenes...';
    }


    if (!opencvReady) {
        // Esta condición debería ser manejada por cv.onRuntimeInitialized, pero se mantiene como un
        // doble chequeo por si acaso y para el mensaje al usuario.
        showMessage('OpenCV.js aún no está cargado. Por favor, espera y vuelve a intentarlo. El botón se habilitará automáticamente.');
        if (btn) { // Si el botón está deshabilitado por nosotros, lo volvemos a habilitar para que no se quede atascado
             btn.disabled = false;
             btn.textContent = 'Generar PDF de fotos';
        }
        return;
    }

    // Verificar si jsPDF está cargado
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
    if (fotos.length > 0) {
        var img = fotos[0];
        if (img.naturalWidth && img.naturalHeight) {
            aspectoFoto = img.naturalWidth / img.naturalHeight;
        }
    }

    altoCelda = altoHoja / filas;
    anchoCelda = altoCelda * aspectoFoto;

    if (anchoCelda * columnas > anchoHoja) {
        anchoCelda = anchoHoja / columnas;
        altoCelda = anchoCelda / aspectoFoto;
    }

    /**
     * Es una función recursiva para manejar la asincronía de la conversión de imágenes.
     * @param {number} indice - El índice de la foto actual a procesar.
     * @param {Array<string>} imagenesWebp - Array que almacena las imágenes procesadas como Data URLs.
     */
    function procesarImagenes(indice, imagenesWebp) {
        if (indice >= fotos.length) {
            // Re-habilitar el botón una vez que el PDF se ha generado
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Generar PDF de fotos';
            }

            if (fotos.length <= 3) {
                for (let j = 0; j < imagenesWebp.length; j++) {
                    pdf.addImage(imagenesWebp[j], 'WEBP', 0, 0, anchoHoja, altoHoja);
                    if (j !== imagenesWebp.length - 1) {
                        pdf.addPage('letter', 'portrait');
                    }
                }
            } else {
                for (let i = 0; i < imagenesWebp.length; i++) {
                    let col = i % columnas;
                    let fila = Math.floor((i % fotosPorHoja) / columnas);
                    let x = col * anchoCelda;
                    let y = fila * altoCelda;
                    pdf.addImage(imagenesWebp[i], 'WEBP', x, y, anchoCelda, altoCelda);

                    if ((i + 1) % fotosPorHoja === 0 && i !== imagenesWebp.length - 1) {
                        pdf.addPage('letter', 'portrait');
                    }
                }
            }
            pdf.save('fotos_documento_mejoradas.pdf');
            return;
        }

        // Aplica el filtro mejorado con OpenCV.js a todas las fotos sin importar la cantidad.
        // La calidad de 0.7 es un buen equilibrio para documentos.
        aplicarFiltroDocumento(fotos[indice], 0.7, Math.max(fotos[indice].naturalWidth, fotos[indice].naturalHeight), function(dataUrlWebp) {
            if (dataUrlWebp) { // Solo si el procesamiento con OpenCV fue exitoso
                imagenesWebp.push(dataUrlWebp);
            } else {
                // Si hubo un error en OpenCV, se pudo haber devuelto null o la imagen original,
                // por lo que no se añade o se añade una versión fallback si la función aplicarFiltroDocumento lo maneja.
                console.warn(`No se pudo procesar la imagen ${indice} con OpenCV. La imagen podría no ser añadida o se usará una versión original.`);
            }
            procesarImagenes(indice + 1, imagenesWebp); // Continúa con la siguiente imagen
        });
    }

    procesarImagenes(0, []);
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

