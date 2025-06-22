// Lógica de autoguardado y restauración para camara.html

(function() {
    // URL del backend Flask para autoguardado de fotos
    var API_URL = 'https://192.168.100.30:8000/api/rij/fotos';

    // Función para obtener todas las imágenes actualmente mostradas y su versión
    function obtenerFotos() {
        var fotos = [];
        var contenedor = document.getElementById('photosContainer');
        if (!contenedor) {
            return fotos;
        }
        var wrappers = contenedor.querySelectorAll('.photo-wrapper');
        for (var i = 0; i < wrappers.length; i++) {
            var img = wrappers[i].querySelector('img.foto-principal');
            if (!img) { continue; }
            var url = img.getAttribute('data-original-url') || img.src;
            var version = img.getAttribute('data-version') || 'original';
            var mejorada = img.getAttribute('data-mejorada') || null;
            fotos.push({ url: url, version: version, mejorada: mejorada });
        }
        return fotos;
    }

    // Función para mostrar las fotos restauradas con versión
    function mostrarFotos(fotos) {
        var contenedor = document.getElementById('photosContainer');
        if (!contenedor) {
            return;
        }
        if (!Array.isArray(fotos) || fotos.length === 0) {
            console.warn('No hay fotos para mostrar:', fotos);
            return;
        }
        // Si el backend devuelve solo URLs, convertir a objetos
        fotos = fotos.map(function(foto) {
            if (typeof foto === 'string') {
                return { url: foto, version: 'original', mejorada: null };
            }
            return foto;
        });
        contenedor.innerHTML = '';
        var yaMostradas = new Set();
        for (var i = 0; i < fotos.length; i++) {
            var foto = fotos[i];
            if (!foto || !foto.url) { continue; }
            if (yaMostradas.has(foto.url)) {
                console.warn('Imagen duplicada omitida:', foto.url);
                continue;
            }
            yaMostradas.add(foto.url);
            // Usar la función global para asegurar el botón borrar y lógica de versiones
            if (typeof window.agregarFotoAGaleria === 'function') {
                window.agregarFotoAGaleria(foto.url, foto.version, foto.mejorada);
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
