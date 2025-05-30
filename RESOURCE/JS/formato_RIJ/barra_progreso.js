document.addEventListener('DOMContentLoaded', function() {
    var barraProgreso = document.getElementById('progreso-barra');
    var formulario = document.querySelector('form');

    formulario.addEventListener('input', function() {
        var camposLlenos = 0;
        var totalCampos = 0;

        //------------------------------------------------------------------------
        // Selecciona todos los campos excepto¿ los radio porque serán contados aparte más adelante
        var campos = formulario.querySelectorAll('input:not([type="radio"]), textarea, select');
        totalCampos += campos.length;

        // Cuenta los campos llenados (excepto radios)
        for (var i = 0; i < campos.length; i++) {
            if (campos[i].value.trim() !== "") {
                camposLlenos++;
            }
        }
        //------------------------------------------------------------------------
        // aqui se Selecciona los campos de tipo radio en total
        var radios = formulario.querySelectorAll('input[type="radio"]');
        totalCampos += radios.length;
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                camposLlenos++;
            }
        }
        //------------------------------------------------------------------------
        // Calcula el porcentaje de progreso con la fórmula clásica de porcentaje
        var progreso = 0;
        if (totalCampos > 0) {
            progreso = (camposLlenos / totalCampos) * 100;
        }
        
        //------------------------------------------------------------------------
        // Actualiza el ancho de la barra de progreso del CSS 
        barraProgreso.style.width = progreso + '%';
    });
});