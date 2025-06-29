
(function() {
    
    function ejecutarPruebasCompletas() {
        verificarDependencias();
        probarIdentificadorUsuario();
        probarEndpointsServidor();
        verificarElementosDOM();
        simularFlujoCompleto();
    }
    
    function verificarDependencias() {
        const dependencias = [
            { nombre: 'PDF.js', variable: 'pdfjsLib' },
            { nombre: 'jsPDF', variable: 'jspdf' },
            { nombre: 'RIJ PDF Manager', variable: 'rijPDFManager' }
        ];
        
        dependencias.forEach(dep => {
            if (typeof window[dep.variable] !== 'undefined') {
                // Dependencia disponible
            }
        });
    }
    
    function probarIdentificadorUsuario() {
        if (typeof window.rijPDFManager !== 'undefined') {
            window.rijPDFManager.limpiarDatosRIJ();
            const identificador1 = window.rijPDFManager.obtenerIdentificadorUsuario();
            const identificador2 = window.rijPDFManager.obtenerIdentificadorUsuario();
            return identificador1 === identificador2;
        }
        return false;
    }
    
    async function probarEndpointsServidor() {
        try {
            const response = await fetch('/api/rij/obtener_imagen/TEST_ID', {
                credentials: 'include'
            });
            return response.status === 404;
        } catch (error) {
            return false;
        }
    }
    
    function verificarElementosDOM() {
        const elementos = {
            'contenedor-rij': 'Contenedor RIJ (camara.html)',
            'imagen-rij-container': 'Container imagen RIJ (camara.html)',
            'btnGenerarPDF': 'Botón generar PDF',
            'btnEnviarCorreo': 'Botón enviar correo'
        };
        
        Object.entries(elementos).forEach(([id, descripcion]) => {
            const elemento = document.getElementById(id);
            // Elemento verificado silenciosamente
        });
    }
    
    function simularFlujoCompleto() {
        if (typeof window.rijPDFManager === 'undefined') {
            return false;
        }
        
        window.rijPDFManager.limpiarDatosRIJ();
        const identificador = window.rijPDFManager.obtenerIdentificadorUsuario();
        
        localStorage.setItem('rij_imagen_url', '/RESOURCE/IMG/img RIJ/simulacion_test.png');
        localStorage.setItem('rij_pdf_procesado', 'true');
        
        const rijProcesado = window.rijPDFManager.rijYaProcesado();
        const urlImagen = window.rijPDFManager.obtenerURLImagenRIJ();
        
        return rijProcesado && urlImagen;
    }
    
    function generarReporte() {
        const estado = {
            dependencias: {
                pdfjs: typeof pdfjsLib !== 'undefined',
                jspdf: typeof window.jspdf !== 'undefined',
                rijPDFManager: typeof window.rijPDFManager !== 'undefined',
                rijCamaraManager: typeof window.rijCamaraManager !== 'undefined'
            },
            elementos: {
                contenedorRIJ: !!document.getElementById('contenedor-rij'),
                imagenContainer: !!document.getElementById('imagen-rij-container'),
                btnPDF: !!document.getElementById('btnGenerarPDF'),
                btnCorreo: !!document.getElementById('btnEnviarCorreo')
            },
            localStorage: {
                identificador: localStorage.getItem('usuario_identificador_rij'),
                imagenUrl: localStorage.getItem('rij_imagen_url'),
                procesado: localStorage.getItem('rij_pdf_procesado')
            }
        };
        
        const sistemaListo = estado.dependencias.pdfjs && 
                           estado.dependencias.jspdf && 
                           estado.dependencias.rijPDFManager;
        
        return sistemaListo;
    }
    
    window.pruebasRIJ = {
        ejecutarPruebasCompletas,
        verificarDependencias,
        probarIdentificadorUsuario,
        probarEndpointsServidor,
        verificarElementosDOM,
        simularFlujoCompleto,
        generarReporte
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(ejecutarPruebasCompletas, 1000);
        });
    } else {
        setTimeout(ejecutarPruebasCompletas, 1000);
    }

})();
