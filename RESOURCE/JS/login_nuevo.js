document.addEventListener('DOMContentLoaded', function() {
    // Configurar el formulario de login
    const formularioLogin = document.getElementById('formulario-login');
    const mensajeError = document.getElementById('mensaje-error');

    if (formularioLogin) {
        formularioLogin.addEventListener('submit', function(evento) {
            evento.preventDefault();
            
            const contrasena = document.getElementById('contrasena').value;
            
            if (!contrasena) {
                mostrarError('Por favor ingrese la contraseña');
                return;
            }
            
            // Enviar petición al servidor para validar la contraseña
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: contrasena
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.success) {
                    // Redireccionar al menú principal
                    window.location.href = '/TEMPLATES/menu.html';
                } else {
                    mostrarError(data.message || 'Contraseña incorrecta');
                }
            })
            .catch(function(error) {
                console.error('Error:', error);
                mostrarError('Error de conexión. Intente nuevamente.');
            });
        });
    }

    function mostrarError(mensaje) {
        if (mensajeError) {
            mensajeError.textContent = mensaje;
            mensajeError.style.display = 'block';
            
            // Ocultar el mensaje después de 5 segundos
            setTimeout(function() {
                mensajeError.style.display = 'none';
            }, 5000);
        }
    }
});
