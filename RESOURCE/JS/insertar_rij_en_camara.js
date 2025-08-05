// Este script maneja la imagen RIJ mostrándola en el contenedor existente

(function() {
    function obtenerIdentificadorUsuario() {
        return localStorage.getItem('usuario_identificador_rij') || 'usuario_demo';
    }

    async function verificarYMostrarRIJ() {
        const identificador = obtenerIdentificadorUsuario();
        
        // Solo buscar si NO es usuario_demo (imagen de prueba)
        if (identificador === 'usuario_demo') {
            // Para usuario_demo, buscar imágenes RIJ generadas con patrón RIJ_timestamp_id.png
            await buscarImagenRIJGenerada();
            return;
        }
        
        // Primero buscar imagen RIJ generada en localStorage
        await buscarImagenRIJGenerada();
        
        // Si no hay en localStorage, buscar imagen RIJ real generada por identificador
        const rijImagenUrl = localStorage.getItem('rij_imagen_url');
        if (!rijImagenUrl) {
            const rutaRIJ = `/RESOURCE/IMG/img RIJ/${identificador}.png`;
            
            try {
                const response = await fetch(rutaRIJ, { method: 'HEAD' });
                if (response.ok) {
                    mostrarImagenEnContenedorExistente(rutaRIJ, identificador);
                }
            } catch (e) {
                // No hacer nada, la imagen no existe
            }
        }
    }

    async function buscarImagenRIJGenerada() {
        // Buscar la imagen RIJ más reciente almacenada en localStorage
        const rijImagenDisponible = localStorage.getItem('rij_imagen_url');
        if (rijImagenDisponible) {
            try {
                const response = await fetch(rijImagenDisponible, { method: 'HEAD' });
                if (response.ok) {
                    mostrarImagenEnContenedorExistente(rijImagenDisponible, 'rij_generado');
                }
            } catch (e) {
                // Limpiar localStorage si la imagen ya no existe
                localStorage.removeItem('rij_imagen_url');
            }
        }
    }

    function mostrarImagenEnContenedorExistente(url, identificador) {
        // Usar el contenedor existente en camara.html
        const contenedorRij = document.getElementById('contenedor-rij');
        const imagenContainer = document.getElementById('imagen-rij-container');
        
        if (contenedorRij && imagenContainer) {
            // Mostrar el contenedor
            contenedorRij.style.display = 'block';
            
            // Insertar solo la imagen en el contenedor existente
            imagenContainer.innerHTML = `
                <img src="${url}" alt="Formulario RIJ" style="
                    max-width: 100%;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                " onerror="this.style.display='none'" onload="this.style.display='block'">
            `;
            
            // Guardar URL para uso en PDF
            localStorage.setItem('rij_imagen_url', url);
        }
    }

    // Función auxiliar para verificar el estado actual
    function verificarEstadoRIJ() {
        const identificador = localStorage.getItem('usuario_identificador_rij');
        const imagenUrl = localStorage.getItem('rij_imagen_url');
        const contenedorRij = document.getElementById('contenedor-rij');
        const imagenContainer = document.getElementById('imagen-rij-container');
        
        return {
            identificador: identificador,
            imagenUrl: imagenUrl,
            contenedorRijExists: !!contenedorRij,
            imagenContainerExists: !!imagenContainer,
            contenedorVisible: contenedorRij ? contenedorRij.style.display !== 'none' : false
        };
    }

    // Inicializar - buscar RIJ generados (excluye usuario_demo)
    function inicializar() {
        // Esperar un momento para asegurar que todos los elementos estén listos
        setTimeout(() => {
            verificarYMostrarRIJ();
        }, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }

    // Escuchar cambios en localStorage para mostrar imágenes recién generadas
    window.addEventListener('storage', function(e) {
        if (e.key === 'rij_imagen_url' && e.newValue) {
            verificarYMostrarRIJ();
        }
    });

    // También escuchar eventos personalizados para cuando se genere una nueva imagen
    window.addEventListener('rij_imagen_generada', function(e) {
        if (e.detail && e.detail.url) {
            mostrarImagenEnContenedorExistente(e.detail.url, 'rij_generado');
        }
    });

    // Función manual para forzar la actualización
    function forzarActualizacionRIJ() {
        const imagenUrl = localStorage.getItem('rij_imagen_url');
        if (imagenUrl) {
            mostrarImagenEnContenedorExistente(imagenUrl, 'manual');
            return { estado: 'imagen_mostrada', url: imagenUrl };
        } else {
            return { estado: 'no_imagen_en_localstorage', localstorage: verificarEstadoRIJ() };
        }
    }

    // Exponer funciones globalmente para uso desde otros scripts
    window.mostrarImagenRIJEnContenedor = mostrarImagenEnContenedorExistente;
    window.verificarEstadoRIJ = verificarEstadoRIJ;
    window.forzarActualizacionRIJ = forzarActualizacionRIJ;
})();
