// Lógica para el acordeón de secciones desplegables
// -----------------------------------------------

var seccionesDesplegables = document.querySelectorAll('.seccion--desplegable');

for (var i = 0; i < seccionesDesplegables.length; i++) {
    (function(indice) {
        var seccion = seccionesDesplegables[indice];
        var resumen = seccion.querySelector('.seccion__resumen');
        seccion.classList.remove('abierta');
        mostrarOcultarCampos(seccion, false);
        resumen.addEventListener('click', function() {
            var abierta = seccion.classList.contains('abierta');
            for (var j = 0; j < seccionesDesplegables.length; j++) {
                seccionesDesplegables[j].classList.remove('abierta');
                mostrarOcultarCampos(seccionesDesplegables[j], false);
            }
            if (!abierta) {
                seccion.classList.add('abierta');
                mostrarOcultarCampos(seccion, true);
            }
        });
    })(i);
}

function mostrarOcultarCampos(seccion, mostrar) {
    var campos = seccion.querySelectorAll(':scope > .campo, :scope > textarea, :scope > .campo__etiqueta, :scope > .campo__control, :scope > .campo__control--area-texto');
    for (var i = 0; i < campos.length; i++) {
        if (mostrar) {
            campos[i].style.display = '';
        } else {
            campos[i].style.display = 'none';
        }
    }
}

if (seccionesDesplegables.length > 1) {
    var seccion6 = seccionesDesplegables[1];
    var camposSeccion6 = seccion6.querySelectorAll('.campo input, .campo textarea, .campo select');
    for (var i = 0; i < camposSeccion6.length; i++) {
        camposSeccion6[i].addEventListener('focus', function() {
            seccionesDesplegables[0].classList.remove('abierta');
            mostrarOcultarCampos(seccionesDesplegables[0], false);
            seccionesDesplegables[1].classList.add('abierta');
            mostrarOcultarCampos(seccionesDesplegables[1], true);
        });
    }
}
