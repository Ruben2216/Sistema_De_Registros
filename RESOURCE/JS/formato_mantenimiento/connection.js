document.addEventListener('DOMContentLoaded', function() {
    
    const searchButton = document.getElementById('search-button');
    const searchUrl = searchButton.dataset.url;
    const serialInput = document.getElementById('numero_serie');



    // Función para buscar los datos
    const fetchData = () => {
        const serialNumber = serialInput.value.trim();
        
        if (serialNumber === '') {
            alert('Por favor, ingrese un número de serie.');
            return;
        }
        
        fetch(`${searchUrl}?serie=${serialNumber}`) 
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
                    document.getElementById('numero_inventario').value = data.numero_inventario || '';
                    document.getElementById('nombre_usuario').value = data.nombre_responsable || ''; // El ID es 'nombre_usuario'
                    document.getElementById('marca').value = data.marca || '';
                    document.getElementById('modelo').value = data.modelo || '';
                    document.getElementById('tipo_uso').value = data.tipo_uso || '';
                } else {
                    alert('Equipo no encontrado en la base de datos.');
                    // Limpia los campos si no se encuentra nada
                    document.getElementById('division').value = '';
                    document.getElementById('centro_trabajo').value = '';
                    document.getElementById('numero_inventario').value = '';
                    document.getElementById('nombre_usuario').value = '';
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

    serialInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            fetchData();
        }
    });
});