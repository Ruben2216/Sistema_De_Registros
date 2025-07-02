// Función de utilidad para mostrar mensajes
function showMessage(message) {
    if (typeof alert !== 'undefined') {
        alert(message);
    } else {
        console.log(message);
    }
}

class CircularProgressPDF {
    constructor() {
        this.modal = null;
        this.anilloProgreso = null;
        this.textoProgreso = null;
        this.circunferencia = 0;
        this.esVisible = false;
        this.progresoActual = 0;
        this.progresoObjetivo = 0;
        this.cuadroAnimacion = null;
        this.estaCompletando = false;
        this.intervaloSimulacion = null;
        this.estaSimulando = false;
        this.progresoInicioSimulacion = 0;
        this.progresoObjetivoSimulacion = 0;
        this.tiempoInicioSimulacion = 0;
        this.duracionSimulacion = 0;
        // Nuevo sistema de progreso continuo
        this.progresoObjetivoGlobal = 0;
        this.esModoContinuo = false;
        this.intervaloContinuo = null;
        this.incrementoProgreso = 0.1; // Incremento mínimo por actualización
        this.inicializarModal();
    }    /**
     * Inicializa el modal de progreso circular
     */
    inicializarModal() {
        // Crear el modal si no existe
        if (!document.getElementById('pdfProgressModal')) {
            this.crearHTMLModal();
        }
        
        this.modal = document.getElementById('pdfProgressModal');
        this.anilloProgreso = document.querySelector('.progress-ring__progress');
        this.textoProgreso = document.querySelector('.progress-text');
        
        // Calcular la circunferencia del círculo
        const radio = this.anilloProgreso.r.baseVal.value;
        this.circunferencia = 2 * Math.PI * radio;
        
        // Configurar el círculo inicial
        this.anilloProgreso.style.strokeDasharray = this.circunferencia;
        this.anilloProgreso.style.strokeDashoffset = this.circunferencia;
    }    /**
     * Crea el HTML del modal de progreso
     */
    crearHTMLModal() {
        const htmlModal = `
            <div id="pdfProgressModal" class="pdf-progress-modal">
                <div class="pdf-progress-container">
                    <div class="pdf-progress-title">Generando PDF</div>
                    
                    <div class="circular-progress">
                        <svg class="progress-ring" viewBox="0 0 150 150">
                            <!-- Círculo de fondo -->
                            <circle class="progress-ring__circle progress-ring__background"
                                    cx="75" cy="75" r="65" />
                            <!-- Círculo de progreso -->
                            <circle class="progress-ring__circle progress-ring__progress"
                                    cx="75" cy="75" r="65" />
                        </svg>
                        
                        <!-- Texto del porcentaje -->
                        <div class="progress-text">0%</div>
                    </div>
                    
                    <div class="pdf-progress-subtitle">Procesando imágenes, por favor espera...</div>
                </div>
            </div>
        `;
        
        // Insertar el modal al final del body
        document.body.insertAdjacentHTML('beforeend', htmlModal);
    }    /**
     * Muestra el modal de progreso
     */
    mostrar() {
        if (this.modal) {
            this.modal.classList.add('show');
            this.esVisible = true;
            this.progresoActual = 0;
            this.progresoObjetivo = 0;
            this.estaCompletando = false;
            
            // Reiniciar el estado del modal
            this.esModoContinuo = false;
            this.detenerProgresoContinuo();
            this.detenerSimulacion();
            
            // Restaurar el mensaje inicial del subtítulo
            const subtitulo = document.querySelector('.pdf-progress-subtitle');
            if (subtitulo) {
                subtitulo.textContent = 'Procesando imágenes, por favor espera...';
            }
            
            // Remover la clase de completado del anillo si existe
            if (this.anilloProgreso) {
                this.anilloProgreso.classList.remove('complete');
            }
            
            this.actualizarProgresoInstantaneo(0); // Comenzar en 0%
        }
    }    
    ocultar() {
        if (this.modal) {
            this.modal.classList.remove('show');
            this.esVisible = false;
            this.estaCompletando = false;
            this.detenerSimulacion(); // Detener simulaciones
            this.detenerProgresoContinuo(); // Detener progreso continuo
            // Remover la clase de completado si existe
            if (this.anilloProgreso) {
                this.anilloProgreso.classList.remove('complete');
            }
            // Cancelar animación si está corriendo
            if (this.cuadroAnimacion) {
                cancelAnimationFrame(this.cuadroAnimacion);
                this.cuadroAnimacion = null;
            }
        }
    }/**
     * Actualiza el progreso del círculo instantáneamente (sin animación)
     * @param {number} porcentaje - Porcentaje de progreso (0-100)
     */
    actualizarProgresoInstantaneo(porcentaje) {
        if (!this.esVisible) return;

        // Asegurar que el porcentaje esté entre 0 y 100
        porcentaje = Math.max(0, Math.min(100, porcentaje));
        
        // Calcular el offset para el círculo
        const desplazamiento = this.circunferencia - (porcentaje / 100) * this.circunferencia;
        
        // Actualizar el círculo de progreso
        this.anilloProgreso.style.strokeDashoffset = desplazamiento;
        
        // Actualizar el texto del porcentaje
        this.textoProgreso.textContent = Math.round(porcentaje) + '%';
        
        // Agregar efecto especial cuando llegue al 100%
        if (porcentaje >= 100) {
            this.anilloProgreso.classList.add('complete');
        }
    }    /**
     * Actualiza el progreso del círculo de forma directa (sin conflictos de animación)
     * @param {number} porcentaje - Porcentaje de progreso (0-100)
     */
    actualizarProgreso(porcentaje) {
        if (!this.esVisible) return;

        // Asegurar que el porcentaje esté entre 0 y 100
        porcentaje = Math.max(0, Math.min(100, porcentaje));
        
        // EVITAR OSCILACIÓN: Solo actualizar si hay un cambio significativo
        const diferencia = Math.abs(porcentaje - this.progresoActual);
        if (diferencia < 0.5) {
            return; // Ignorar cambios menores que pueden causar oscilación
        }
        
        // Detener cualquier animación en curso para evitar conflictos
        if (this.cuadroAnimacion) {
            cancelAnimationFrame(this.cuadroAnimacion);
            this.cuadroAnimacion = null;
        }
        
        // Actualizar directamente sin animación suave
        this.progresoActual = porcentaje;
        this.progresoObjetivo = porcentaje;
        this.actualizarProgresoInstantaneo(porcentaje);
    }

