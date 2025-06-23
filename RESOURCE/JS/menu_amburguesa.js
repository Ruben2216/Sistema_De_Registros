window.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del menú hamburguesa
    var btnHamburguesa = document.getElementById('btn-hamburguesa');
    var menuOpciones = document.getElementById('menu-hamburguesa-opciones');
    var menuContenedor = document.getElementById('menu-hamburguesa-flotante');
    var btnVerImagenDia = document.getElementById('opcion-ver-imagen-dia');
    var modal = document.getElementById('modal-imagen-dia');
    var cerrar = document.getElementById('cerrar-modal-imagen-dia');

    // Lógica para mostrar/ocultar el menú hamburguesa
    if (btnHamburguesa && menuOpciones && menuContenedor) {
        btnHamburguesa.addEventListener('click', function() {
            menuContenedor.classList.toggle('activo');

            // Si el menú está activo, crear el div de blur
            if (menuContenedor.classList.contains('activo')) {
                var blurDiv = document.getElementById('blur-fondo');
                if (!blurDiv) {
                    blurDiv = document.createElement('div');
                    blurDiv.id = 'blur-fondo';
                    blurDiv.style.position = 'fixed';
                    blurDiv.style.top = '0';
                    blurDiv.style.left = '0';
                    blurDiv.style.width = '100vw';
                    blurDiv.style.height = '100vh';
                    blurDiv.style.zIndex = '1000';
                    blurDiv.style.backdropFilter = 'blur(5px)';
                    document.body.appendChild(blurDiv);
                }
                menuContenedor.style.zIndex = '1001'; //mas 1 para que el contenedor esta arriba del div que se creo
            } else {
                // Eliminar el div de blur si existe
                var blurDiv = document.getElementById('blur-fondo');
                if (blurDiv) {
                    blurDiv.parentNode.removeChild(blurDiv);
                }
                menuContenedor.style.zIndex = '';
            }
        });
        // Cerrar menú al hacer click fuera
        document.addEventListener('click', function(e) {
            var blurDiv = document.getElementById('blur-fondo');
            if (blurDiv && e.target === blurDiv) {
                menuContenedor.classList.remove('activo');
                blurDiv.parentNode.removeChild(blurDiv);
                menuContenedor.style.zIndex = '';
            } else if (blurDiv && !menuContenedor.contains(e.target) && !btnHamburguesa.contains(e.target)) {
                menuContenedor.classList.remove('activo');
                blurDiv.parentNode.removeChild(blurDiv);
                menuContenedor.style.zIndex = '';
            }
        });
    }

    // Lógica para mostrar la imagen del día desde el menú hamburguesa
    if (btnVerImagenDia && modal && cerrar) {
        btnVerImagenDia.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'flex';
            menuContenedor.classList.remove('activo');
        });
        cerrar.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});
