// Sistema de Evidencia de Mantenimiento
// Variables globales
let pdfSeleccionado = null;
let imagenesEvidencia = [];
let imagenActualModal = null;

// Elementos del DOM
const listaPdfs = document.getElementById('lista-pdfs');
const seccionEvidencia = document.getElementById('seccion-evidencia');
const zonaArrastre = document.getElementById('zona-arrastre');
const inputArchivos = document.getElementById('input-archivos');
const contenedorImagenes = document.getElementById('contenedor-imagenes');
const notificacion = document.getElementById('notificacion');
const modalImagen = document.getElementById('modal-imagen');
const imagenModal = document.getElementById('imagen-modal');

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de evidencia de mantenimiento iniciado');
    cargarPDFsDisponibles();
    configurarEventosArrastre();
    configurarEventosArchivos();
    
    // Inicializar sistema de verificación de cámara si hay un PDF seleccionado
    // (esto se ejecutará automáticamente cuando se seleccione un PDF)
});

// Función para cargar PDFs disponibles desde el servidor
async function cargarPDFsDisponibles() {
    try {
        const response = await fetch('/api/evidencia/obtener_pdfs_mantenimiento');
        const data = await response.json();
        
        if (data.success && data.pdfs.length > 0) {
            mostrarListaPDFs(data.pdfs);
        } else {
            mostrarMensajeVacio();
        }
    } catch (error) {
        console.error('Error al cargar PDFs:', error);
        mostrarNotificacion('Error al cargar los PDFs de mantenimiento', 'error');
        mostrarMensajeVacio();
    }
}

// Función para mostrar la lista de PDFs
function mostrarListaPDFs(pdfs) {
    listaPdfs.innerHTML = '';
    
    pdfs.forEach(pdf => {
        const elementoPdf = document.createElement('div');
        elementoPdf.className = 'item-pdf';
        elementoPdf.innerHTML = `
            <div class="info-pdf">
                <h3>${pdf.nombre}</h3>
                <p>Fecha: ${formatearFecha(pdf.fecha)}</p>
                <p>Tipo: ${pdf.tipo}</p>
            </div>
            <div class="acciones-pdf">
                <button class="btn-seleccionar-pdf" onclick="seleccionarPDF('${pdf.id}', '${pdf.nombre}', '${pdf.fecha}')">
                    📁 Seleccionar
                </button>
                <button class="btn-ver-pdf" onclick="verPDF('${pdf.ruta}')">
                    👁️ Ver PDF
                </button>
            </div>
        `;
        listaPdfs.appendChild(elementoPdf);
    });
}

// Función para mostrar mensaje cuando no hay PDFs
function mostrarMensajeVacio() {
    listaPdfs.innerHTML = `
        <div class="mensaje-vacio">
            <p>No hay PDFs de mantenimiento disponibles en este momento.</p>
            <p>Complete un formato de mantenimiento para ver los PDFs aquí.</p>
        </div>
    `;
}

// Función para seleccionar un PDF
function seleccionarPDF(idPdf, nombrePdf, fechaPdf) {
    pdfSeleccionado = {
        id: idPdf,
        nombre: nombrePdf,
        fecha: fechaPdf
    };
    
    // Actualizar información del PDF seleccionado
    document.getElementById('nombre-pdf-seleccionado').textContent = nombrePdf;
    document.getElementById('fecha-pdf-seleccionado').textContent = formatearFecha(fechaPdf);
    
    // Mostrar sección de evidencia
    seccionEvidencia.style.display = 'block';
    
    // Limpiar evidencias anteriores
    imagenesEvidencia = [];
    actualizarVistaImagenes();
    
    mostrarNotificacion(`PDF "${nombrePdf}" seleccionado correctamente`, 'success');
    
    // Iniciar verificación de estado de cámara
    iniciarVerificacionEstado();
    
    // Scroll hacia la sección de evidencia
    seccionEvidencia.scrollIntoView({ behavior: 'smooth' });
}

// Función para ver un PDF
function verPDF(rutaPdf) {
    window.open(rutaPdf, '_blank');
}

