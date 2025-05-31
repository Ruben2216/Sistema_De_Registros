document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas'); 
    //Referencias a los dos elementos de imagen 
    const photosContainer = document.getElementById('photosContainer');
    const startButton = document.getElementById('startButton');
    const snapButton = document.getElementById('snapButton');
    const stopButton = document.getElementById('stopButton');
    const statusElement = document.getElementById('status');
    //const videoContainer = document.querySelector('.video-container'); 
    const context = canvasElement.getContext('2d');

    let stream = null;
    let frontCamera = false; 
    let photosTakenCount = 0; // Contador de fotos tomadas 

    // Preferencias iniciales
    let currentFacingMode = "environment"; // "environment" para trasera SIEMPRE

    const constraints = {
        audio: false,
        video: {
            facingMode: currentFacingMode, // Siempre trasera
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

function updateVideoMirroring() {
    if (frontCamera) {
        videoElement.style.transform = 'translate(-50%, -50%) scaleX(-1)';
    } else {
        videoElement.style.transform = 'translate(-50%, -50%)';
    }
}

    async function startCamera() {
        constraints.video.facingMode = currentFacingMode; // Actualizar por si cambió
        startButton.disabled = true;
        snapButton.disabled = true; // Deshabilitar hasta que el video esté listo
        stopButton.disabled = true;
        photosTakenCount = 0; // Reiniciar contador al inciiar

        //Limpia imagenes anteriores
        photosContainer.innerHTML = '';  

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                videoElement.srcObject = stream;

                videoElement.onloadedmetadata = () => {
                    videoElement.play().catch(function(err) {
                        console.error("Error al reproducir video:", err);
                        statusElement.textContent = "Error al reproducir video.";
                    });

                    // Determinar si la cámara activa es trasera desde el stream real
                    const settings = stream.getVideoTracks()[0].getSettings();
                    frontCamera = settings.facingMode === "user" ? true : false;
                    currentFacingMode = settings.facingMode; // Guardar el modo actual

                    // Forzar trasera si el navegador lo permite
                    if (currentFacingMode !== "environment") {
                        statusElement.textContent = "No se pudo acceder a la cámara trasera. Se usó: " + currentFacingMode;
                    }

                    console.log("Stream settings:", settings);
                    console.log("Video dimensions (onloadedmetadata):", videoElement.videoWidth, videoElement.videoHeight);
                    console.log("Actual facingMode:", currentFacingMode, "Is frontCamera:", frontCamera);

                    updateVideoMirroring(); // Aplicar espejo CSS según la cámara

                    statusElement.textContent = "Toma la primera foto."; 
                    snapButton.disabled = false; // Habilitar botón de captura AHORA
                    stopButton.disabled = false;
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
            statusElement.textContent = "Imagenes nuevas";
            startButton.disabled = false;
            snapButton.disabled = true;
            stopButton.disabled = true;

            //limpiar imagenes y contador
            photosContainer.innerHTML = ''; 
            photosTakenCount = 0; 
            videoElement.style.transform = 'translate(-50%, -50%) rotate(90deg)'; //al parecer, rota el video al detener
        }
    }

    function snapPhoto() {
        if (!stream || videoElement.paused || videoElement.ended || videoElement.videoWidth === 0) {
            statusElement.textContent = "La cámara no está activa o lista.";
            return;
        }

        console.log("Snapping photo. Video dimensions:", videoElement.videoWidth, videoElement.videoHeight);
        console.log("Is front camera for snap:", frontCamera);

        // Configurar el canvas al mismo tamaño que el video original
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        context.save(); // Guardar estado actual del contexto (limpio)

        // Si es cámara frontal, aplicar espejo horizontal
        if (frontCamera) {
            context.translate(canvasElement.width, 0);
            context.scale(-1, 1); // Espejar horizontalmente
        }

        // Dibujar el video exactamente igual, sin escalado ni recorte
        context.drawImage(
            videoElement,
            0, 0, videoElement.videoWidth, videoElement.videoHeight, // Fuente: todo el video
            0, 0, videoElement.videoWidth, videoElement.videoHeight  // Destino: todo el canvas
        );

        context.restore(); // Restaurar el contexto a su estado original (sin transformaciones)

        const dataUrl = canvasElement.toDataURL('image/png');
        photosTakenCount++; // Incrementar contador de fotos
        // Crear y añadir nuevo elemento img
        const newImgElement = document.createElement('img');
        newImgElement.src = dataUrl;
        newImgElement.alt = `Foto Capturada ${photosTakenCount}`;

        //añade imagen al contenedor
        photosContainer.appendChild(newImgElement);
        statusElement.textContent = `¡Foto ${photosTakenCount} tomada! Puedes tomar otra.`;
        // El botón snapButton permanece habilitado

        //Mostrar fotos al final, sin esto no se visualiza 
        photoElement.src = dataUrl;
        photoElement.style.display = 'block';  
        return; // Terminar aquí para evitar código anterior innecesario
    }
    startButton.addEventListener('click', startCamera);
    stopButton.addEventListener('click', stopCamera);
    snapButton.addEventListener('click', snapPhoto);

    window.addEventListener('beforeunload', () => {
        stopCamera(); 
    });
});