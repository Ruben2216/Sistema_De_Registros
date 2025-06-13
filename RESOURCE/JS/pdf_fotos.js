function generarPDFConFotos() {
    var fotos = document.querySelectorAll('#photosContainer img');
    if (fotos.length === 0) {
        alert('No hay fotos para exportar.');
        return;
    }

    if (typeof window.jspdf === 'undefined') {
        alert('jsPDF no está cargado. Asegúrate de incluir la librería jsPDF.');
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

    function aplicarFiltroCamScanner(img, calidad, maxLado, callback) {
        const ratio = img.naturalWidth / img.naturalHeight;
        const nuevoAncho = ratio > 1 ? Math.min(maxLado, img.naturalWidth) : maxLado * ratio;
        const nuevoAlto = ratio > 1 ? maxLado / ratio : Math.min(maxLado, img.naturalHeight);

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(nuevoAncho);
        canvas.height = Math.round(nuevoAlto);
        const ctx = canvas.getContext('2d');

        // Dibujar imagen original
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Obtener datos de pixeles
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Filtro tipo escáner: realce de bordes y aumento de contraste
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i + 1], b = data[i + 2];
            let gray = (r + g + b) / 3;

            // Aumentar contraste
            gray = gray > 127 ? 255 : 0;

            // Aplicar a RGB
            data[i] = data[i + 1] = data[i + 2] = gray;
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(function(blob) {
            const reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            };
            reader.readAsDataURL(blob);
        }, 'image/webp', calidad);
    }

    function convertirAWebpReducida(img, calidad, maxLado, callback) {
        const ratio = img.naturalWidth / img.naturalHeight;
        const nuevoAncho = ratio > 1 ? Math.min(maxLado, img.naturalWidth) : maxLado * ratio;
        const nuevoAlto = ratio > 1 ? maxLado / ratio : Math.min(maxLado, img.naturalHeight);

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(nuevoAncho);
        canvas.height = Math.round(nuevoAlto);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(function(blob) {
            const reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            };
            reader.readAsDataURL(blob);
        }, 'image/webp', calidad);
    }

    function procesarImagenes(indice, imagenesWebp) {
        if (indice >= fotos.length) {
            if (fotos.length <= 3) {
                for (let j = 0; j < imagenesWebp.length; j++) {
                    pdf.addImage(imagenesWebp[j], 'WEBP', 0, 0, anchoHoja, altoHoja);
                    if (j !== imagenesWebp.length - 1) {
                        pdf.addPage('letter', 'portrait');
                    }
                }
                pdf.save('fotos_capturadas.pdf');
                return;
            }

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

            pdf.save('fotos_capturadas.pdf');
            return;
        }

        if (fotos.length <= 3) {
            aplicarFiltroCamScanner(fotos[indice], 0.7, Math.max(fotos[indice].naturalWidth, fotos[indice].naturalHeight), function(dataUrlWebp) {
                imagenesWebp.push(dataUrlWebp);
                procesarImagenes(indice + 1, imagenesWebp);
            });
        } else {
            convertirAWebpReducida(fotos[indice], 0.5, 1024, function(dataUrlWebp) {
                imagenesWebp.push(dataUrlWebp);
                procesarImagenes(indice + 1, imagenesWebp);
            });
        }
    }

    procesarImagenes(0, []);
}

window.addEventListener('DOMContentLoaded', function() {
    var botonPDF = document.getElementById('btnGenerarPDF');
    if (botonPDF) {
        botonPDF.addEventListener('click', generarPDFConFotos);
    }
});
