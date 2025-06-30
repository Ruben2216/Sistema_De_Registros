// Script para forzar la visualización de la imagen RIJ
// Este es para testing y debugging

(function() {
    console.log('🔍 Script de testing RIJ iniciado');
    
    // Función para verificar la existencia de imagen con múltiples identificadores
    async function verificarImagenRIJ() {
        const identificadores = [
            localStorage.getItem('usuario_identificador_rij'),
            'usuario_demo',
            'RIJ_1751290000000_abcd123',
            'test_endpoint_12345'
        ];
        
        console.log('🔍 Buscando imágenes RIJ con identificadores:', identificadores);
        
        for (const id of identificadores) {
            if (!id) continue;
            
            const url = `/RESOURCE/IMG/img RIJ/${id}.png`;
            
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`✅ Imagen encontrada: ${url}`);
                    mostrarImagenRIJ(url, id);
                    return true;
                }
            } catch (error) {
                console.log(`❌ Error verificando ${url}:`, error);
            }
        }
        
        console.log('❌ No se encontró ninguna imagen RIJ');
        return false;
    }
    
    // Función para mostrar la imagen RIJ
    function mostrarImagenRIJ(url, identificador) {
        // Buscar contenedor existente o crear uno nuevo
        let contenedorRIJ = document.getElementById('imagen-rij-container');
        
        if (!contenedorRIJ) {
            contenedorRIJ = document.createElement('div');
            contenedorRIJ.id = 'imagen-rij-container';
            contenedorRIJ.style.cssText = `
                width: 100%;
                margin-bottom: 20px;
                padding: 10px;
                border: 2px solid #007bff;
                border-radius: 5px;
                background-color: #f8f9fa;
            `;
            
            // Insertar al principio del contenedor principal
            const contenedor = document.querySelector('.container') || document.body;
            if (contenedor.firstChild) {
                contenedor.insertBefore(contenedorRIJ, contenedor.firstChild);
            } else {
                contenedor.appendChild(contenedorRIJ);
            }
        }
        
        contenedorRIJ.innerHTML = `
            <div style="text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #007bff;">📋 Formulario RIJ</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">ID: ${identificador}</p>
                <img src="${url}" alt="Formulario RIJ" style="
                    max-width: 100%;
                    max-height: 400px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                " onload="console.log('✅ Imagen RIJ cargada exitosamente')" 
                   onerror="console.log('❌ Error cargando imagen RIJ')">
            </div>
        `;
        
        console.log('🖼️ Imagen RIJ mostrada:', url);
    }
    
    // Función para inicializar cuando el DOM esté listo
    function inicializar() {
        console.log('🚀 Inicializando verificación de imagen RIJ');
        verificarImagenRIJ();
        
        // También listar todas las imágenes disponibles para debugging
        fetch('/api/rij/imagenes_disponibles')
            .then(response => response.json())
            .then(data => {
                if (data.imagenes && data.imagenes.length > 0) {
                    console.log('📁 Imágenes RIJ disponibles:', data.imagenes);
                } else {
                    console.log('📂 No hay imágenes RIJ disponibles');
                }
            })
            .catch(error => console.log('❌ Error obteniendo lista de imágenes:', error));
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
    
})();
