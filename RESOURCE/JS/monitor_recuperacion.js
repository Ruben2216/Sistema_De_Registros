
class MonitorRecuperacion {
    constructor() {
        this.tiempoInicio = Date.now();
        this.tiempoMaximoEspera = 45000; // 45 segundos
        this.verificacionesRealizadas = 0;
        this.sistemaRecuperado = false;
        this.intentosRecuperacion = 0;
        this.maxIntentosRecuperacion = 2;
        
        this.iniciarMonitoreo();
    }

    iniciarMonitoreo() {
        console.log('[Monitor] Iniciando monitoreo del sistema');
        
        // Verificación cada 5 segundos
        this.intervaloMonitoreo = setInterval(() => {
            this.verificarEstadoSistema();
        }, 5000);

        // Timeout de emergencia
        this.timeoutEmergencia = setTimeout(() => {
            this.activarRecuperacionEmergencia();
        }, this.tiempoMaximoEspera);
    }

    verificarEstadoSistema() {
        this.verificacionesRealizadas++;
        const tiempoTranscurrido = Date.now() - this.tiempoInicio;
        
        console.log(`[Monitor] Verificación ${this.verificacionesRealizadas} - Tiempo: ${Math.round(tiempoTranscurrido/1000)}s`);

        // Verificar si OpenCV está disponible
        if (this.verificarOpenCVDisponible()) {
            this.sistemaListo();
            return;
        }

        // Verificar si el loader está funcionando
        if (window.opencvLoader && window.opencvLoader.cargaExitosa) {
            this.sistemaListo();
            return;
        }

        // Si han pasado más de 20 segundos, intentar recuperación suave
        if (tiempoTranscurrido > 20000 && this.intentosRecuperacion === 0) {
            this.intentarRecuperacionSuave();
        }

        // Si han pasado más de 35 segundos, intentar recuperación agresiva
        if (tiempoTranscurrido > 35000 && this.intentosRecuperacion === 1) {
            this.intentarRecuperacionAgresiva();
        }
    }

    verificarOpenCVDisponible() {
        return window.cv && window.cv.Mat && typeof window.cv.Mat === 'function';
    }

    sistemaListo() {
        if (!this.sistemaRecuperado) {
            this.sistemaRecuperado = true;
            const tiempoTotal = Date.now() - this.tiempoInicio;
            
            console.log(`[Monitor] ✅ Sistema listo en ${Math.round(tiempoTotal/1000)}s`);
            
            if (window.mostrarExito) {
                window.mostrarExito('Sistema de cámara listo para usar');
            }
            
            this.limpiarMonitoreo();
        }
    }

    intentarRecuperacionSuave() {
        this.intentosRecuperacion++;
        console.log('[Monitor] 🔄 Intentando recuperación suave...');
        
        if (window.mostrarAdvertencia) {
            window.mostrarAdvertencia('Optimizando carga del sistema...');
        }

        // Intentar reinicializar el loader si existe
        if (window.opencvLoader && typeof window.opencvLoader.reiniciarCarga === 'function') {
            window.opencvLoader.reiniciarCarga();
        } else {
            // Crear un nuevo loader
            this.crearNuevoLoader();
        }
    }

    intentarRecuperacionAgresiva() {
        this.intentosRecuperacion++;
        console.log('[Monitor] ⚡ Intentando recuperación agresiva...');
        
        if (window.mostrarAdvertencia) {
            window.mostrarAdvertencia('Aplicando correcciones del sistema...');
        }

        // Limpiar todo y empezar de nuevo
        this.limpiarScriptsOpenCV();
        this.cargarOpenCVDirecto();
    }

    crearNuevoLoader() {
        try {
            if (window.OpenCVLoader) {
                window.opencvLoader = new window.OpenCVLoader();
            } else {
                this.cargarLoaderScript();
            }
        } catch (error) {
            console.error('[Monitor] Error creando nuevo loader:', error);
            this.cargarOpenCVDirecto();
        }
    }

    cargarLoaderScript() {
        const script = document.createElement('script');
        script.src = '/RESOURCE/JS/opencv_loader.js';
        script.onload = () => {
            console.log('[Monitor] Loader script recargado');
            if (window.OpenCVLoader) {
                window.opencvLoader = new window.OpenCVLoader();
            }
        };
        script.onerror = () => {
            console.warn('[Monitor] Error recargando loader, usando método directo');
            this.cargarOpenCVDirecto();
        };
        document.head.appendChild(script);
    }

    limpiarScriptsOpenCV() {
        // Remover scripts existentes
        const scripts = document.querySelectorAll('script[src*="opencv"]');
        scripts.forEach(script => script.remove());
        
        // Limpiar variables globales
        if (window.cv) {
            try {
                delete window.cv;
            } catch (e) {
                window.cv = undefined;
            }
        }
        
        if (window.opencvLoader) {
            try {
                if (window.opencvLoader.limpiarMonitoreo) {
                    window.opencvLoader.limpiarMonitoreo();
                }
            } catch (e) {
                // Ignorar errores
            }
            window.opencvLoader = null;
        }
    }

