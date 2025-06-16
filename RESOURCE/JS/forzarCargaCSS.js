
// se espera a que todo el contenido de la página,
window.addEventListener('load', function() {
    // Esto activará las reglas CSS para hacer visible el contenido.
    if (document.body) {
        document.body.classList.add('loaded');
    }
});