    /**
     * Anima el progreso de forma suave hacia el objetivo
     */
    animarProgreso() {
        if (!this.esVisible) {
            this.cuadroAnimacion = null;
            return;
        }

        // Calcular la diferencia
        const diferencia = this.progresoObjetivo - this.progresoActual;
        
        if (Math.abs(diferencia) < 0.1) {
            // Muy cerca del objetivo, establecer directamente
            this.progresoActual = this.progresoObjetivo;
            this.actualizarProgresoInstantaneo(this.progresoActual);
            this.cuadroAnimacion = null;
            return;
        }

        // Mover hacia el objetivo (velocidad adaptativa)
        const velocidad = Math.max(0.5, Math.abs(diferencia) * 0.1);
        if (diferencia > 0) {
            this.progresoActual += velocidad;
            if (this.progresoActual > this.progresoObjetivo) {
                this.progresoActual = this.progresoObjetivo;
            }
        } else {
            this.progresoActual -= velocidad;
            if (this.progresoActual < this.progresoObjetivo) {
                this.progresoActual = this.progresoObjetivo;
            }
        }

        // Actualizar visualmente
        this.actualizarProgresoInstantaneo(this.progresoActual);

        // Continuar animación
        this.cuadroAnimacion = requestAnimationFrame(() => this.animarProgreso());
    }    /**
     * Simula el progreso basado en el número de imágenes a procesar
     * @param {number} imagenActual - Imagen actual procesada (0-based, índice de la imagen completada)
     * @param {number} totalImagenes - Número total de imágenes
     */
    actualizarProgresoDesdeImagenes(imagenActual, totalImagenes) {
        if (totalImagenes === 0) return;
        
        // Calcular porcentaje: 85% para procesamiento de imágenes, 15% para generación final
        // imagenActual representa las imágenes ya procesadas (completadas)
        const progresoImagenes = ((imagenActual + 1) / totalImagenes) * 85;
        this.actualizarProgreso(progresoImagenes);
    }    /**
     * Marca el progreso como completado con animación final
     * @deprecated Usar el flujo automático iniciado por iniciarFaseFinal()
     */
    completar() {
        // Si no se está ejecutando ya el flujo automático, forzar completado
        if (!this.estaSimulando) {
            this.actualizarProgreso(100);
            setTimeout(() => {
                this.ocultar();
            }, 1500);
        }
        // Si ya está simulando, dejar que el flujo automático continúe
    }/**
     * Establece el progreso en la fase final de generación del PDF
     * @deprecated Usar iniciarFaseFinal() para progreso más fluido
     */
    establecerFaseFinal() {
        const progresoActual = this.obtenerProgresoActual();
        this.iniciarFaseFinal(progresoActual);
    }

