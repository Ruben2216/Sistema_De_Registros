// Script para forzar conversión PDF a imagen después de generar RIJ
// Se ejecuta automáticamente después del evento "Pasar siguiente"

(function() {
    // Interceptar la generación de PDF en formato_RIJ.html
    function interceptarGeneracionPDF() {
        // Buscar botones que puedan ser "Pasar siguiente"
        const botones = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
        
        for (const boton of botones) {
            const texto = (boton.textContent || boton.value || '').toLowerCase();
            if (texto.includes('siguiente') || texto.includes('generar') || texto.includes('continuar')) {
                boton.addEventListener('click', function() {
                    setTimeout(procesarPDFGenerado, 2000); // Esperar a que se genere el PDF
                });
            }
        }
    }

    async function procesarPDFGenerado() {
        // Verificar si ya fue procesado
        if (localStorage.getItem('rij_pdf_procesado') === 'true') {
            return;
        }

        // Obtener PDF del localStorage o generar uno nuevo
        let pdfBase64 = localStorage.getItem('ultimo_pdf_rij');
        
        if (!pdfBase64) {
            // Si no hay PDF guardado, intentar generar uno simple
            if (typeof window.jspdf !== 'undefined') {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text("LISTA DE VERIFICACIÓN RIJ", 105, 15, null, null, "center");
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.text("Formulario completado: " + new Date().toLocaleDateString(), 15, 30);
                
                pdfBase64 = doc.output('datauristring');
                localStorage.setItem('ultimo_pdf_rij', pdfBase64);
            }
        }

        if (pdfBase64) {
            await convertirPDFaImagen(pdfBase64);
        }
    }

    async function convertirPDFaImagen(pdfBase64) {
        try {
            // Obtener o crear identificador único
            let identificador = localStorage.getItem('usuario_identificador_rij');
            if (!identificador) {
                identificador = 'RIJ_' + Date.now() + '_' + Math.random().toString(36).substring(7);
                localStorage.setItem('usuario_identificador_rij', identificador);
            }

            const response = await fetch('/api/rij/convertir_pdf_imagen', {
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
                const resultado = await response.json();
                if (resultado.success) {
                    localStorage.setItem('rij_imagen_url', resultado.url);
                    localStorage.setItem('rij_pdf_procesado', 'true');
                }
            }
        } catch (error) {
            // Error silencioso
        }
    }

    // Solo ejecutar en formato_RIJ.html
    if (window.location.pathname.includes('formato_RIJ.html')) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', interceptarGeneracionPDF);
        } else {
            interceptarGeneracionPDF();
        }
    }
})();
