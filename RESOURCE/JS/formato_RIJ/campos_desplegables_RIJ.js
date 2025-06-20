function mostrarInput(nombre) {
        document.querySelectorAll('[id^="input_"]').forEach(el => el.style.display = 'none');
    // Oculta el input correspondiente
    const input = document.getElementById("input_" + nombre);
    if (!input) return;
    input.style.display = "none";

    // Busca los radios de ese grupo
    const radios = document.getElementsByName(nombre);
    radios.forEach(radio => {
        // Si está seleccionado y tiene el atributo data-desplegar igual a su valor
        if (radio.checked && radio.dataset.desplegar === radio.value) {
            input.style.display = "block";
        }
    });
}

// Para todos los radios, agrega el evento change
document.querySelectorAll('.grupo-opciones__control[type="radio"]').forEach(radio => {
    radio.addEventListener('change', function() {
        mostrarInput(this.name);
    });
});