    /**
     * Actualiza el progreso durante la fase de guardado
     * @deprecated Integrado en el flujo automático de fases
     */
    establecerFaseGuardado() {
        // Este método ahora es manejado automáticamente por iniciarFaseFinal()
        console.log('establecerFaseGuardado() está deprecated - el progreso es automático');
    }

    /**
     * Obtiene el progreso actual
     * @returns {number} Progreso actual
     */
    obtenerProgresoActual() {
        return this.progresoActual;
    }/**
     * Reinicia el sistema de progreso para una nueva operación
     */
    reiniciar() {
        this.progresoActual = 0;
        this.progresoObjetivo = 0;
        this.progresoObjetivoGlobal = 0;
        this.estaCompletando = false;
        this.detenerSimulacion(); // Detener simulaciones
        this.detenerProgresoContinuo(); // Detener progreso continuo
        if (this.cuadroAnimacion) {
            cancelAnimationFrame(this.cuadroAnimacion);
            this.cuadroAnimacion = null;
        }
        if (this.anilloProgreso) {
            this.anilloProgreso.classList.remove('complete');
        }
        // Restaurar subtítulo original
        const subtitulo = document.querySelector('.pdf-progress-subtitle');
        if (subtitulo) {
            subtitulo.textContent = 'Procesando imágenes, por favor espera...';
        }
    }

    /**
     * Maneja errores ocultando el modal y limpiando el estado
     */
    manejarError() {
        this.ocultar();
        this.reiniciar();
    }    /**
     * Comienza el progreso simple (sin sistema continuo para evitar oscilación)
     */
    iniciarProgreso() {
        // DESHABILITADO: No usar sistema continuo para evitar oscilación
        console.log('🔄 Iniciando progreso simple (sin modo continuo)');
        
        // Establecer progreso inicial directamente
        this.actualizarProgreso(1);
        
        /* CÓDIGO ORIGINAL COMENTADO para evitar oscilación:
        this.iniciarProgresoContinuo(); // Iniciar el sistema continuo
        */
    }    /**
     * Inicia una simulación de progreso gradual entre dos puntos
     * @param {number} progresoInicial - Progreso inicial
     * @param {number} progresoFinal - Progreso objetivo
     * @param {number} duracionMs - Duración estimada en milisegundos
     */
    simularProgresoEntre(progresoInicial, progresoFinal, duracionMs = 2000) {
        // Detener cualquier simulación anterior
        this.detenerSimulacion();
        
        this.estaSimulando = true;
        this.progresoInicioSimulacion = progresoInicial;
        this.progresoObjetivoSimulacion = progresoFinal;
        this.tiempoInicioSimulacion = Date.now();
        this.duracionSimulacion = duracionMs;
        
        // Comenzar la simulación
        this.ejecutarSimulacion();
    }    /**
     * Ejecuta la simulación de progreso
     */
    ejecutarSimulacion() {
        if (!this.estaSimulando || !this.esVisible) return;

        const tiempoActual = Date.now();
        const tiempoTranscurrido = tiempoActual - this.tiempoInicioSimulacion;
        const progreso = Math.min(tiempoTranscurrido / this.duracionSimulacion, 1);

        // Usar una función de easing para un movimiento más natural
        const progresoSuave = this.easingEntradaSalida(progreso);
        
        const progresoSimuladoActual = this.progresoInicioSimulacion + 
            (this.progresoObjetivoSimulacion - this.progresoInicioSimulacion) * progresoSuave;

        this.actualizarProgreso(progresoSimuladoActual);

        // Continuar la simulación si no hemos llegado al final
        if (progreso < 1 && this.estaSimulando) {
            this.intervaloSimulacion = setTimeout(() => this.ejecutarSimulacion(), 16); // ~60fps para mayor fluidez
        }
    }    /**
     * Función de easing para un movimiento más natural
     * @param {number} t - Tiempo normalizado (0-1)
     * @returns {number} - Valor con easing aplicado
     */
    easingEntradaSalida(t) {
        // Mejorado para transiciones más suaves
        if (t < 0.2) {
            // Inicio muy gradual
            return 0.5 * t * t * 5;
        } else if (t < 0.8) {
            // Parte media consistente
            return 0.02 + 0.76 * t;
        } else {
            // Final suave pero que llega al objetivo
            const tAjustado = (t - 0.8) / 0.2; // Normalizar el último 20%
            return 0.62 + 0.38 * (1 - Math.pow(1 - tAjustado, 3));
        }
    }    /**
     * Detiene la simulación de progreso
     */
    detenerSimulacion() {
        this.estaSimulando = false;
        if (this.intervaloSimulacion) {
            clearTimeout(this.intervaloSimulacion);
            this.intervaloSimulacion = null;
        }
    }

