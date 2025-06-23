// Lógica de autoguardado y restauración para camara.html

(function() {
    // URL del backend Flask para autoguardado de fotos
    var API_URL = 'https://192.168.100.30:8000/api/rij/fotos';    // Función para obtener todas las imágenes actualmente mostradas y su versión
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
            
            // CORREGIDO: Obtener todas las versiones procesadas identificando por URL única
            var versiones = {
                original: url,
                mejorada: mejorada
            };
            
            var miniaturas = wrappers[i].querySelectorAll('.miniatura-foto');
            for (var j = 0; j < miniaturas.length; j++) {
                var miniatura = miniaturas[j];
                var title = miniatura.title || '';
                var src = miniatura.src;
                
                // Solo guardar versiones procesadas que no sean la original
                if (src && src !== url && src.startsWith('data:')) {
                    if (title.includes('fondos de color')) {
                        versiones.contraste = src;
                    } else if (title.includes('texto/logos')) {
                        versiones.bordes = src;
                    } else if (title.includes('mala iluminación')) {
                        versiones.color = src;
                    }
                }
            }
            
            // IMPORTANTE: Usar URL como identificador único para evitar problemas con índices
            fotos.push({ 
                id: url, // Identificador único basado en URL
                url: url, 
                version: version, 
                mejorada: mejorada,
                versiones: versiones
            });
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
        }        // Si el backend devuelve solo URLs, convertir a objetos
        fotos = fotos.map(function(foto) {
            if (typeof foto === 'string') {
                return { 
                    id: foto, 
                    url: foto, 
                    version: 'original', 
                    mejorada: null, 
                    versiones: null 
                };
            }
            // Asegurar que existe el campo versiones e id
            if (!foto.versiones) {
                foto.versiones = {
                    original: foto.url,
                    mejorada: foto.mejorada
                };
            }
            if (!foto.id) {
                foto.id = foto.url; // Usar URL como ID si no existe
            }
            return foto;
        });
        contenedor.innerHTML = '';        var yaMostradas = new Set();
        for (var i = 0; i < fotos.length; i++) {
            var foto = fotos[i];
            if (!foto || !foto.url) { continue; }
            // CORREGIDO: Usar ID único para evitar duplicados y problemas de índice
            if (yaMostradas.has(foto.id || foto.url)) {
                console.warn('Imagen duplicada omitida:', foto.url);
                continue;
            }
            yaMostradas.add(foto.id || foto.url);            // Usar la función global para asegurar el botón borrar y lógica de versiones
            if (typeof window.agregarFotoRestaurada === 'function') {
                // NUEVO: Usar función especial para fotos restauradas que preserva las versiones
                window.agregarFotoRestaurada(foto.url, foto.version, foto.mejorada, foto.versiones);
            } else if (typeof window.agregarFotoAGaleria === 'function') {
                // Fallback a función original si la nueva no está disponible
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
