(function() {
    const BORRADOR_KEY = 'borrador_RIJ';
    const EXPIRATION_TIME = 3 * 60 * 1000; 
    var API_URL = 'https://192.168.1.18:8000/api/rij/autoguardado';
    var backendDisponible = true;


    function obtenerDatosFormulario() {
        var form = document.querySelector('.formulario-verificacion__formulario');
        var datos = {};
        var elementos = form.querySelectorAll('input, select, textarea');
        
        elementos.forEach(function(el) {
            var key = el.name || el.id;
            if (!key) return;

            if ((el.tagName === 'TEXTAREA' && el.readOnly) || el.id === 'hora_inicio') {
                return;
            }

            if (el.type === 'radio') {
                if (el.checked) {
                    datos[key] = el.value;
                }
            } else if (el.type === 'checkbox') {
                datos[key] = el.checked;
            } else {
                datos[key] = el.value;
            }
        });
        return datos;
    }


    function limpiarFormulario() {
        var form = document.querySelector('.formulario-verificacion__formulario');
        if (form) {
            form.reset();
        }

        ['1', '2', '3'].forEach(function(num) {
            var img = document.getElementById('firma-imagen-' + num);
            var area = document.getElementById('firma-area-' + num);
            var input = document.getElementById('firma-input-' + num);

            if (img) {
                img.src = '';
                img.style.display = 'none';
            }
            if (area) area.style.display = 'flex';
            if (input) input.value = '';
        });

        establecerValoresPorDefecto();
    }

    function rellenarFormulario(datos) {
        if (!datos) return;
        var form = document.querySelector('.formulario-verificacion__formulario');

        var divisionSelect = document.getElementById('division');
        if (divisionSelect && datos.hasOwnProperty('division')) {
            divisionSelect.value = datos['division'];
            divisionSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        setTimeout(function() {
            var elementos = form.querySelectorAll('input, select, textarea');
            elementos.forEach(function(el) {
                var key = el.name || el.id;
                if (!key || !datos.hasOwnProperty(key)) return;

                if (el.type === 'radio') {
                    if (el.value === datos[key]) {
                        el.checked = true;
                    }
                } else if (el.type === 'checkbox') {
                    el.checked = !!datos[key];
                } else {
                    el.value = datos[key];
                }
            });

            ['1', '2', '3'].forEach(function(num) {
                var firmaKey = 'firma-input-' + num;
                var firmaData = datos[firmaKey] || datos['firma' + num];
                if (firmaData) {
                    var img = document.getElementById('firma-imagen-' + num);
                    var area = document.getElementById('firma-area-' + num);
                    if (img) {
                        img.src = firmaData;
                        img.style.display = 'block';
                    }
                    if (area) {
                        area.style.display = 'none';
                    }
                }
            });
        }, 150);
    }

    function establecerValoresPorDefecto() {
        var divisionSelect = document.getElementById('division');
        var zonaSelect = document.getElementById('zona');
        if (divisionSelect && !divisionSelect.value) {
            divisionSelect.value = 'Sureste';
            divisionSelect.dispatchEvent(new Event('change', { bubbles: true }));
            setTimeout(function() {
                if (zonaSelect) {
                    zonaSelect.value = 'Tuxtla';
                }
            }, 100);
        }
    }

    //borra el borrador de localStorage y limpia el formulario
    function limpiarBorradorExpirado() {
        console.log("Borrador expirado. Limpiando datos locales y el formulario.");
        localStorage.removeItem(BORRADOR_KEY);
        limpiarFormulario();
    }

    //guarda el objeto de datos en localStorage, con un timestamp
    function guardarEnLocalStorage(datos) {
        var wrapper = {
            datos: datos,
            timestamp: Date.now()
        };
        localStorage.setItem(BORRADOR_KEY, JSON.stringify(wrapper));
    }

    function autoguardar() {
        var datos = obtenerDatosFormulario();
        guardarEnLocalStorage(datos);

        if (!backendDisponible) return;
        
        var datosSinFirmas = Object.assign({}, datos);
        delete datosSinFirmas['firma-input-1'];
        delete datosSinFirmas['firma-input-2'];
        delete datosSinFirmas['firma-input-3'];

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosSinFirmas),
            credentials: 'include'
        }).catch(function(err) {
            console.warn("El backend no está disponible. Se guardó solo localmente.", err);
            backendDisponible = false;
        });
    }

    //se ejecuta al cargar la página para recuperar el trabajo no guardado
    function restaurar() {
        var borradorJSON = localStorage.getItem(BORRADOR_KEY);
        
        if (!borradorJSON) {
            establecerValoresPorDefecto();
            return;
        }

        try {
            var wrapper = JSON.parse(borradorJSON);
            
            if (Date.now() - wrapper.timestamp > EXPIRATION_TIME) {
                limpiarBorradorExpirado();
            } else {
                console.log("Restaurando borrador válido desde localStorage.");
                rellenarFormulario(wrapper.datos);
            }
        } catch (e) {
            console.error("Error al procesar el borrador local. Se procederá a limpiar.", e);
            limpiarBorradorExpirado();
        }
    }

    //configuración de los eventos 
    var autoguardadoTimeout = null;
    function autoguardarDebounced() {
        if (autoguardadoTimeout) clearTimeout(autoguardadoTimeout);
        autoguardadoTimeout = setTimeout(autoguardar, 500);
    }

    document.addEventListener('DOMContentLoaded', function() {
        var form = document.querySelector('.formulario-verificacion__formulario');
        if (form) {
            form.addEventListener('input', autoguardarDebounced);
            form.addEventListener('change', autoguardarDebounced);
        }
        
        restaurar();
    });

    // Proceso en segundo plano que comprueba la expiración cada 30 segundos.
    setInterval(function() {
        var borradorJSON = localStorage.getItem(BORRADOR_KEY);
        if (borradorJSON) {
            try {
                var wrapper = JSON.parse(borradorJSON);
                if (Date.now() - wrapper.timestamp > EXPIRATION_TIME) {
                    localStorage.removeItem(BORRADOR_KEY);
                    console.log("Borrador expirado y eliminado en segundo plano.");
                }
            } catch (e) {
                localStorage.removeItem(BORRADOR_KEY);
            }
        }
    }, 30000);

    window.autoguardadoRIJ = {
        limpiarSesion: function() {
            fetch('/api/rij/limpiar_sesion', { method: 'POST', credentials: 'include' })
                .finally(limpiarBorradorExpirado);
        }
    };

})();