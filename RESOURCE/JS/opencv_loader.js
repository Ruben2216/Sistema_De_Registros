
class OpenCVLoader {
    constructor() {
        this.intentosMaximos = 3;
        this.intentoActual = 0;
        this.tiempoEsperaBase = 2000; // 2 segundos
        this.tiempoEsperaMaximo = 10000; // 10 segundos
        this.fuentesOpenCV = [
            '/RESOURCE/opencv/opencv.js', // Fuente local principal
            'https://docs.opencv.org/4.8.0/opencv.js', // CDN oficial 1
            'https://cdn.jsdelivr.net/npm/opencv.js@1.2.1/opencv.js', // CDN oficial 2
            'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.1/opencv.js' // CDN alternativo
        ];
        this.fuenteActual = 0;
        this.cargaExitosa = false;
        this.callbacksExito = [];
        this.callbacksError = [];
        this.tiempoInicio = Date.now();
        this.modalProgreso = null;
        this.mensajeProgreso = null;
        
        this.inicializarModalProgreso();
        this.iniciarCarga();
    }

    /**
     * Crear modal de progreso visual para el usuario
     */
    inicializarModalProgreso() {
        // Verificar si ya existe
        if (document.getElementById('opencv-loader-modal')) {
            this.modalProgreso = document.getElementById('opencv-loader-modal');
            this.mensajeProgreso = document.getElementById('opencv-loader-message');
            return;
        }

        // Crear modal de progreso
        const modalHTML = `
            <div id="opencv-loader-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    max-width: 400px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #3498db;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <h3 style="margin: 0 0 15px 0; color: #333;">Cargando Sistema de Cámara</h3>
                    <p id="opencv-loader-message" style="margin: 0; color: #666;">Inicializando OpenCV.js...</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalProgreso = document.getElementById('opencv-loader-modal');
        this.mensajeProgreso = document.getElementById('opencv-loader-message');
    }

    /**
     * Actualizar mensaje de progreso
     */
    actualizarMensaje(mensaje) {
        if (this.mensajeProgreso) {
            this.mensajeProgreso.textContent = mensaje;
        }
        // Mensaje actualizado
    }

    /**
     * Ocultar modal de progreso
     */
    ocultarModal() {
        if (this.modalProgreso) {
            this.modalProgreso.style.display = 'none';
        }
    }

    /**
     * Iniciar el proceso de carga
     */
    iniciarCarga() {
        this.actualizarMensaje('Iniciando carga de OpenCV.js...');
        this.cargarDesdeProximaFuente();
    }

    /**
     * Cargar OpenCV.js desde la siguiente fuente disponible
     */
    cargarDesdeProximaFuente() {
        if (this.fuenteActual >= this.fuentesOpenCV.length) {
            this.reiniciarCicloFuentes();
            return;
        }

        const fuente = this.fuentesOpenCV[this.fuenteActual];
        const esFuenteLocal = fuente.startsWith('/');
        
        this.actualizarMensaje(
            `Cargando desde ${esFuenteLocal ? 'archivo local' : 'CDN'} (intento ${this.intentoActual + 1}/${this.intentosMaximos})...`
        );

        this.cargarScript(fuente)
            .then(() => {
                this.verificarCargaOpenCV();
            })
            .catch((error) => {
                // Error cargando desde fuente
                this.manejarErrorCarga();
            });
    }

    /**
     * Cargar script dinámicamente con timeout
     */
    cargarScript(url) {
        return new Promise((resolve, reject) => {
            // Limpiar scripts previos de OpenCV
            this.limpiarScriptsOpenCV();

            const script = document.createElement('script');
            script.src = url;
            script.async = true;

            // Timeout para evitar esperas infinitas
            const timeout = setTimeout(() => {
                script.remove();
                reject(new Error(`Timeout cargando ${url}`));
            }, this.tiempoEsperaMaximo);

            script.onload = () => {
                clearTimeout(timeout);
                resolve();
            };

            script.onerror = () => {
                clearTimeout(timeout);
                script.remove();
                reject(new Error(`Error cargando ${url}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Limpiar scripts previos de OpenCV para evitar conflictos
     */
    limpiarScriptsOpenCV() {
        const scriptsOpenCV = document.querySelectorAll('script[src*="opencv"]');
        scriptsOpenCV.forEach(script => {
            if (script.src.includes('opencv')) {
                script.remove();
            }
        });

        // Limpiar variables globales de OpenCV si existen
        if (window.cv && window.cv.Mat) {
            try {
                window.cv = undefined;
            } catch (e) {
                // Ignorar errores al limpiar
            }
        }
    }

    /**
     * Verificar si OpenCV.js se cargó correctamente
     */
    verificarCargaOpenCV() {
        const verificarDisponibilidad = () => {
            if (window.cv && window.cv.Mat && typeof window.cv.Mat === 'function') {
                // Verificación adicional: intentar crear una matriz simple
                try {
                    const testMat = new window.cv.Mat();
                    testMat.delete();
                    this.manejarCargaExitosa();
                    return true;
                } catch (e) {
                    // OpenCV no está completamente inicializado
                    return false;
                }
            }
            return false;
        };

        // Verificación inmediata
        if (verificarDisponibilidad()) {
            return;
        }

        // Verificación con polling durante 5 segundos
        let intentosVerificacion = 0;
        const maxIntentosVerificacion = 50; // 5 segundos con intervalos de 100ms
        
        const intervaloVerificacion = setInterval(() => {
            intentosVerificacion++;
            
            if (verificarDisponibilidad()) {
                clearInterval(intervaloVerificacion);
                return;
            }

            if (intentosVerificacion >= maxIntentosVerificacion) {
                clearInterval(intervaloVerificacion);
                // OpenCV no se inicializó completamente después de la verificación
                this.manejarErrorCarga();
            }
        }, 100);
    }

    /**
     * Manejar carga exitosa de OpenCV.js
     */
    manejarCargaExitosa() {
        this.cargaExitosa = true;
        const tiempoTotal = Date.now() - this.tiempoInicio;
        
        this.actualizarMensaje('¡OpenCV.js cargado exitosamente!');
        // OpenCV.js cargado exitosamente
        
        // Ocultar modal después de un breve momento
        setTimeout(() => {
            this.ocultarModal();
        }, 1000);

        // Ejecutar callbacks de éxito
        this.callbacksExito.forEach(callback => {
            try {
                callback();
            } catch (e) {
                // Error ejecutando callback de éxito
            }
        });

        // Cargar dependencias que requieren OpenCV
        this.cargarDependenciasOpenCV();
    }

    /**
     * Manejar error en la carga
     */
    manejarErrorCarga() {
        this.fuenteActual++;
        
        if (this.fuenteActual >= this.fuentesOpenCV.length) {
            this.reiniciarCicloFuentes();
        } else {
            // Esperar un poco antes del siguiente intento
            const tiempoEspera = Math.min(this.tiempoEsperaBase * Math.pow(2, this.intentoActual), this.tiempoEsperaMaximo);
            
            setTimeout(() => {
                this.cargarDesdeProximaFuente();
            }, tiempoEspera);
        }
    }

    /**
     * Reiniciar el ciclo de fuentes cuando se agotan
     */
    reiniciarCicloFuentes() {
        this.intentoActual++;
        
        if (this.intentoActual >= this.intentosMaximos) {
            this.manejarFalloCompleto();
            return;
        }

        // Reiniciar el ciclo de fuentes
        this.fuenteActual = 0;
        const tiempoEspera = this.tiempoEsperaBase * (this.intentoActual + 1);
        
        this.actualizarMensaje(`Reintentando carga... (intento ${this.intentoActual + 1}/${this.intentosMaximos})`);
        
        setTimeout(() => {
            this.cargarDesdeProximaFuente();
        }, tiempoEspera);
    }

    /**
     * Manejar fallo completo después de todos los intentos
     */
    manejarFalloCompleto() {
        const tiempoTotal = Date.now() - this.tiempoInicio;
        
        this.actualizarMensaje('Error: No se pudo cargar OpenCV.js. Algunas funciones pueden no estar disponibles.');
        // Fallo completo cargando OpenCV.js
        
        // Ocultar modal después de mostrar el error
        setTimeout(() => {
            this.ocultarModal();
        }, 3000);

        // Ejecutar callbacks de error
        this.callbacksError.forEach(callback => {
            try {
                callback();
            } catch (e) {
                // Error ejecutando callback de error
            }
        });

        // Habilitar funcionalidades básicas sin OpenCV
        this.habilitarModoBasico();
    }

    /**
     * Cargar dependencias que requieren OpenCV
     */
    cargarDependenciasOpenCV() {
        // Cargar pdf_fotos.js que depende de OpenCV
        if (typeof window.cargarPDFfotosJS === 'function') {
            window.cargarPDFfotosJS();
        } else {
            this.cargarScriptDependencia('/RESOURCE/JS/pdf_fotos.js');
        }

        // Habilitar botones que dependen de OpenCV
        const btnGenerarPDF = document.getElementById('btnGenerarPDF');
        if (btnGenerarPDF) {
            btnGenerarPDF.disabled = false;
            btnGenerarPDF.textContent = 'Generar PDF de fotos';
        }
    }

    /**
     * Cargar script dependiente
     */
    cargarScriptDependencia(src) {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        script.onerror = () => {
            // Error cargando dependencia
        };
        
        document.head.appendChild(script);
    }

    /**
     * Habilitar modo básico sin OpenCV (funcionalidades limitadas)
     */
    habilitarModoBasico() {
        const btnGenerarPDF = document.getElementById('btnGenerarPDF');
        if (btnGenerarPDF) {
            btnGenerarPDF.disabled = false;
            btnGenerarPDF.textContent = 'Generar PDF (modo básico)';
            btnGenerarPDF.title = 'Funcionalidad limitada: OpenCV.js no está disponible';
        }

        // Definir función básica de showMessage si no existe
        if (typeof window.showMessage !== 'function') {
            window.showMessage = function(message) {
                // Mostrar mensaje
                alert(message);
            };
        }

        // Modo básico activado
    }

    /**
     * Agregar callback para cuando OpenCV se cargue exitosamente
     */
    onSuccess(callback) {
        if (this.cargaExitosa) {
            callback();
        } else {
            this.callbacksExito.push(callback);
        }
    }

    /**
     * Agregar callback para cuando OpenCV falle al cargar
     */
    onError(callback) {
        this.callbacksError.push(callback);
    }

    /**
     * Verificar si OpenCV está disponible
     */
    static estaDisponible() {
        return window.cv && window.cv.Mat && typeof window.cv.Mat === 'function';
    }
}

// Instancia global del loader
window.opencvLoader = null;

// Función para inicializar el loader
function inicializarOpenCVLoader() {
    if (!window.opencvLoader) {
        window.opencvLoader = new OpenCVLoader();
    }
    return window.opencvLoader;
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarOpenCVLoader);
} else {
    inicializarOpenCVLoader();
}

// Función de compatibilidad para código existente
window.cargarPDFfotosJS = function() {
    const script = document.createElement('script');
    script.src = '/RESOURCE/JS/pdf_fotos.js';
    script.async = true;
    script.onload = function() {
        // pdf_fotos.js cargado exitosamente
    };
    script.onerror = function() {
        // Error cargando pdf_fotos.js
    };
    document.head.appendChild(script);
};

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenCVLoader;
}
