
  document.getElementById('select-reset').addEventListener('click', function() {
    // Obtener una referencia al elemento select
    const selectElement = document.getElementById('select-mantenimient');
    // Verificar si el elemento select existe en este HTML
    if (selectElement) {
        selectElement.selectedIndex = 0; // Establecer la selección al primer elemento
    }
  });
