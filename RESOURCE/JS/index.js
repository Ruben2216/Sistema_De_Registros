document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const photoElement = document.getElementById('photo');
    const startButton = document.getElementById('startButton');
    const snapButton = document.getElementById('snapButton');
    const stopButton = document.getElementById('stopButton');
    const statusElement = document.getElementById('status');
    const videoContainer = document.querySelector('.video-container'); 
    const context = canvasElement.getContext('2d');

    let stream = null;
    let frontCamera = false; 

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

                    statusElement.textContent = "Cámara lista.  cc";
                    snapButton.disabled = false; // Habilitar botón de captura AHORA
                    stopButton.disabled = false;
                    photoElement.src = "#";
                    photoElement.style.display = 'none';
                };

                videoElement.onerror = (e) => {
                    console.error("Error en el elemento de video:", e);
                    statusElement.textContent = "Error con el elemento de video.";
                    stopCamera(); // Intentar limpiar
                };

            } else {
                statusElement.textContent = "Error: getUserMedia no es soportado.";
                console.error("getUserMedia not supported");
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
            statusElement.textContent = "Cámara detenida.";
            startButton.disabled = false;
            snapButton.disabled = true;
            stopButton.disabled = true;
            photoElement.src = "#";
            photoElement.style.display = 'none';
            videoElement.style.transform = 'translate(-50%, -50%) rotate(90deg)';
        }
    }

    function snapPhoto() {
        if (!stream || videoElement.paused || videoElement.ended || videoElement.videoWidth === 0) {
            statusElement.textContent = "La cámara no está activa o lista.";
            console.warn("Snap attempt when video not ready. Video state:", {
                paused: videoElement.paused,
                ended: videoElement.ended,
                videoWidth: videoElement.videoWidth,
                readyState: videoElement.readyState
            });
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
        photoElement.src = dataUrl;
        photoElement.style.display = 'block'; 
        statusElement.textContent = "¡Foto tomada!";
        return; // Terminar aquí para evitar código anterior innecesario
    }

    startButton.addEventListener('click', startCamera);
    stopButton.addEventListener('click', stopCamera);
    snapButton.addEventListener('click', snapPhoto);

    window.addEventListener('beforeunload', () => {
        stopCamera();
    });
});