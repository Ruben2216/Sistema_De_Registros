// Lógica para enviar imágenes base64 al backend Flask y mostrar las URLs devueltas

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
    subirFotoBase64(base64, function(err, url) {
        if (err) {
            alert('Error al subir la foto: ' + err);
        } else {
            // Al agregar, siempre como versión original
            window.agregarFotoAGaleria(url, 'original', null);
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
    photoWrapper.appendChild(img);
    contenedor.appendChild(photoWrapper);
}


