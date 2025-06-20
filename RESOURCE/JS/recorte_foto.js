function abrirModalRecorte(img, url, callback) {
    // Crear modal si no existe
    var modal = document.getElementById('modal-recorte-foto');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-recorte-foto';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <div style="background:#fff;padding:10px;border-radius:8px;mwidth:99vw;max-height:99vh;display:flex;flex-direction:column;align-items:center;">
                <canvas id="canvas-recorte-foto" style="max-width:98vw;max-height:85vh;touch-action:manipulation;"></canvas>
                <div style="margin-top:10px;display:flex;gap:10px;">
                    <button id="btn-confirmar-recorte" style="font-size:1.1em;padding:8px 18px;background:#00724e;color:#fff;border:none;border-radius:5px;">Recortar</button>
                    <button id="btn-cancelar-recorte" style="font-size:1.1em;padding:8px 18px;background:#888;color:#fff;border:none;border-radius:5px;">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }
    // Cargar la imagen en el canvas
    var canvas = document.getElementById('canvas-recorte-foto');
    var ctx = canvas.getContext('2d');
    var tempImg = new window.Image();
    tempImg.onload = function() {
        var maxW = Math.min(window.innerWidth * 0.98, tempImg.naturalWidth);
        var maxH = Math.min(window.innerHeight * 0.96, tempImg.naturalHeight);
        var ratio = Math.min(maxW / tempImg.naturalWidth, maxH / tempImg.naturalHeight, 1);
        // El canvas tiene el mismo aspecto que la imagen original
        canvas.width = tempImg.naturalWidth * ratio;
        canvas.height = tempImg.naturalHeight * ratio;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
        // El recorte se define en coordenadas proporcionales
        var recorte = {
            x: canvas.width * 0.1,
            y: canvas.height * 0.1,
            w: canvas.width * 0.8,
            h: canvas.height * 0.8
        };
        var dragging = false, offsetX = 0, offsetY = 0;
        // --- NUEVO: Handlers para redimensionar el área de recorte ---
        var handlerSize = 14; // Tamaño de los handlers
        var handlerHover = null; // Qué handler está activo
        // Función para dibujar los handlers en las esquinas
        function dibujarHandlers() {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#00724e';
            ctx.lineWidth = 2;
            // Esquinas: topleft, topright, bottomleft, bottomright
            var puntos = [
                [recorte.x, recorte.y],
                [recorte.x + recorte.w, recorte.y],
                [recorte.x, recorte.y + recorte.h],
                [recorte.x + recorte.w, recorte.y + recorte.h]
            ];
            for (var i = 0; i < puntos.length; i++) {
                ctx.beginPath();
                ctx.rect(puntos[i][0] - handlerSize/2, puntos[i][1] - handlerSize/2, handlerSize, handlerSize);
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        }
        // Modificar la función dibujar para incluir los handlers
        function dibujar() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.strokeStyle = '#00724e';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.strokeRect(recorte.x, recorte.y, recorte.w, recorte.h);
            ctx.restore();
            dibujarHandlers();
        }
        dibujar();
        // --- NUEVO: Detectar si el puntero está sobre un handler ---
        function getHandlerAt(x, y) {
            var puntos = [
                [recorte.x, recorte.y, 'topleft'],
                [recorte.x + recorte.w, recorte.y, 'topright'],
                [recorte.x, recorte.y + recorte.h, 'bottomleft'],
                [recorte.x + recorte.w, recorte.y + recorte.h, 'bottomright']
            ];
            for (var i = 0; i < puntos.length; i++) {
                var px = puntos[i][0];
                var py = puntos[i][1];
                if (x >= px - handlerSize && x <= px + handlerSize && y >= py - handlerSize && y <= py + handlerSize) {
                    return puntos[i][2];
                }
            }
            return null;
        }
        // --- Mejorar compatibilidad y fluidez con addEventListener y passive: false ---
        // Eliminar listeners antiguos si existen
        canvas.onpointerdown = null;
        canvas.onpointermove = null;
        canvas.onpointerup = null;
        canvas.onpointerleave = null;
        // Variables para el estado
        var startX = 0, startY = 0, startW = 0, startH = 0, startRecorteX = 0, startRecorteY = 0;
        function getPos(e) {
            var rect = canvas.getBoundingClientRect();
            var x, y;
            if (e.touches && e.touches.length > 0) {
                x = e.touches[0].clientX - rect.left;
                y = e.touches[0].clientY - rect.top;
            } else {
                x = e.clientX - rect.left;
                y = e.clientY - rect.top;
            }
            return {x: x, y: y};
        }
        function pointerDown(e) {
            e.preventDefault();
            var pos = getPos(e);
            var handler = getHandlerAt(pos.x, pos.y);
            if (handler) {
                resizing = true;
                resizeDir = handler;
                startX = pos.x;
                startY = pos.y;
                startW = recorte.w;
                startH = recorte.h;
                startRecorteX = recorte.x;
                startRecorteY = recorte.y;
            } else if (dentroRecorte(pos.x, pos.y)) {
                dragging = true;
                offsetX = pos.x - recorte.x;
                offsetY = pos.y - recorte.y;
            }
        }
        function pointerMove(e) {
            if (!dragging && !resizing) { return; }
            e.preventDefault();
            var pos = getPos(e);
            if (resizing && resizeDir) {
                var dx = pos.x - startX;
                var dy = pos.y - startY;
                if (resizeDir === 'topleft') {
                    var newW = startW - dx;
                    var newH = startH - dy;
                    var newX = startRecorteX + dx;
                    var newY = startRecorteY + dy;
                    if (newW > 30 && newH > 30 && newX >= 0 && newY >= 0) {
                        recorte.w = newW;
                        recorte.h = newH;
                        recorte.x = newX;
                        recorte.y = newY;
                    }
                } else if (resizeDir === 'topright') {
                    var newW = startW + dx;
                    var newH = startH - dy;
                    var newY = startRecorteY + dy;
                    if (newW > 30 && newH > 30 && recorte.x + newW <= canvas.width && newY >= 0) {
                        recorte.w = newW;
                        recorte.h = newH;
                        recorte.y = newY;
                    }
                } else if (resizeDir === 'bottomleft') {
                    var newW = startW - dx;
                    var newH = startH + dy;
                    var newX = startRecorteX + dx;
                    if (newW > 30 && newH > 30 && newX >= 0 && recorte.y + newH <= canvas.height) {
                        recorte.w = newW;
                        recorte.h = newH;
                        recorte.x = newX;
                    }
                } else if (resizeDir === 'bottomright') {
                    var newW = startW + dx;
                    var newH = startH + dy;
                    if (newW > 30 && newH > 30 && recorte.x + newW <= canvas.width && recorte.y + newH <= canvas.height) {
                        recorte.w = newW;
                        recorte.h = newH;
                    }
                }
                dibujar();
            } else if (dragging) {
                recorte.x = Math.max(0, Math.min(canvas.width - recorte.w, pos.x - offsetX));
                recorte.y = Math.max(0, Math.min(canvas.height - recorte.h, pos.y - offsetY));
                dibujar();
            }
        }
        function pointerUp(e) {
            dragging = false;
            resizing = false;
            resizeDir = null;
        }
        // Listeners pointer y touch
        canvas.addEventListener('pointerdown', pointerDown, { passive: false });
        canvas.addEventListener('pointermove', pointerMove, { passive: false });
        canvas.addEventListener('pointerup', pointerUp, { passive: false });
        canvas.addEventListener('pointerleave', pointerUp, { passive: false });
        // Soporte touch extra
        canvas.addEventListener('touchstart', pointerDown, { passive: false });
        canvas.addEventListener('touchmove', pointerMove, { passive: false });
        canvas.addEventListener('touchend', pointerUp, { passive: false });
        canvas.addEventListener('touchcancel', pointerUp, { passive: false });
        // --- Guardar imagen recortada en el servidor y cargarla ---
        async function guardarEnServidor(dataUrl) {
            try {
                const response = await fetch('/guardar-imagen', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imagen: dataUrl })
                });
                if (!response.ok) {
                    throw new Error('Error al guardar la imagen en el servidor');
                }
                console.log('Imagen guardada en el servidor');
            } catch (error) {
                console.error('Fallo al guardar en el servidor:', error);
                localStorage.setItem('imagenRecortada', dataUrl); // Respaldo en localStorage
            }
        }
        async function cargarDesdeServidor() {
            try {
                const response = await fetch('/cargar-imagen');
                if (!response.ok) {
                    throw new Error('Error al cargar la imagen desde el servidor');
                }
                const data = await response.json();
                if (data && data.imagen) {
                    var img = new Image();
                    img.onload = function() {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = data.imagen;
                } else {
                    throw new Error('No se encontró imagen en el servidor');
                }
            } catch (error) {
                console.error('Fallo al cargar desde el servidor:', error);
                var imagenRecortada = localStorage.getItem('imagenRecortada');
                if (imagenRecortada) {
                    var img = new Image();
                    img.onload = function() {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = imagenRecortada;
                }
            }
        }
        // --- Cargar imagen desde URL externa ---
        async function cargarImagenDesdeURL(url) {
            try {
                var img = new Image();
                img.crossOrigin = 'anonymous'; // Permitir imágenes externas
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    console.log('Imagen cargada correctamente desde URL:', url);
                };
                img.onerror = function() {
                    console.error('Error al cargar la imagen desde URL:', url);
                };
                img.src = url;
            } catch (error) {
                console.error('Fallo al cargar la imagen desde URL:', error);
            }
        }
        // Llamar a la función con la URL proporcionada
        window.addEventListener('load', function() {
            const url = "https://192.168.100.30:8000/RESOURCE/IMG/Evidencias/rij_6c8eb7f585e34746_20250620031320234658.png";
            cargarImagenDesdeURL(url);
        });
        document.getElementById('btn-confirmar-recorte').onclick = function() {
            var escala = tempImg.naturalWidth / canvas.width;
            var cropCanvas = document.createElement('canvas');
            cropCanvas.width = recorte.w * escala;
            cropCanvas.height = recorte.h * escala;
            cropCanvas.getContext('2d').drawImage(
                tempImg,
                recorte.x * escala,
                recorte.y * escala,
                recorte.w * escala,
                recorte.h * escala,
                0, 0,
                recorte.w * escala,
                recorte.h * escala
            );
            var dataUrl = cropCanvas.toDataURL('image/png');
            guardarEnServidor(dataUrl); // Intentar guardar en el servidor
            modal.style.display = 'none';
            if (typeof callback === 'function') {
                callback(dataUrl);
            }
        };
        // Botón cancelar recorte
        document.getElementById('btn-cancelar-recorte').onclick = function() {
            modal.style.display = 'none';
            if (typeof callback === 'function') {
                callback(null);
            }
        };
        window.addEventListener('load', function() {
            cargarDesdeServidor(); // Intentar cargar desde el servidor
        });
    };
    tempImg.src = img.src;
}
