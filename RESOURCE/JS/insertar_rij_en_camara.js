// Este script maneja la imagen RIJ mostrándola en el contenedor existente

(function() {
    function obtenerIdentificadorUsuario() {
        return localStorage.getItem('usuario_identificador_rij') || 'usuario_demo';
    }

    async function verificarYMostrarRIJ() {
        const identificador = obtenerIdentificadorUsuario();
        
        // Lista de posibles ubicaciones de imagen
        const posiblesRutas = [
            `/RESOURCE/IMG/img RIJ/${identificador}.png`,
            `/api/rij/obtener_imagen/${identificador}`
        ];

        for (const ruta of posiblesRutas) {
            try {
                const response = await fetch(ruta, { method: 'HEAD' });
                if (response.ok) {
                    mostrarImagenEnContenedorExistente(ruta, identificador);
                    return;
                }
            } catch (e) {}
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
                    max-height: 400px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                " onerror="this.style.display='none'">
            `;
            
            // Guardar URL para uso en PDF
            localStorage.setItem('rij_imagen_disponible', url);
        }
    }

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verificarYMostrarRIJ);
    } else {
        verificarYMostrarRIJ();
    }
})();
