
// se espera a que todo el contenido de la página,
window.addEventListener('load', function() {
    // Esto activará las reglas CSS para hacer visible el contenido.
    if (document.body) {
        document.body.classList.add('loaded');
    }
});

//FECHA ACTUAL PARA FORMULARIOS DE MANTENIMIENTO 
var elementosGlobales = {
    fechaInput: null,
    fechaElemento: null,
};

function obtenerFecha() {
    var fecha = new Date();
    var dia = (fecha.getDate()).toString().padStart(2, '0');
    var mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    var anio = fecha.getFullYear();
    var fechaHoy = dia + '/' + mes + '/' + anio;
    return fechaHoy;
}

// Hacer la función disponible globalmente
window.obtenerFecha = obtenerFecha;

function inicializarElementosGlobales() {
    elementosGlobales.fechaInput = document.getElementById('fecha');
    elementosGlobales.fechaElemento = document.getElementById('fecha1');

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