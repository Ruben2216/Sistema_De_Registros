// importar_imagenes.js - Funcionalidad para importar imágenes desde la carpeta img RIJ

(function() {    // Función para mostrar el modal de selección de imágenes
    function mostrarModalImportarImagenes() {
        // Limpiar selecciones previas
        limpiarSelecciones();
        
        // Verificar si ya existe el modal, si no, crearlo
        var modal = document.getElementById('modal-importar-imagenes');
        if (!modal) {
            crearModalImportarImagenes();
            modal = document.getElementById('modal-importar-imagenes');
        }
        
        // Cargar lista de imágenes disponibles
        cargarImagenesDisponibles();
        
        // Mostrar el modal
        modal.style.display = 'block';
    }
    
    // Función para crear el modal HTML
    function crearModalImportarImagenes() {
        var modalHTML = `
            <div id="modal-importar-imagenes" class="modal-importar" style="display: none;">
                <div class="modal-contenido">
                    <div class="modal-header">
                        <h3>Importar Imagen Predefinida</h3>
                        <button class="cerrar-modal" onclick="cerrarModalImportar()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Selecciona una imagen de la biblioteca para agregar a tus evidencias:</p>
                        <div id="lista-imagenes-importar" class="galeria-importar">
                            <div class="cargando">Cargando imágenes disponibles...</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="boton boton--secundario" onclick="cerrarModalImportar()">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar estilos CSS para el modal
        var estilos = `
            <style>
                .modal-importar {
                    position: fixed;
                    z-index: 10000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                
                .modal-contenido {
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 80%;
                    max-height: 80%;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                
                .modal-header h3 {
                    margin: 0;
                    color: #333;
                }
                
                .cerrar-modal {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .cerrar-modal:hover {
                    color: #000;
                    background-color: #f0f0f0;
                    border-radius: 50%;
                }
                
                .galeria-importar {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                
                .imagen-importar {
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    padding: 10px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background-color: #f9f9f9;
                }
                
                .imagen-importar:hover {
                    border-color: #007bff;
                    background-color: #f0f8ff;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,123,255,0.2);
                }
                  .imagen-importar img {
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                    border-radius: 4px;
                    margin-bottom: 8px;
                    cursor: pointer;
                }
                
                .imagen-importar img:hover {
                    opacity: 0.8;
                }
                
                .imagen-importar.seleccionada {
                    border-color: #28a745 !important;
                    background-color: #f8fff9 !important;
                    transform: scale(1.02);
                }
                
                .imagen-importar .nombre-archivo {
                    font-size: 12px;
                    color: #666;
                    margin-top: 5px;
                    word-break: break-word;
                }
                
                .cargando {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                
                .error-carga {
                    text-align: center;
                    padding: 40px;
                    color: #d32f2f;
                    background-color: #ffebee;
                    border-radius: 4px;
                }
                
                .modal-footer {
                    margin-top: 20px;
                    text-align: right;
                    border-top: 1px solid #eee;
                    padding-top: 15px;
                }
                
                .checkbox-importar {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 8px;
                }
                
                .checkbox-importar input[type="checkbox"] {
                    margin-right: 5px;
                    transform: scale(1.2);
                }
                
                .checkbox-importar label {
                    font-size: 14px;
                    color: #333;
                    cursor: pointer;
                }
            </style>
        `;
        
        // Agregar el modal y estilos al body
        document.head.insertAdjacentHTML('beforeend', estilos);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Función para cargar las imágenes disponibles desde el servidor
    function cargarImagenesDisponibles() {
        var listaContainer = document.getElementById('lista-imagenes-importar');
        
        fetch('/api/rij/imagenes_disponibles', {
            method: 'GET',
            credentials: 'include'
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Error al cargar las imágenes');
            }
            return response.json();
        })
        .then(function(data) {
            mostrarImagenesEnLista(data.imagenes || []);
        })
        .catch(function(error) {
            listaContainer.innerHTML = `
                <div class="error-carga">
                    Error al cargar las imágenes: ${error.message}
                    <br><br>
                    <button class="boton boton--primario" onclick="cargarImagenesDisponibles()">Reintentar</button>
                </div>
            `;
        });
    }
    
    // Función para mostrar las imágenes en la lista
    function mostrarImagenesEnLista(imagenes) {
        var listaContainer = document.getElementById('lista-imagenes-importar');
        
        if (imagenes.length === 0) {
            listaContainer.innerHTML = `
                <div class="cargando">
                    No hay imágenes disponibles en la carpeta img RIJ.
                    <br><br>
                    <small>Agrega archivos de imagen (.jpg, .png, .gif, etc.) a la carpeta 
                    /RESOURCE/IMG/img RIJ/ para que aparezcan aquí.</small>
                </div>
            `;
            return;
        }        var html = '';
        imagenes.forEach(function(imagen, index) {
            // Crear ID único y seguro para el checkbox
            var checkboxId = 'check-imagen-' + index;
            html += `
                <div class="imagen-importar" data-nombre="${imagen.nombre}" data-url="${imagen.url}" onclick="toggleImagenPorClick('${checkboxId}')">
                    <img src="${imagen.url}" alt="${imagen.nombre}" loading="lazy">
                    <div class="checkbox-importar">
                        <input type="checkbox" id="${checkboxId}" onchange="toggleSeleccionImagen(this, '${imagen.nombre}', '${imagen.url}')">
                        <label for="${checkboxId}">Seleccionar</label>
                    </div>
                    <div class="nombre-archivo">${imagen.nombre}</div>
                </div>
            `;
        });
          listaContainer.innerHTML = html;
        
        // Inicializar botones del modal
        actualizarBotonesModal();
    }
    
    // Variables para manejar las selecciones
    var imagenesSeleccionadas = [];
    
    // Función para manejar la selección/deselección de imágenes
    function toggleSeleccionImagen(checkbox, nombreArchivo, urlOriginal) {
        var imagenDiv = checkbox.closest('.imagen-importar');
        
        if (checkbox.checked) {
            // Agregar a selecciones
            imagenesSeleccionadas.push({
                nombre: nombreArchivo,
                url: urlOriginal,
                elemento: imagenDiv
            });
            
            // Cambiar estilo visual para mostrar que está seleccionada
            imagenDiv.style.borderColor = '#28a745';
            imagenDiv.style.backgroundColor = '#f8fff9';
            imagenDiv.style.transform = 'scale(1.02)';
            
        } else {
            // Remover de selecciones
            imagenesSeleccionadas = imagenesSeleccionadas.filter(function(img) {
                return img.nombre !== nombreArchivo;
            });
            
            // Restaurar estilo original
            imagenDiv.style.borderColor = '#ddd';
            imagenDiv.style.backgroundColor = '#f9f9f9';
            imagenDiv.style.transform = 'scale(1)';
        }
        
        // Actualizar botones del modal
        actualizarBotonesModal();
    }
    
    // Función para actualizar los botones del modal según las selecciones
    function actualizarBotonesModal() {
        var modalFooter = document.querySelector('#modal-importar-imagenes .modal-footer');
        if (!modalFooter) return;
        
        // Limpiar botones existentes
        modalFooter.innerHTML = '';
        
        // Botón cancelar (siempre presente)
        var btnCancelar = document.createElement('button');
        btnCancelar.className = 'boton boton--secundario';
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.onclick = function() {
            limpiarSelecciones();
            cerrarModalImportar();
        };
        modalFooter.appendChild(btnCancelar);
        
        if (imagenesSeleccionadas.length > 0) {
            // Botón importar seleccionadas
            var btnImportar = document.createElement('button');
            btnImportar.className = 'boton boton--primario';
            btnImportar.style.marginLeft = '10px';
            btnImportar.textContent = `Importar ${imagenesSeleccionadas.length} imagen${imagenesSeleccionadas.length > 1 ? 'es' : ''}`;
            btnImportar.onclick = importarImagenesSeleccionadas;
            modalFooter.appendChild(btnImportar);
        }
    }
    
    // Función para importar todas las imágenes seleccionadas
    function importarImagenesSeleccionadas() {
        if (imagenesSeleccionadas.length === 0) {
            alert('No hay imágenes seleccionadas');
            return;
        }
        
        var mensaje = imagenesSeleccionadas.length === 1 
            ? `¿Deseas importar la imagen "${imagenesSeleccionadas[0].nombre}"?`
            : `¿Deseas importar ${imagenesSeleccionadas.length} imágenes seleccionadas?`;
        
        if (typeof showConfirm === 'function') {
            showConfirm(mensaje, function() {
                procesarImportacionMultiple();
            });
        } else {
            if (confirm(mensaje)) {
                procesarImportacionMultiple();
            }
        }
    }
    
    // Función para procesar la importación de múltiples imágenes
    function procesarImportacionMultiple() {
        var modal = document.getElementById('modal-importar-imagenes');
        if (modal) {
            modal.style.pointerEvents = 'none';
            modal.style.opacity = '0.7';
        }
        
        var totalImagenes = imagenesSeleccionadas.length;
        var procesadas = 0;
        var errores = [];
        
        // Mostrar progreso
        var modalBody = document.querySelector('#modal-importar-imagenes .modal-body');
        if (modalBody) {
            var progresoDiv = document.createElement('div');
            progresoDiv.id = 'progreso-importacion';
            progresoDiv.style.position = 'fixed';
            progresoDiv.style.top = '50%';
            progresoDiv.style.left = '50%';
            progresoDiv.style.transform = 'translate(-50%, -50%)';
            progresoDiv.style.background = 'white';
            progresoDiv.style.padding = '20px';
            progresoDiv.style.borderRadius = '8px';
            progresoDiv.style.border = '2px solid #007bff';
            progresoDiv.style.zIndex = '10001';
            progresoDiv.innerHTML = `
                <div style="text-align: center;">
                    <div>Importando imágenes...</div>
                    <div id="progreso-texto">0 de ${totalImagenes}</div>
                    <div style="width: 200px; height: 6px; background: #eee; border-radius: 3px; margin: 10px 0;">
                        <div id="barra-progreso" style="width: 0%; height: 100%; background: #007bff; border-radius: 3px; transition: width 0.3s;"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(progresoDiv);
        }
        
        // Procesar cada imagen
        function procesarSiguiente(index) {
            if (index >= imagenesSeleccionadas.length) {
                // Todas procesadas
                finalizarImportacion();
                return;
            }
            
            var imagen = imagenesSeleccionadas[index];
            
            fetch('/api/rij/importar_imagen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    nombre_archivo: imagen.nombre 
                }),
                credentials: 'include'
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Error al importar la imagen');
                }
                return response.json();
            })            .then(function(data) {
                if (data.success) {
                    console.log('Imagen importada exitosamente:', data);
                    
                    // Agregar la imagen a la galería
                    if (typeof window.agregarFotoAGaleria === 'function') {
                        // Llamar con todos los parámetros requeridos
                        window.agregarFotoAGaleria(data.url, 'original', null, null, null);
                        
                        // Forzar autoguardado para conservar la imagen importada
                        setTimeout(function() {
                            if (window.autoguardadoCamara && window.autoguardadoCamara.autoguardarFotos) {
                                window.autoguardadoCamara.autoguardarFotos();
                                console.log('Autoguardado forzado después de importar imagen');
                            }
                        }, 500);
                        
                        // Actualizar contador de fotos si existe
                        if (typeof window.actualizarContadorFotos === 'function') {
                            window.actualizarContadorFotos();
                        }
                        
                    } else {
                        console.error('Función agregarFotoAGaleria no disponible');
                        // Fallback: agregar manualmente al DOM
                        var contenedor = document.getElementById('photosContainer');
                        if (contenedor) {
                            var photoWrapper = document.createElement('div');
                            photoWrapper.classList.add('photo-wrapper');
                            photoWrapper.style.position = 'relative';
                            
                            var img = document.createElement('img');
                            img.src = data.url;
                            img.alt = 'Imagen importada';
                            img.className = 'foto-principal';
                            
                            photoWrapper.appendChild(img);
                            contenedor.appendChild(photoWrapper);
                        }
                    }
                    
                } else {
                    errores.push(`${imagen.nombre}: ${data.error}`);
                }
            })
            .catch(function(error) {
                errores.push(`${imagen.nombre}: ${error.message}`);
            })
            .finally(function() {
                procesadas++;
                
                // Actualizar progreso
                var progresoTexto = document.getElementById('progreso-texto');
                var barraProgreso = document.getElementById('barra-progreso');
                if (progresoTexto) {
                    progresoTexto.textContent = `${procesadas} de ${totalImagenes}`;
                }
                if (barraProgreso) {
                    barraProgreso.style.width = `${(procesadas / totalImagenes) * 100}%`;
                }
                
                // Procesar siguiente
                setTimeout(function() {
                    procesarSiguiente(index + 1);
                }, 200); // Pequeña pausa entre importaciones
            });
        }
        
        function finalizarImportacion() {
            // Remover progreso
            var progresoDiv = document.getElementById('progreso-importacion');
            if (progresoDiv) {
                progresoDiv.remove();
            }
            
            // Mostrar resultado
            var exitosas = procesadas - errores.length;
            var mensaje = `Importación completada:\n${exitosas} imagen${exitosas !== 1 ? 'es' : ''} importada${exitosas !== 1 ? 's' : ''} exitosamente`;
            
            if (errores.length > 0) {
                mensaje += `\n${errores.length} error${errores.length !== 1 ? 'es' : ''}:\n${errores.join('\n')}`;
            }
            
            if (typeof showMessage === 'function') {
                showMessage(mensaje);
            } else {
                alert(mensaje);
            }
            
            // Cerrar modal
            limpiarSelecciones();
            cerrarModalImportar();
            
            // Restaurar modal
            if (modal) {
                modal.style.pointerEvents = 'auto';
                modal.style.opacity = '1';
            }
        }
        
        // Iniciar procesamiento
        procesarSiguiente(0);
    }
    
    // Función para limpiar las selecciones
    function limpiarSelecciones() {
        // Desmarcar todos los checkboxes y restaurar estilos
        imagenesSeleccionadas.forEach(function(imagen) {
            var checkbox = imagen.elemento.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = false;
            }
            imagen.elemento.style.borderColor = '#ddd';
            imagen.elemento.style.backgroundColor = '#f9f9f9';
            imagen.elemento.style.transform = 'scale(1)';
        });
          // Limpiar array
        imagenesSeleccionadas = [];
    }
      // Función para seleccionar imagen haciendo clic en ella
    function toggleImagenPorClick(checkboxId) {
        var checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            // Disparar el evento change manualmente
            var event = new Event('change');
            checkbox.dispatchEvent(event);
        }
    }
    
    // Función para seleccionar e importar una imagen
    function seleccionarImagenParaImportar(nombreArchivo, urlOriginal) {
        // Mostrar confirmación
        if (typeof showConfirm === 'function') {
            showConfirm(
                `¿Deseas importar la imagen "${nombreArchivo}" a tus evidencias?`,
                function() {
                    importarImagenSeleccionada(nombreArchivo, urlOriginal);
                },
                function() {
                    // No hacer nada si cancela
                }
            );
        } else {
            // Fallback si showConfirm no está disponible
            if (confirm(`¿Deseas importar la imagen "${nombreArchivo}" a tus evidencias?`)) {
                importarImagenSeleccionada(nombreArchivo, urlOriginal);
            }
        }
    }
    
    // Función para importar la imagen seleccionada
    function importarImagenSeleccionada(nombreArchivo, urlOriginal) {
        // Mostrar loading
        var modal = document.getElementById('modal-importar-imagenes');
        if (modal) {
            modal.style.pointerEvents = 'none';
            modal.style.opacity = '0.7';
        }
        
        fetch('/api/rij/importar_imagen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                nombre_archivo: nombreArchivo 
            }),
            credentials: 'include'
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Error al importar la imagen');
            }
            return response.json();
        })        .then(function(data) {
            if (data.success) {
                console.log('Imagen individual importada exitosamente:', data);
                console.log('URL recibida:', data.url);
                
                // Verificar si existe la función agregarFotoAGaleria
                console.log('Verificando función agregarFotoAGaleria:', typeof window.agregarFotoAGaleria);
                
                // Agregar la imagen a la galería
                if (typeof window.agregarFotoAGaleria === 'function') {
                    console.log('Llamando a window.agregarFotoAGaleria con:', data.url);
                    // Llamar con todos los parámetros requeridos
                    window.agregarFotoAGaleria(data.url, 'original', null, null, null);
                    console.log('Función agregarFotoAGaleria ejecutada');
                    
                    // Forzar autoguardado para conservar la imagen importada
                    setTimeout(function() {
                        if (window.autoguardadoCamara && window.autoguardadoCamara.autoguardarFotos) {
                            window.autoguardadoCamara.autoguardarFotos();
                            console.log('Autoguardado forzado después de importar imagen individual');
                        }
                    }, 500);
                    
                    // Actualizar contador de fotos si existe
                    if (typeof window.actualizarContadorFotos === 'function') {
                        window.actualizarContadorFotos();
                        console.log('Contador de fotos actualizado');
                    }
                    
                } else {
                    console.error('Función agregarFotoAGaleria no disponible, usando fallback');
                    // Fallback: agregar manualmente al DOM
                    var contenedor = document.getElementById('photosContainer');
                    console.log('Contenedor photosContainer:', contenedor);
                    if (contenedor) {
                        var photoWrapper = document.createElement('div');
                        photoWrapper.classList.add('photo-wrapper');
                        photoWrapper.style.position = 'relative';
                        
                        var img = document.createElement('img');
                        img.src = data.url;
                        img.alt = 'Imagen importada';
                        img.className = 'foto-principal';
                        img.style.width = '100%';
                        img.style.maxWidth = '300px';
                        img.style.border = '2px solid #007bff';
                        
                        photoWrapper.appendChild(img);
                        contenedor.appendChild(photoWrapper);
                        console.log('Imagen agregada manualmente al DOM');
                    } else {
                        console.error('Contenedor photosContainer no encontrado');
                    }
                }
                
                // Mostrar mensaje de éxito
                if (typeof showMessage === 'function') {
                    showMessage(`Imagen "${data.nombre_original}" importada exitosamente`);
                } else {
                    alert(`Imagen "${data.nombre_original}" importada exitosamente`);
                }
                
                // Cerrar modal
                cerrarModalImportar();
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        })
        .catch(function(error) {
            if (typeof showMessage === 'function') {
                showMessage('Error al importar la imagen: ' + error.message);
            } else {
                alert('Error al importar la imagen: ' + error.message);
            }
        })
        .finally(function() {
            // Restaurar modal
            if (modal) {
                modal.style.pointerEvents = 'auto';
                modal.style.opacity = '1';
            }
        });
    }
    
    // Función para cerrar el modal
    function cerrarModalImportar() {
        var modal = document.getElementById('modal-importar-imagenes');
        if (modal) {
            modal.style.display = 'none';
        }
    }    // Exponer funciones globalmente
    window.mostrarModalImportarImagenes = mostrarModalImportarImagenes;
    window.cerrarModalImportar = cerrarModalImportar;
    window.cargarImagenesDisponibles = cargarImagenesDisponibles;
    window.toggleSeleccionImagen = toggleSeleccionImagen;
    window.toggleImagenPorClick = toggleImagenPorClick;
    window.importarImagenesSeleccionadas = importarImagenesSeleccionadas;
    window.limpiarSelecciones = limpiarSelecciones;
    
    // Agregar el botón de importar después de que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // Agregar botón de importar imágenes después del botón de generar PDF
        var btnGenerarPDF = document.getElementById('btnGenerarPDF');
        if (btnGenerarPDF) {
            var btnImportar = document.createElement('button');
            btnImportar.id = 'btnImportarImagenes';
            btnImportar.className = 'boton boton--secundario';
            btnImportar.style.marginLeft = '10px';
            btnImportar.textContent = 'Importar Imagen Predefinida';
            btnImportar.onclick = mostrarModalImportarImagenes;
            
            // Insertar después del botón de PDF
            btnGenerarPDF.parentNode.insertBefore(btnImportar, btnGenerarPDF.nextSibling);
        }
    });
    
})();
