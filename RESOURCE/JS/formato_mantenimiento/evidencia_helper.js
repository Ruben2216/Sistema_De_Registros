// Funciones auxiliares para el sistema de evidencia de mantenimiento
// Este archivo contiene funciones reutilizables para todos los formularios de mantenimiento

// Función para guardar PDF en el repositorio de evidencia de mantenimiento
async function guardarPDFEnRepositorioEvidencia(docPDF, nombreArchivo, tipoMantenimiento) {
    try {
        console.log('[DEBUG] Iniciando guardarPDFEnRepositorioEvidencia');
        console.log('[DEBUG] nombreArchivo:', nombreArchivo);
        console.log('[DEBUG] tipoMantenimiento:', tipoMantenimiento);
        console.log('[DEBUG] docPDF:', docPDF ? 'OK' : 'NULL');
        
        // Validar parámetros
        if (!docPDF) {
            console.error('[DEBUG] Error: docPDF es null o undefined');
            return;
        }
        
        if (!nombreArchivo || nombreArchivo.trim() === '') {
            console.error('[DEBUG] Error: nombreArchivo está vacío');
            return;
        }
        
        if (!tipoMantenimiento) {
            console.error('[DEBUG] Error: tipoMantenimiento está vacío, usando default');
            tipoMantenimiento = 'general';
        }
        
        // Obtener el PDF como base64
        const pdfBase64 = docPDF.output('datauristring');
        console.log('[DEBUG] PDF generado, longitud base64:', pdfBase64 ? pdfBase64.length : 0);
        
        // Datos para enviar al servidor
        const datosRepositorio = {
            pdf_base64: pdfBase64,
            nombre_archivo: nombreArchivo.trim(),
            tipo_mantenimiento: tipoMantenimiento
        };
        
        console.log('[DEBUG] Enviando datos al servidor...');
        
        // Enviar al servidor
        const response = await fetch('/api/evidencia/guardar_pdf_mantenimiento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosRepositorio)
        });
        
        console.log('[DEBUG] Respuesta del servidor:', response.status);
        
        const result = await response.json();
        console.log('[DEBUG] Resultado:', result);
        
        if (result.success) {
            console.log('PDF guardado en repositorio de evidencia:', result.pdf_id);
            
            // Mostrar notificación al usuario
            mostrarNotificacionRepositorio(
                `PDF guardado en repositorio. Puede añadir evidencia fotográfica desde el menú.`,
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
            max-width: 300px;
            z-index: 10000;
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
    }, 5000);
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
            z-index: 10000;
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
                <h3 style="color: #00724e; margin-bottom: 20px;">PDF Generado Exitosamente</h3>
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
                        background: #6c757d;
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
    }, 10000);
}

// Nueva función para comprimir PDF antes de la descarga
async function comprimirYDescargarPDF(docPDF, nombreArchivo, tipoMantenimiento, mostrarModal = true) {
    try {
        console.log('[DEBUG] Iniciando compresión y descarga de PDF...');
        
        // Mostrar indicador de carga
        mostrarIndicadorCompresion(true);
        
        // Obtener el PDF como base64 
        const pdfBase64Original = docPDF.output('datauristring');
        console.log('[DEBUG] PDF original generado, tamaño:', pdfBase64Original.length);
        
        // Opción 1: Comprimir para descarga directa
        const datosCompresionDescarga = {
            pdf_base64: pdfBase64Original,
            nombre_archivo: nombreArchivo.trim()
        };
        
        console.log('[DEBUG] Enviando PDF para compresión y descarga...');
        
        const responseDescarga = await fetch('/api/evidencia/comprimir_y_descargar_pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosCompresionDescarga)
        });
        
        const resultDescarga = await responseDescarga.json();
        console.log('[DEBUG] Resultado de compresión para descarga:', resultDescarga);
        
        if (resultDescarga.success && resultDescarga.pdf_comprimido_base64) {
            // Mostrar estadísticas de compresión
            if (resultDescarga.estadisticas) {
                const stats = resultDescarga.estadisticas;
                console.log('[DEBUG] Estadísticas de compresión:');
                console.log('  - Tamaño original:', stats.tamaño_original, 'bytes');
                console.log('  - Tamaño comprimido:', stats.tamaño_comprimido, 'bytes');
                console.log('  - Reducción:', stats.porcentaje_reduccion + '%');
                console.log('  - Método:', stats.metodo_usado);
                
                mostrarNotificacionCompresion(stats);
            }
            
            // Descargar PDF comprimido
            descargarPDFDesdBase64(resultDescarga.pdf_comprimido_base64, nombreArchivo);
            
            console.log('✅ PDF comprimido descargado exitosamente');
            
        } else {
            console.warn('Compresión falló, usando descarga normal');
            // Fallback: descarga normal si falla la compresión
            docPDF.save(nombreArchivo);
        }
        
        // Opción 2: Guardar en repositorio de evidencia (en paralelo)
        try {
            await guardarPDFEnRepositorioEvidencia(docPDF, nombreArchivo, tipoMantenimiento);
        } catch (error) {
            console.warn('Error al guardar en repositorio (no crítico):', error);
        }
        
        // Mostrar modal de evidencia (opcional)
        if (mostrarModal) {
            setTimeout(() => {
                mostrarModalEvidencia(nombreArchivo);
            }, 1000); // Delay aumentado para dar tiempo a la compresión
        }
        
    } catch (error) {
        console.error('Error en proceso de compresión:', error);
        // Fallback: descarga normal si hay error
        docPDF.save(nombreArchivo);
        
        if (mostrarModal) {
            setTimeout(() => {
                mostrarModalEvidencia(nombreArchivo);
            }, 500);
        }
    } finally {
        // Ocultar indicador de carga
        mostrarIndicadorCompresion(false);
    }
}