    /**
     * Finaliza la simulación y establece el progreso exacto
     * @param {number} progresoExacto - Progreso exacto a establecer
     */
    finalizarSimulacionEn(progresoExacto) {
        this.detenerSimulacion();
        this.actualizarProgreso(progresoExacto);
    }/**
     * Comienza el procesamiento de una imagen específica (modo continuo)
     * @param {number} indiceImagen - Índice de la imagen (0-based)
     * @param {number} totalImagenes - Total de imágenes
     */
    iniciarProcesamientoImagen(indiceImagen, totalImagenes) {
        if (!this.esModoContinuo) {
            this.iniciarProgresoContinuo();
        }
        
        // Calcular progreso objetivo para esta imagen
        const progresoPorImagen = 85 / totalImagenes;
        const objetivoParaEstaImagen = ((indiceImagen + 0.8) * progresoPorImagen) + 1;
        
        // Dar un pequeño incremento inmediato para feedback
        const incrementoInmediato = progresoPorImagen * 0.1;
        this.establecerObjetivoContinuo(this.progresoObjetivoGlobal + incrementoInmediato);
        
        // Luego establecer el objetivo real
        setTimeout(() => {
            this.establecerObjetivoContinuo(objetivoParaEstaImagen);
        }, 100);
    }

    /**
     * Finaliza el procesamiento de una imagen específica (modo continuo)
     * @param {number} indiceImagen - Índice de la imagen (0-based)
     * @param {number} totalImagenes - Total de imágenes
     */
    finalizarProcesamientoImagen(indiceImagen, totalImagenes) {
        // Calcular progreso exacto para esta imagen completada
        const progresoPorImagen = 85 / totalImagenes;
        const progresoExacto = ((indiceImagen + 1) * progresoPorImagen) + 1;
        
        // Establecer nuevo objetivo
        this.establecerObjetivoContinuo(progresoExacto);
    }    /**
     * Ejecuta la fase final con progreso simple (sin oscilación)
     * @param {number} progresoDesde - Progreso actual (usualmente ~85%)
     */
    iniciarFaseFinal(progresoDesde = 85) {
        // NO USAR modo continuo para evitar oscilación
        console.log('🔄 Iniciando fase final desde', progresoDesde + '%');
        
        // Actualizar mensaje inmediatamente
        const subtitulo = document.querySelector('.pdf-progress-subtitle');
        if (subtitulo) {
            subtitulo.textContent = 'Finalizando generación del PDF...';
        }
        
        // Establecer progreso directamente sin animación continua
        this.actualizarProgreso(Math.max(progresoDesde, 90));
        
        // Programar la fase de guardado
        setTimeout(() => {
            this.iniciarFaseGuardado();
        }, 800);
    }

    /**
     * Ejecuta la fase de guardado con progreso simple
     */
    iniciarFaseGuardado() {
        // Actualizar mensaje
        const subtitulo = document.querySelector('.pdf-progress-subtitle');
        if (subtitulo) {
            subtitulo.textContent = 'Guardando archivo PDF...';
        }
        
        // Establecer progreso directamente
        this.actualizarProgreso(95);
        
        // Programar la finalización
        setTimeout(() => {
            this.iniciarFaseFinalizacion();
        }, 600);
    }

