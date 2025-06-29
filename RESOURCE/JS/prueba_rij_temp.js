// Script de prueba para funcionalidad RIJ

(function() {
    
    function verificarComponentesRIJ() {
        let componentesOK = 0;
        const totalComponentes = 5;
        
        if (typeof pdfjsLib !== 'undefined') {
            componentesOK++;
        }
        
        if (typeof window.jspdf !== 'undefined') {
            componentesOK++;
        }
        
        if (typeof window.rijPDFManager !== 'undefined') {
            componentesOK++;
            window.rijPDFManager.obtenerIdentificadorUsuario();
            window.rijPDFManager.rijYaProcesado();
            window.rijPDFManager.obtenerURLImagenRIJ();
        }
        
        if (typeof window.rijCamaraManager !== 'undefined') {
            componentesOK++;
        }
        
        if (typeof window.validadorRIJ !== 'undefined') {
            componentesOK++;
        }
        
        const contenedorRIJ = document.getElementById('contenedor-rij');
        if (contenedorRIJ) {
            // Componente DOM verificado
        }
        
        return componentesOK === totalComponentes;
    }
    
    function ejecutarPruebaSilenciosa() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', verificarComponentesRIJ);
        } else {
            setTimeout(verificarComponentesRIJ, 500);
        }
    }
    
    window.pruebaRIJ = {
        verificar: verificarComponentesRIJ
    };
    
    ejecutarPruebaSilenciosa();

})();
