// Guarda y recupera datos del formulario, firmas y fotos usando 

(function() {
    // URL del backend Flask para autoguardado
    var API_URL = 'https://192.168.1.82:8000/api/rij/autoguardado';

    // Función para obtener todos los datos del formulario, incluyendo firmas
    function obtenerDatosFormulario() {
        var form = document.querySelector('.formulario-verificacion__formulario');
        var datos = {};
        var elementos = form.querySelectorAll('input, select, textarea');
        for (var i = 0; i < elementos.length; i++) {
            var el = elementos[i];
            var key = el.name ? el.name : el.id;
            if (!key) {
                // Si no tiene name ni id, usar un identificador único por tipo y posición
                key = el.tagName + '_' + i;
            }
            if (el.type === 'radio') {
                if (el.checked) {
                    datos[key] = el.value;
                } else if (!datos.hasOwnProperty(key)) {
                    // Si ningún radio está seleccionado, guardar vacío
                    datos[key] = '';
                }
            } else if (el.type === 'checkbox') {
                datos[key] = el.checked;
            } else if (el.tagName === 'SELECT') {
                datos[key] = el.value;
            } else if (el.tagName === 'TEXTAREA') {
                datos[key] = el.value;
            } else {
                datos[key] = el.value;
            }
        }
        // Firmas (canvas en base64)
        var firma1 = document.getElementById('firma-input-1');
        var firma2 = document.getElementById('firma-input-2');
        if (firma1) {
            datos['firma1'] = firma1.value;
        }
        if (firma2) {
            datos['firma2'] = firma2.value;
        }
        return datos;
    }

    // Función para rellenar el formulario con datos
    function rellenarFormulario(datos) {
        if (!datos) {
            return;
        }
        var form = document.querySelector('.formulario-verificacion__formulario');
        var elementos = form.querySelectorAll('input, select, textarea');
        // Primero restaurar selects de nivel superior (como división) antes que los dependientes
        // 1. Restaurar select de división
        var divisionSelect = document.getElementById('division');
        if (divisionSelect && datos.hasOwnProperty('division')) {
            divisionSelect.value = datos['division'];
            // Lanzar evento change para que el script de zonas actualice el select de zona
            var event = new Event('change', { bubbles: true });
            divisionSelect.dispatchEvent(event);
        }
        // 2. Restaurar el resto de campos (incluyendo zona, que ya tendrá las opciones correctas)
        for (var i = 0; i < elementos.length; i++) {
            var el = elementos[i];
            var key = el.name ? el.name : el.id;
            if (!key) {
                key = el.tagName + '_' + i;
            }
            // Saltar división porque ya se restauró arriba
            if (el.id === 'division') {
                continue;
            }
            if (datos.hasOwnProperty(key)) {
                if (el.type === 'radio') {
                    if (el.value === datos[key]) {
                        el.checked = true;
                    }
                } else if (el.type === 'checkbox') {
                    el.checked = !!datos[key];
                } else {
                    el.value = datos[key];
                }
            }
        }
        // Restaurar firmas
        if (datos.firma1) {
            var img1 = document.getElementById('firma-imagen-1');
            if (img1) {
                img1.src = datos.firma1;
                img1.style.display = 'block';
            }
            var input1 = document.getElementById('firma-input-1');
            if (input1) {
                input1.value = datos.firma1;
            }
        }
        if (datos.firma2) {
            var img2 = document.getElementById('firma-imagen-2');
            if (img2) {
                img2.src = datos.firma2;
                img2.style.display = 'block';
            }
            var input2 = document.getElementById('firma-input-2');
            if (input2) {
                input2.value = datos.firma2;
            }
        }
    }

    // Función para autoguardar (POST)
    function autoguardar() {
        var datos = obtenerDatosFormulario();
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos),
            credentials: 'include'
        })
        .then(function(res) {
            if (!res.ok) {
                throw new Error('Error al guardar');
            }
            return res.json();
        })
        .then(function(data) {
        })
        .catch(function(err) {
            // Si hay error, puedes guardar en localStorage como respaldo
            localStorage.setItem('borrador_RIJ', JSON.stringify(datos));
        });
    }

    // Función para restaurar (GET)
    function restaurar() {
        fetch(API_URL, {
            method: 'GET',
            credentials: 'include'
        })
        .then(function(res) {
            if (!res.ok) {
                throw new Error('No hay datos guardados');
            }
            return res.json();
        })
        .then(function(datos) {
            rellenarFormulario(datos);
        })
        .catch(function() {
            // Si falla, intenta restaurar de localStorage
            var borrador = localStorage.getItem('borrador_RIJ');
            if (borrador) {
                rellenarFormulario(JSON.parse(borrador));
            }
        });
    }

    // Detectar cambios en el formulario para autoguardar
    document.addEventListener('DOMContentLoaded', function() {
        var form = document.querySelector('.formulario-verificacion__formulario');
        if (form) {
            form.addEventListener('input', function() {
                autoguardar();
            });
            form.addEventListener('change', function() {
                autoguardar();
            });
        }
        // Restaurar al cargar
        restaurar();
    });

    // Forzar autoguardado antes de salir de la página
    window.addEventListener('beforeunload', function() {
        try {
            autoguardar();
        } catch (e) {
            // Si falla, al menos guarda en localStorage
            var datos = obtenerDatosFormulario();
            localStorage.setItem('borrador_RIJ', JSON.stringify(datos));
        }
    });

    // Exponer funciones para pruebas y depuración
    window.autoguardadoRIJ = {
        autoguardar: autoguardar,
        restaurar: restaurar,
        limpiarSesion: function() {
            // Llama al endpoint y limpia localStorage
            fetch('/api/rij/limpiar_sesion', {method: 'POST', credentials: 'include'})
                .then(function() {
                    localStorage.removeItem('borrador_RIJ');
                });
        }
    };
})();
