// Función para guardar PDF en el repositorio de evidencia de mantenimiento
async function guardarPDFEnRepositorioEvidencia(docPDF, nombreArchivo, tipoMantenimiento) {
    try {
        // Obtener el PDF como base64
        const pdfBase64 = docPDF.output('datauristring');
        
        console.log('Enviando PDF al repositorio con nombre:', nombreArchivo);
        
        // Datos para enviar al servidor
        const datosRepositorio = {
            pdf_base64: pdfBase64,
            nombre_archivo: nombreArchivo,
            tipo_mantenimiento: tipoMantenimiento
        };
        
        // Enviar al servidor
        const response = await fetch('/api/evidencia/guardar_pdf_mantenimiento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosRepositorio)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('PDF guardado en repositorio de evidencia:', result.pdf_id);
            console.log('Nombre original enviado:', nombreArchivo);
            console.log('Nombre guardado por el backend:', result.nombre_guardado || nombreArchivo);
            console.log('Archivo PDF guardado como:', result.nombre_archivo);
            
            // Mostrar notificación al usuario
            mostrarNotificacionRepositorio(
                `PDF "${result.nombre_guardado || nombreArchivo}" guardado en repositorio. Puede añadir evidencia fotográfica desde el menú.`,
                'success'
            );
        } else {
            console.error('Error al guardar PDF en repositorio:', result.error);
        }
        
    } catch (error) {
        console.error('Error al comunicarse con el repositorio de evidencia:', error);
    }
}

// Función para mostrar notificaciones sobre el repositorio
function mostrarNotificacionRepositorio(mensaje, tipo = 'info') {
    // Crear elemento de notificación si no existe
    let notificacion = document.getElementById('notificacion-repositorio');
    
    if (!notificacion) {
        notificacion = document.createElement('div');
        notificacion.id = 'notificacion-repositorio';
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            border-left: 4px solid #28a745;
            max-width: 90vw !important;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(notificacion);
    }
    
    // Configurar estilos según el tipo
    const estilos = {
        success: 'background-color: #00724e;',
        error: 'background-color: #dc3545;',
        info: 'background-color: #007bff;',
        warning: 'background-color: #ffc107; color: #212529;'
    };
    
    notificacion.style.cssText += estilos[tipo] || estilos.info;
    notificacion.textContent = mensaje;
    
    // Mostrar notificación
    setTimeout(() => {
        notificacion.style.transform = 'translateX(0)';
    }, 100);
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        notificacion.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
        }, 300);
    }, 10000);
}

// Función para mostrar modal de confirmación con enlace a evidencia
function mostrarModalEvidencia(nombreArchivo) {
    // Crear modal si no existe
    let modal = document.getElementById('modal-evidencia-mantenimiento');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-evidencia-mantenimiento';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000 ;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            ">
                <h3 style="color: #00724e; margin-bottom: 20px;">PDF Generado Exitosamente:  ${nombreArchivo}</h3>
                <p style="margin-bottom: 25px; color: #333;">
                    Su PDF de mantenimiento ha sido guardado correctamente.
                    ¿Desea añadir evidencia fotográfica?
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="btn-ir-evidencia" style="
                        background: #00724e;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">
                        📄 Añadir Evidencia
                    </button>
                    <button id="btn-cerrar-modal-evidencia" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Eventos del modal
        document.getElementById('btn-ir-evidencia').addEventListener('click', function() {
            window.location.href = '/TEMPLATES/evidencia_mantenimiento.html';
        });
        
        document.getElementById('btn-cerrar-modal-evidencia').addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    }, 15000); 
}

