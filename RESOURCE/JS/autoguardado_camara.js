// Lógica de autoguardado y restauración para camara.html

(function() {
    // URL del backend Flask para autoguardado de fotos
    var API_URL = 'https://192.168.1.90:8000/api/rij/fotos';

    // Función para obtener todas las imágenes actualmente mostradas
    function obtenerFotos() {
        var fotos = [];
        var contenedor = document.getElementById('photosContainer');
        if (!contenedor) {
            return fotos;
        }
        var imgs = contenedor.querySelectorAll('img');
        for (var i = 0; i < imgs.length; i++) {
            fotos.push(imgs[i].src);
        }
        return fotos;
    }

    // Función para mostrar las fotos restauradas
    function mostrarFotos(fotos) {
        var contenedor = document.getElementById('photosContainer');
        if (!contenedor) {
            return;
        }
        contenedor.innerHTML = '';
        var yaMostradas = new Set();
        for (var i = 0; i < fotos.length; i++) {
            var url = fotos[i];
            if (yaMostradas.has(url)) {
                console.warn('Imagen duplicada omitida:', url);
                continue; // Si ya se mostró esta URL, omitir
            }
            yaMostradas.add(url);
            // En vez de solo img, usar la función global para asegurar el botón borrar
            if (typeof window.agregarFotoAGaleria === 'function') {
                window.agregarFotoAGaleria(url);
            } else {
                var photoWrapper = document.createElement('div');
                photoWrapper.classList.add('photo-wrapper');
                var img = document.createElement('img');
                img.src = url;
                img.alt = 'Foto restaurada ' + (i+1);
                photoWrapper.appendChild(img);
                contenedor.appendChild(photoWrapper);
            }
        }
        // Log para depuración
        console.log('Fotos restauradas únicas:', Array.from(yaMostradas));
        if (fotos.length !== yaMostradas.size) {
            console.warn('Se omitieron duplicados al mostrar la galería.');
        }
    }

    // Función para autoguardar (POST)
    function autoguardarFotos() {
        var fotos = obtenerFotos();
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({fotos: fotos}),
            credentials: 'include'
        })
        .then(function(res) {
            if (!res.ok) {
                throw new Error('Error al guardar fotos');
            }
            return res.json();
        })
        .then(function(data) {
            // Guardado exitoso
        })
        .catch(function(err) {
            // Si hay error, puedes guardar en localStorage como respaldo
            localStorage.setItem('borrador_fotos_RIJ', JSON.stringify(fotos));
        });
    }

    // Función para restaurar (GET)
    function restaurarFotos() {
        fetch(API_URL, {
            method: 'GET',
            credentials: 'include'
        })
        .then(function(res) {
            if (!res.ok) {
                throw new Error('No hay fotos guardadas');
            }
            return res.json();
        })
        .then(function(datos) {
            if (datos && datos.fotos) {
                // Limpiar galería antes de restaurar para evitar duplicados
                var contenedor = document.getElementById('photosContainer');
                if (contenedor) { contenedor.innerHTML = ''; }
                mostrarFotos(datos.fotos);
            }
        })
        .catch(function() {
            // Si falla, intenta restaurar de localStorage
            var borrador = localStorage.getItem('borrador_fotos_RIJ');
            if (borrador) {
                var contenedor = document.getElementById('photosContainer');
                if (contenedor) { contenedor.innerHTML = ''; }
                mostrarFotos(JSON.parse(borrador));
            }
        });
    }

    // Detectar cambios en las fotos para autoguardar
    document.addEventListener('DOMContentLoaded', function() {
        var contenedor = document.getElementById('photosContainer');
        if (contenedor) {
            // Observador de cambios en el contenedor de fotos
            var observer = new MutationObserver(function() {
                autoguardarFotos();
            });
            observer.observe(contenedor, { childList: true, subtree: true });
        }
        // Restaurar al cargar
        restaurarFotos();
    });

    // Exponer funciones para pruebas
    window.autoguardadoCamara = {
        autoguardarFotos: autoguardarFotos,
        restaurarFotos: restaurarFotos
    };
})();