    /**
     * Ejecuta la fase de finalización con progreso simple
     */
    iniciarFaseFinalizacion() {
        // Establecer progreso final de 100%
        this.actualizarProgreso(100);
        
        // Actualizar mensaje un poco después
        setTimeout(() => {
            const subtitulo = document.querySelector('.pdf-progress-subtitle');
            if (subtitulo) {
                subtitulo.textContent = 'Descarga completada exitosamente';
            }
        }, 400);
        
        // Ocultar modal después de llegar al 100%
        setTimeout(() => {
            this.ocultar();
        }, 1200);
    }    /**
     * Inicia el modo de progreso continuo para eliminar saltos visuales
     * DESHABILITADO para evitar oscilación
     */
    iniciarProgresoContinuo() {
        // SISTEMA DESHABILITADO: Causaba conflictos con actualizarProgreso()
        console.log('⚠️ Modo continuo deshabilitado para evitar oscilación');
        this.esModoContinuo = false;
        return;
        
        /* CÓDIGO ORIGINAL COMENTADO:
        this.esModoContinuo = true;
        this.detenerSimulacion(); // Detener simulaciones anteriores
        this.progresoObjetivoGlobal = 1; // Comenzar en 1%
        this.iniciarAnimacionContinua();
        */
    }

    /**
     * Actualiza el objetivo del progreso continuo
     * @param {number} nuevoObjetivo - Nuevo objetivo de progreso
     */
    establecerObjetivoContinuo(nuevoObjetivo) {
        if (this.esModoContinuo) {
            this.progresoObjetivoGlobal = Math.max(nuevoObjetivo, this.progresoObjetivoGlobal);
        }
    }    /**
     * Ejecuta la animación continua del progreso
     * DESHABILITADO para evitar oscilación con otros sistemas
     */
    iniciarAnimacionContinua() {
        // SISTEMA DESHABILITADO: Causaba oscilación con actualizarProgreso()
        console.log('⚠️ Sistema de animación continua deshabilitado para evitar oscilación');
        return;
        
        /* CÓDIGO ORIGINAL COMENTADO:
        if (!this.esModoContinuo || !this.esVisible) return;

        const actualizarProgreso = () => {
            if (!this.esModoContinuo || !this.esVisible) {
                if (this.intervaloContinuo) {
                    clearInterval(this.intervaloContinuo);
                    this.intervaloContinuo = null;
                }
                return;
            }

            const diferencia = this.progresoObjetivoGlobal - this.progresoActual;
            
            if (Math.abs(diferencia) < 0.05) {
                // Muy cerca del objetivo, mover muy lentamente
                this.progresoActual += diferencia * 0.02;
            } else if (Math.abs(diferencia) < 0.5) {
                // Cerca del objetivo, velocidad lenta
                this.progresoActual += diferencia * 0.05;
            } else if (Math.abs(diferencia) < 2) {
                // Distancia media, velocidad moderada
                this.progresoActual += diferencia * 0.08;
            } else {
                // Lejos del objetivo, velocidad más rápida pero controlada
                this.progresoActual += diferencia * 0.12;
            }

            // Asegurar que no se pase del objetivo
            if (diferencia > 0 && this.progresoActual > this.progresoObjetivoGlobal) {
                this.progresoActual = this.progresoObjetivoGlobal;
            } else if (diferencia < 0 && this.progresoActual < this.progresoObjetivoGlobal) {
                this.progresoActual = this.progresoObjetivoGlobal;
            }

            // Actualizar visualmente
            this.actualizarProgresoInstantaneo(this.progresoActual);
        };

        // Actualizar a 60fps para máxima suavidad
        this.intervaloContinuo = setInterval(actualizarProgreso, 16);
        */
    }

    /**
     * Detiene el modo de progreso continuo
     */
    detenerProgresoContinuo() {
        this.esModoContinuo = false;
        if (this.intervaloContinuo) {
            clearInterval(this.intervaloContinuo);
            this.intervaloContinuo = null;
        }
    }
}

// Instancia global del sistema de progreso
window.pdfProgressManager = new CircularProgressPDF();
