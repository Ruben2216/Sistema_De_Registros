// Intercepta el PDF REAL cuando se genera desde el botón del formulario
(function() {
    let yaInterceptado = false;
    
    function configurarInterceptacion() {
        // Esperar a que jsPDF esté disponible
        if (typeof window.jspdf === 'undefined') {
            setTimeout(configurarInterceptacion, 100);
            return;
        }
        
        // Guardar la función original de jsPDF save
        const originalSave = window.jspdf.jsPDF.prototype.save;
        
        // Sobrescribir save para capturar el PDF
        window.jspdf.jsPDF.prototype.save = function(filename) {
            // Solo procesar si es en formato_RIJ.html y no se ha procesado ya
            if (window.location.pathname.includes('formato_RIJ.html') && !yaInterceptado) {
                const pdfData = this.output('datauristring');
                
                // Marcar como procesado inmediatamente
                yaInterceptado = true;
                
                // Procesar el PDF real
                setTimeout(() => {
                    procesarPDFReal(pdfData);
                }, 100);
            }
            
            // Llamar al método original
            return originalSave.call(this, filename);
        };
    }
    
    async function procesarPDFReal(pdfDataUri) {
        try {
            // Generar identificador único si no existe
            let identificador = localStorage.getItem('usuario_identificador_rij');
            if (!identificador) {
                identificador = 'RIJ_' + Date.now() + '_' + Math.random().toString(36).substring(7);
                localStorage.setItem('usuario_identificador_rij', identificador);
            }
            
            // Guardar el PDF en localStorage
            localStorage.setItem('ultimo_pdf_rij', pdfDataUri);
            
            // Enviar al servidor para conversión
            const response = await fetch('/api/rij/convertir_pdf_imagen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pdf_base64: pdfDataUri,
                    identificador: identificador
                }),
                credentials: 'include'
            });
            
            if (response.ok) {
                const resultado = await response.json();
                if (resultado.success) {
                    localStorage.setItem('rij_imagen_url', resultado.url);
                    localStorage.setItem('rij_pdf_procesado', 'true');
                }
            }
        } catch (error) {
            // Error silencioso, resetear flag para permitir reintento
            yaInterceptado = false;
        }
    }
    
    // Solo ejecutar en formato_RIJ.html
    if (window.location.pathname.includes('formato_RIJ.html')) {
        configurarInterceptacion();
    }
})();
