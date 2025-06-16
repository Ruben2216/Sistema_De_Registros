
// Array para guardar la decisión del usuario por cada foto ("original" o "mejorada")
window.fotosDecisiones = [];
window.fotosMejoradas = [];

function mostrarModalEditarFoto(indice, dataUrlOriginal, imgElement) {
    var modal = document.getElementById('modal-editar-foto');
    var imgOriginal = document.getElementById('modal-foto-original');
    var imgMejorada = document.getElementById('modal-foto-mejorada');
    var btnCerrar = document.getElementById('btn-cerrar-modal-editar');

    imgOriginal.src = dataUrlOriginal;
    imgMejorada.src = '';

    // Procesar la imagen con OpenCV y mostrar la mejorada si el usuario lo permite
    if (typeof aplicarFiltroDocumento === 'function') {
        aplicarFiltroDocumento(imgElement, 0.7, Math.max(imgElement.naturalWidth, imgElement.naturalHeight), function(dataUrlMejorada) {
            if (dataUrlMejorada) {
                imgMejorada.src = dataUrlMejorada;
            } else {
                imgMejorada.alt = 'Error al mejorar';
            }
        });
    } else {
        imgMejorada.alt = 'OpenCV no disponible';
    }

    btnCerrar.onclick = function() {
        modal.style.display = 'none';
    };
    modal.style.display = 'block';
}

// Función para agregar el botón de editar a cada foto de un lapicito
function agregarBotonEditarFotos() {
    var fotos = document.querySelectorAll('#photosContainer img');
    fotos.forEach(function(img, i) {
        // Evitar duplicar el botón
        if (img.parentElement.querySelector('.btn-editar-foto')) {
            return;
        }
        var btn = document.createElement('button');
        btn.textContent = '✏️';
        btn.title = 'Editar foto (comparar y elegir versión)';
        btn.className = 'btn-editar-foto';
        btn.style.position = 'absolute';
        btn.style.top = '5px';
        btn.style.right = '5px';
        btn.style.zIndex = '10';
        btn.onclick = function(e) {
            e.preventDefault();
            // Obtener el dataURL de la imagen original
            var canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            var dataUrlOriginal = canvas.toDataURL('image/webp', 0.7);
            mostrarModalEditarFoto(i, dataUrlOriginal, img);
        };
        // Envolver la imagen en un div relativo si no lo está
        var wrapper = img.parentElement;
        if (!wrapper.classList.contains('foto-wrapper')) {
            var div = document.createElement('div');
            div.className = 'foto-wrapper';
            div.style.position = 'relative';
            div.style.display = 'inline-block';
            wrapper.replaceChild(div, img);
            div.appendChild(img);
            wrapper = div;
        }
        wrapper.appendChild(btn);
    });
}

// Llamar a agregarBotonEditarFotos cada vez que se agregue una foto
var observer = new MutationObserver(function() {
    agregarBotonEditarFotos();
});
observer.observe(document.getElementById('photosContainer'), { childList: true, subtree: true });

document.addEventListener('DOMContentLoaded', function() {
    agregarBotonEditarFotos();
});