// Configurar eventos de arrastre y soltado
function configurarEventosArrastre() {
    zonaArrastre.addEventListener('dragover', function(e) {
        e.preventDefault();
        zonaArrastre.classList.add('dragover');
    });
    
    zonaArrastre.addEventListener('dragleave', function(e) {
        e.preventDefault();
        zonaArrastre.classList.remove('dragover');
    });
    
    zonaArrastre.addEventListener('drop', function(e) {
        e.preventDefault();
        zonaArrastre.classList.remove('dragover');
        
        const archivos = e.dataTransfer.files;
        procesarArchivos(archivos);
    });
    
    // Remover el click automático de la zona de arrastre para evitar el error
    // El usuario debe usar el botón específico "Seleccionar Imágenes"
}

// Configurar eventos del input de archivos
function configurarEventosArchivos() {
    inputArchivos.addEventListener('change', function(e) {
        procesarArchivos(e.target.files);
    });
}

// Función para procesar archivos seleccionados
function procesarArchivos(archivos) {
    if (!pdfSeleccionado) {
        mostrarNotificacion('Debe seleccionar un PDF primero', 'warning');
        return;
    }
    
    if (archivos.length === 0) {
        return;
    }
    
    for (let archivo of archivos) {
        if (archivo.type.startsWith('image/')) {
            procesarImagen(archivo);
        } else {
            mostrarNotificacion(`El archivo "${archivo.name}" no es una imagen válida`, 'warning');
        }
    }
}

// Función para procesar una imagen individual
function procesarImagen(archivo) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imagen = {
            id: Date.now() + Math.random(),
            nombre: archivo.name,
            tipo: archivo.type,
            tamaño: archivo.size,
            data: e.target.result,
            fecha: new Date()
        };
        
        imagenesEvidencia.push(imagen);
        actualizarVistaImagenes();
        mostrarNotificacion(`Imagen "${archivo.name}" añadida correctamente`, 'success');
    };
    
    reader.onerror = function() {
        mostrarNotificacion(`Error al procesar la imagen "${archivo.name}"`, 'error');
    };
    
    reader.readAsDataURL(archivo);
}

// Función para actualizar la vista de imágenes
function actualizarVistaImagenes() {
    contenedorImagenes.innerHTML = '';
    
    if (imagenesEvidencia.length === 0) {
        contenedorImagenes.innerHTML = `
            <div class="mensaje-sin-imagenes">
                <p>No hay imágenes de evidencia añadidas</p>
            </div>
        `;
        return;
    }
    
    imagenesEvidencia.forEach((imagen, indice) => {
        const elementoImagen = document.createElement('div');
        elementoImagen.className = 'item-imagen';
        elementoImagen.innerHTML = `
            <img src="${imagen.data}" alt="${imagen.nombre}" onclick="abrirModal('${imagen.id}')">
            <div class="info-imagen">
                <p class="nombre-imagen">${imagen.nombre}</p>
                <p class="tamaño-imagen">${formatearTamaño(imagen.tamaño)}</p>
                <button class="btn-eliminar-imagen" onclick="eliminarImagen('${imagen.id}')">
                    🗑️ Eliminar
                </button>
            </div>
        `;
        contenedorImagenes.appendChild(elementoImagen);
    });
}

// Función para abrir modal de imagen
function abrirModal(idImagen) {
    const imagen = imagenesEvidencia.find(img => img.id == idImagen);
    if (imagen) {
        imagenActualModal = imagen;
        imagenModal.src = imagen.data;
        modalImagen.style.display = 'block';
    }
}

// Función para cerrar modal
function cerrarModal() {
    modalImagen.style.display = 'none';
    imagenActualModal = null;
}

// Función para eliminar imagen actual del modal
function eliminarImagenActual() {
    if (imagenActualModal) {
        eliminarImagen(imagenActualModal.id);
        cerrarModal();
    }
}

// Función para eliminar una imagen
function eliminarImagen(idImagen) {
    imagenesEvidencia = imagenesEvidencia.filter(img => img.id != idImagen);
    actualizarVistaImagenes();
    mostrarNotificacion('Imagen eliminada correctamente', 'success');
}

