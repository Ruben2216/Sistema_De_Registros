
(function() {

    // Función para interceptar la generación del PDF RIJ y procesarlo
    function procesarPDFRIJDespuesDeGenerar(pdfArrayBuffer) {
        if (typeof window.rijPDFManager === 'undefined') {
            return;
        }

        try {
            // Convertir ArrayBuffer a base64
            const bytes = new Uint8Array(pdfArrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const dataUri = 'data:application/pdf;base64,' + base64;
            
            // Procesar PDF a imagen de forma asíncrona
            window.rijPDFManager.procesarPDFRIJ(dataUri)
                .then(() => {
                    setTimeout(() => {
                        window.location.href = '/TEMPLATES/camara.html';
                    }, 1000);
                })
                .catch(error => {
                    setTimeout(() => {
                        window.location.href = '/TEMPLATES/camara.html';
                    }, 1000);
                });
        } catch (error) {
            // Error silencioso
        }
    }

    // Interceptar la función jsPDF save para capturar el PDF antes de descargarlo
    function interceptarGeneracionPDF() {
        // Esperar a que jsPDF esté disponible
        if (typeof window.jspdf === 'undefined') {
            setTimeout(interceptarGeneracionPDF, 100);
            return;
        }

        // Guardar la función original de save
        const originalSave = window.jspdf.jsPDF.prototype.save;
        
        // Sobrescribir la función save
        window.jspdf.jsPDF.prototype.save = function(filename) {
            // Solo procesar si es el PDF RIJ
            if (filename === 'RIJ.pdf') {
                // Obtener el ArrayBuffer del PDF
                const pdfArrayBuffer = this.output('arraybuffer');
                
                // Procesar para imagen
                procesarPDFRIJDespuesDeGenerar(pdfArrayBuffer);
            }
            
            // Llamar a la función original para descargar
            return originalSave.call(this, filename);
        };
    }

    // Función alternativa: interceptar directamente la función generarPDF
    function interceptarGenerarPDF() {
        // Verificar que estamos en la página correcta
        if (!window.location.pathname.includes('formato_RIJ.html')) {
            return;
        }

        if (typeof window.generarPDF === 'undefined') {
            setTimeout(interceptarGenerarPDF, 100);
            return;
        }

        // Guardar la función original
        const originalGenerarPDF = window.generarPDF;
        
        // Sobrescribir la función
        window.generarPDF = async function() {
            try {
                // Llamar a la función original
                await originalGenerarPDF.call(this);
                
            } catch (error) {
                // Error silencioso
            }
        };
    }

    // Función para escuchar el evento de submit del formulario RIJ
    function escucharFormularioRIJ() {
        document.addEventListener('DOMContentLoaded', function() {
            // Buscar el formulario RIJ
            const form = document.querySelector('form');
            if (form && window.location.pathname.includes('formato_RIJ.html')) {
                form.addEventListener('submit', function(e) {
                    // Formulario enviado
                });
            }
        });
    }

    // Función para crear un botón de redirección después de procesar
    function crearBotonRedireccion() {
        const contenedor = document.querySelector('.container') || document.body;
        const boton = document.createElement('div');
        boton.innerHTML = `
            <div id="rij-procesado-mensaje" style="display: none; text-align: center; margin: 20px;">
                <p>✅ RIJ procesado exitosamente. Redirigiendo a la cámara...</p>
                <button onclick="window.location.href='/TEMPLATES/camara.html'" class="boton boton--primario">
                    Ir a Cámara
                </button>
            </div>
        `;
        contenedor.appendChild(boton);
    }

    // Función principal de inicialización
    function inicializar() {
        if (window.location.pathname.includes('formato_RIJ.html')) {
            // Solo en la página del formulario RIJ
            interceptarGeneracionPDF();
            interceptarGenerarPDF();
            escucharFormularioRIJ();
            crearBotonRedireccion();
        }
    }

    // Exponer funciones globalmente si es necesario
    window.rijIntegracion = {
        procesarPDFRIJDespuesDeGenerar,
        interceptarGeneracionPDF,
        interceptarGenerarPDF
    };

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }

})();
