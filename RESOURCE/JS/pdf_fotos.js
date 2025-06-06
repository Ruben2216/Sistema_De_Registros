function generarPDFConFotos() {
    // Obtener todas las imágenes capturadas
    var fotos = document.querySelectorAll('#photosContainer img');
    if (fotos.length === 0) {
        alert('No hay fotos para exportar.');
        return;
    }

    // Cargar jsPDF si no está presente
    if (typeof window.jspdf === 'undefined') {
        alert('jsPDF no está cargado. Asegúrate de incluir la librería jsPDF.');
        return;
    }

    var { jsPDF } = window.jspdf;
    var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    // Hoja carta: 
    var anchoHoja = 216;
    var altoHoja = 279;
    var fotosPorHoja = 6;
    var columnas = 2;
    var filas = 3;
    var anchoCelda, altoCelda;

    // Obtener la relación de aspecto de la primera imagen capturada
    var aspectoFoto = 4 / 3; // Valor por defecto (más alto que ancho)
    if (fotos.length > 0) {
        var img = fotos[0];
        if (img.naturalWidth && img.naturalHeight) {
            aspectoFoto = img.naturalWidth / img.naturalHeight;
        }
    }
    altoCelda = altoHoja / filas;
    anchoCelda = altoCelda * aspectoFoto;
    // Si el ancho total se pasa de la hoja, ajustar por ancho
    if (anchoCelda * columnas > anchoHoja) {
        anchoCelda = anchoHoja / columnas;
        altoCelda = anchoCelda / aspectoFoto;
    }

    // Función auxiliar para convertir una imagen a webp, comprimirla y redimensionarla a un tamaño máximo (por ejemplo, 1024px de ancho o alto)
    function convertirAWebpReducida(img, calidad, maxLado, callback) {
        var ratio = img.naturalWidth / img.naturalHeight;
        var nuevoAncho, nuevoAlto;
        if (img.naturalWidth > img.naturalHeight) {
            nuevoAncho = Math.min(maxLado, img.naturalWidth);
            nuevoAlto = nuevoAncho / ratio;
        } else {
            nuevoAlto = Math.min(maxLado, img.naturalHeight);
            nuevoAncho = nuevoAlto * ratio;
        }
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(nuevoAncho);
        canvas.height = Math.round(nuevoAlto);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function(blob) {
            var reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            };
            reader.readAsDataURL(blob);
        }, 'image/webp', calidad);
    }

    // Se ignora la relación de aspecto para que todas tengan el mismo tamaño visual en el PDF.
    var procesarImagenes = function(indice, imagenesWebp) {
        if (indice >= fotos.length) {
            // Si hay 3 o menos imágenes, cada una debe ocupar una página completa tamaño carta
            if (fotos.length <= 3) {
                for (var j = 0; j < imagenesWebp.length; j++) {
                    // Dibuja la imagen ocupando toda la hoja carta (216x279 mm)
                    pdf.addImage(imagenesWebp[j], 'WEBP', 0, 0, anchoHoja, altoHoja);
                    if (j !== imagenesWebp.length - 1) {
                        pdf.addPage('letter', 'portrait');
                    }
                }
                pdf.save('fotos_capturadas.pdf');
                return;
            }
            for (var i = 0; i < imagenesWebp.length; i++) {
                var col = i % columnas;
                var fila = Math.floor((i % fotosPorHoja) / columnas);
                var x = col * anchoCelda;
                var y = fila * altoCelda;
                // Dibuja cada imagen respetando la relación de aspecto original
                pdf.addImage(imagenesWebp[i], 'WEBP', x, y, anchoCelda, altoCelda);
                if ((i + 1) % fotosPorHoja === 0 && i !== imagenesWebp.length - 1) {
                    pdf.addPage('letter', 'portrait');
                }
            }
            pdf.save('fotos_capturadas.pdf');
            return;
        }
        if (fotos.length <= 3) {
            convertirAWebpReducida(fotos[indice], 0.3, Math.max(fotos[indice].naturalWidth, fotos[indice].naturalHeight), function(dataUrlWebp) {
                imagenesWebp.push(dataUrlWebp);
                procesarImagenes(indice + 1, imagenesWebp);
            }); 
        } else {
            // Para más de 3 imágenes, usar calidad estándar (0.5) y máximo 1024px
            convertirAWebpReducida(fotos[indice], 0.5, 1024, function(dataUrlWebp) {
                imagenesWebp.push(dataUrlWebp);
                procesarImagenes(indice + 1, imagenesWebp);
            });
        }
    };
    // Iniciar procesamiento
    procesarImagenes(0, []);
}

// Agregar el evento al botón si existe en el DOM
window.addEventListener('DOMContentLoaded', function() {
    var botonPDF = document.getElementById('btnGenerarPDF');
    if (botonPDF) {
        botonPDF.addEventListener('click', generarPDFConFotos);
    }
});
