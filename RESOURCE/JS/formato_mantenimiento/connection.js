document.addEventListener('DOMContentLoaded', function() {
    
    const searchContainers = document.querySelectorAll('.search-container');
    searchContainers.forEach(container => {
        
    const paramName = container.dataset.paramName; 
        
        const inputField = container.querySelector('input[type="text"]');
        const searchButton = container.querySelector('.search-button');
        const searchUrl = searchButton.dataset.url;

        if (!paramName || !inputField || !searchButton) {
            console.error('Falta configuración en un contenedor de búsqueda.', container);
            return;
        }

        const fetchData = () => {
            const searchValue = inputField.value.trim();
            if (searchValue === '') {
                alert(`Por favor, ingrese un número de ${paramName}.`);
                return;
            }

            const finalUrl = `${searchUrl}?${paramName}=${searchValue}`;
            
            console.log('Buscando en:', finalUrl); 

            fetch(finalUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Respuesta del servidor no fue OK');
                    }
                    return response.json();
                })
                .then(data => {
                    if (Object.keys(data).length > 0) {
                        // Validación para mostrar solo 'Tuxtla' por lo que se requiere en el formato de los equipos, que sea solo "Tuxtla" (que yo sepa -Ruben)
                        if (data.nombre_division === "DIS Zona Tuxtla") {
                            document.getElementById('division').value = "TUXTLA";
                        } else {
                            document.getElementById('division').value = data.nombre_division || '';
                        }
                        document.getElementById('centro_trabajo').value = data.centro_trabajo || '';
                        document.getElementById('usuario').value = data.nombre_responsable || '';
                        document.getElementById('marca').value = data.marca || '';
                        document.getElementById('modelo').value = data.modelo || '';
                        // document.getElementById('tipo_uso').value = data.tipo_uso || '';
                        // document.getElementById('procesos').value = data.procesos || '';

                        if (document.getElementById('numero_serie')) {
                            document.getElementById('numero_serie').value = data.numero_serie || '';
                        }
                        if (document.getElementById('numero_inventario')) { 
                            document.getElementById('numero_inventario').value = data.numero_inventario || ''; 
                        }
                        if (document.getElementById('tipo_uso')) { 
                            document.getElementById('tipo_uso').value = data.tipo_uso || ''; 
                        }
                        if (document.getElementById('procesos')) { 
                            document.getElementById('procesos').value = data.procesos || ''; 
                        }
                    
                    } else {
                        alert('Equipo no encontrado');
                    }
                })
                .catch(error => {
                    console.error('Error al buscar el equipo:', error);
                    alert('Ocurrió un error al conectar con el servidor.');
                });
        };
        searchButton.addEventListener('click', fetchData);
        inputField.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                fetchData();
            }
        });
    });
});