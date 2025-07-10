// Mostrar input de motivo y contador si se elige "No"
function mostrarInput(nombre) {
    // Oculta todos los inputs de motivo excepto Observaciones
    document.querySelectorAll('[id^="input_"]').forEach(el => {
        if (el.id !== "input_Observaciones") {
            el.style.display = 'none';
        }
    });

    // Oculta todos los contadores de letras excepto Observaciones
    document.querySelectorAll('[id^="contador_letras_"]').forEach(el => {
        if (el.id !== "contador_letras_Observaciones") {
            el.style.display = 'none';
        }
    });

    // Verifica si el radio "no" está seleccionado
    const radios = document.getElementsByName(nombre);
    radios.forEach(radio => {
        if (radio.value === "no" && radio.checked) {
            // Muestra el input correspondiente
            const inputMotivo = document.getElementById("input_" + nombre);
            if (inputMotivo) inputMotivo.style.display = "block";

            // Muestra el contador correspondiente
            const contador = document.getElementById("contador_letras_" + nombre);
            if (contador) contador.style.display = "inline";
        }
    });
}

// Añade evento a todos los radios para detectar cambios
document.querySelectorAll('.grupo-opciones__control[type="radio"]').forEach(radio => {
    radio.addEventListener('change', function () {
        mostrarInput(this.name);
    });
});

// Contador de letras para todos los inputs de motivo excepto Observaciones
document.querySelectorAll('input[id^="input_"]:not(#input_Observaciones)').forEach(function(input) {
    input.addEventListener('input', function () {
        // Obtiene el nombre base del input, por ejemplo: "pantalla"
        var nombre = this.id.replace("input_", "");
        var contador = document.getElementById("contador_letras_" + nombre);
        if (contador) {
            var longitud = this.value.length;
            if (longitud > 40) {
                this.value = this.value.substring(0, 40);
                longitud = 40;
            }
            contador.textContent = longitud + "/40 caracteres";
        }
    });
});

// Contador de letras específico para Observaciones
var inputObservaciones = document.getElementById("input_Observaciones");
if (inputObservaciones) {
    inputObservaciones.addEventListener('input', function () {
        var contador = document.getElementById("contador_letras_Observaciones");
        if (contador) {
            var longitud = this.value.length;
            if (longitud > 120) {
                this.value = this.value.substring(0, 120);
                longitud = 120;
            }
            contador.textContent = longitud + "/120 caracteres";
        }
    });
}
