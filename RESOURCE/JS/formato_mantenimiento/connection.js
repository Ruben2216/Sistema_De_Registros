document.addEventListener('DOMContentLoaded', function() {
    
    function rellenarFormularioConDatos(data) {
        if (data && Object.keys(data).length > 0) {
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
            alert('Equipo no encontrado o sin datos.');
        }
    }

    const searchContainers = document.querySelectorAll('.search-container');
    searchContainers.forEach(container => {
        
        const paramName = container.dataset.paramName; 
        const inputField = container.querySelector('input[type="text"]');
        const searchButton = container.querySelector('.search-button');

        if (!paramName || !inputField || !searchButton) {
            console.error('Falta configuración en un contenedor de búsqueda.', container);
            return;
        }

        const fetchDataConBoton = () => {
            const searchValue = inputField.value.trim();
            if (searchValue === '') {
                alert(`Por favor, ingrese un valor para ${paramName}.`);
                return;
            }
            
            const searchUrl = searchButton.dataset.url;
            const finalUrl = `${searchUrl}?${paramName}=${searchValue}`;

            fetch(finalUrl)
                .then(response => {
                    if (!response.ok) throw new Error('Respuesta del servidor no fue OK');
                    return response.json();
                })
                .then(data => {
                    rellenarFormularioConDatos(data);
                })
                .catch(error => {
                    console.error('Error al buscar el equipo:', error);
                    alert('Ocurrió un error al conectar con el servidor.');
                });
        };

        searchButton.addEventListener('click', fetchDataConBoton);
        inputField.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                fetchDataConBoton();
            }
        });

        // AUTOCOMPLETADO (campo de serie) 
        if (paramName === 'serie') {
            const sugerenciasContainer = container.querySelector('#serie-sugerencias');
            if (!sugerenciasContainer) return; 

            inputField.addEventListener('input', function() {
                const query = this.value.trim();

                if (query.length < 3) { //buscar a partir de 3 carcteres
                    sugerenciasContainer.style.display = 'none';
                    sugerenciasContainer.innerHTML = '';
                    return;
                }
                
                //endpoint para sugerencias
                fetch(`/buscar_sugerencias_serie?q=${query}`)
                    .then(response => response.json())
                    .then(sugerencias => {
                        sugerenciasContainer.innerHTML = ''; 

                        if (sugerencias.length > 0) {
                            sugerenciasContainer.style.display = 'block';
                            sugerencias.forEach(equipo => {
                                const divItem = document.createElement('div');
                                divItem.className = 'sugerencia-item'; 
                                divItem.textContent = equipo.numero_serie;

                                divItem.addEventListener('click', function() {
                                    rellenarFormularioConDatos(equipo);
                                    sugerenciasContainer.style.display = 'none';
                                    sugerenciasContainer.innerHTML = '';
                                });
                                sugerenciasContainer.appendChild(divItem);
                            });
                        } else {
                            sugerenciasContainer.style.display = 'none';
                        }
                    })
                    .catch(error => {
                        console.error('Error al buscar sugerencias:', error);
                        sugerenciasContainer.style.display = 'none';
                    });
            });

            document.addEventListener('click', function(e) {
                if (!container.contains(e.target)) {
                    sugerenciasContainer.style.display = 'none';
                }
            });
        }
    });
});