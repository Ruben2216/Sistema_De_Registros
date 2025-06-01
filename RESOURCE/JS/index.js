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
    let imageCapture = null; // Instancia para la API ImageCapture

    // Preferencias iniciales
    let currentFacingMode = "environment"; // "environment" para trasera SIEMPRE

    // Solicitar la máxima calidad posible, 
    const constraints = {
        audio: false,
        video: {
            facingMode: currentFacingMode, 
            width: { max: 9999, ideal: 3840, min: 1280 }, 
            height: { max: 9999, ideal: 2160, min: 720 }  
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
        photosTakenCount = 0; // Reiniciar contador al inciiar

        //Limpia imagenes anteriores
        photosContainer.innerHTML = '';

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                videoElement.srcObject = stream;

                videoElement.onloadedmetadata =() => {
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
                        // ImageCapture no disponible, se usará el método de canvas como reservaa
                        imageCapture = null; 
                    }

                    //------------------------------------------------
                    // Mostrar la resolución obtenida del navegador

                    const realWidth = videoElement.videoWidth;
                    const realHeight = videoElement.videoHeight;
                    console.log("Resolución otbenida:", realWidth, "x", realHeight);
                    //------------------------------------------------

                    // Forzar trasera si el navegador lo permite
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

    async function snapPhoto() { 
        if (!stream || videoElement.paused || videoElement.ended || videoElement.videoWidth === 0) {
            statusElement.textContent = "La cámara no está activa o lista.";
            return;
        }

        console.log("Snapping photo. Video dimensions:", videoElement.videoWidth, videoElement.videoHeight);
        console.log("Is front camera for snap:", frontCamera);

        let dataUrl;
        let photoWidth, photoHeight; // Variables para almacenar las dimensiones de la foto tomada en el canvas

        try {
            // Intentar usar ImageCapture primero para la máxima resolución, si no está disponible, usara canvas como plan B de respaldo
            if (imageCapture) {
                const photoBlob = await imageCapture.takePhoto();
                let originalBlobUrl = URL.createObjectURL(photoBlob); // Guardar el URL del Blob para poder usarlo

                // Cargar en un objeto Image temporal para obtener dimensiones y dibujar
                const img = new Image();
                img.src = originalBlobUrl;
                await new Promise(resolve => img.onload = resolve); // Esperar a que la imagen se cargue

                photoWidth = img.width; // Obtener el ancho de la imagen capturada
                photoHeight = img.height; // Obtener el alto de la imagen capturada

                // Si es cámara frontal, necesitamos aplicar el espejo en un canvas temporal
                if (frontCamera) {
                    const tempCanvas = document.createElement('canvas'); // Crear un canvas temporal
                    const tempContext = tempCanvas.getContext('2d');
                    tempCanvas.width = photoWidth;
                    tempCanvas.height = photoHeight;

                    tempContext.save(); // Guardar estado del contexto del canvas temporal
                    tempContext.translate(tempCanvas.width, 0);
                    tempContext.scale(-1, 1); // Espejar horizontalmente
                    tempContext.drawImage(img, 0, 0, photoWidth, photoHeight); // Dibujar la imagen
                    tempContext.restore(); // Restaurar estado del contexto

                    dataUrl = tempCanvas.toDataURL('image/png'); // Obtener la imagen ya espejada
                    URL.revokeObjectURL(originalBlobUrl); // Revocar el URL original para liberar memoria
                } else {
                    dataUrl = originalBlobUrl; // Si no es cámara frontal, usar el blob original directamente
                }

            } else {
                // Fallback al método de canvas si ImageCapture no está disponible o falla
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

                dataUrl = canvasElement.toDataURL('image/png');
                photoWidth = canvasElement.width; // Obtener ancho del canvas
                photoHeight = canvasElement.height; // Obtener alto del canvas
            }

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
        // photoElement.src = dataUrl; //CAUSABA ERROR
        // photoElement.style.display = 'block';  
        return; // Terminar aquí para evitar código anterior innecesario

        } catch (error) {
            console.error("Error al tomar la foto:", error);
            statusElement.textContent = `Error al tomar la foto: ${error.name}`; // Mostrar el nombre del error
        }
    }

    startButton.addEventListener('click', startCamera);
    stopButton.addEventListener('click', stopCamera);
    snapButton.addEventListener('click', snapPhoto);

    window.addEventListener('beforeunload', () => {
        stopCamera(); 
    });
});