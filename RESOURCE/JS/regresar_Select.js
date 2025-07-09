
  // Función para resetear el select a "FORMATO MANTENIMIENTO" dsde en menu.html
function resetearSelectMantenimiento() {
    const selectElement = document.getElementById('select-mantenimiento');
    if (selectElement) {
        selectElement.selectedIndex = 0; 
    }
}

document.addEventListener('DOMContentLoaded', resetearSelectMantenimiento);

// Resetear cuando la página se muestra, obligando a ejecutar incluso cuando se carga desde el caché
window.addEventListener('pageshow', resetearSelectMantenimiento);