    cargarOpenCVDirecto() {
        console.log('[Monitor] Cargando OpenCV directamente...');
        
        const fuentes = [
            'https://docs.opencv.org/4.8.0/opencv.js',
            'https://cdn.jsdelivr.net/npm/opencv.js@1.2.1/opencv.js',
            '/RESOURCE/opencv/opencv.js'
        ];

        this.cargarDesdeFuentes(fuentes, 0);
    }

    cargarDesdeFuentes(fuentes, indice) {
        if (indice >= fuentes.length) {
            this.activarModoBasico();
            return;
        }

        const fuente = fuentes[indice];
        const script = document.createElement('script');
        script.src = fuente;
        
        const timeout = setTimeout(() => {
            script.remove();
            this.cargarDesdeFuentes(fuentes, indice + 1);
        }, 10000);

        script.onload = () => {
            clearTimeout(timeout);
            console.log(`[Monitor] OpenCV cargado desde: ${fuente}`);
            
            // Configurar callback de inicialización
            if (window.cv) {
                if (typeof window.cv.onRuntimeInitialized !== 'undefined') {
                    window.cv.onRuntimeInitialized = () => {
                        this.sistemaListo();
                        this.activarFuncionalidadCompleta();
                    };
                } else {
                    // OpenCV ya está listo
                    this.sistemaListo();
                    this.activarFuncionalidadCompleta();
                }
            }
        };

        script.onerror = () => {
            clearTimeout(timeout);
            script.remove();
            this.cargarDesdeFuentes(fuentes, indice + 1);
        };

        document.head.appendChild(script);
    }

    activarFuncionalidadCompleta() {
        // Cargar dependencias de OpenCV
        const script = document.createElement('script');
        script.src = '/RESOURCE/JS/pdf_fotos.js';
        script.onload = () => {
            console.log('[Monitor] Dependencias de OpenCV cargadas');
            
            // Habilitar botones
            const btnGenerarPDF = document.getElementById('btnGenerarPDF');
            if (btnGenerarPDF) {
                btnGenerarPDF.disabled = false;
                btnGenerarPDF.textContent = 'Generar PDF de fotos';
            }

            const btnEnviarCorreo = document.getElementById('btnEnviarCorreo');
            if (btnEnviarCorreo) {
                btnEnviarCorreo.disabled = false;
            }
        };
        document.head.appendChild(script);
    }

    activarRecuperacionEmergencia() {
        console.warn('[Monitor] ⚠️ Activando recuperación de emergencia');
        
        if (window.mostrarError) {
            window.mostrarError('El sistema tardó más de lo esperado en cargar. Activando modo de recuperación...');
        }

        this.activarModoBasico();
    }

    activarModoBasico() {
        console.log('[Monitor] 🛟 Activando modo básico');
        
        // Ocultar todos los modales de carga
        if (window.ocultarModalProgreso) {
            window.ocultarModalProgreso();
        }

        // Habilitar funcionalidades básicas
        const btnGenerarPDF = document.getElementById('btnGenerarPDF');
        if (btnGenerarPDF) {
            btnGenerarPDF.disabled = false;
            btnGenerarPDF.textContent = 'Generar PDF (modo básico)';
            btnGenerarPDF.title = 'Modo básico: algunas funciones de procesamiento no están disponibles';
        }

        // Mostrar mensaje al usuario
        if (window.mostrarAdvertencia) {
            window.mostrarAdvertencia('Sistema activado en modo básico. Funcionalidad limitada disponible.');
        }

        // Definir función básica de showMessage si no existe
        if (typeof window.showMessage !== 'function') {
            window.showMessage = function(mensaje) {
                console.log('Mensaje:', mensaje);
                if (window.sistemaNotificaciones) {
                    window.sistemaNotificaciones.mostrarNotificacion(mensaje, 'info');
                } else {
                    alert(mensaje);
                }
            };
        }

        this.limpiarMonitoreo();
    }

    limpiarMonitoreo() {
        if (this.intervaloMonitoreo) {
            clearInterval(this.intervaloMonitoreo);
            this.intervaloMonitoreo = null;
        }
        
        if (this.timeoutEmergencia) {
            clearTimeout(this.timeoutEmergencia);
            this.timeoutEmergencia = null;
        }
        
        console.log('[Monitor] Monitoreo finalizado');
    }
}

// Inicializar monitor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para que otros scripts se inicialicen
    setTimeout(() => {
        if (!window.monitorRecuperacion) {
            window.monitorRecuperacion = new MonitorRecuperacion();
        }
    }, 1000);
});

// Limpiar monitor al salir de la página
window.addEventListener('beforeunload', function() {
    if (window.monitorRecuperacion) {
        window.monitorRecuperacion.limpiarMonitoreo();
    }
});
