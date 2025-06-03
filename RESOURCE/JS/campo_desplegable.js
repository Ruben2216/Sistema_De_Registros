function mostrarInput(nombre) { //nombre referencia name de los radios
    // Oculta todos los inputs de motivo
    document.querySelectorAll('[id^="input_"]').forEach(el => el.style.display = 'none');
    // Si el radio "no" está seleccionado, muestra el input correspondiente
    const radios = document.getElementsByName(nombre);
    radios.forEach(radio => {
        if (radio.value === "no" && radio.checked) {
            document.getElementById("input_" + nombre).style.display = "block";
        }
    });
}
// Para todos los radios, agrega el evento onchange
document.querySelectorAll('.grupo-opciones__control[type="radio"]').forEach(radio => {
    radio.addEventListener('change', function() {
        mostrarInput(this.name);
    });
});
