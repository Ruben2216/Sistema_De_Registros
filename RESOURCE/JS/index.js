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
    let photosTakenCount = 0; // Contador de fotos tomadas 
    let imageCapture = null; // Instancia para la API ImageCapture

    // Preferencias iniciales
    let currentFacingMode = "environment"; // "environment" para trasera SIEMPRE

    // Solicitar la máxima calidad posible, 
    const constraints = {
        audio: false,  
        video: {
            facingMode: currentFacingMode, 
            width: {  ideal: 1920, min: 1280 }, 
            height: {  ideal: 1080, min: 720 },
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
        clearButton.disabled = true; 
        statusElement.textContent = "Iniciando cámara... Espere.";
        photosTakenCount = 0; // Reiniciar contador al inciiar

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
            clearButton.disabled = true; 

            //limpiar imagenes y contador
            photosTakenCount = 0; 
            videoElement.style.transform = 'translate(-50%, -50%)'; //al parecer, rota el video al detener - Corregido para resetear la rotación
        }
    }

    async function snapPhoto() { 
        if (!stream || videoElement.paused || videoElement.ended || videoElement.videoWidth === 0) {
            statusElement.textContent = "La cámara no está activa o lista.";
            return;
        }

        console.log("Snapping photo. Video dimensions:", videoElement.videoWidth, videoElement.videoHeight);
        console.log("Is front camera for snap:", frontCamera);

        let dataUrl;

        try {
            const videoSourceWidth = videoElement.videoWidth;
            const videoSourceHeight = videoElement.videoHeight;
            const videoAspectRatio = videoSourceWidth / videoSourceHeight;

            const videoContainer = videoElement.parentElement;
            const containerDisplayWidth = videoContainer.clientWidth;
            const containerDisplayHeight = videoContainer.clientHeight;
            const containerAspectRatio = containerDisplayWidth / containerDisplayHeight;

            // Determina las dimensiones de la "ventana" de video que se ve en el contenedor
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

            // El canvas tendrá la resolución de la sección visible del video,
            // manteniendo la máxima resolución para esa porción.
            canvasElement.width = cropSourceWidth;
            canvasElement.height = cropSourceHeight;

            context.save();

            // Limpiar el canvas antes de dibujar
            context.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // Si es cámara frontal, aplicar espejo horizontal en el canvas
            if (frontCamera) {
                context.translate(canvasElement.width, 0);
                context.scale(-1, 1);
            }

            // Dibujar la sección recortada del video en el canvas
            context.drawImage(
                videoElement,
                cropSourceX, cropSourceY, cropSourceWidth, cropSourceHeight, // Fuente: sección recortada del video
                0, 0, canvasElement.width, canvasElement.height              // Destino: todo el canvas
            );

            // Restaurar el contexto para quitar el espejo antes de dibujar la fecha/hora
            context.restore();

            // ----------------------- Agregar fecha y hora como pie de foto dentro de la imagen (sin espejo) ----------------
            
            var fecha = new Date();

            var fechaTexto = fecha.toLocaleDateString('es-MX') + ' ' + fecha.getHours() + ':' + fecha.getMinutes() ;
            var fontSize = 48; //tamaño de fuente
            var padding = 10;
            context.save();
            context.font = fontSize + 'px Arial';
            context.textBaseline = 'bottom';
            var textWidth = context.measureText(fechaTexto).width;
            var x = canvasElement.width - textWidth - padding;
            var y = canvasElement.height - padding;
            // Fondo semitransparente para que se vea mejor
            context.fillStyle = 'rgba(0,0,0,0.48)';
            context.fillRect(x - padding, y - fontSize - 4, textWidth + 2 * padding, fontSize + 8);
            // Texto
            context.fillStyle = 'white';
            context.fillText(fechaTexto, x, y);
            context.restore();
            // ---------------------- Fin pie de foto -------------------------

            dataUrl = canvasElement.toDataURL('image/png');

            photosTakenCount++;
            const photoWrapper = document.createElement('div');
            photoWrapper.classList.add('photo-wrapper');

            const newImgElement = document.createElement('img'); //ELEMENTO QUE SE VA A CREAR LAS IMG
            newImgElement.src = dataUrl;
            newImgElement.alt = `Foto Capturada ${photosTakenCount}`;

            const deleteButton = document.createElement('button');
            //estilos para el boton de eliminar
            deleteButton.style.backgroundColor = '#00724e';
            deleteButton.style.border = 'none';
            deleteButton.style.borderRadius = '40px';
            deleteButton.style.width = '1.8rem';
            deleteButton.style.height = '1.8rem';
            deleteButton.style.position = 'absolute'; 
            photoWrapper.style.position = 'relative'; // Asegurar que el contenedor tenga posición relativa para posicionar el botón independientemente del tamañño del dispositivo
            deleteButton.style.top = '5px'; 
            deleteButton.style.right = '5px'; 

            deleteButton.textContent = 'X';
            deleteButton.addEventListener('click', () => {
                //preguntar antes de eliminar de que si si se va a borrar la foto o no
                if (!confirm("¿Estás seguro de que quieres eliminar esta foto?")) {
                    return; // Si selecciona que no, no hacer nada, solo retornar nada
                }
                photoWrapper.remove();
                photosTakenCount--; //Reiniciar contador de las n imagenes
                
                statusElement.textContent = `Foto eliminada. Total: ${photosTakenCount}`;
            });
         // ---------------- evento de descarga de la img con dblclick ----------------
            newImgElement.addEventListener('dblclick', () => {
                const link = document.createElement('a');
                link.href = newImgElement.src;
                link.download = `Foto_Capturada_${photosTakenCount}.png`;
                link.click();
            });
            //-------------------------------------------------------------------------------

            photoWrapper.appendChild(newImgElement);
            photoWrapper.appendChild(deleteButton);
            photosContainer.appendChild(photoWrapper);

            statusElement.textContent = `¡Foto ${photosTakenCount} tomada! Puedes tomar otra.`;

        } catch (error) {
            console.error("Error al tomar la foto:", error);
            statusElement.textContent = `Error al tomar la foto: ${error.name}`;
        }
    }

    function clearimage(){
        photosContainer.innerHTML = '';
        photosTakenCount = 0; // Reiniciar contador al limpiar
        statusElement.innerHTML="Espacio en blanco...";
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

    window.addEventListener('beforeunload', () => {
        stopCamera(); 
    });
});