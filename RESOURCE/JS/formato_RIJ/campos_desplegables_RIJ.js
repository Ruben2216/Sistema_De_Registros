// Mostrar input y contador si se elige "Sí"
function mostrarInput(nombre) {
    // Oculta todos los inputs de motivo
    document.querySelectorAll('[id^="input_"]').forEach(el => el.style.display = 'none');

    // Oculta todos los contadores de letras
    document.querySelectorAll('[id^="contador_letras_"]').forEach(el => el.style.display = 'none');

    // Verifica si el radio "sí" está seleccionado y tiene data-desplegar="si"
    const radios = document.getElementsByName(nombre);
    radios.forEach(radio => {
        if (radio.checked && radio.dataset.desplegar === radio.value) {
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

// Contador de letras para todos los inputs de motivo
document.querySelectorAll('input[id^="input_"]').forEach(input => {
    input.addEventListener('input', function () {
        const nombre = this.id.replace("input_", ""); // Ej: "riesgo"
        const contador = document.getElementById("contador_letras_" + nombre);
        if (contador) {
            contador.textContent = `${this.value.length}/40 caracteres`;
        }
    });
});



