
(function() {
    
    // Función para mostrar la imagen RIJ en la interfaz
    function mostrarImagenRIJ() {
        const contenedorRIJ = document.getElementById('contenedor-rij');
        if (!contenedorRIJ) {
            return;
        }

        // Verificar si ya hay RIJ procesado
        if (typeof window.rijPDFManager !== 'undefined' && window.rijPDFManager.rijYaProcesado()) {
            const urlImagen = window.rijPDFManager.obtenerURLImagenRIJ();
            if (urlImagen) {
                mostrarRIJEnInterfaz(urlImagen);
                return;
            }
        }

        // Si no hay imagen local, buscar en servidor
        const identificador = localStorage.getItem('usuario_identificador_rij');
        if (identificador) {
            buscarImagenEnServidor(identificador);
        }
    }

    // Función para buscar imagen en servidor
    async function buscarImagenEnServidor(identificador) {
        try {
            const response = await fetch(`/api/rij/obtener_imagen/${identificador}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const resultado = await response.json();
                if (resultado.success && resultado.url) {
                    // Actualizar localStorage
                    localStorage.setItem('rij_imagen_url', resultado.url);
                    localStorage.setItem('rij_pdf_procesado', 'true');
                    
                    mostrarRIJEnInterfaz(resultado.url);
                }
            }
        } catch (error) {
            // Error silencioso
        }
    }

    // Función para mostrar RIJ en la interfaz
    function mostrarRIJEnInterfaz(urlImagen) {
        const contenedorRIJ = document.getElementById('contenedor-rij');
        if (!contenedorRIJ) {
            return;
        }

        // Limpiar contenido previo
        contenedorRIJ.innerHTML = '';

        // Crear elementos para mostrar la imagen
        const tituloRIJ = document.createElement('h3');
        tituloRIJ.textContent = 'Formulario RIJ Completado';
        tituloRIJ.style.color = '#2c3e50';
        tituloRIJ.style.marginBottom = '10px';
        tituloRIJ.style.textAlign = 'center';

        const imagenRIJ = document.createElement('img');
        imagenRIJ.src = urlImagen;
        imagenRIJ.alt = 'Formulario RIJ';
        imagenRIJ.style.width = '100%';
        imagenRIJ.style.maxWidth = '600px';
        imagenRIJ.style.height = 'auto';
        imagenRIJ.style.border = '2px solid #27ae60';
        imagenRIJ.style.borderRadius = '8px';
        imagenRIJ.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        imagenRIJ.style.display = 'block';
        imagenRIJ.style.margin = '0 auto';

        // Agregar evento de error para la imagen
        imagenRIJ.onerror = function() {
            contenedorRIJ.innerHTML = '<p style="color: #e74c3c; text-align: center;">Error al cargar la imagen RIJ</p>';
        };

        // Mensaje informativo
        const mensajeInfo = document.createElement('p');
        mensajeInfo.innerHTML = '<i class="fa fa-check-circle" style="color: #27ae60;"></i> Su formulario RIJ se incluirá al inicio del PDF final';
        mensajeInfo.style.textAlign = 'center';
        mensajeInfo.style.color = '#27ae60';
        mensajeInfo.style.marginTop = '10px';
        mensajeInfo.style.fontSize = '14px';

        // Agregar elementos al contenedor
        contenedorRIJ.appendChild(tituloRIJ);
        contenedorRIJ.appendChild(imagenRIJ);
        contenedorRIJ.appendChild(mensajeInfo);

        // Mostrar el contenedor
        contenedorRIJ.style.display = 'block';
    }

    // Función para ocultar RIJ
    function ocultarImagenRIJ() {
        const contenedorRIJ = document.getElementById('contenedor-rij');
        if (contenedorRIJ) {
            contenedorRIJ.style.display = 'none';
        }
    }

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // Crear contenedor para RIJ si no existe
        crearContenedorRIJ();
        
        // Mostrar imagen RIJ si existe
        setTimeout(mostrarImagenRIJ, 100);
    });

    // Función para crear el contenedor RIJ
    function crearContenedorRIJ() {
        if (document.getElementById('contenedor-rij')) {
            return; // Ya existe
        }

        const contenedorPrincipal = document.querySelector('.container');
        if (!contenedorPrincipal) {
            return;
        }

        const contenedorRIJ = document.createElement('div');
        contenedorRIJ.id = 'contenedor-rij';
        contenedorRIJ.style.display = 'none';
        contenedorRIJ.style.marginBottom = '20px';
        contenedorRIJ.style.padding = '15px';
        contenedorRIJ.style.backgroundColor = '#f8f9fa';
        contenedorRIJ.style.border = '1px solid #dee2e6';
        contenedorRIJ.style.borderRadius = '8px';

        // Insertar después del título pero antes de los controles
        const titulo = contenedorPrincipal.querySelector('h1');
        if (titulo && titulo.nextSibling) {
            contenedorPrincipal.insertBefore(contenedorRIJ, titulo.nextSibling);
        } else {
            contenedorPrincipal.insertBefore(contenedorRIJ, contenedorPrincipal.firstChild);
        }
    }

    // Exponer funciones globalmente
    window.rijCamaraManager = {
        mostrarImagenRIJ: mostrarImagenRIJ,
        ocultarImagenRIJ: ocultarImagenRIJ,
        buscarImagenEnServidor: buscarImagenEnServidor
    };

})();
