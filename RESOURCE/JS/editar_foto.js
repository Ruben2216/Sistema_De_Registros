// editar_foto.js
// Lógica para el modal de edición de fotos (original vs mejorada)
// Debe integrarse con la lógica de captura y PDF

// Array para guardar la decisión del usuario por cada foto ("original" o "mejorada")
window.fotosDecisiones = [];
window.fotosMejoradas = [];

// Eliminar toda la lógica relacionada con el modal de edición de foto
// Solo se mantiene la función para agregar el botón de editar a cada foto

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
            // Ya no se muestra ningún modal ni se ofrece elegir entre versiones aquí
            // La lógica de edición se maneja solo con miniaturas en la galería
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
