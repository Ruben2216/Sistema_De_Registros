document.addEventListener('DOMContentLoaded', function() {
    var barraProgreso = document.getElementById('progreso-barra');
    var formulario = document.querySelector('form');

    formulario.addEventListener('input', function() {
        var camposLlenos = 0;
        var totalCampos = 0;

        //------------------------------------------------------------------------
        // Selecciona todos los campos no radio y selects visibles (excluye display:none)
        var todosCampos = Array.prototype.slice.call(
            formulario.querySelectorAll('input:not([type="radio"]):not([type="hidden"]), textarea, select')
        ).filter(function(campo) {
            return campo.offsetParent !== null;
        });
        totalCampos += todosCampos.length;

        // Cuenta los campos llenados 
        for (var i = 0; i < todosCampos.length; i++) {
            if (todosCampos[i].value.trim() !== "") {
                camposLlenos++;
            }
        }
        //------------------------------------------------------------------------
        // Contar grupos de radios visibles
        var radiosVisibles = Array.prototype.slice.call(
            formulario.querySelectorAll('input[type="radio"]')
        ).filter(function(radio) {
            return radio.offsetParent !== null;
        });
        var gruposRadio = {};
        for (var j = 0; j < radiosVisibles.length; j++) {
            var nombre = radiosVisibles[j].name;
            if (nombre) {
                gruposRadio[nombre] = true;
            }
        }
        var totalGrupos = Object.keys(gruposRadio).length;
        totalCampos += totalGrupos;
        // Contar cada grupo si tiene al menos una opción marcada
        for (var nombreGrupo in gruposRadio) {
            var checkedRadio = formulario.querySelector('input[name="' + nombreGrupo + '"]:checked');
            if (checkedRadio) {
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

    formulario.addEventListener('change', function() {
        formulario.dispatchEvent(new Event('input'));
    });
});