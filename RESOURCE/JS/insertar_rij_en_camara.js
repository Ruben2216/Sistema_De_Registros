// Este script inserta la imagen del formulario RIJ al principio de camara.html

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
                    mostrarImagenRIJ(ruta, identificador);
                    return;
                }
            } catch (e) {}
        }
    }

    function mostrarImagenRIJ(url, identificador) {
        // Buscar o crear contenedor
        let contenedor = document.getElementById('rij-container');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'rij-container';
            contenedor.style.cssText = `
                width: 100%;
                margin-bottom: 20px;
                padding: 15px;
                border: 2px solid #007bff;
                border-radius: 8px;
                background: #f8f9fa;
                text-align: center;
            `;

            // Insertar al principio
            const main = document.querySelector('.container') || document.body;
            if (main.firstChild) {
                main.insertBefore(contenedor, main.firstChild);
            } else {
                main.appendChild(contenedor);
            }
        }

        contenedor.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #007bff;">📋 Formulario RIJ Completado</h3>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">ID: ${identificador}</p>
            <img src="${url}" alt="Formulario RIJ" style="
                max-width: 100%;
                max-height: 300px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            " onerror="this.style.display='none'">
        `;
    }

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verificarYMostrarRIJ);
    } else {
        verificarYMostrarRIJ();
    }
})();
