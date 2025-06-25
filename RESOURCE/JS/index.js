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
    });    // Permite agregar una foto a la galería con versión seleccionada
    window.agregarFotoAGaleria = function(url, version, mejorada, recortada, recorteInfo) {
        var contenedor = document.getElementById('photosContainer');
        if (!contenedor) {
            return;
        }
        var photoWrapper = document.createElement('div');
        photoWrapper.classList.add('photo-wrapper');
        photoWrapper.style.position = 'relative';

        // Imagen principal mostrada
        var img = document.createElement('img');
        img.className = 'foto-principal';
        img.setAttribute('data-original-url', url);        img.setAttribute('data-version', version || 'original');
        if (mejorada) {
            img.setAttribute('data-mejorada', mejorada);
        }
        
        // NUEVO: Agregar atributos de recorte si existen
        if (recortada) {
            img.setAttribute('data-recortada', recortada);
        }
        if (recorteInfo) {
            img.setAttribute('data-recorte-info', JSON.stringify(recorteInfo));
        }        // CORREGIDO: Verificar si hay imagen recortada y priorizarla
        var necesitaRegeneracion = false;
        
        if (recortada) {
            // Priorizar imagen recortada si existe
            img.src = recortada;
            console.log('Aplicando imagen recortada para:', url);
        } else {
            // Mostrar la imagen correcta según la versión almacenada
            var versionActual = version || 'original';
            
            if (versionActual === 'mejorada' && mejorada) {
                img.src = mejorada;
            } else if (versionActual === 'original') {
                img.src = url;
            } else {
                // Para versiones avanzadas (contraste, bordes, color), mostrar original y marcar para regeneración
                img.src = url;
                necesitaRegeneracion = true;
            }
        }
        img.alt = 'Foto subida';
        photoWrapper.appendChild(img);

        // Miniaturas y lógica de versiones
        var miniaturasContainer = document.createElement('div');
        miniaturasContainer.className = 'miniaturas-container';
        miniaturasContainer.style.display = 'flex';
        miniaturasContainer.style.justifyContent = 'center';
        miniaturasContainer.style.gap = '6px';
        miniaturasContainer.style.marginTop = '6px';
        miniaturasContainer.style.marginBottom = '4px';
        miniaturasContainer.style.flexWrap = 'wrap';
        photoWrapper.appendChild(miniaturasContainer);        var versiones = {
            original: url,
            mejorada: mejorada || null,
            contraste: null,
            bordes: null,
            color: null
        };
        var miniaturas = {};
        
        // CORREGIDO: Eliminar dependencia de índices para evitar problemas al eliminar fotos
        // No usar más window.fotosDecisiones ni window.fotosMejoradas basados en índices

        // Función para crear miniatura con estado correcto
        function crearMiniatura(tipo, src, alt, titulo) {
            var mini = document.createElement('img');
            mini.src = src;
            mini.alt = alt;
            mini.title = titulo;
            mini.className = 'miniatura-foto';
            // CORRIGIDO: Establecer borde verde según la versión actual almacenada
            mini.style.border = (versionActual === tipo) ? '2px solid #4caf50' : '2px solid #ccc';
            mini.style.borderRadius = '6px';
            mini.style.width = '40px';
            mini.style.height = '40px';
            mini.style.objectFit = 'cover';
            mini.style.cursor = 'pointer';
            mini.style.display = (tipo === 'original' || src) ? 'block' : 'none';
            miniaturas[tipo] = mini;
            miniaturasContainer.appendChild(mini);
            mini.addEventListener('click', function() {
                if (versiones[tipo]) {
                    seleccionarVersion(tipo);
                }
            });
            return mini;
        }

        // Miniatura original
        crearMiniatura('original', url, 'Original', 'Imagen original');

        // Miniatura mejorada (si existe)
        if (mejorada) {
            crearMiniatura('mejorada', mejorada, 'Mejorada', 'Binarización adaptativa');
        } else {
            crearMiniatura('mejorada', null, 'Mejorada', 'Binarización adaptativa');
        }        // Miniaturas para las nuevas versiones (inicialmente ocultas)
        crearMiniatura('contraste', null, 'Fondo Color', 'Documentos con fondos de color');
        crearMiniatura('bordes', null, 'Texto Color', 'Documentos con texto/logos de colores');
        crearMiniatura('color', null, 'Iluminación', 'Documentos con mala iluminación');        // Botón editar (lápiz)
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
        
        var versionesGeneradas = {
            mejorada: !!mejorada,
            contraste: false,
            bordes: false,
            color: false
        };
        
        // NUEVO: Regenerar automáticamente la versión seleccionada si es necesario
        if (necesitaRegeneracion && versionActual !== 'original' && versionActual !== 'mejorada') {
            // Mostrar indicador de procesamiento en la imagen
            var overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(0,0,0,0.7)';
            overlay.style.color = 'white';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.fontSize = '14px';
            overlay.style.textAlign = 'center';
            overlay.style.zIndex = '5';
            overlay.innerHTML = 'Regenerando<br>versión...';
            photoWrapper.appendChild(overlay);
            
            setTimeout(function() {
                var imgTemp = new window.Image();
                imgTemp.onload = function() {
                    var funcionFiltro, titulo;
                    
                    switch(versionActual) {
                        case 'contraste':
                            funcionFiltro = aplicarFiltroContrasteAutomatico;
                            titulo = 'Documentos con fondos de color';
                            break;
                        case 'bordes':
                            funcionFiltro = aplicarFiltroDeteccionBordes;
                            titulo = 'Documentos con texto/logos de colores';
                            break;
                        case 'color':
                            funcionFiltro = aplicarFiltroCorreccionColor;
                            titulo = 'Documentos con mala iluminación';
                            break;
                    }
                    
                    if (funcionFiltro && typeof funcionFiltro === 'function') {
                        funcionFiltro(imgTemp, 0.7, Math.max(imgTemp.naturalWidth, imgTemp.naturalHeight), function(dataUrlProcesada) {
                            if (dataUrlProcesada) {
                                versiones[versionActual] = dataUrlProcesada;
                                versionesGeneradas[versionActual] = true;
                                
                                // Actualizar imagen principal
                                img.src = dataUrlProcesada;
                                  // Actualizar miniatura
                                if (miniaturas[versionActual]) {
                                    miniaturas[versionActual].src = dataUrlProcesada;
                                    miniaturas[versionActual].style.display = 'block';
                                }
                                  // CORREGIDO: No usar más variables globales con índices
                                // La información se mantiene en los atributos del DOM
                                
                                // Remover overlay
                                photoWrapper.removeChild(overlay);
                                
                                // NUEVO: Forzar autoguardado para conservar la versión regenerada
                                if (window.autoguardadoCamara && window.autoguardadoCamara.autoguardarFotos) {
                                    setTimeout(function() {
                                        window.autoguardadoCamara.autoguardarFotos();
                                    }, 300);
                                }
                                
                                console.log('Versión regenerada:', versionActual);
                            } else {
                                overlay.innerHTML = 'Error al<br>regenerar';
                                setTimeout(function() {
                                    photoWrapper.removeChild(overlay);
                                }, 2000);
                            }
                        });
                    } else {
                        overlay.innerHTML = 'Función no<br>disponible';
                        setTimeout(function() {
                            photoWrapper.removeChild(overlay);
                        }, 2000);
                    }
                };
                imgTemp.src = url;
            }, 100);
        }
        
        btnEditar.addEventListener('click', function(e) {
            e.preventDefault();
            
            var imgTemp = new window.Image();
            imgTemp.onload = function() {
                var versionesAProcesar = [];
                
                // Agregar versiones que no están generadas
                if (!versionesGeneradas.mejorada && typeof aplicarFiltroDocumento === 'function') {
                    versionesAProcesar.push({
                        tipo: 'mejorada',
                        funcion: aplicarFiltroDocumento,
                        titulo: 'Binarización adaptativa'
                    });
                }
                  if (!versionesGeneradas.contraste && typeof aplicarFiltroContrasteAutomatico === 'function') {
                    versionesAProcesar.push({
                        tipo: 'contraste',
                        funcion: aplicarFiltroContrasteAutomatico,
                        titulo: 'Documentos con fondos de color'
                    });
                }
                
                if (!versionesGeneradas.bordes && typeof aplicarFiltroDeteccionBordes === 'function') {
                    versionesAProcesar.push({
                        tipo: 'bordes',
                        funcion: aplicarFiltroDeteccionBordes,
                        titulo: 'Documentos con texto/logos de colores'
                    });
                }
                
                if (!versionesGeneradas.color && typeof aplicarFiltroCorreccionColor === 'function') {
                    versionesAProcesar.push({
                        tipo: 'color',
                        funcion: aplicarFiltroCorreccionColor,
                        titulo: 'Documentos con mala iluminación'
                    });
                }
                
                if (versionesAProcesar.length === 0) {
                    // Todas las versiones ya están generadas, solo mostrar las miniaturas
                    Object.keys(miniaturas).forEach(function(tipo) {
                        if (tipo !== 'original' && miniaturas[tipo]) {
                            miniaturas[tipo].style.display = 'block';
                        }
                    });
                    return;
                }
                
                // Mostrar mensaje de procesamiento
                var statusElement = document.getElementById('status');
                if (statusElement) {
                    statusElement.textContent = 'Generando versiones mejoradas... (' + versionesAProcesar.length + ' versiones)';
                }
                
                // Procesar cada versión secuencialmente
                var procesamientoIndex = 0;
                
                function procesarSiguienteVersion() {
                    if (procesamientoIndex >= versionesAProcesar.length) {
                        // Procesamiento completado
                        if (statusElement) {
                            statusElement.textContent = 'Versiones generadas correctamente. Selecciona la mejor opción.';
                        }
                        return;
                    }
                    
                    var versionActual = versionesAProcesar[procesamientoIndex];
                    
                    if (statusElement) {
                        statusElement.textContent = 'Procesando: ' + versionActual.titulo + '...';
                    }
                    
                    versionActual.funcion(imgTemp, 0.7, Math.max(imgTemp.naturalWidth, imgTemp.naturalHeight), function(dataUrlProcesada) {
                        if (dataUrlProcesada) {
                            versiones[versionActual.tipo] = dataUrlProcesada;
                            versionesGeneradas[versionActual.tipo] = true;
                            
                            // Actualizar la miniatura correspondiente
                            if (miniaturas[versionActual.tipo]) {
                                miniaturas[versionActual.tipo].src = dataUrlProcesada;
                                miniaturas[versionActual.tipo].style.display = 'block';
                            }
                            
                            // Actualizar atributos de la imagen principal si es necesario
                            if (versionActual.tipo === 'mejorada') {
                                img.setAttribute('data-mejorada', dataUrlProcesada);
                            }
                        } else {
                            console.error('Error al generar versión:', versionActual.titulo);
                        }
                        
                        procesamientoIndex++;
                        // Procesar la siguiente versión después de un pequeño delay
                        setTimeout(procesarSiguienteVersion, 100);
                    });
                }
                
                // Iniciar el procesamiento
                procesarSiguienteVersion();
            };
            imgTemp.src = url;
        });
        photoWrapper.appendChild(btnEditar);

        // Botón recortar (tijeras)
        var btnRecortar = document.createElement('button');
        btnRecortar.textContent = '✂️';
        btnRecortar.title = 'Recortar foto';
        btnRecortar.className = 'btn-recortar-foto';
        btnRecortar.style.position = 'absolute';
        btnRecortar.style.top = '5px';
        btnRecortar.style.right = '70px';
        btnRecortar.style.zIndex = '10';
        btnRecortar.style.background = 'transparent';
        btnRecortar.style.border = 'none';
        btnRecortar.style.fontSize = '1.3rem';
        btnRecortar.style.cursor = 'pointer';
        btnRecortar.style.touchAction = 'manipulation';        // --- Ajustar lógica de subida y recorte para asegurar URL correcta ---
        btnRecortar.addEventListener('click', function(e) {
            e.preventDefault();
            abrirModalRecorte(img, url, function(dataUrlRecortada, infoRecorte) {
                if (dataUrlRecortada) {
                    subirFotoBase64(dataUrlRecortada, function(err, nuevaUrl) {                        if (!err && nuevaUrl) {
                            // CORREGIDO: Mostrar la imagen recortada, no la nueva URL
                            img.src = dataUrlRecortada;
                            img.setAttribute('data-original-url', nuevaUrl);
                            
                            // NUEVO: Guardar información del recorte en los atributos de la imagen
                            if (infoRecorte) {
                                img.setAttribute('data-recortada', dataUrlRecortada);
                                img.setAttribute('data-recorte-info', JSON.stringify(infoRecorte));
                            }
                            
                            // Actualizar la preferencia de pantalla completa si existe
                            var clavePreferencia = 'fotoPantallaCompleta_' + url;
                            var valor = localStorage.getItem(clavePreferencia);
                            if (valor !== null) {
                                localStorage.setItem('fotoPantallaCompleta_' + nuevaUrl, valor);
                                localStorage.removeItem(clavePreferencia);
                            }
                            // Eliminar la foto anterior del servidor
                            borrarFotoDelServidor(url, function(){
                                console.log('Foto anterior eliminada del servidor:', url);
                            });
                            // --- NUEVO: Forzar autoguardado tras recorte para que la URL real quede persistida ---
                            if (window.autoguardadoCamara && window.autoguardadoCamara.autoguardarFotos) {
                                setTimeout(function() {
                                    window.autoguardadoCamara.autoguardarFotos();
                                }, 300);
                            }
                        } else {
                            alert('Error al subir la imagen recortada');
                        }
                    });
                }
            });
        });
        photoWrapper.appendChild(btnRecortar);        // Función para seleccionar versión y actualizar lógica
        function seleccionarVersion(tipo) {
            if (!versiones[tipo]) {
                console.warn('Versión no disponible:', tipo);
                return;
            }
            
            // Actualizar imagen principal
            if (tipo === 'original') {
                img.src = url;
                img.setAttribute('data-version', 'original');
            } else {
                img.src = versiones[tipo];
                img.setAttribute('data-version', tipo);
                if (tipo === 'mejorada') {
                    img.setAttribute('data-mejorada', versiones[tipo]);
                }
            }
            
            // Actualizar bordes de miniaturas
            for (var key in miniaturas) {
                if (miniaturas[key]) {
                    if (key === tipo) {
                        miniaturas[key].style.border = '2px solid #4caf50';
                    } else {
                        miniaturas[key].style.border = '2px solid #ccc';
                    }
                }            }
            
            // CORREGIDO: No usar más variables globales con índices
            // La información se mantiene en los atributos del DOM
              
            // NUEVO: Autoguardar después de seleccionar versión
            if (window.autoguardadoCamara && window.autoguardadoCamara.autoguardarFotos) {
                setTimeout(function() {
                    window.autoguardadoCamara.autoguardarFotos();
                }, 200);
            }
            
            img.setAttribute('data-version', tipo);
            if (versiones[tipo] && tipo !== 'original') {
                img.setAttribute('data-mejorada', versiones[tipo]);
            }
            
            // Forzar autoguardado si existe
            if (window.autoguardadoCamara && typeof window.autoguardadoCamara.autoguardarFotos === 'function') {
                window.autoguardadoCamara.autoguardarFotos();
            }
        }
        
        // NUEVO: Función para restaurar versión almacenada
        function restaurarVersionAlmacenada() {
            // Si la versión actual no es 'original' y no tenemos la imagen, mostrar indicador
            if (versionActual !== 'original' && versionActual !== 'mejorada') {
                // Mostrar mensaje que se necesita regenerar
                var statusElement = document.getElementById('status');
                if (statusElement && !versiones[versionActual]) {
                    statusElement.textContent = 'Haz clic en ✏️ para regenerar las versiones de filtros.';
                }
                
                // Destacar la miniatura correspondiente aunque no tengamos la imagen
                if (miniaturas[versionActual]) {
                    miniaturas[versionActual].style.border = '2px solid #4caf50';
                    miniaturas[versionActual].style.display = 'block';
                    // Mostrar todas las miniaturas para que el usuario sepa que hay versiones disponibles
                    Object.keys(miniaturas).forEach(function(key) {
                        if (key !== 'original' && miniaturas[key]) {
                            miniaturas[key].style.display = 'block';
                        }
                    });
                }
            }
        }
        
        // Ejecutar restauración después de crear las miniaturas
        setTimeout(restaurarVersionAlmacenada, 100);

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
            }            borrarFotoDelServidor(url, function(err) {
                if (!err) {
                    photoWrapper.remove();
                    photosTakenCount = contenedor.querySelectorAll('.photo-wrapper').length;
                    actualizarContadorFotos();
                    statusElement.textContent = 'Foto eliminada correctamente.';
                    
                    // Forzar autoguardado después de eliminar para mantener consistencia
                    if (window.autoguardadoCamara && window.autoguardadoCamara.autoguardarFotos) {
                        setTimeout(function() {
                            window.autoguardadoCamara.autoguardarFotos();
                        }, 300);
                    }
                } else {
                    alert('Error al borrar la foto: ' + err);
                }
            });
        });
        photoWrapper.appendChild(deleteButton);

        // Checkbox para pantalla completa en PDF (al final, debajo de todo)
        var divCheckbox = document.createElement('div');
        divCheckbox.style.textAlign = 'center';
        divCheckbox.style.margin = '6px 0 0 0';
        var checkboxPantallaCompleta = document.createElement('input');
        checkboxPantallaCompleta.type = 'checkbox';
        checkboxPantallaCompleta.className = 'checkbox-pantalla-completa';
        checkboxPantallaCompleta.title = '¿Esta foto debe ir en pantalla completa en el PDF?';
        var labelPantallaCompleta = document.createElement('label');
        labelPantallaCompleta.textContent = 'Pantalla completa en PDF';
        labelPantallaCompleta.style.fontSize = '0.85em';
        labelPantallaCompleta.style.marginLeft = '4px';
        labelPantallaCompleta.style.color = '#444';
        labelPantallaCompleta.appendChild(checkboxPantallaCompleta);
        // Leer preferencia guardada
        var clavePreferencia = 'fotoPantallaCompleta_' + url;
        var guardado = localStorage.getItem(clavePreferencia);
        checkboxPantallaCompleta.checked = guardado === 'true';
        // Guardar preferencia al cambiar
        checkboxPantallaCompleta.addEventListener('change', function() {
            localStorage.setItem(clavePreferencia, checkboxPantallaCompleta.checked ? 'true' : 'false');
        });        divCheckbox.appendChild(labelPantallaCompleta);
        photoWrapper.appendChild(divCheckbox); // SIEMPRE al final
        
        // NUEVO: Botón para importar imagen predefinida después de cada foto
        var divImportar = document.createElement('div');
        divImportar.style.textAlign = 'center';
        divImportar.style.margin = '8px 0 4px 0';
        
        var btnImportarIndividual = document.createElement('button');
        btnImportarIndividual.textContent = '📁 Importar Imagen';
        btnImportarIndividual.className = 'boton boton--terciario';
        btnImportarIndividual.style.fontSize = '0.8em';
        btnImportarIndividual.style.padding = '4px 8px';
        btnImportarIndividual.style.backgroundColor = '#e8f4f8';
        btnImportarIndividual.style.border = '1px solid #b0d4e3';
        btnImportarIndividual.style.borderRadius = '4px';
        btnImportarIndividual.style.color = '#2c5aa0';
        btnImportarIndividual.style.cursor = 'pointer';
        btnImportarIndividual.title = 'Importar una imagen predefinida desde la biblioteca';
        
        btnImportarIndividual.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof window.mostrarModalImportarImagenes === 'function') {
                window.mostrarModalImportarImagenes();
            } else {
                alert('Funcionalidad de importar imágenes no disponible');
            }
        });
        
        divImportar.appendChild(btnImportarIndividual);
        photoWrapper.appendChild(divImportar);
        
        contenedor.appendChild(photoWrapper);
    }    // NUEVA: Función especial para agregar fotos restauradas conservando todas las versiones
    window.agregarFotoRestaurada = function(url, version, mejorada, versionesGuardadas, recortada, recorteInfo) {
        var contenedor = document.getElementById('photosContainer');
        if (!contenedor) {
            return;
        }
        var photoWrapper = document.createElement('div');
        photoWrapper.classList.add('photo-wrapper');
        photoWrapper.style.position = 'relative';

        // Imagen principal mostrada
        var img = document.createElement('img');
        img.className = 'foto-principal';
        img.setAttribute('data-original-url', url);
        img.setAttribute('data-version', version || 'original');
        if (mejorada) {
            img.setAttribute('data-mejorada', mejorada);
        }
        
        // NUEVO: Agregar atributos de recorte si existen
        if (recortada) {
            img.setAttribute('data-recortada', recortada);
        }
        if (recorteInfo) {
            img.setAttribute('data-recorte-info', JSON.stringify(recorteInfo));
        }
        
        // Configurar las versiones disponibles desde el guardado
        var versiones = {
            original: url,
            mejorada: mejorada || null,
            contraste: null,
            bordes: null,
            color: null
        };
        
        // Restaurar versiones guardadas si existen
        if (versionesGuardadas) {
            if (versionesGuardadas.contraste) versiones.contraste = versionesGuardadas.contraste;
            if (versionesGuardadas.bordes) versiones.bordes = versionesGuardadas.bordes;
            if (versionesGuardadas.color) versiones.color = versionesGuardadas.color;
        }
          // CORREGIDO: Priorizar imagen recortada si existe, luego versión seleccionada
        if (recortada) {
            // Si hay imagen recortada, mostrarla directamente
            img.src = recortada;
            console.log('Aplicando imagen recortada guardada para:', url);
        } else {
            // Mostrar la imagen correcta según la versión seleccionada
            var versionActual = version || 'original';
            if (versiones[versionActual]) {
                img.src = versiones[versionActual];
            } else {
                // Si la versión no está disponible, mostrar original
                img.src = url;
            }
        }
        
        img.alt = 'Foto subida';
        photoWrapper.appendChild(img);

        // Miniaturas y lógica de versiones
        var miniaturasContainer = document.createElement('div');
        miniaturasContainer.className = 'miniaturas-container';
        miniaturasContainer.style.display = 'flex';
        miniaturasContainer.style.justifyContent = 'center';
        miniaturasContainer.style.gap = '6px';
        miniaturasContainer.style.marginTop = '6px';
        miniaturasContainer.style.marginBottom = '4px';
        miniaturasContainer.style.flexWrap = 'wrap';
        photoWrapper.appendChild(miniaturasContainer);        var miniaturas = {};
        
        // CORREGIDO: No usar más arrays globales con índices para evitar problemas al eliminar fotos

        // Función para crear miniatura con estado correcto
        function crearMiniatura(tipo, src, alt, titulo) {
            var mini = document.createElement('img');
            mini.src = src || url; // Usar original como fallback
            mini.alt = alt;
            mini.title = titulo;
            mini.className = 'miniatura-foto';
            // Establecer borde verde según la versión actual almacenada
            mini.style.border = (versionActual === tipo) ? '2px solid #4caf50' : '2px solid #ccc';
            mini.style.borderRadius = '6px';
            mini.style.width = '40px';
            mini.style.height = '40px';
            mini.style.objectFit = 'cover';
            mini.style.cursor = 'pointer';
            mini.style.display = (tipo === 'original' || src) ? 'block' : 'none';
            miniaturas[tipo] = mini;
            miniaturasContainer.appendChild(mini);
            mini.addEventListener('click', function() {
                if (versiones[tipo]) {
                    seleccionarVersion(tipo);
                }
            });
            return mini;
        }

        // Crear miniaturas con las versiones restauradas
        crearMiniatura('original', url, 'Original', 'Imagen original');
        crearMiniatura('mejorada', versiones.mejorada, 'Mejorada', 'Binarización adaptativa');
        crearMiniatura('contraste', versiones.contraste, 'Fondo Color', 'Documentos con fondos de color');
        crearMiniatura('bordes', versiones.bordes, 'Texto Color', 'Documentos con texto/logos de colores');
        crearMiniatura('color', versiones.color, 'Iluminación', 'Documentos con mala iluminación');

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
        
        var versionesGeneradas = {
            mejorada: !!versiones.mejorada,
            contraste: !!versiones.contraste,
            bordes: !!versiones.bordes,
            color: !!versiones.color
        };
        
        btnEditar.addEventListener('click', function(e) {
            e.preventDefault();
            
            var imgTemp = new window.Image();
            imgTemp.onload = function() {
                var versionesAProcesar = [];
                
                // Solo agregar versiones que no están generadas
                if (!versionesGeneradas.mejorada && typeof aplicarFiltroDocumento === 'function') {
                    versionesAProcesar.push({
                        tipo: 'mejorada',
                        funcion: aplicarFiltroDocumento,
                        titulo: 'Binarización adaptativa'
                    });
                }
                
                if (!versionesGeneradas.contraste && typeof aplicarFiltroContrasteAutomatico === 'function') {
                    versionesAProcesar.push({
                        tipo: 'contraste',
                        funcion: aplicarFiltroContrasteAutomatico,
                        titulo: 'Documentos con fondos de color'
                    });
                }
                
                if (!versionesGeneradas.bordes && typeof aplicarFiltroDeteccionBordes === 'function') {
                    versionesAProcesar.push({
                        tipo: 'bordes',
                        funcion: aplicarFiltroDeteccionBordes,
                        titulo: 'Documentos con texto/logos de colores'
                    });
                }
                
                if (!versionesGeneradas.color && typeof aplicarFiltroCorreccionColor === 'function') {
                    versionesAProcesar.push({
                        tipo: 'color',
                        funcion: aplicarFiltroCorreccionColor,
                        titulo: 'Documentos con mala iluminación'
                    });
                }
                
                if (versionesAProcesar.length === 0) {
                    // Todas las versiones ya están generadas, solo mostrar las miniaturas
                    Object.keys(miniaturas).forEach(function(tipo) {
                        if (tipo !== 'original' && miniaturas[tipo]) {
                            miniaturas[tipo].style.display = 'block';
                        }
                    });
                    return;
                }
                
                // Procesar versiones faltantes de forma similar a la función original
                var statusElement = document.getElementById('status');
                if (statusElement) {
                    statusElement.textContent = 'Generando versiones faltantes... (' + versionesAProcesar.length + ' versiones)';
                }
                
                var procesamientoIndex = 0;
                
                function procesarSiguienteVersion() {
                    if (procesamientoIndex >= versionesAProcesar.length) {
                        if (statusElement) {
                            statusElement.textContent = 'Versiones generadas correctamente. Selecciona la mejor opción.';
                        }
                        return;
                    }
                    
                    var versionProcesar = versionesAProcesar[procesamientoIndex];
                    
                    if (statusElement) {
                        statusElement.textContent = 'Procesando: ' + versionProcesar.titulo + '...';
                    }
                    
                    versionProcesar.funcion(imgTemp, 0.7, Math.max(imgTemp.naturalWidth, imgTemp.naturalHeight), function(dataUrlProcesada) {
                        if (dataUrlProcesada) {
                            versiones[versionProcesar.tipo] = dataUrlProcesada;
                            versionesGeneradas[versionProcesar.tipo] = true;
                            
                            if (miniaturas[versionProcesar.tipo]) {
                                miniaturas[versionProcesar.tipo].src = dataUrlProcesada;
                                miniaturas[versionProcesar.tipo].style.display = 'block';
                            }
                            
                            if (versionProcesar.tipo === 'mejorada') {
                                img.setAttribute('data-mejorada', dataUrlProcesada);
                            }
                        } else {
                            console.error('Error al generar versión:', versionProcesar.titulo);
                        }
                        
                        procesamientoIndex++;
                        setTimeout(procesarSiguienteVersion, 100);
                    });
                }
                
                procesarSiguienteVersion();
            };
            imgTemp.src = url;
        });
        photoWrapper.appendChild(btnEditar);

        // Botón recortar (usar la misma lógica que la función original)
        var btnRecortar = document.createElement('button');
        btnRecortar.textContent = '✂️';
        btnRecortar.title = 'Recortar foto';
        btnRecortar.className = 'btn-recortar-foto';
        btnRecortar.style.position = 'absolute';
        btnRecortar.style.top = '5px';
        btnRecortar.style.right = '70px';
        btnRecortar.style.zIndex = '10';
        btnRecortar.style.background = 'transparent';
        btnRecortar.style.border = 'none';
        btnRecortar.style.fontSize = '1.3rem';
        btnRecortar.style.cursor = 'pointer';
        btnRecortar.style.touchAction = 'manipulation';
          btnRecortar.addEventListener('click', function(e) {
            e.preventDefault();
            abrirModalRecorte(img, url, function(dataUrlRecortada, infoRecorte) {
                if (dataUrlRecortada) {
                    subirFotoBase64(dataUrlRecortada, function(err, nuevaUrl) {                        if (!err && nuevaUrl) {
                            // CORREGIDO: Mostrar la imagen recortada, no la nueva URL
                            img.src = dataUrlRecortada;
                            img.setAttribute('data-original-url', nuevaUrl);
                            
                            // NUEVO: Guardar información del recorte en los atributos de la imagen
                            if (infoRecorte) {
                                img.setAttribute('data-recortada', dataUrlRecortada);
                                img.setAttribute('data-recorte-info', JSON.stringify(infoRecorte));
                            }
                            
                            var clavePreferencia = 'fotoPantallaCompleta_' + url;
                            var valor = localStorage.getItem(clavePreferencia);
                            if (valor !== null) {
                                localStorage.setItem('fotoPantallaCompleta_' + nuevaUrl, valor);
                                localStorage.removeItem(clavePreferencia);
                            }
                            borrarFotoDelServidor(url, function(){
                                console.log('Foto anterior eliminada del servidor:', url);
                            });
                            if (window.autoguardadoCamara && window.autoguardadoCamara.autoguardarFotos) {
                                setTimeout(function() {
                                    window.autoguardadoCamara.autoguardarFotos();
                                }, 300);
                            }
                        } else {
                            alert('Error al subir la imagen recortada');
                        }
                    });
                }
            });
        });
        photoWrapper.appendChild(btnRecortar);

        // Función para seleccionar versión
        function seleccionarVersion(tipo) {
            if (!versiones[tipo]) {
                console.warn('Versión no disponible:', tipo);
                return;
            }
            
            // Actualizar imagen principal
            img.src = versiones[tipo];
            img.setAttribute('data-version', tipo);
            if (tipo === 'mejorada') {
                img.setAttribute('data-mejorada', versiones[tipo]);
            }
            
            // Actualizar bordes de miniaturas
            for (var key in miniaturas) {
                if (miniaturas[key]) {
                    if (key === tipo) {
                        miniaturas[key].style.border = '2px solid #4caf50';
                    } else {
                        miniaturas[key].style.border = '2px solid #ccc';
                    }
                }            }
            
            // CORREGIDO: No usar más variables globales con índices
            // La información se mantiene en los atributos del DOM
            
            // Autoguardar después de seleccionar versión
            if (window.autoguardadoCamara && window.autoguardadoCamara.autoguardarFotos) {
                setTimeout(function() {
                    window.autoguardadoCamara.autoguardarFotos();
                }, 200);
            }
        }

        // Agregar botón eliminar (usar la misma lógica que la función original)
        var btnEliminar = document.createElement('button');
        btnEliminar.textContent = '🗑️';
        btnEliminar.title = 'Eliminar foto';
        btnEliminar.className = 'btn-eliminar-foto';
        btnEliminar.style.position = 'absolute';
        btnEliminar.style.top = '5px';
        btnEliminar.style.right = '10px';
        btnEliminar.style.zIndex = '10';
        btnEliminar.style.background = 'transparent';
        btnEliminar.style.border = 'none';
        btnEliminar.style.fontSize = '1.3rem';
        btnEliminar.style.cursor = 'pointer';
        btnEliminar.style.touchAction = 'manipulation';
        
        btnEliminar.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que deseas eliminar esta foto?')) {
                // Eliminar la foto del servidor
                borrarFotoDelServidor(url, function() {
                    console.log('Foto eliminada del servidor');
                });                // Remover del DOM
                photoWrapper.remove();                // Limpiar localStorage si tiene preferencias
                var clavePreferencia = 'fotoPantallaCompleta_' + url;
                localStorage.removeItem(clavePreferencia);
                // CORREGIDO: Ya no es necesario actualizar arrays globales con índices
                // El autoguardado se encarga de mantener la consistencia
                
                // Forzar autoguardado después de eliminar para mantener consistencia
                if (window.autoguardadoCamara && window.autoguardadoCamara.autoguardarFotos) {
                    setTimeout(function() {
                        window.autoguardadoCamara.autoguardarFotos();
                    }, 300);
                }
            }
        });
        photoWrapper.appendChild(btnEliminar);

        // Agregar checkbox de pantalla completa (usar la misma lógica que la función original)
        var divCheckbox = document.createElement('div');
        divCheckbox.style.textAlign = 'center';
        divCheckbox.style.marginTop = '4px';
        var checkboxPantallaCompleta = document.createElement('input');
        checkboxPantallaCompleta.type = 'checkbox';
        checkboxPantallaCompleta.className = 'checkbox-pantalla-completa';
        checkboxPantallaCompleta.id = 'pantallaCompleta_' + Date.now() + '_' + Math.random();
        var labelCheckbox = document.createElement('label');
        labelCheckbox.htmlFor = checkboxPantallaCompleta.id;
        labelCheckbox.textContent = ' Página completa';
        labelCheckbox.style.fontSize = '12px';
        labelCheckbox.style.color = '#666';
        divCheckbox.appendChild(checkboxPantallaCompleta);
        divCheckbox.appendChild(labelCheckbox);
        photoWrapper.appendChild(divCheckbox);

        // Restaurar preferencia de pantalla completa
        var clavePreferencia = 'fotoPantallaCompleta_' + url;
        var preferenciaGuardada = localStorage.getItem(clavePreferencia);
        if (preferenciaGuardada === 'true') {
            checkboxPantallaCompleta.checked = true;
        }

        // Guardar preferencia al cambiar
        checkboxPantallaCompleta.addEventListener('change', function() {
            localStorage.setItem(clavePreferencia, checkboxPantallaCompleta.checked.toString());
        });

        contenedor.appendChild(photoWrapper);
    };

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
