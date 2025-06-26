
// se espera a que todo el contenido de la página,
window.addEventListener('load', function() {
    // Esto activará las reglas CSS para hacer visible el contenido.
    if (document.body) {
        document.body.classList.add('loaded');
    }
}); 

var elementosGlobales = {
    fechaInput: null
}

function obtenerFecha(){
    fecha= new Date();
    var dia = (fecha.getDate()).toString().padStart(2, '0');
    var mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    var anio = fecha.getFullYear();
    fechaHoy = dia + '/' + mes + '/' + anio;
    return fechaHoy;
}
function inicializarElementosGlobales() {
    elementosGlobales.fechaInput = document.getElementById('fecha');
    if (elementosGlobales.fechaInput) {
        elementosGlobales.fechaInput.value = obtenerFecha();
    }
}

function guardarLocalStorage() {
    if (elementosGlobales.fechaInput) {
        localStorage.setItem('valor_fecha', elementosGlobales.fechaInput.value || obtenerFecha());
    }
}
document.addEventListener('DOMContentLoaded', function() {
    inicializarElementosGlobales(); 
    var valorFecha = localStorage.getItem('valor_fecha') || obtenerFecha();
    if (elementosGlobales.fechaElemento) {
        elementosGlobales.fechaElemento.innerHTML = valorFecha;
    }
});