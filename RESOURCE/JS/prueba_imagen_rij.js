// Script de prueba para generar imagen RIJ de demostración

(function() {
    
    // Función para crear imagen de prueba
    function crearImagenPrueba() {
        // Crear canvas con dimensiones de página A4
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        // Fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texto del formulario
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FORMULARIO RIJ', canvas.width / 2, 50);
        
        ctx.font = '16px Arial';
        ctx.fillText('Lista de Verificación de la Reunión de Inicio de Jornada', canvas.width / 2, 80);
        
        // Información de prueba
        ctx.textAlign = 'left';
        ctx.font = '14px Arial';
        const identificador = localStorage.getItem('usuario_identificador_rij') || 'demo_user';
        ctx.fillText(`ID: ${identificador}`, 50, 120);
        ctx.fillText(`Fecha: ${new Date().toLocaleDateString()}`, 50, 150);
        ctx.fillText('Departamento: Departamento de Prueba', 50, 180);
        ctx.fillText('Estado: Completado', 50, 210);
        
        // Borde
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Convertir a blob y enviar al servidor
        canvas.toBlob(function(blob) {
            const formData = new FormData();
            formData.append('imagen', blob, `${identificador}.png`);
            formData.append('identificador', identificador);
            
            fetch('/api/rij/guardar_imagen', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('rij_imagen_url', data.url);
                    localStorage.setItem('rij_pdf_procesado', 'true');
                    console.log('Imagen de prueba RIJ creada exitosamente');
                }
            })
            .catch(error => {
                console.error('Error al crear imagen de prueba:', error);
            });
        }, 'image/png');
    }
    
    // Exponer función globalmente para pruebas
    window.crearImagenPruebaRIJ = crearImagenPrueba;
    
})();
