document.addEventListener('DOMContentLoaded', function() {
    // Configurar el formulario de login
    const formularioLogin = document.getElementById('formulario-login');
    const mensajeError = document.getElementById('mensaje-error');
    const inputContrasena = document.getElementById('contrasena');
    const checkboxMostrarContrasena = document.getElementById('mostrar-contrasena');

    // Verificar si ya hay una sesión activa
    verificarSesionExistente();

    // Configurar funcionalidad para mostrar/ocultar contraseña
    if (checkboxMostrarContrasena && inputContrasena) {
        checkboxMostrarContrasena.addEventListener('change', function() {
            if (this.checked) {
                // Mostrar contraseña: cambiar tipo a 'text'
                inputContrasena.type = 'text';
            } else {
                // Ocultar contraseña: cambiar tipo a 'password'
                inputContrasena.type = 'password';
            }
        });
    }

    if (formularioLogin) {
        formularioLogin.addEventListener('submit', function(evento) {
            evento.preventDefault();
            
            const contrasena = document.getElementById('contrasena').value;
            
            if (!contrasena) {
                mostrarError('Por favor ingrese la contraseña');
                return;
            }
            
            // Deshabilitar el formulario durante el login
            const botonSubmit = formularioLogin.querySelector('button[type="submit"]');
            const textoOriginal = botonSubmit.textContent;
            botonSubmit.disabled = true;
            botonSubmit.textContent = 'Verificando...';
            
            // Enviar petición al servidor para validar la contraseña
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: contrasena
                }),
                credentials: 'include'
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.success) {
                    // Mostrar mensaje de éxito
                    mostrarExito(`Acceso autorizado. Sesión válida por ${data.tiempo_sesion_minutos} minutos.`);
                    
                    // Redirigir al menú principal después de 1 segundo
                    setTimeout(function() {
                        window.location.href = '/TEMPLATES/menu.html';
                    }, 1000);
                } else {
                    mostrarError(data.message || 'Contraseña incorrecta');
                    // Rehabilitar el formulario
                    botonSubmit.disabled = false;
                    botonSubmit.textContent = textoOriginal;
                }
            })
            .catch(function(error) {
                console.error('Error:', error);
                mostrarError('Error de conexión. Intente nuevamente.');
                // Rehabilitar el formulario
                botonSubmit.disabled = false;
                botonSubmit.textContent = textoOriginal;
            });
        });
    }

    function verificarSesionExistente() {
        // Verificar si ya hay una sesión activa
        fetch('/api/verificar_sesion', {
            method: 'GET',
            credentials: 'include'
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success && data.autenticado) {
                // Ya hay una sesión activa, redirigir al menú
                console.log('Sesión existente encontrada, redirigiendo...');
                window.location.href = '/TEMPLATES/menu.html';
            }
        })
        .catch(function(error) {
            // Si hay error, continuar normalmente con el login
            console.log('No hay sesión previa o error al verificar');
        });
    }

    function mostrarError(mensaje) {
        if (mensajeError) {
            mensajeError.textContent = mensaje;
            mensajeError.style.display = 'block';
            mensajeError.style.backgroundColor = '#f8d7da';
            mensajeError.style.color = '#721c24';
            mensajeError.style.border = '1px solid #f5c6cb';
            
            // Ocultar el mensaje después de 5 segundos
            setTimeout(function() {
                mensajeError.style.display = 'none';
            }, 5000);
        }
    }

    function mostrarExito(mensaje) {
        if (mensajeError) {
            mensajeError.textContent = mensaje;
            mensajeError.style.display = 'block';
            mensajeError.style.backgroundColor = '#d4edda';
            mensajeError.style.color = '#155724';
            mensajeError.style.border = '1px solid #c3e6cb';
        }
    }
});
