
// Función para subir una imagen base64 al servidor y obtener la URL
function subirFotoBase64(base64, callback) {
    fetch('/api/rij/upload_foto', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ foto_base64: base64 }),
        credentials: 'include'
    })
    .then(function(res) {
        if (!res.ok) {
            throw new Error('Error al subir la foto');
        }
        return res.json();
    })
    .then(function(data) {
        if (data.url) {
            callback(null, data.url);
        } else {
            callback('No se recibió URL');
        }
    })
    .catch(function(err) {
        callback(err);
    });
}

// Función para obtener la lista de URLs de fotos guardadas en el servidor
function obtenerListaFotos(callback) {
    fetch('/api/rij/lista_fotos', {
        method: 'GET',
        credentials: 'include'
    })
    .then(function(res) {
        if (!res.ok) {
            throw new Error('Error al obtener la lista de fotos');
        }
        return res.json();
    })
    .then(function(data) {
        // Si el backend aún devuelve solo URLs, conviértelo a objetos
        var fotos = (data.fotos || []).map(function(foto) {
            if (typeof foto === 'string') {
                return { url: foto, version: 'original', mejorada: null };
            }
            return foto;
        });
        callback(null, fotos);
    })
    .catch(function(err) {
        callback(err);
    });
}

// Ejemplo de uso: subir una imagen desde un canvas
// Llama a esta función después de tomar una foto en tu lógica de cámara
// NOTA: Cuando se sube una nueva foto, se debe guardar como objeto con versión
function guardarFotoDesdeCanvas(canvas) {
    var base64 = canvas.toDataURL('image/png');
    
    // OPTIMIZACIÓN: Almacenar la imagen local inmediatamente para evitar dependencia del servidor
    // Esto mejora la velocidad de generación de PDFs y reduce la carga del servidor
    var localDataURL = canvas.toDataURL('image/webp', 0.9); // Máxima calidad inicial - el controlador ajustará
    
    subirFotoBase64(base64, function(err, url) {
        if (err) {
            alert('Error al subir la foto: ' + err);
        } else {
            // Al agregar, siempre como versión original, pero incluyendo data URL local
            window.agregarFotoAGaleria(url, 'original', null, null, null, localDataURL);
        }
    });
}

// Función para agregar una imagen a la galería en el DOM
function agregarFotoAGaleria(url) {
    var contenedor = document.getElementById('photosContainer');
    if (!contenedor) {
        return;
    }
    var photoWrapper = document.createElement('div');
    photoWrapper.classList.add('photo-wrapper');
    var img = document.createElement('img');
    img.src = url;
    img.alt = 'Foto subida';
    img.className = 'foto-principal';
    img.setAttribute('data-original-url', url);
    img.setAttribute('data-version', 'original');
    
    // OPTIMIZACIÓN: Cargar imagen como data URL local para PDF
    if (typeof window.cargarImagenComoDataURL === 'function') {
        window.cargarImagenComoDataURL(url, function(dataURL) {
            if (dataURL) {
                img.setAttribute('data-local-image', dataURL);
            }
        });
    }
    
    photoWrapper.appendChild(img);
    contenedor.appendChild(photoWrapper);
}

// OPTIMIZACIÓN: Función para cargar una imagen como data URL local
// Esto reduce la dependencia del servidor para generación de PDFs
function cargarImagenComoDataURL(url, callback) {
    if (url.startsWith('data:')) {
        callback(url);
        return;
    }
    
    fetch(url, { credentials: 'include' })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Error al cargar imagen');
        }
        return response.blob();
    })
    .then(function(blob) {
        var reader = new FileReader();
        reader.onloadend = function() {
            // Convertir a WebP para mejor compresión
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                var webpDataUrl = canvas.toDataURL('image/webp', 0.9);
                callback(webpDataUrl);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(blob);
    })
    .catch(function(error) {
        console.warn('Error al cargar imagen como data URL:', error);
        callback(null);
    });
}

// Exponer función globalmente
window.cargarImagenComoDataURL = cargarImagenComoDataURL;


