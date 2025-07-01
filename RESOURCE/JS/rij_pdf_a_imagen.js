// Script para convertir PDF de RIJ a imagen y manejar identificador único

(function() {
    // Generar o recuperar identificador único del usuario
    function obtenerIdentificadorUsuario() {
        let identificador = localStorage.getItem('usuario_identificador_rij');
        if (!identificador) {
            // Crear nuevo identificador basado en timestamp y random
            identificador = 'RIJ_' + Date.now() + '_' + Math.random().toString(36).substring(7);
            localStorage.setItem('usuario_identificador_rij', identificador);
        }
        return identificador;
    }

    // Función para convertir PDF a imagen usando PDF.js
    async function convertirPDFaImagen(pdfArrayBuffer, identificadorUsuario) {
        try {
            // Verificar si PDF.js está disponible
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js no está cargado');
            }

            // Cargar el PDF
            const pdf = await pdfjsLib.getDocument({data: pdfArrayBuffer}).promise;
            
            // Obtener la primera página
            const pagina = await pdf.getPage(1);
            
            // Configurar el viewport para buena resolución
            const escala = 2.0; // Mayor escala = mejor calidad
            const viewport = pagina.getViewport({scale: escala});
            
            // Crear canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Renderizar la página
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await pagina.render(renderContext).promise;
            
            // Convertir canvas a blob con alta calidad
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png', 1.0);
            });

        } catch (error) {
            throw error;
        }
    }

    // Función para guardar imagen en el servidor
    async function guardarImagenRIJ(blob, identificadorUsuario) {
        try {
            const formData = new FormData();
            formData.append('imagen', blob);
            formData.append('identificador', identificadorUsuario);
            
            const response = await fetch('/api/rij/guardar_imagen', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Error al guardar imagen');
            }
            
            const resultado = await response.json();
            return resultado;
            
        } catch (error) {
            throw error;
        }
    }

    // Función principal para procesar PDF del RIJ
    async function procesarPDFRIJ(pdfBase64) {
        try {
            const identificadorUsuario = obtenerIdentificadorUsuario();
            
            // Convertir base64 a ArrayBuffer
            let pdfData = pdfBase64;
            if (pdfData.includes(',')) {
                pdfData = pdfData.split(',')[1];
            }
            
            const binaryString = atob(pdfData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Convertir PDF a imagen
            const imagenBlob = await convertirPDFaImagen(bytes.buffer, identificadorUsuario);
            
            // Guardar imagen en servidor
            const resultado = await guardarImagenRIJ(imagenBlob, identificadorUsuario);
            
            // Guardar referencia en localStorage para uso posterior
            localStorage.setItem('rij_imagen_url', resultado.url);
            localStorage.setItem('rij_pdf_procesado', 'true');
            
            // Disparar evento para notificar que se generó una nueva imagen
            window.dispatchEvent(new CustomEvent('rij_imagen_generada', {
                detail: { url: resultado.url, identificador: identificadorUsuario }
            }));
            
            return resultado;
            
        } catch (error) {
            throw error;
        }
    }

    // Función para obtener URL de imagen RIJ guardada
    function obtenerURLImagenRIJ() {
        return localStorage.getItem('rij_imagen_url');
    }

    // Función para verificar si el RIJ ya fue procesado
    function rijYaProcesado() {
        return localStorage.getItem('rij_pdf_procesado') === 'true';
    }

    // Función para limpiar datos del RIJ
    function limpiarDatosRIJ() {
        localStorage.removeItem('rij_imagen_url');
        localStorage.removeItem('rij_pdf_procesado');
        localStorage.removeItem('usuario_identificador_rij');
    }

    // Exponer funciones globalmente
    window.rijPDFManager = {
        obtenerIdentificadorUsuario: obtenerIdentificadorUsuario,
        procesarPDFRIJ: procesarPDFRIJ,
        obtenerURLImagenRIJ: obtenerURLImagenRIJ,
        rijYaProcesado: rijYaProcesado,
        limpiarDatosRIJ: limpiarDatosRIJ
    };

})();

