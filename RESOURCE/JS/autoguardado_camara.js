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
            
            // Obtener información de recorte si existe
            var recortada = img.getAttribute('data-recortada') || null;
            var recorteInfo = null;
            if (img.hasAttribute('data-recorte-info')) {
                try {
                    recorteInfo = JSON.parse(img.getAttribute('data-recorte-info'));
                } catch (e) {
                    console.warn('Error al parsear información de recorte:', e);
                }
            }
            
            var versiones = {
                original: url,
                mejorada: mejorada,
                recortada: recortada  // NUEVO: Agregar versión recortada
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
                versiones: versiones,
                recortada: recortada,  
                recorteInfo: recorteInfo  
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
                    versiones: null,
                    recortada: null,  // NUEVO: Información de recorte
                    recorteInfo: null  // NUEVO: Metadatos del recorte
                };
            }
            // Asegurar que existe el campo versiones e id
            if (!foto.versiones) {
                foto.versiones = {
                    original: foto.url,
                    mejorada: foto.mejorada,
                    recortada: foto.recortada || null  // NUEVO: Incluir versión recortada
                };
            }
            if (!foto.id) {
                foto.id = foto.url; // Usar URL como ID si no existe
            }
            if (!foto.hasOwnProperty('recortada')) {
                foto.recortada = null;
            }
            if (!foto.hasOwnProperty('recorteInfo')) {
                foto.recorteInfo = null;
            }
            return foto;
        });
        contenedor.innerHTML = '';        var yaMostradas = new Set();
        for (var i = 0; i < fotos.length; i++) {
            var foto = fotos[i];
            if (!foto || !foto.url) { continue; }
            if (yaMostradas.has(foto.id || foto.url)) {
                console.warn('Imagen duplicada omitida:', foto.url);
                continue;
            }
            yaMostradas.add(foto.id || foto.url);            // Usar la función global para asegurar el botón borrar y lógica de versiones
            if (typeof window.agregarFotoRestaurada === 'function') {
                window.agregarFotoRestaurada(foto.url, foto.version, foto.mejorada, foto.versiones, foto.recortada, foto.recorteInfo);            } else if (typeof window.agregarFotoAGaleria === 'function') {
                // Fallback a función original si la nueva no está disponible
                window.agregarFotoAGaleria(foto.url, foto.version, foto.mejorada, foto.recortada, foto.recorteInfo);
            }
        }        // Log para depuración
        console.log('Fotos restauradas únicas:', Array.from(yaMostradas));
        if (fotos.length !== yaMostradas.size) {
            console.warn('Se omitieron duplicados al mostrar la galería.');
        }
        
        setTimeout(function() {
            aplicarRecortesGuardados();
        }, 100);
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

    function aplicarRecortesGuardados() {
        var contenedor = document.getElementById('photosContainer');
        if (!contenedor) {
            return;
        }
        
        var fotos = contenedor.querySelectorAll('.photo-wrapper img.foto-principal');
        for (var i = 0; i < fotos.length; i++) {
            var img = fotos[i];
            var urlOriginal = img.getAttribute('data-original-url') || img.src;
            var recortada = img.getAttribute('data-recortada');
            var recorteInfo = img.getAttribute('data-recorte-info');
              // Si ya tiene información de recorte, aplicarla
            if (recortada && recorteInfo) {
                try {
                    var info = JSON.parse(recorteInfo);
                    console.log('Aplicando recorte guardado para:', urlOriginal, info);
                    // CORREGIDO: Aplicar la imagen recortada como fuente principal
                    img.src = recortada;
                    continue;
                } catch (e) {
                    console.warn('Error al parsear información de recorte:', e);
                }
            }
            
            // Si no tiene recorte en los atributos, buscar en localStorage
            var claveRecorte = 'imagenRecortada_' + urlOriginal;
            var datosGuardados = localStorage.getItem(claveRecorte);
            if (datosGuardados) {
                try {                    var datos = JSON.parse(datosGuardados);
                    if (datos.imagen && datos.recorteInfo) {
                        console.log('Aplicando recorte desde localStorage para:', urlOriginal);
                        img.src = datos.imagen;
                        img.setAttribute('data-recortada', datos.imagen);
                        img.setAttribute('data-recorte-info', JSON.stringify(datos.recorteInfo));
                        
                        // Forzar autoguardado para persistir el recorte
                        setTimeout(function() {
                            if (window.autoguardadoCamara && window.autoguardadoCamara.autoguardarFotos) {
                                window.autoguardadoCamara.autoguardarFotos();
                            }
                        }, 500);
                    }
                } catch (e) {
                    console.warn('Error al parsear datos de recorte desde localStorage:', e);
                }
            }
        }
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
