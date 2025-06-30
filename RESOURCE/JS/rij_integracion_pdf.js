// Script para integrar conversión de PDF RIJ a imagen al finalizar el formulario

(function() {
    
    // Función para interceptar la generación del PDF RIJ
    function interceptarPDFRIJ() {
        // Buscar el botón "Pasar siguiente" o el evento de finalización del formulario
        var form = document.querySelector('.formulario-verificacion__formulario');
        if (!form) return;
        
        // Interceptar el evento de submit o click en "Pasar siguiente"
        form.addEventListener('submit', function(e) {
            // No prevenir el evento, pero procesar después
            setTimeout(procesarPDFRIJ, 1000);
        });
        
        // También buscar botones que puedan ser "Pasar siguiente"
        var botones = document.querySelectorAll('button, input[type="submit"], .boton');
        for (var i = 0; i < botones.length; i++) {
            var boton = botones[i];
            var texto = boton.textContent || boton.value || '';
            if (texto.toLowerCase().includes('siguiente') || 
                texto.toLowerCase().includes('finalizar') || 
                texto.toLowerCase().includes('continuar')) {
                
                boton.addEventListener('click', function() {
                    setTimeout(procesarPDFRIJ, 1000);
                });
            }
        }
    }
    
    // Función para procesar el PDF RIJ después de generarlo
    async function procesarPDFRIJ() {
        try {
            // Verificar si existe el gestor de PDF RIJ
            if (typeof window.rijPDFManager === 'undefined') {
                return;
            }
            
            // Obtener el identificador único del usuario
            var identificador = window.rijPDFManager.obtenerIdentificadorUsuario();
            
            // Verificar si ya se procesó
            if (window.rijPDFManager.rijYaProcesado()) {
                return;
            }
            
            // Buscar si existe un PDF generado recientemente
            // Esto puede variar dependiendo de cómo se genera el PDF en tu sistema
            var pdfBase64 = obtenerPDFGenerado();
            
            if (pdfBase64) {
                // Convertir PDF a imagen usando el backend
                await convertirPDFaImagenBackend(pdfBase64, identificador);
            }
            
        } catch (error) {
            // Error silencioso
        }
    }
    
    // Función para obtener el PDF generado (esto depende de tu implementación)
    function obtenerPDFGenerado() {
        // Buscar en localStorage, variables globales, o DOM
        var pdfData = localStorage.getItem('ultimo_pdf_rij');
        if (pdfData) {
            return pdfData;
        }
        
        // Buscar en variables globales si las hay
        if (window.ultimoPDFGenerado) {
            return window.ultimoPDFGenerado;
        }
        
        return null;
    }
    
    // Función para convertir PDF a imagen usando el backend
    async function convertirPDFaImagenBackend(pdfBase64, identificador) {
        try {
            var response = await fetch('/api/rij/convertir_pdf_imagen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pdf_base64: pdfBase64,
                    identificador: identificador
                }),
                credentials: 'include'
            });
            
            if (response.ok) {
                var resultado = await response.json();
                if (resultado.success) {
                    // Guardar en localStorage para uso posterior
                    localStorage.setItem('rij_imagen_url', resultado.url);
                    localStorage.setItem('rij_pdf_procesado', 'true');
                }
            }
            
        } catch (error) {
            // Error silencioso
        }
    }
    
    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        interceptarPDFRIJ();
    });
    
})();
