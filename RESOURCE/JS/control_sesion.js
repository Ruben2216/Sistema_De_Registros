

(function() {
    'use strict';

    // Configuración
    const CONFIG = {
        TIEMPO_SESION_MINUTOS: 30,
        TIEMPO_ADVERTENCIA_MINUTOS: 25,
        INTERVALO_VERIFICACION_MS: 60000, 
        URL_VERIFICAR_SESION: '/api/verificar_sesion',
        URL_LOGOUT: '/api/logout',
        URL_LOGIN: '/TEMPLATES/login.html'
    };

    // Variables de estado
    let intervalVerificacion = null;
    let advertenciaMostrada = false;
    let modalAdvertencia = null;

    /**
     * Inicia el sistema de control de sesión
     */
    function iniciarControlSesion() {

        
        // Crear modal de advertencia
        crearModalAdvertencia();
        
        // Verificar sesión inmediatamente
        verificarSesion();
        
        // Programar verificaciones periódicas
        intervalVerificacion = setInterval(verificarSesion, CONFIG.INTERVALO_VERIFICACION_MS);
        
        // Limpiar al salir de la página
        window.addEventListener('beforeunload', function() {
            if (intervalVerificacion) {
                clearInterval(intervalVerificacion);
            }
        });
    }

    /**
     * Verifica el estado de la sesión con el servidor
     */
    function verificarSesion() {
        fetch(CONFIG.URL_VERIFICAR_SESION, {
            method: 'GET',
            credentials: 'include'
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success && data.autenticado) {
                console.log(` Sesión activa - Tiempo restante: ${data.tiempo_restante_minutos} minutos`);
                
                // Mostrar advertencia si es necesario
                if (data.debe_mostrar_advertencia && !advertenciaMostrada) {
                    mostrarAdvertenciaCierre();
                }
                
                // Si el tiempo se agotó, cerrar sesión
                if (data.tiempo_restante_minutos <= 0) {
                    cerrarSesionYRedirigir('Su sesión ha expirado');
                }
            } else {
                // Sesión no válida o expirada
                console.log('Sesión expirada o no válida');
                cerrarSesionYRedirigir('Su sesión ha expirado');
            }
        })
        .catch(function(error) {
            console.error('Error al verificar sesión:', error);
            // En caso de error de red, no hacer nada para evitar redirigir por problemas de conectividad
        });
    }

    /**
     * Crea el modal de advertencia
     */
    function crearModalAdvertencia() {
        // Crear HTML del modal
        const modalHTML = `
            <div id="modal-advertencia-sesion" style="
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    max-width: 400px;
                    text-align: center;
                ">
                    <div style="
                        color: #ff6b35;
                        font-size: 48px;
                        margin-bottom: 20px;
                    ">⚠️</div>
                    
                    <h2 style="
                        color: #333;
                        margin: 0 0 15px 0;
                        font-size: 22px;
                    ">Advertencia de Sesión</h2>
                    
                    <p style="
                        color: #666;
                        margin: 0 0 25px 0;
                        line-height: 1.5;
                        font-size: 16px;
                    ">Su sesión se cerrará automáticamente en 5 minutos. 
                    Cualquier trabajo no guardado se perderá.</p>
                    
                    <button id="btn-entendido-sesion" style="
                        background-color: #00724e;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">Entendido</button>
                    
                    <button id="btn-cerrar-sesion-ahora" style="
                        background-color: #dc3545;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    ">Cerrar Sesión Ahora</button>
                </div>
            </div>
        `;
        
        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalAdvertencia = document.getElementById('modal-advertencia-sesion');
        
        // Configurar eventos
        document.getElementById('btn-entendido-sesion').addEventListener('click', function() {
            ocultarAdvertencia();
        });
        
        document.getElementById('btn-cerrar-sesion-ahora').addEventListener('click', function() {
            cerrarSesionManual();
        });
    }

    /**
     * Muestra la advertencia de cierre de sesión
     */
    function mostrarAdvertenciaCierre() {
        if (advertenciaMostrada) return;
        
        
        advertenciaMostrada = true;
        
        if (modalAdvertencia) {
            modalAdvertencia.style.display = 'block';
        }
    }

    /**
     * Oculta la advertencia
     */
    function ocultarAdvertencia() {
        if (modalAdvertencia) {
            modalAdvertencia.style.display = 'none';
        }
    }

    /**
     * Cierra la sesión manualmente
     */
    function cerrarSesionManual() {
        console.log(' Cerrando sesión manualmente...');
        
        fetch(CONFIG.URL_LOGOUT, {
            method: 'POST',
            credentials: 'include'
        })
        .then(function() {
            window.location.href = CONFIG.URL_LOGIN;
        })
        .catch(function(error) {
            console.error('Error al cerrar sesión:', error);
            // Redirigir de todos modos
            window.location.href = CONFIG.URL_LOGIN;
        });
    }

    /**
     * Cierra la sesión y redirige al login
     */
    function cerrarSesionYRedirigir(mensaje) {
        console.log(' Cerrando sesión automáticamente:', mensaje);
        
        // Limpiar intervalos
        if (intervalVerificacion) {
            clearInterval(intervalVerificacion);
        }
        
        // Cerrar sesión en el servidor
        fetch(CONFIG.URL_LOGOUT, {
            method: 'POST',
            credentials: 'include'
        })
        .finally(function() {
            // Redirigir al login
            window.location.href = CONFIG.URL_LOGIN;
        });
    }

    /**
     * Función pública para verificar si la sesión está activa
     */
    function esSesionActiva() {
        return fetch(CONFIG.URL_VERIFICAR_SESION, {
            method: 'GET',
            credentials: 'include'
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            return data.success && data.autenticado;
        })
        .catch(function() {
            return false;
        });
    }

    // Exponer funciones públicas
    window.ControlSesion = {
        iniciar: iniciarControlSesion,
        verificar: verificarSesion,
        esSesionActiva: esSesionActiva,
        cerrarSesion: cerrarSesionManual
    };

    // Inicializar automáticamente cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarControlSesion);
    } else {
        iniciarControlSesion();
    }

})();