// Función para descargar PDF desde base64
function descargarPDFDesdBase64(pdfBase64, nombreArchivo) {
    try {
        console.log('[DEBUG] Iniciando descarga de PDF comprimido...');
        
        // Crear un enlace de descarga
        const link = document.createElement('a');
        link.href = pdfBase64;
        link.download = nombreArchivo;
        
        // Agregar al DOM temporalmente y hacer clic
        document.body.appendChild(link);
        link.click();
        
        // Limpiar
        document.body.removeChild(link);
        
        console.log('[DEBUG] Descarga de PDF comprimido iniciada');
        
    } catch (error) {
        console.error('Error al descargar PDF comprimido:', error);
        throw error;
    }
}

// Función para mostrar/ocultar indicador de compresión
function mostrarIndicadorCompresion(mostrar) {
    let indicador = document.getElementById('indicador-compresion');
    
    if (!indicador && mostrar) {
        indicador = document.createElement('div');
        indicador.id = 'indicador-compresion';
        indicador.innerHTML = `
            <div style=""
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px 30px;
                border-radius: 10px;
                z-index: 10001;
                text-align: center;
                font-family: Arial, sans-serif;
            ">
                <div style="margin-bottom: 10px;">📄 Comprimiendo PDF...</div>
                <div style="font-size: 12px; opacity: 0.8;">Optimizando tamaño del archivo</div>
            </div>
        `;
        document.body.appendChild(indicador);
    }
    
    if (indicador) {
        indicador.style.display = mostrar ? 'block' : 'none';
        if (!mostrar) {
            setTimeout(() => {
                if (indicador && indicador.parentNode) {
                    indicador.parentNode.removeChild(indicador);
                }
            }, 300);
        }
    }
}

// Función para mostrar notificación de compresión
function mostrarNotificacionCompresion(estadisticas) {
    const porcentaje = estadisticas.porcentaje_reduccion || 0;
    const tamaño_ahorrado = (estadisticas.tamaño_original - estadisticas.tamaño_comprimido) || 0;
    const tamaño_kb = (tamaño_ahorrado / 1024).toFixed(1);
    
    let mensaje = `PDF optimizado`;
    if (porcentaje > 0) {
        mensaje += ` - Reducción: ${porcentaje}% (${tamaño_kb} KB ahorrados)`;
    }
    
    mostrarNotificacionRepositorio(mensaje, porcentaje > 5 ? 'success' : 'info');
}

// Función wrapper que se puede usar en todos los archivos de PDF
function procesarPDFMantenimiento(docPDF, nombreArchivo, tipoMantenimiento, mostrarModal = true) {
    console.log('[DEBUG] procesarPDFMantenimiento llamado');
    console.log('[DEBUG] nombreArchivo:', nombreArchivo);
    console.log('[DEBUG] tipoMantenimiento:', tipoMantenimiento);
    
    // Validar parámetros antes de procesar
    if (!nombreArchivo || nombreArchivo.trim() === '') {
        console.error('[DEBUG] Error: nombreArchivo está vacío en procesarPDFMantenimiento');
        alert('Error: No se pudo determinar el nombre del archivo PDF');
        return;
    }
    
    if (!docPDF) {
        console.error('[DEBUG] Error: docPDF es null en procesarPDFMantenimiento');
        alert('Error: No se pudo generar el documento PDF');
        return;
    }
    
    // Nueva funcionalidad: Comprimir PDF antes de descarga
    comprimirYDescargarPDF(docPDF, nombreArchivo, tipoMantenimiento, mostrarModal);
}
