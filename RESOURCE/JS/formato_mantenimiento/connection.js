document.addEventListener('DOMContentLoaded', function() {
    
    const searchButton = document.getElementById('search-button');
    const searchUrl = searchButton.dataset.url;
    const inventarioInput = document.getElementById('inventario');



    // Función para buscar los datos
    const fetchData = () => {
        const inventarioNumber = inventarioInput.value.trim();

        if (inventarioNumber === '') {
            alert('Por favor, ingrese un número de inventario.');
            return;
        }

        fetch(`${searchUrl}?inventario=${inventarioNumber}`)
        .then(response => {
            if (!response.ok) { 
                throw new Error('Respuesta del servidor no fue OK');
            }
            return response.json();
        })
            .then(data => {
                if (Object.keys(data).length > 0) {
                    document.getElementById('division').value = data.nombre_division || '';
                    document.getElementById('centro_trabajo').value = data.centro_trabajo || '';
                    document.getElementById('numero_serie').value = data.numero_serie || '';
                    document.getElementById('usuario').value = data.nombre_responsable || ''; // El ID es 'nombre_usuario'
                    document.getElementById('marca').value = data.marca || '';
                    document.getElementById('modelo').value = data.modelo || '';
                    document.getElementById('tipo_uso').value = data.tipo_uso || '';
                } else {
                    alert('Equipo no encontrado en la base de datos.');
                    // Limpia los campos si no se encuentra nada
                    document.getElementById('division').value = '';
                    document.getElementById('centro_trabajo').value = '';
                    document.getElementById('numero_serie').value = '';
                    document.getElementById('usuario').value = '';
                    document.getElementById('marca').value = '';
                    document.getElementById('modelo').value = '';
                    document.getElementById('tipo_uso').value = '';
                }
            })
            .catch(error => {
                console.error('Error al buscar el equipo:', error);
                alert('Ocurrió un error al conectar con el servidor. Revisa la consola para más detalles.');
            });
    };
    searchButton.addEventListener('click', fetchData);

    inventarioInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            fetchData();
        }
    });
});