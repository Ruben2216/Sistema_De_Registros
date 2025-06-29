// Script de diagnóstico para modal de progreso

(function() {
    
    function verificarModalProgreso() {
        if (typeof window.pdfProgressManager !== 'undefined') {
            return true;
        }
        
        const modalElement = document.querySelector('#modal-progreso-circular');
        if (modalElement) {
            return true;
        }
        
        return false;
    }
    
    function probarModal() {
        if (typeof window.pdfProgressManager !== 'undefined') {
            window.pdfProgressManager.mostrar();
            setTimeout(() => {
                window.pdfProgressManager.actualizarProgreso(50);
            }, 1000);
            setTimeout(() => {
                window.pdfProgressManager.completar();
            }, 2000);
            setTimeout(() => {
                window.pdfProgressManager.ocultar();
            }, 3000);
        }
    }
    
    function inicializar() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', verificarModalProgreso);
        } else {
            setTimeout(verificarModalProgreso, 500);
        }
    }
    
    window.verificarModalProgreso = {
        verificar: verificarModalProgreso,
        probar: probarModal
    };
    
    inicializar();

})();
