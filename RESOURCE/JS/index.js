document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas'); 
    //Referencias a los dos elementos de imagen 
    const photosContainer = document.getElementById('photosContainer');
    const startButton = document.getElementById('startButton');
    const snapButton = document.getElementById('snapButton');
    const stopButton = document.getElementById('stopButton');
    const statusElement = document.getElementById('status');
    //const videoContainer = document.querySelector('.video-container'); // Comentado originalmente
    const context = canvasElement.getContext('2d');
    const clearButton = document.getElementById('clearButton');

    let stream = null;
    let frontCamera = false; 
    let imageCapture = null; // Instancia para la API ImageCapture

    // Preferencias iniciales
    let currentFacingMode = "environment"; // "environment" para trasera SIEMPRE

    const constraints = {
        audio: false,  
        video: {
            facingMode: currentFacingMode, 
            width: { max: 4096, ideal: 3840, min: 1280 }, // 4K UHD
            height: { max: 2160, ideal: 2160, min: 720 }, // 4K UHD
            advanced: [{ zoom: 1}]
        }
    };

    function updateVideoMirroring() {
        if (frontCamera) {
            videoElement.style.transform = 'translate(-50%, -50%) scaleX(-1)';
        } else {
            videoElement.style.transform = 'translate(-50%, -50%)';
        }
    }

    async function startCamera() { // Función asíncrona para permitir await
        constraints.video.facingMode = currentFacingMode; // Actualizar por si cambió
        startButton.disabled = true;
        snapButton.disabled = true; // Deshabilitar hasta que el video esté listo
        stopButton.disabled = true;
        // clearButton.disabled = true; // No deshabilitar nunca el botón de limpiar fotos
        statusElement.textContent = "Iniciando cámara... Espere.";

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                videoElement.srcObject = stream;

                videoElement.onloadedmetadata = () => {
                    videoElement.play().catch(function(err) {
                        console.error("Error al reproducir video:", err);
                        statusElement.textContent = "Error al reproducir video.";
                    });

                    const videoTrack = stream.getVideoTracks()[0]; // Necesario para ImageCapture
                    const settings = videoTrack.getSettings();
                    frontCamera = settings.facingMode === "user" ? true : false;
                    currentFacingMode = settings.facingMode; // Guardar el modo actual

                    if (window.ImageCapture) {
                        imageCapture = new ImageCapture(videoTrack);
                    } else {
                        // ImageCapture no disponible, se usará el método de canvas como reserva
                        imageCapture = null; 
                    }

                    //------------------------------------------------
                    // Mostrar la resolución obtenida del navegador
                    const realWidth = videoElement.videoWidth;
                    const realHeight = videoElement.videoHeight;
                    console.log("Resolución obtenida:", realWidth, "x", realHeight);
                    //------------------------------------------------

                    // Forzar trasera si el navegador lo permite (Nota: esto es un chequeo, no una "fuerza" de cambio si no se obtuvo inicialmente)
                    if (currentFacingMode !== "environment") {
                        statusElement.textContent = " No se pudo acceder a la cámara trasera. Se usó: " + currentFacingMode ;
                    }

                    // Mostrar en consola detalles de la resolución
                    console.log("Stream settings:", settings);
                    console.log("Video dimensions (onloadedmetadata):", realWidth, realHeight);
                    console.log("Actual facingMode:", currentFacingMode, "Is frontCamera:", frontCamera);

                    updateVideoMirroring(); // Aplicar espejo CSS según la cámara
                    statusElement.textContent = "Toma la primera foto."; 

                    snapButton.disabled = false; // Habilitar botón de captura AHORA
                    stopButton.disabled = false;
                    clearButton.disabled = false; 
                };

                videoElement.onerror = (e) => {
                    console.error("Error en el elemento de video:", e);
                    statusElement.textContent = "Error con el elemento de video.";
                    stopCamera(); // Intentar limpiar
                };

            } else {
                statusElement.textContent = "Error: getUserMedia no es soportado.";
                startButton.disabled = false;
            }
        } catch (err) {
            statusElement.textContent = `Error al acceder a la cámara: ${err.name}`;
            console.error("Error accessing camera: ", err);
            if (err.name === "NotAllowedError") {
                statusElement.textContent = "Permiso denegado.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                statusElement.textContent = "No se encontró cámara compatible.";
            } else if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
                   statusElement.textContent = `Restricciones no satisfechas: ${err.constraint}. Intenta con otra cámara o resolución.`;
            }
            startButton.disabled = false;
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
            stream = null;
            imageCapture = null; // Limpiar la instancia de ImageCapture 
            statusElement.textContent = "Cámara detenida. Presiona 'Iniciar Cámara' para comenzar de nuevo."; // Modificado para ser más claro
            startButton.disabled = false;
            snapButton.disabled = true;
            stopButton.disabled = true;
            // clearButton.disabled = true; // No deshabilitar nunca el botón de limpiar fotos

            videoElement.style.transform = 'translate(-50%, -50%)'; //al parecer, rota el video al detener - Corregido para resetear la rotación
        }
    }

    // Contador global de fotos tomadas. Solo se reinicia al borrar todas las fotos.
    let photosTakenCount = 0; // Contador de fotos

    // Crear el elemento visual del contador (sin estilos)
    let photoCounterElement = document.createElement('div');
    photoCounterElement.id = 'photoCounter';
    photoCounterElement.textContent = 'Fotos tomadas: 0';

    // Función para actualizar el contador visual
    function actualizarContadorFotos() {
        photoCounterElement.textContent = 'Fotos tomadas: ' + photosTakenCount;
    }

    async function snapPhoto() { 
        if (!stream || videoElement.paused || videoElement.ended || videoElement.videoWidth === 0) {
            statusElement.textContent = "La cámara no está activa o lista.";
            return;
        }

        try {
            const videoSourceWidth = videoElement.videoWidth;
            const videoSourceHeight = videoElement.videoHeight;
            const videoAspectRatio = videoSourceWidth / videoSourceHeight;

            const videoContainer = videoElement.parentElement;
            const containerDisplayWidth = videoContainer.clientWidth;
            const containerDisplayHeight = videoContainer.clientHeight;
            const containerAspectRatio = containerDisplayWidth / containerDisplayHeight;

            // Determinar recorte para mantener la proporción del contenedor
            let cropSourceX = 0;
            let cropSourceY = 0;
            let cropSourceWidth = videoSourceWidth;
            let cropSourceHeight = videoSourceHeight;

            if (videoAspectRatio > containerAspectRatio) {
                // El video es más ancho que el contenedor, se recorta horizontalmente
                cropSourceWidth = videoSourceHeight * containerAspectRatio;
                cropSourceX = (videoSourceWidth - cropSourceWidth) / 2;
            } else if (videoAspectRatio < containerAspectRatio) {
                // El video es más alto que el contenedor, se recorta verticalmente
                cropSourceHeight = videoSourceWidth / containerAspectRatio;
                cropSourceY = (videoSourceHeight - cropSourceHeight) / 2;
            }

            // Ajustar el canvas al recorte
            canvasElement.width = cropSourceWidth;
            canvasElement.height = cropSourceHeight;

            context.save();
            context.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // Espejo si es cámara frontal
            if (frontCamera) {
                context.translate(canvasElement.width, 0);
                context.scale(-1, 1);
            }

            context.drawImage(
                videoElement,
                cropSourceX, cropSourceY, cropSourceWidth, cropSourceHeight,
                0, 0, canvasElement.width, canvasElement.height
            );

            context.restore();

            // Agregar fecha/hora
            var fecha = new Date();
            var fechaTexto = fecha.toLocaleDateString('es-MX') + ' ' + fecha.getHours() + ':' + fecha.getMinutes();
            var fontSize = 48;
            var padding = 10;
            context.save();
            context.font = fontSize + 'px Arial';
            context.textBaseline = 'bottom';
            var textWidth = context.measureText(fechaTexto).width;
            var x = canvasElement.width - textWidth - padding;
            var y = canvasElement.height - padding;
            context.fillStyle = 'rgba(0,0,0,0.48)';
            context.fillRect(x - padding, y - fontSize - 4, textWidth + 2 * padding, fontSize + 8);
            context.fillStyle = 'white';
            context.fillText(fechaTexto, x, y);
            context.restore();

            // Mostrar mensaje de subida
            statusElement.textContent = "Subiendo foto al servidor...";

            // Subir la foto al servidor y actualizar galería
            if (typeof guardarFotoDesdeCanvas === 'function') {
                guardarFotoDesdeCanvas(canvasElement);
                // Incrementar el contador de fotos al tomar una nueva
                photosTakenCount++;
                statusElement.textContent = "¡Foto tomada y subida! Puedes tomar otra.";
                // Mostrar el contador justo debajo del mensaje
                if (statusElement.nextSibling !== photoCounterElement) {
                    statusElement.parentNode.insertBefore(photoCounterElement, statusElement.nextSibling);
                }
                actualizarContadorFotos(); // Actualizar el contador visual
            } else {
                statusElement.textContent = "Error: función de guardado no disponible.";
            }

        } catch (error) {
            console.error("Error al tomar la foto:", error);
            statusElement.textContent = `Error al tomar la foto: ${error.name}`;
        }
    }

    // Función para limpiar todas las fotos y reiniciar el contador
    function clearimage() {
        // Advertencia al usuario antes de limpiar todas las fotos
        if (confirm("ADVERTENCIA: Si continúas, se borrarán TODAS las fotos s. ¿Deseas continuar?")) {
       
            fetch('/api/rij/limpiar_sesion', {
                method: 'POST',
                credentials: 'include'
            })
            .then(function(res) {
                if (!res.ok) {
                    throw new Error('Error al borrar las fotos del servidor');
                }
                return res.json();
            })
            .then(function(data) {
                // Limpiar la galería del DOM
                photosContainer.innerHTML = '';
                photosTakenCount = 0; // Reiniciar contador solo al borrar todas las fotos
                actualizarContadorFotos(); // Actualizar el contador visual
                statusElement.innerHTML = "Espacio en blanco... (Fotos: 0)";
            })
            .catch(function(err) {
                alert('Error al borrar las fotos del servidor: ' + err);
            });
        } else {
            statusElement.innerHTML = "Operación cancelada. Las fotos no se han borrado.";
        }
    }

    // Función para borrar una foto del servidor y del DOM (usada en el botón X de cada foto)
    function borrarFotoDelServidor(url, callback) {
        fetch('/api/rij/borrar_foto', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url }),
            credentials: 'include'
        })
        .then(function(res) {
            if (!res.ok) {
                throw new Error('Error al borrar la foto');
            }
            return res.json();
        })
        .then(function(data) {
            if (data.success) {
                // Eliminar la foto del DOM y actualizar el contador según las fotos reales
                var contenedor = document.getElementById('photosContainer');
                // Esperar a que el callback de borrado en el DOM se ejecute antes de contar
                setTimeout(function() {
                    photosTakenCount = contenedor.querySelectorAll('.photo-wrapper').length;
                    actualizarContadorFotos();
                }, 10);
                statusElement.textContent = "Foto eliminada correctamente.";
                callback(null);
            } else {
                callback('No se pudo borrar la foto');
            }
        })
        .catch(function(err) {
            callback(err);
        });
    }

    startButton.addEventListener('click', startCamera);
    stopButton.addEventListener('click', stopCamera);
    snapButton.addEventListener('click', snapPhoto);
    clearButton.addEventListener('click', clearimage);

    document.querySelector('.video-container').addEventListener('dblclick', async function() {
        // Cambiar el modo de cámara de environment a user y al contrario
        if (currentFacingMode === 'environment') {
            currentFacingMode = 'user';
            statusElement.textContent = "Cambiando a cámara frontal...";
        } else {
            currentFacingMode = 'environment';
            statusElement.textContent = "Cambiando a cámara trasera...";
        }

        // Detener la cámara actual si está activa, para que se reinicie con el nuevo modo
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            videoElement.srcObject = null;
            stream = null;
            imageCapture = null;
        }

        // Reiniciar la cámara para aplicar el nuevo modo de user o viceversa
        await startCamera();
    });

    // función agregarFotoAGaleria para añadir botón de borrar y descarga por doble click 
    window.agregarFotoAGaleria = function(url) {
        var contenedor = document.getElementById('photosContainer');
        if (!contenedor) {
            return;
        }
        var photoWrapper = document.createElement('div');
        photoWrapper.classList.add('photo-wrapper');
        photoWrapper.style.position = 'relative';

        // Imagen principal mostrada
        var img = document.createElement('img');
        img.src = url;
        img.alt = 'Foto subida';
        img.className = 'foto-principal';

        // Miniaturas y lógica de versiones (solo original por defecto)
        var miniaturasContainer = document.createElement('div');
        miniaturasContainer.className = 'miniaturas-container';
        miniaturasContainer.style.display = 'flex';
        miniaturasContainer.style.justifyContent = 'center';
        miniaturasContainer.style.gap = '8px';
        miniaturasContainer.style.marginTop = '6px';
        miniaturasContainer.style.marginBottom = '4px';

        // Almacenar las versiones
        var versiones = {
            original: url,
            mejorada: null
        };
        var miniaturas = {};
        var indice = contenedor.querySelectorAll('.photo-wrapper').length;
        // Inicializar decisión por defecto
        if (!window.fotosDecisiones) {
            window.fotosDecisiones = [];
        }
        if (!window.fotosMejoradas) {
            window.fotosMejoradas = [];
        }
        window.fotosDecisiones[indice] = 'original';
        window.fotosMejoradas[indice] = null;

        // Crear miniatura original
        var miniOriginal = document.createElement('img');
        miniOriginal.src = url;
        miniOriginal.alt = 'Original';
        miniOriginal.className = 'miniatura-foto';
        miniOriginal.style.border = '2px solid #4caf50'; // Seleccionada por defecto
        miniOriginal.style.borderRadius = '6px';
        miniOriginal.style.width = '48px';
        miniOriginal.style.height = '48px';
        miniOriginal.style.objectFit = 'cover';
        miniOriginal.style.cursor = 'pointer';
        miniaturas.original = miniOriginal;
        miniaturasContainer.appendChild(miniOriginal);

        // Listener para original (por defecto)
        miniOriginal.addEventListener('click', function() {
            seleccionarVersion('original');
        });

        // Botón editar (lápiz)
        var btnEditar = document.createElement('button');
        btnEditar.textContent = '✏️';
        btnEditar.title = 'Editar foto (comparar y elegir versión mejorada)';
        btnEditar.className = 'btn-editar-foto';
        btnEditar.style.position = 'absolute';
        btnEditar.style.top = '5px';
        btnEditar.style.right = '40px';
        btnEditar.style.zIndex = '10';
        btnEditar.style.background = 'transparent';
        btnEditar.style.border = 'none';
        btnEditar.style.fontSize = '1.3rem';
        btnEditar.style.cursor = 'pointer';
        btnEditar.addEventListener('click', function(e) {
            e.preventDefault();
            // Si ya se generó, solo mostrar
            if (miniaturas.mejorada) {
                miniaturas.mejorada.style.display = '';
                return;
            }
            // Generar versión mejorada solo al editar
            var imgTemp = new window.Image();
            imgTemp.onload = function() {
                if (typeof aplicarFiltroDocumento === 'function') {
                    aplicarFiltroDocumento(imgTemp, 0.7, Math.max(imgTemp.naturalWidth, imgTemp.naturalHeight), function(dataUrlMejorada) {
                        versiones.mejorada = dataUrlMejorada;
                        var miniMejorada = document.createElement('img');
                        miniMejorada.src = dataUrlMejorada;
                        miniMejorada.alt = 'Mejorada';
                        miniMejorada.className = 'miniatura-foto';
                        miniMejorada.style.border = '2px solid #ccc';
                        miniMejorada.style.borderRadius = '6px';
                        miniMejorada.style.width = '48px';
                        miniMejorada.style.height = '48px';
                        miniMejorada.style.objectFit = 'cover';
                        miniMejorada.style.cursor = 'pointer';
                        miniaturas.mejorada = miniMejorada;
                        miniaturasContainer.appendChild(miniMejorada);
                        miniMejorada.addEventListener('click', function() {
                            seleccionarVersion('mejorada');
                        });
                    });
                }
            };
            imgTemp.src = url;
        });
        photoWrapper.appendChild(btnEditar);

        // Función para seleccionar versión y actualizar lógica
        function seleccionarVersion(tipo) {
            img.src = versiones[tipo] || url;
            for (var key in miniaturas) {
                if (miniaturas[key]) {
                    if (key === tipo) {
                        miniaturas[key].style.border = '2px solid #4caf50';
                    } else {
                        miniaturas[key].style.border = '2px solid #ccc';
                    }
                }
            }
            if (tipo === 'original') {
                window.fotosDecisiones[indice] = 'original';
                window.fotosMejoradas[indice] = null;
            } else {
                window.fotosDecisiones[indice] = tipo;
                window.fotosMejoradas[indice] = versiones[tipo];
            }
            // Forzar autoguardado si existe
            if (window.autoguardadoCamara && typeof window.autoguardadoCamara.autoguardarFotos === 'function') {
                window.autoguardadoCamara.autoguardarFotos();
            }
        }

        // Evento para descargar la imagen al hacer doble click (no modificar)
        img.addEventListener('dblclick', function() {
            function descargarBlob(blob, nombre) {
                var urlBlob = URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.href = urlBlob;
                link.download = 'pilin.png'; // Nombre fijo para descarga
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(function() { URL.revokeObjectURL(urlBlob); }, 1000);
            }
            fetch(img.src, { credentials: 'include' })
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('No se pudo descargar la imagen');
                    }
                    return response.blob();
                })
                .then(function(blob) { descargarBlob(blob, 'pilin.png'); })
                .catch(function(err) {
                    alert('Error al descargar la imagen: ' + err);
                });
        });

        // Botón de borrar SIEMPRE visible
        var deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.style.backgroundColor = '#00724e';
        deleteButton.style.border = 'none';
        deleteButton.style.borderRadius = '40px';
        deleteButton.style.width = '1.8rem';
        deleteButton.style.height = '1.8rem';
        deleteButton.style.position = 'absolute';
        deleteButton.style.top = '5px';
        deleteButton.style.right = '5px';
        deleteButton.addEventListener('click', function() {
            if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
                return;
            }
            borrarFotoDelServidor(url, function(err) {
                if (!err) {
                    photoWrapper.remove();
                    photosTakenCount = contenedor.querySelectorAll('.photo-wrapper').length;
                    actualizarContadorFotos();
                    statusElement.textContent = 'Foto eliminada correctamente.';
                } else {
                    alert('Error al borrar la foto: ' + err);
                }
            });
        });

        photoWrapper.appendChild(img);
        photoWrapper.appendChild(miniaturasContainer);
        photoWrapper.appendChild(deleteButton);
        contenedor.appendChild(photoWrapper);
    }

    window.addEventListener('beforeunload', () => {
        stopCamera(); 
    });

    // Asegurarse que el botón de limpiar fotos esté habilitado al cargar la página
    clearButton.disabled = false;

    // --- Lógica para reordenar imágenes en el contenedor de fotos (móvil y escritorio) ---
    function agregarBotonesReordenarFotos() {
        var fotos = Array.from(document.querySelectorAll('#photosContainer .photo-wrapper'));
        fotos.forEach(function(wrapper) {
            // Eliminar botones previos para evitar duplicados
            var btns = wrapper.querySelectorAll('.btn-mover-arriba, .btn-mover-abajo');
            btns.forEach(function(btn) { btn.remove(); });
            var container = wrapper.parentElement;
            var wrappers = Array.from(container.querySelectorAll('.photo-wrapper'));
            var i = wrappers.indexOf(wrapper);
            // Botón subir
            var btnArriba = document.createElement('button');
            btnArriba.textContent = '⬆️';
            btnArriba.className = 'btn-mover-arriba';
            btnArriba.style.position = 'absolute';
            btnArriba.style.left = '5px';
            btnArriba.style.top = '5px';
            btnArriba.style.zIndex = '20';
            btnArriba.style.background = 'rgba(255,255,255,0.8)';
            btnArriba.style.border = 'none';
            btnArriba.style.borderRadius = '50%';
            btnArriba.style.width = '2.2em';
            btnArriba.style.height = '2.2em';
            btnArriba.style.fontSize = '1.2em';
            btnArriba.style.touchAction = 'manipulation';
            btnArriba.onclick = function(e) {
                e.preventDefault();
                var wrappers = Array.from(container.querySelectorAll('.photo-wrapper'));
                var idx = wrappers.indexOf(wrapper);
                if (idx > 0) {
                    container.insertBefore(wrapper, wrappers[idx - 1]);
                    setTimeout(agregarBotonesReordenarFotos, 100);
                }
            };
            // Botón bajar
            var btnAbajo = document.createElement('button');
            btnAbajo.textContent = '⬇️';
            btnAbajo.className = 'btn-mover-abajo';
            btnAbajo.style.position = 'absolute';
            btnAbajo.style.left = '5px';
            btnAbajo.style.top = '40px';
            btnAbajo.style.zIndex = '20';
            btnAbajo.style.background = 'rgba(255,255,255,0.8)';
            btnAbajo.style.border = 'none';
            btnAbajo.style.borderRadius = '50%';
            btnAbajo.style.width = '2.2em';
            btnAbajo.style.height = '2.2em';
            btnAbajo.style.fontSize = '1.2em';
            btnAbajo.style.touchAction = 'manipulation';
            btnAbajo.onclick = function(e) {
                e.preventDefault();
                var wrappers = Array.from(container.querySelectorAll('.photo-wrapper'));
                var idx = wrappers.indexOf(wrapper);
                if (idx < wrappers.length - 1) {
                    if (wrappers[idx + 1].nextSibling) {
                        container.insertBefore(wrapper, wrappers[idx + 1].nextSibling);
                    } else {
                        container.appendChild(wrapper);
                    }
                    setTimeout(agregarBotonesReordenarFotos, 100);
                }
            };
            wrapper.appendChild(btnArriba);
            wrapper.appendChild(btnAbajo);
        });
    }

    // Observar cambios en el contenedor de fotos para agregar los botones
    var observerReordenar = new MutationObserver(function() {
        agregarBotonesReordenarFotos();
    });
    observerReordenar.observe(document.getElementById('photosContainer'), { childList: true, subtree: false });

    document.addEventListener('DOMContentLoaded', function() {
        agregarBotonesReordenarFotos();
    });
});