// Función principal para procesar y guardar PDF de mantenimiento
async function procesarPDFMantenimiento(docPDF, nombreArchivo, tipoMantenimiento, mostrarModal = true) {
    // Guardar el PDF localmente (descarga para el usuario)
    docPDF.save(nombreArchivo);

    // Guardar en el backend y luego subir a Google Drive usando la ruta/nombre devuelto
    try {
        // Obtener el PDF como base64
        const pdfBase64 = docPDF.output('datauristring');
        // Datos para enviar al servidor
        const datosRepositorio = {
            pdf_base64: pdfBase64,
            nombre_archivo: nombreArchivo,
            tipo_mantenimiento: tipoMantenimiento
        };
        // Guardar en backend
        const response = await fetch('/api/evidencia/guardar_pdf_mantenimiento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosRepositorio)
        });
        const result = await response.json();
        if (result.success) {
            // Notificación de guardado
            mostrarNotificacionRepositorio(
                `PDF "${result.nombre_guardado || nombreArchivo}" guardado en repositorio. Puede añadir evidencia fotográfica desde el menú.`,
                'success'
            );
            // Subir a Google Drive usando el nombre/ruta devuelto
            const rutaCompleta = `Evidencias_Mantenimiento/${result.nombre_archivo}`;
            const datosDrive = {
                archivo_pdf: rutaCompleta,
                nombre_personalizado: nombreArchivo
            };
            const responseDrive = await fetch('/api/drive/subir_pdf_mantenimiento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosDrive)
            });
            const resultDrive = await responseDrive.json();
            if (resultDrive.success) {
                if (resultDrive.queued) {
                    mostrarNotificacionDrive(
                        `PDF "${nombreArchivo}" guardado en cola. Se enviará a Google Drive cuando haya conexión a internet.`,
                        'warning'
                    );
                } else {
                    mostrarNotificacionDrive(
                        `PDF "${nombreArchivo}" enviado exitosamente a Google Drive.`,
                        'success'
                    );
                }
            } else {
                mostrarNotificacionDrive(
                    `No se pudo enviar "${nombreArchivo}" a Google Drive: ${resultDrive.error}`,
                    'error'
                );
            }
        } else {
            mostrarNotificacionRepositorio(
                `Error al guardar PDF en repositorio: ${result.error}`,
                'error'
            );
        }
    } catch (error) {
        mostrarNotificacionRepositorio(
            `Error al comunicarse con el repositorio de evidencia: ${error.message}`,
            'error'
        );
    }

    // Mostrar modal de evidencia (opcional)
    if (mostrarModal) {
        setTimeout(() => {
            mostrarModalEvidencia(nombreArchivo);
        }, 500);
    }
}

// Función para mostrar notificaciones específicas de Google Drive
function mostrarNotificacionDrive(mensaje, tipo = 'info') {
    // Crear elemento de notificación si no existe
    let notificacion = document.getElementById('notificacion-drive');
    
    if (!notificacion) {
        notificacion = document.createElement('div');
        notificacion.id = 'notificacion-drive';
        notificacion.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 13px;
            max-width: 90vw !important;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            border-left: 4px solid;
        `;
        document.body.appendChild(notificacion);
    }
    
    // Configurar estilos según el tipo
    const estilos = {
        success: 'background-color: #00724e; border-left-color: #28a745;',
        error: 'background-color: #dc3545; border-left-color: #dc3545;',
        info: 'background-color: #007bff; border-left-color: #007bff;',
        warning: 'background-color: #fd7e14; border-left-color: #ffc107; color: #212529;'
    };
    
    notificacion.style.cssText += estilos[tipo] || estilos.info;
    
    // Añadir icono según el tipo de situacion, se planea en caso de no conexioni o inestable se despliegue en ese contexto
    const iconos = {
        success: '☁️ ✓',
        error: '☁️ ✗', 
        info: '☁️ ℹ️',
        warning: '☁️ ⚠️'
    };
    
    notificacion.innerHTML = `<strong>${iconos[tipo] || iconos.info}</strong> ${mensaje}`;
    
    // Mostrar notificación
    setTimeout(() => {
        notificacion.style.transform = 'translateX(0)';
    }, 100);
    
    // Ocultar después de 6 segundos
    setTimeout(() => {
        notificacion.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
        }, 300);
    }, 8000);
}

async function enviarPDFEvidenciasAGoogleDrive(nombreArchivo, mostrarNotificacion = true) {
    try {
        // Construir la ruta completa del PDF de evidencias
        var rutaCompleta = `Evidencias_Mantenimiento/${nombreArchivo}`;
        var datosDrive = {
            archivo_pdf: rutaCompleta,
            nombre_personalizado: nombreArchivo
        };
        // Enviar al backend para subir a Google Drive
        var responseDrive = await fetch('/api/drive/subir_pdf_mantenimiento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosDrive)
        });
        var resultDrive = await responseDrive.json();
        if (mostrarNotificacion) {
            if (resultDrive.success) {
                if (resultDrive.queued) {
                    mostrarNotificacionDrive(
                        `PDF "${nombreArchivo}" guardado en cola. Se enviará a Google Drive cuando haya conexión a internet.`,
                        'warning'
                    );
                } else {
                    mostrarNotificacionDrive(
                        `PDF "${nombreArchivo}" enviado exitosamente a Google Drive.`,
                        'success'
                    );
                }
            } else {
                mostrarNotificacionDrive(
                    `No se pudo enviar "${nombreArchivo}" a Google Drive: ${resultDrive.error}`,
                    'error'
                );
            }
        }
    } catch (error) {
        if (mostrarNotificacion) {
            mostrarNotificacionDrive(
                `Error al comunicarse con Google Drive: ${error.message}`,
                'error'
            );
        }
    }
}