// Función para limpiar toda la evidencia
function limpiarEvidencia() {
    if (imagenesEvidencia.length === 0) {
        mostrarNotificacion('No hay evidencia para limpiar', 'info');
        return;
    }
    
    if (confirm('¿Está seguro de que desea eliminar toda la evidencia fotográfica?')) {
        imagenesEvidencia = [];
        actualizarVistaImagenes();
        mostrarNotificacion('Evidencia limpiada correctamente', 'success');
    }
}

// Función para generar PDF con evidencia
async function generarPDFConEvidencia() {
    if (!pdfSeleccionado) {
        mostrarNotificacion('Debe seleccionar un PDF primero', 'warning');
        return;
    }
    
    if (imagenesEvidencia.length === 0) {
        mostrarNotificacion('Debe añadir al menos una imagen de evidencia', 'warning');
        return;
    }
    
    try {
        mostrarNotificacion('Generando PDF con evidencia...', 'info');
        
        const datosEvidencia = {
            pdfSeleccionado: pdfSeleccionado,
            imagenes: imagenesEvidencia.map(img => ({
                id: img.id,
                nombre: img.nombre,
                tipo: img.tipo,
                data: img.data
            }))
        };
        
        const response = await fetch('/api/evidencia/generar_pdf_con_evidencia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosEvidencia)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarNotificacion('PDF con evidencia generado correctamente', 'success');
            // Descargar el PDF
            window.open(result.urlPdf, '_blank');
            
            // Opcional: limpiar evidencia después de generar
            if (confirm('¿Desea limpiar la evidencia actual para empezar con un nuevo PDF?')) {
                limpiarEvidencia();
                pdfSeleccionado = null;
                seccionEvidencia.style.display = 'none';
            }
        } else {
            mostrarNotificacion(`Error al generar PDF: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarNotificacion('Error al generar el PDF con evidencia', 'error');
    }
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    notificacion.textContent = mensaje;
    notificacion.className = `notificacion ${tipo}`;
    notificacion.classList.remove('oculto');
    
    setTimeout(() => {
        notificacion.classList.add('oculto');
    }, 5000);
}

// Función para formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';
    
    try {
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return fecha;
    }
}

// Función para formatear tamaño de archivo
function formatearTamaño(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const tamaños = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamaños[i];
}

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', function(event) {
    if (event.target === modalImagen) {
        cerrarModal();
    }
});

// Manejar tecla ESC para cerrar modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modalImagen.style.display === 'block') {
        cerrarModal();
    }
});

// === FUNCIONALIDADES DE INTEGRACIÓN CON CÁMARA ===

// Función para sincronizar automáticamente con la cámara
function iniciarSincronizacionAutomatica() {
    // Verificar si hay un PDF seleccionado guardado
    const pdfGuardado = localStorage.getItem('evidencia_pdf_seleccionado');
    if (pdfGuardado && !pdfSeleccionado) {
        try {
            pdfSeleccionado = JSON.parse(pdfGuardado);
            document.getElementById('nombre-pdf-seleccionado').textContent = pdfSeleccionado.nombre;
            document.getElementById('fecha-pdf-seleccionado').textContent = formatearFecha(pdfSeleccionado.fecha);
            seccionEvidencia.style.display = 'block';
            
            // Limpiar localStorage
            localStorage.removeItem('evidencia_pdf_seleccionado');
            
            mostrarNotificacion('PDF seleccionado restaurado automáticamente', 'success');
        } catch (error) {
            console.error('Error al restaurar PDF seleccionado:', error);
        }
    }
    
    // Revisar periódicamente si hay nuevas fotos en la cámara
    setInterval(async function() {
        if (pdfSeleccionado) {
            try {
                const response = await fetch('/api/rij/lista_fotos');
                const data = await response.json();
                
                // Si hay fotos nuevas, mostrar una notificación
                if (data.fotos && data.fotos.length > 0) {
                    const botonImportar = document.querySelector('.btn-importar-camara');
                    if (botonImportar) {
                        botonImportar.style.backgroundColor = '#fd7e14'; // Color naranja para indicar fotos disponibles
                        botonImportar.innerHTML = `📥 Importar (${data.fotos.length}) fotos`;
                    }
                }
            } catch (error) {
                // Silencioso, no mostrar errores de sincronización
            }
        }
    }, 5000); // Revisar cada 5 segundos
}

// Inicializar sincronización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    iniciarSincronizacionAutomatica();
});

// === FUNCIONES AUXILIARES ===

// Función auxiliar para convertir blob a base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// === FUNCIONALIDADES MEJORADAS DE INTEGRACIÓN CON CÁMARA ===

// Variables para el estado de la cámara
let estadoCamara = {
    conectada: false,
    fotosDisponibles: 0,
    sincronizando: false,
    verificandoEstado: false
};

// Elementos del DOM para cámara
const estadoCamaraElement = document.getElementById('estado-camara');
const iconoEstado = document.getElementById('icono-estado');
const mensajeEstado = document.getElementById('mensaje-estado');
const contadorFotos = document.getElementById('contador-fotos');
const btnSincronizar = document.getElementById('btn-sincronizar');
const btnImportar = document.getElementById('btn-importar');

// Función mejorada para abrir la cámara
function abrirCamara() {
    if (!pdfSeleccionado) {
        mostrarNotificacion('Debe seleccionar un PDF primero', 'warning');
        return;
    }
    
    // Guardar contexto de evidencia en localStorage
    const contextoEvidencia = {
        pdfSeleccionado: pdfSeleccionado,
        timestamp: Date.now(),
        origen: 'evidencia_mantenimiento'
    };
    localStorage.setItem('evidencia_contexto', JSON.stringify(contextoEvidencia));
    
    // Abrir cámara en nueva ventana con parámetros específicos
    const ventanaCamara = window.open(
        '/TEMPLATES/camara.html?origen=evidencia&pdf_id=' + pdfSeleccionado.id, 
        'camara_evidencia', 
        'width=900,height=700,scrollbars=yes,resizable=yes'
    );
    
    if (ventanaCamara) {
        mostrarNotificacion('Cámara abierta. Tome las fotos necesarias y regrese para importarlas.', 'info');
        
        // Marcar botón de cámara como conectado
        const btnCamara = document.querySelector('.btn-camara');
        btnCamara.classList.add('conectado');
        btnCamara.innerHTML = '📷 Cámara Abierta';
        
        // Actualizar estado
        estadoCamara.conectada = true;
        actualizarEstadoCamara();
        
        // Comenzar verificación periódica más frecuente
        iniciarVerificacionEstado();
        
        // Restablecer estado cuando se cierre la ventana
        const checkClosed = setInterval(() => {
            if (ventanaCamara.closed) {
                clearInterval(checkClosed);
                btnCamara.classList.remove('conectado');
                btnCamara.innerHTML = '📷 Abrir Cámara';
                estadoCamara.conectada = false;
                // Verificar fotos una vez más después de cerrar
                setTimeout(verificarEstadoCamara, 1000);
            }
        }, 1000);
    } else {
        mostrarNotificacion('Error al abrir la cámara. Verifique que no esté bloqueando ventanas emergentes.', 'error');
    }
}

// Función mejorada para importar fotos de la cámara
async function importarFotosCamara() {
    if (!pdfSeleccionado) {
        mostrarNotificacion('Debe seleccionar un PDF primero', 'warning');
        return;
    }
    
    if (estadoCamara.sincronizando) {
        mostrarNotificacion('Sincronización ya en progreso...', 'warning');
        return;
    }
    
    try {
        estadoCamara.sincronizando = true;
        actualizarEstadoCamara();
        mostrarNotificacion('Importando fotos desde la cámara...', 'info');
        
        // Obtener fotos del sistema de cámara
        const response = await fetch('/api/rij/lista_fotos');
        const data = await response.json();
        
        if (!data.fotos || data.fotos.length === 0) {
            mostrarNotificacion('No hay fotos en la cámara para importar', 'warning');
            return;
        }
        
        let fotosImportadas = 0;
        let erroresImportacion = 0;
        
        // Procesar cada foto con indicador de progreso
        for (let i = 0; i < data.fotos.length; i++) {
            const fotoUrl = data.fotos[i];
            
            try {
                // Actualizar mensaje de estado
                mensajeEstado.textContent = `Importando foto ${i + 1} de ${data.fotos.length}...`;
                
                // Descargar la imagen como blob
                const responseImg = await fetch(fotoUrl);
                const blob = await responseImg.blob();
                
                // Convertir blob a base64
                const base64 = await blobToBase64(blob);
                
                // Crear objeto de imagen para la evidencia
                const nombreArchivo = `Evidencia_Camara_${Date.now()}_${fotosImportadas + 1}.jpg`;
                const imagen = {
                    id: Date.now() + Math.random(),
                    nombre: nombreArchivo,
                    tipo: blob.type,
                    tamaño: blob.size,
                    data: base64,
                    fecha: new Date(),
                    origen: 'camara'
                };
                
                imagenesEvidencia.push(imagen);
                fotosImportadas++;
                
            } catch (error) {
                console.error('Error al procesar foto:', error);
                erroresImportacion++;
            }
        }
        
        if (fotosImportadas > 0) {
            actualizarVistaImagenes();
            
            let mensaje = `${fotosImportadas} fotos importadas correctamente`;
            if (erroresImportacion > 0) {
                mensaje += ` (${erroresImportacion} errores)`;
            }
            mostrarNotificacion(mensaje, 'success');
            
            // Preguntar si desea limpiar las fotos de la cámara
            if (await confirmarAccion('¿Desea limpiar las fotos de la cámara después de importarlas?')) {
                await limpiarFotosCamara();
            }
        } else {
            mostrarNotificacion('No se pudieron importar las fotos', 'error');
        }
        
    } catch (error) {
        console.error('Error al importar fotos de cámara:', error);
        mostrarNotificacion('Error al importar fotos desde la cámara: ' + error.message, 'error');
    } finally {
        estadoCamara.sincronizando = false;
        await verificarEstadoCamara();
    }
}

// Nueva función para sincronización usando la API del backend
async function sincronizarFotosCamara() {
    if (!pdfSeleccionado) {
        mostrarNotificacion('Debe seleccionar un PDF primero', 'warning');
        return;
    }
    
    if (estadoCamara.sincronizando) {
        mostrarNotificacion('Sincronización ya en progreso...', 'warning');
        return;
    }
    
    try {
        estadoCamara.sincronizando = true;
        actualizarEstadoCamara();
        mostrarNotificacion('Sincronizando fotos automáticamente...', 'info');
        
        const response = await fetch('/api/evidencia/sincronizar_fotos_camara', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pdf_id: pdfSeleccionado.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.fotos_sincronizadas > 0) {
                // Añadir las fotos sincronizadas a la evidencia
                data.fotos.forEach(foto => {
                    imagenesEvidencia.push(foto);
                });
                
                actualizarVistaImagenes();
                mostrarNotificacion(`${data.fotos_sincronizadas} fotos sincronizadas automáticamente`, 'success');
                
                // Limpiar automáticamente después de sincronizar
                await limpiarFotosCamara();
            } else {
                mostrarNotificacion(data.message || 'No hay fotos nuevas para sincronizar', 'info');
            }
        } else {
            throw new Error(data.error || 'Error en la sincronización');
        }
        
    } catch (error) {
        console.error('Error al sincronizar fotos:', error);
        mostrarNotificacion('Error al sincronizar fotos: ' + error.message, 'error');
    } finally {
        estadoCamara.sincronizando = false;
        await verificarEstadoCamara();
    }
}

// Función para verificar el estado de la cámara
async function verificarEstadoCamara() {
    if (estadoCamara.verificandoEstado) return;
    
    try {
        estadoCamara.verificandoEstado = true;
        
        const response = await fetch('/api/evidencia/estado_camara');
        const data = await response.json();
        
        if (data.success) {
            estadoCamara.fotosDisponibles = data.fotos_disponibles;
            actualizarEstadoCamara();
        }
        
    } catch (error) {
        console.error('Error al verificar estado de cámara:', error);
    } finally {
        estadoCamara.verificandoEstado = false;
    }
}

// Función para actualizar la visualización del estado de la cámara
function actualizarEstadoCamara() {
    if (!estadoCamaraElement) return;
    
    // Mostrar/ocultar indicador de estado
    if (estadoCamara.conectada || estadoCamara.fotosDisponibles > 0 || estadoCamara.sincronizando) {
        estadoCamaraElement.style.display = 'block';
    } else {
        estadoCamaraElement.style.display = 'none';
        return;
    }
    
    // Actualizar clase CSS según el estado
    estadoCamaraElement.className = 'estado-camara';
    if (estadoCamara.sincronizando) {
        estadoCamaraElement.classList.add('sincronizando');
    } else if (estadoCamara.conectada) {
        estadoCamaraElement.classList.add('conectado');
    }
    
    // Actualizar icono
    if (estadoCamara.sincronizando) {
        iconoEstado.textContent = '🔄';
    } else if (estadoCamara.conectada) {
        iconoEstado.textContent = '📷';
    } else {
        iconoEstado.textContent = '📋';
    }
    
    // Actualizar mensaje
    if (estadoCamara.sincronizando) {
        mensajeEstado.textContent = 'Sincronizando fotos...';
    } else if (estadoCamara.conectada) {
        mensajeEstado.textContent = 'Cámara conectada - Tome fotos y regrese aquí';
    } else if (estadoCamara.fotosDisponibles > 0) {
        mensajeEstado.textContent = 'Fotos disponibles para importar';
    } else {
        mensajeEstado.textContent = 'Sin fotos disponibles';
    }
    
    // Actualizar contador
    contadorFotos.textContent = `${estadoCamara.fotosDisponibles} fotos`;
    
    // Actualizar visibilidad de botones
    if (btnSincronizar) {
        if (estadoCamara.fotosDisponibles > 0 && !estadoCamara.sincronizando) {
            btnSincronizar.style.display = 'block';
            btnSincronizar.innerHTML = '🔄 Sincronizar (' + estadoCamara.fotosDisponibles + ')';
        } else {
            btnSincronizar.style.display = 'none';
        }
    }
    
    // Actualizar botón importar
    if (btnImportar) {
        if (estadoCamara.fotosDisponibles > 0) {
            btnImportar.classList.add('disponible');
            btnImportar.innerHTML = `📥 Importar (${estadoCamara.fotosDisponibles})`;
        } else {
            btnImportar.classList.remove('disponible');
            btnImportar.innerHTML = '📥 Importar de Cámara';
        }
    }
}

// Función para iniciar verificación periódica del estado
function iniciarVerificacionEstado() {
    // Verificar inmediatamente
    verificarEstadoCamara();
    
    // Verificar cada 3 segundos cuando hay un PDF seleccionado
    const intervalo = setInterval(async () => {
        if (pdfSeleccionado && !estadoCamara.sincronizando) {
            await verificarEstadoCamara();
        } else if (!pdfSeleccionado) {
            clearInterval(intervalo);
        }
    }, 3000);
}

// Función auxiliar para confirmación de acciones
function confirmarAccion(mensaje) {
    return new Promise((resolve) => {
        if (confirm(mensaje)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

// Función mejorada para limpiar fotos de la cámara
async function limpiarFotosCamara() {
    try {
        const response = await fetch('/api/rij/limpiar_sesion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Fotos de la cámara limpiadas correctamente', 'success');
            estadoCamara.fotosDisponibles = 0;
            actualizarEstadoCamara();
        } else {
            throw new Error(data.error || 'Error al limpiar fotos');
        }
        
    } catch (error) {
        console.error('Error al limpiar fotos de cámara:', error);
        mostrarNotificacion('Error al limpiar fotos de la cámara', 'error');
    }
}

// Inicializar verificación cuando se selecciona un PDF (funcionalidad añadida en la función original)
