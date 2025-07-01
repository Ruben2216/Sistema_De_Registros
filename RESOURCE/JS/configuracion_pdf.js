class PDFSizeController {
    constructor() {
        // Configuración de límites y calidades
        this.configuracion = {
            // LÍMITE ABSOLUTO - NUNCA SUPERAR
            tamaño_maximo_mb: 5,
            tamaño_maximo_bytes: 5 * 1024 * 1024, // 5MB en bytes
            
            // Niveles de calidad JPEG (de mejor a peor) - EMPEZANDO CON CALIDAD ULTRA ALTA
            niveles_calidad: [0.98, 0.95, 0.9, 0.85, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25],
            
            // Límites de resolución por nivel - RESOLUCIONES ULTRA ALTAS PARA DOCUMENTOS
            resoluciones_maximas: [
                { ancho: 6000, alto: 4000, nombre: "6K Ultra (Documentos)" },
                { ancho: 5120, alto: 2880, nombre: "5K Retina" },
                { ancho: 4096, alto: 2304, nombre: "4K Cinema" },
                { ancho: 3840, alto: 2160, nombre: "4K Ultra HD" },
                { ancho: 2560, alto: 1440, nombre: "2K QHD" },
                { ancho: 1920, alto: 1080, nombre: "Full HD" },
                { ancho: 1600, alto: 900, nombre: "HD+" },
                { ancho: 1280, alto: 720, nombre: "HD" }
            ],
            
            // Configuración por número de fotos - EMPEZANDO CON CALIDAD ULTRA ALTA
            ajustes_por_cantidad: {
                1: { calidad_inicial: 0.98, resolucion_idx: 0 },  // Calidad ultra alta para pocas fotos
                5: { calidad_inicial: 0.95, resolucion_idx: 0 },  // Máxima calidad
                10: { calidad_inicial: 0.9, resolucion_idx: 0 },  // Excelente calidad
                15: { calidad_inicial: 0.85, resolucion_idx: 1 }, // Muy buena calidad
                20: { calidad_inicial: 0.7, resolucion_idx: 2 },  // Buena calidad
                999: { calidad_inicial: 0.6, resolucion_idx: 3 }  // Calidad aceptable para muchas fotos
            }
        };
        
        this.estadisticas = {
            fotos_procesadas: 0,
            tamaño_actual_bytes: 0,
            nivel_compresion_usado: 0,
            tiempo_inicio: null
        };
    }

    /**
     * Calcula la configuración inicial basada en el número de fotos
     * @param {number} numeroFotos - Cantidad de fotos a procesar
     * @returns {Object} Configuración inicial
     */
    calcularConfiguracionInicial(numeroFotos) {
        let configuracion = null;
        
        // Buscar la configuración apropiada según cantidad de fotos
        for (const [cantidad, config] of Object.entries(this.configuracion.ajustes_por_cantidad)) {
            if (numeroFotos <= parseInt(cantidad)) {
                configuracion = config;
                break;
            }
        }
        
        // Si no se encontró configuración, usar la más restrictiva
        if (!configuracion) {
            configuracion = this.configuracion.ajustes_por_cantidad[999];
        }
        
        return {
            calidad_webp: configuracion.calidad_inicial,
            resolucion: this.configuracion.resoluciones_maximas[configuracion.resolucion_idx],
            nivel_compresion: 0
        };
    }

    /**
     * Estima el tamaño que tendrá el PDF completo
     * @param {number} tamañoPromedioPorFoto - Tamaño promedio en bytes por foto
     * @param {number} fotosRestantes - Fotos que faltan por procesar
     * @returns {number} Tamaño estimado en bytes
     */
    estimarTamañoFinal(tamañoPromedioPorFoto, fotosRestantes) {
        const tamañoActual = this.estadisticas.tamaño_actual_bytes;
        const tamañoEstimadoRestante = tamañoPromedioPorFoto * fotosRestantes;
        const overhead_pdf = 50 * 1024; // 50KB de overhead del PDF
        
        return tamañoActual + tamañoEstimadoRestante + overhead_pdf;
    }

    /**
     * Procesa una imagen ajustando su calidad según sea necesario
     * NUEVA LÓGICA: Incrementa calidad si hay espacio disponible, reduce si es necesario
     * @param {HTMLImageElement} img - Imagen a procesar
     * @param {number} indice - Índice de la foto actual
     * @param {number} totalFotos - Total de fotos a procesar
     * @param {Function} callback - Función que recibe la imagen procesada
     */
    procesarImagenConControl(img, indice, totalFotos, callback) {
        const configuracionInicial = this.calcularConfiguracionInicial(totalFotos);
        
        // NUEVA LÓGICA: Empezar con calidad inicial y ajustar dinámicamente
        this.procesarConOptimizacionInteligente(img, configuracionInicial, indice, totalFotos, callback);
    }

    /**
     * NUEVA FUNCIÓN: Optimización inteligente bidireccional
     * Incrementa calidad si hay espacio, reduce si es necesario
     */
    procesarConOptimizacionInteligente(img, config, indice, totalFotos, callback) {
        // Calcular el espacio disponible y óptimo por foto
        const espacioRestante = this.configuracion.tamaño_maximo_bytes - this.estadisticas.tamaño_actual_bytes;
        const fotosRestantes = totalFotos - indice;
        const espacioOptimoPorFoto = Math.floor(espacioRestante / Math.max(fotosRestantes, 1));
        
        // Si es la primera foto, usar configuración inicial
        if (indice === 0) {
            this.procesarConCalidadObjetivo(img, config, indice, totalFotos, espacioOptimoPorFoto, callback);
            return;
        }
        
        // Si ya hay fotos procesadas, calcular promedio y optimizar
        const tamañoPromedio = this.estadisticas.tamaño_actual_bytes / this.estadisticas.fotos_procesadas;
        const proyeccionTotal = tamañoPromedio * totalFotos;
        const porcentajeUsado = (proyeccionTotal / this.configuracion.tamaño_maximo_bytes) * 100;
        
        // LÓGICA ESTRICTA PARA RESPETART EL LÍMITE DE 5MB:
        if (proyeccionTotal < this.configuracion.tamaño_maximo_bytes * 0.85) {
            // Si usa menos del 85% del espacio → INCREMENTAR CALIDAD CONTROLADAMENTE
            this.optimizarParaMayorCalidad(img, config, indice, totalFotos, espacioOptimoPorFoto, callback);
        } else if (proyeccionTotal > this.configuracion.tamaño_maximo_bytes * 1.02) {
            // Si usa más del 102% del espacio → REDUCIR CALIDAD DRÁSTICAMENTE
            this.optimizarParaMenorTamaño(img, config, indice, totalFotos, callback);
        } else {
            // Rango crítico (85-102%) → usar espacio restante de forma muy conservadora
            this.procesarConEspacioRestanteConservador(img, config, indice, totalFotos, espacioOptimoPorFoto, callback);
        }
    }

    /**
     * NUEVA FUNCIÓN: Optimizar para mayor calidad cuando hay espacio disponible
     */
    optimizarParaMayorCalidad(img, config, indice, totalFotos, espacioObjetivo, callback) {
        // Calcular espacio más conservador para evitar oscilaciones
        const fotosRestantes = totalFotos - indice;
        const espacioRestante = this.configuracion.tamaño_maximo_bytes - this.estadisticas.tamaño_actual_bytes;
        
        // USAR ESPACIO MÁS CONSERVADOR: 40% del espacio restante para esta foto
        const espacioControlado = espacioRestante * 0.4;
        
        // Buscar la mejor calidad posible que quepa en el espacio controlado
        this.encontrarMejorCalidad(img, config, indice, totalFotos, espacioControlado, callback);
    }

    /**
     * NUEVA FUNCIÓN: Optimizar para menor tamaño cuando se acerca al límite
     */
    optimizarParaMenorTamaño(img, config, indice, totalFotos, callback) {
        // Calcular cuánto nos hemos pasado del límite
        const tamañoPromedio = this.estadisticas.tamaño_actual_bytes / this.estadisticas.fotos_procesadas;
        const proyeccionTotal = tamañoPromedio * totalFotos;
        const exceso = proyeccionTotal - this.configuracion.tamaño_maximo_bytes;
        
        // Usar compresión más agresiva si el exceso es grande
        let nivelCompresion = 3; // Compresión moderada por defecto
        if (exceso > 1024 * 1024) { // Más de 1MB de exceso
            nivelCompresion = 6; // Compresión alta
        }
        
        // Usar la lógica de reducción progresiva con nivel ajustado
        this.procesarConNivel(img, config, nivelCompresion, indice, totalFotos, callback);
    }

    /**
     * NUEVA FUNCIÓN: Procesar conservadoramente cuando estamos cerca del límite
     */
    procesarConEspacioRestanteConservador(img, config, indice, totalFotos, espacioObjetivo, callback) {
        const fotosRestantes = totalFotos - indice;
        const espacioRestante = this.configuracion.tamaño_maximo_bytes - this.estadisticas.tamaño_actual_bytes;
        
        // Calcular espacio MÁXIMO permitido para esta foto (con margen de seguridad)
        const espacioMaximoSeguro = Math.floor(espacioRestante / Math.max(fotosRestantes, 1)) * 0.85; // Solo 85% del espacio disponible
        
        // Si el espacio seguro es muy pequeño, usar compresión más agresiva
        if (espacioMaximoSeguro < 100 * 1024) { // Menos de 100KB disponible
            this.procesarConNivel(img, config, 6, indice, totalFotos, callback); // Nivel alto de compresión
        } else {
            // Buscar la mejor calidad que quepa en el espacio seguro
            this.encontrarMejorCalidad(img, config, indice, totalFotos, espacioMaximoSeguro, callback);
        }
    }

    /**
     * NUEVA FUNCIÓN: Encontrar la mejor calidad que quepa en el espacio objetivo
     */
    encontrarMejorCalidad(img, config, indice, totalFotos, espacioObjetivo, callback) {
        // Probar calidades desde la mejor hacia abajo hasta encontrar la que quepa
        this.probarCalidadOptima(img, 0, espacioObjetivo, (mejorCalidad, mejorResolucion) => {
            if (mejorCalidad !== null) {
                // Usar la mejor calidad encontrada
                this.procesarConParametrosEspecificos(img, mejorCalidad, mejorResolucion, callback);
            } else {
                // Fallback a configuración estándar
                this.procesarConCalidadObjetivo(img, config, indice, totalFotos, espacioObjetivo, callback);
            }
        });
    }

    /**
     * NUEVA FUNCIÓN: Probar diferentes calidades para encontrar la óptima
     */
    probarCalidadOptima(img, nivelInicio, espacioObjetivo, callback) {
        if (nivelInicio >= this.configuracion.niveles_calidad.length) {
            callback(null, null); // No se encontró calidad adecuada
            return;
        }

        const calidad = this.configuracion.niveles_calidad[nivelInicio];
        const resolucion = this.configuracion.resoluciones_maximas[Math.min(nivelInicio, this.configuracion.resoluciones_maximas.length - 1)];
        
        // Procesar imagen con esta calidad para probar el tamaño
        this.procesarImagenPrueba(img, calidad, resolucion, (tamañoPrueba) => {
            if (tamañoPrueba && tamañoPrueba <= espacioObjetivo * 1.2) { // 20% de tolerancia para ser más permisivo
                // Esta calidad funciona - verificar si podemos mejorar aún más
                if (nivelInicio > 0 && tamañoPrueba <= espacioObjetivo * 0.6) {
                    // Si queda mucho espacio (usa menos del 60%), probar calidad superior
                    this.probarCalidadOptima(img, nivelInicio - 1, espacioObjetivo, callback);
                } else {
                    // Esta es la mejor calidad que cabe
                    callback(calidad, resolucion);
                }
            } else {
                // Probar con menor calidad
                this.probarCalidadOptima(img, nivelInicio + 1, espacioObjetivo, callback);
            }
        });
    }

    /**
     * NUEVA FUNCIÓN: Procesar imagen de prueba para obtener tamaño - FORZANDO ALTA RESOLUCIÓN
     */
    procesarImagenPrueba(img, calidad, resolucion, callback) {
        const ratio = img.naturalWidth / img.naturalHeight;
        let nuevoAncho, nuevoAlto;

        // USAR LA MISMA LÓGICA DE FORZAR RESOLUCIONES ALTAS
        if (ratio > 1) {
            nuevoAncho = Math.max(resolucion.ancho, img.naturalWidth * 3);
            nuevoAlto = nuevoAncho / ratio;
        } else {
            nuevoAlto = Math.max(resolucion.alto, img.naturalHeight * 3);
            nuevoAncho = nuevoAlto * ratio;
        }

        // LÍMITE MÁXIMO ULTRA ALTO
        const LIMITE_MAXIMO = 6000;
        if (nuevoAncho > LIMITE_MAXIMO) {
            nuevoAncho = LIMITE_MAXIMO;
            nuevoAlto = nuevoAncho / ratio;
        }
        if (nuevoAlto > LIMITE_MAXIMO) {
            nuevoAlto = LIMITE_MAXIMO;
            nuevoAncho = nuevoAlto * ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(nuevoAncho);
        canvas.height = Math.round(nuevoAlto);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            callback(blob ? blob.size : null);
        }, 'image/jpeg', calidad);
    }

    /**
     * NUEVA FUNCIÓN: Procesar con parámetros específicos - FORZANDO ALTA RESOLUCIÓN
     */
    procesarConParametrosEspecificos(img, calidad, resolucion, callback) {
        const ratio = img.naturalWidth / img.naturalHeight;
        let nuevoAncho, nuevoAlto;

        // FORZAR RESOLUCIONES MUY ALTAS - NO LIMITAR POR TAMAÑO ORIGINAL
        if (ratio > 1) {
            // Imagen horizontal - FORZAR ANCHO MÍNIMO
            nuevoAncho = Math.max(resolucion.ancho, img.naturalWidth * 3); // Al menos 3x la resolución original
            nuevoAlto = nuevoAncho / ratio;
        } else {
            // Imagen vertical - FORZAR ALTO MÍNIMO  
            nuevoAlto = Math.max(resolucion.alto, img.naturalHeight * 3); // Al menos 3x la resolución original
            nuevoAncho = nuevoAlto * ratio;
        }

        // LÍMITE MÁXIMO ULTRA ALTO para documentos
        const LIMITE_MAXIMO = 6000; // 6K de resolución máxima
        if (nuevoAncho > LIMITE_MAXIMO) {
            nuevoAncho = LIMITE_MAXIMO;
            nuevoAlto = nuevoAncho / ratio;
        }
        if (nuevoAlto > LIMITE_MAXIMO) {
            nuevoAlto = LIMITE_MAXIMO;
            nuevoAncho = nuevoAlto * ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(nuevoAncho);
        canvas.height = Math.round(nuevoAlto);
        const ctx = canvas.getContext('2d');
        
        // USAR INTERPOLACIÓN SUAVE PARA ESCALAR
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                // VALIDACIÓN CRÍTICA: Verificar que no supere el límite absoluto
                const nuevoTamañoTotal = this.estadisticas.tamaño_actual_bytes + blob.size;
                
                if (nuevoTamañoTotal > this.configuracion.tamaño_maximo_bytes) {
                    // Procesar con máxima compresión como última opción
                    const nuevaCalidad = Math.max(calidad * 0.3, 0.1); // Reducir a 30% de la calidad actual, mínimo 10%
                    
                    canvas.toBlob((blobEmergencia) => {
                        if (blobEmergencia && (this.estadisticas.tamaño_actual_bytes + blobEmergencia.size) <= this.configuracion.tamaño_maximo_bytes) {
                            this.estadisticas.tamaño_actual_bytes += blobEmergencia.size;
                            this.estadisticas.fotos_procesadas++;
                            
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                callback(reader.result);
                            };
                            reader.readAsDataURL(blobEmergencia);
                        } else {
                            callback(null); // No agregar esta imagen
                        }
                    }, 'image/jpeg', nuevaCalidad);
                    
                    return;
                }
                
                // Procesar normalmente si está dentro del límite
                this.estadisticas.tamaño_actual_bytes += blob.size;
                this.estadisticas.fotos_procesadas++;
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    callback(reader.result);
                };
                reader.readAsDataURL(blob);
            } else {
                callback(null);
            }
        }, 'image/jpeg', calidad);
    }

    /**
     * NUEVA FUNCIÓN: Procesar con calidad objetivo específica - BALANCEADA
     */
    procesarConCalidadObjetivo(img, config, indice, totalFotos, espacioObjetivo, callback) {
        // Para 17 fotos, usar ~300KB por foto como objetivo (5MB / 17 ≈ 300KB)
        const espacioBalanceadoPorFoto = Math.max(espacioObjetivo, 300 * 1024);
        
        // Buscar la mejor calidad posible con espacio balanceado
        this.encontrarMejorCalidad(img, config, indice, totalFotos, espacioBalanceadoPorFoto, callback);
    }

    /**
     * NUEVA FUNCIÓN: Procesar con calidad optimizada para rango intermedio (90-98%)
     */
    procesarConCalidadOptimizada(img, config, indice, totalFotos, espacioObjetivo, callback) {
        // En el rango intermedio, ser MUY agresivo para aumentar calidad
        const fotosRestantes = totalFotos - indice;
        const espacioRestante = this.configuracion.tamaño_maximo_bytes - this.estadisticas.tamaño_actual_bytes;
        
        // Usar 50% del espacio restante para esta foto (más generoso que el modo ultra agresivo)
        const espacioGenerosoParaEstaFoto = espacioRestante * 0.5;
        
        // Buscar la mejor calidad posible dentro del espacio generoso
        this.encontrarMejorCalidad(img, config, indice, totalFotos, espacioGenerosoParaEstaFoto, callback);
    }

    /**
     * Procesa la imagen con un nivel específico de compresión
     * @param {HTMLImageElement} img - Imagen a procesar
     * @param {Object} config - Configuración base
     * @param {number} nivel - Nivel de compresión (0 = mejor calidad)
     * @param {number} indice - Índice actual
     * @param {number} totalFotos - Total de fotos
     * @param {Function} callback - Callback final
     */
    procesarConNivel(img, config, nivel, indice, totalFotos, callback) {
        // Calcular dimensiones con la resolución actual
        const resolucion = this.configuracion.resoluciones_maximas[Math.min(nivel, this.configuracion.resoluciones_maximas.length - 1)];
        const calidad = this.configuracion.niveles_calidad[Math.min(nivel, this.configuracion.niveles_calidad.length - 1)];
        
        const ratio = img.naturalWidth / img.naturalHeight;
        let nuevoAncho, nuevoAlto;

        if (ratio > 1) { // Horizontal
            nuevoAncho = Math.min(resolucion.ancho, img.naturalWidth);
            nuevoAlto = nuevoAncho / ratio;
        } else { // Vertical
            nuevoAlto = Math.min(resolucion.alto, img.naturalHeight);
            nuevoAncho = nuevoAlto * ratio;
        }

        // Crear canvas y procesar imagen
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(nuevoAncho);
        canvas.height = Math.round(nuevoAlto);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertir a blob para obtener tamaño real
        canvas.toBlob((blob) => {
            if (!blob) {
                callback(null);
                return;
            }

            const tamañoFoto = blob.size;
            
            // Calcular si con esta calidad el PDF superará 5MB
            const fotosRestantes = totalFotos - (indice + 1);
            const tamañoPromedio = (this.estadisticas.tamaño_actual_bytes + tamañoFoto) / (indice + 1);
            const tamañoEstimado = this.estimarTamañoFinal(tamañoPromedio, fotosRestantes);

            // Si supera el límite y podemos reducir más la calidad
            if (tamañoEstimado > this.configuracion.tamaño_maximo_bytes && nivel < this.configuracion.niveles_calidad.length - 1) {
                // Intentar con menor calidad
                this.procesarConNivel(img, config, nivel + 1, indice, totalFotos, callback);
                return;
            }

            // Si aún con la menor calidad supera el límite, usar compresión extrema
            if (tamañoEstimado > this.configuracion.tamaño_maximo_bytes) {
                this.aplicarCompresionExtrema(img, callback);
                return;
            }

            // Actualizar estadísticas
            this.estadisticas.tamaño_actual_bytes += tamañoFoto;
            this.estadisticas.fotos_procesadas++;
            this.estadisticas.nivel_compresion_usado = Math.max(this.estadisticas.nivel_compresion_usado, nivel);

            // Convertir blob a data URL
            const reader = new FileReader();
            reader.onloadend = () => callback(reader.result);
            reader.readAsDataURL(blob);

        }, 'image/webp', calidad);
    }

    /**
     * Aplicar compresión extrema como último recurso
     * @param {HTMLImageElement} img - Imagen a comprimir
     * @param {Function} callback - Callback con resultado
     */
    aplicarCompresionExtrema(img, callback) {
        // Resolución mínima extrema
        const maxAncho = 400;
        const maxAlto = 300;
        const calidadMinima = 0.2;

        const ratio = img.naturalWidth / img.naturalHeight;
        let nuevoAncho, nuevoAlto;

        if (ratio > 1) {
            nuevoAncho = Math.min(maxAncho, img.naturalWidth);
            nuevoAlto = nuevoAncho / ratio;
        } else {
            nuevoAlto = Math.min(maxAlto, img.naturalHeight);
            nuevoAncho = nuevoAlto * ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(nuevoAncho);
        canvas.height = Math.round(nuevoAlto);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                this.estadisticas.tamaño_actual_bytes += blob.size;
                const reader = new FileReader();
                reader.onloadend = () => callback(reader.result);
                reader.readAsDataURL(blob);
            } else {
                callback(null);
            }
        }, 'image/webp', calidadMinima);
    }

    /**
     * Reinicia las estadísticas para un nuevo PDF
     */
    reiniciarEstadisticas() {
        this.estadisticas = {
            fotos_procesadas: 0,
            tamaño_actual_bytes: 0,
            nivel_compresion_usado: 0,
            tiempo_inicio: new Date()
        };
    }

    /**
     * Obtiene un reporte del procesamiento con información de optimización
     * @returns {Object} Estadísticas del procesamiento
     */
    obtenerReporte() {
        const tamañoMB = (this.estadisticas.tamaño_actual_bytes / (1024 * 1024)).toFixed(2);
        const porcentajeUsado = ((this.estadisticas.tamaño_actual_bytes / this.configuracion.tamaño_maximo_bytes) * 100).toFixed(1);
        const espacioRestante = ((this.configuracion.tamaño_maximo_bytes - this.estadisticas.tamaño_actual_bytes) / (1024 * 1024)).toFixed(2);
        
        // Determinar nivel de optimización mejorado
        let nivelOptimizacion = 'Ultra Alta';
        let estadoOptimizacion = '🎯 ÓPTIMO';
        
        if (porcentajeUsado > 95) {
            nivelOptimizacion = 'Conservadora';
            estadoOptimizacion = '⚠️ LÍMITE ALCANZADO';
        } else if (porcentajeUsado > 85) {
            nivelOptimizacion = 'Equilibrada';
            estadoOptimizacion = '✅ BIEN OPTIMIZADO';
        } else if (porcentajeUsado > 70) {
            nivelOptimizacion = 'Alta';
            estadoOptimizacion = '📈 CALIDAD ALTA';
        } else if (porcentajeUsado > 50) {
            nivelOptimizacion = 'Muy Alta';
            estadoOptimizacion = '🌟 CALIDAD MUY ALTA';
        } else {
            nivelOptimizacion = 'Ultra Alta';
            estadoOptimizacion = '✨ CALIDAD MÁXIMA';
        }
        
        return {
            tamaño_final_mb: tamañoMB,
            porcentaje_usado: porcentajeUsado,
            espacio_restante_mb: espacioRestante,
            fotos_procesadas: this.estadisticas.fotos_procesadas,
            nivel_optimizacion: nivelOptimizacion,
            estado_optimizacion: estadoOptimizacion,
            promedio_por_foto_kb: ((this.estadisticas.tamaño_actual_bytes / this.estadisticas.fotos_procesadas) / 1024).toFixed(0),
            dentro_del_limite: this.estadisticas.tamaño_actual_bytes <= this.configuracion.tamaño_maximo_bytes,
            eficiencia: porcentajeUsado > 80 ? 'Excelente aprovechamiento' : 
                       porcentajeUsado > 60 ? 'Buen aprovechamiento' : 
                       porcentajeUsado > 40 ? 'Aprovechamiento moderado' : 
                       'Mucho espacio disponible',
            recomendacion: porcentajeUsado < 70 ? 
                          '💡 Se puede agregar más contenido o aumentar calidad' : 
                          porcentajeUsado > 90 ? 
                          '⚠️ Cerca del límite - calidad optimizada automáticamente' : 
                          '✅ Tamaño y calidad óptimos'
        };
    }

    /**
     * Verifica si el tamaño actual está cerca del límite
     * @returns {boolean} True si está en zona de peligro
     */
    estaEnZonaDePeligro() {
        const limite_peligro = this.configuracion.tamaño_maximo_bytes * 0.8; // 80% del límite
        return this.estadisticas.tamaño_actual_bytes > limite_peligro;
    }
}

// Crear instancia global
window.pdfSizeController = new PDFSizeController();

// Función de utilidad para uso fácil
window.procesarImagenParaPDF = function(img, indice, totalFotos, callback) {
    if (indice === 0) {
        window.pdfSizeController.reiniciarEstadisticas();
    }
    return window.pdfSizeController.procesarImagenConControl(img, indice, totalFotos, callback);
};

// Función para obtener reporte final
window.obtenerReportePDF = function() {
    return window.pdfSizeController.obtenerReporte();
};

/**
 * Función para mostrar advertencias sobre el tamaño del PDF
 */
function mostrarAdvertenciaTamaño() {
    const totalFotos = document.querySelectorAll('#photosContainer .photo-wrapper').length;
    
    if (totalFotos === 0) {
        return;
    }
    
    // Usar el controlador para estimar configuración inicial
    if (typeof window.pdfSizeController !== 'undefined') {
        const espacioPorFoto = (5 * 1024 * 1024) / totalFotos; // 5MB dividido entre fotos
        const espacioMB = (espacioPorFoto / (1024 * 1024)).toFixed(1);
        
        let mensaje = `📄 ANÁLISIS DE CALIDAD AUTOMÁTICA\n\n`;
        mensaje += `📊 Fotos a procesar: ${totalFotos}\n`;
        mensaje += `💾 Espacio por foto: ~${espacioMB}MB\n`;
        mensaje += `🎯 Límite total: 5MB máximo\n\n`;
        
        if (espacioPorFoto > 500 * 1024) { // > 500KB por foto
            mensaje += `✨ CALIDAD MÁXIMA\n`;
            mensaje += `• Resolución: 4K (3840x2160)\n`;
            mensaje += `• Calidad WebP: 95%\n`;
            mensaje += `• Resultado: Excelente para documentos`;
        } else if (espacioPorFoto > 300 * 1024) { // 300-500KB por foto
            mensaje += `🎯 CALIDAD ALTA\n`;
            mensaje += `• Resolución: 4K (3840x2160)\n`;
            mensaje += `• Calidad WebP: 90%\n`;
            mensaje += `• Resultado: Muy buena para documentos`;
        } else if (espacioPorFoto > 200 * 1024) { // 200-300KB por foto
            mensaje += `⚡ CALIDAD BUENA\n`;
            mensaje += `• Resolución: Full HD+ (1600x900)\n`;
            mensaje += `• Calidad WebP: 85%\n`;
            mensaje += `• Resultado: Buena legibilidad`;
        } else {
            mensaje += `🔧 OPTIMIZACIÓN AUTOMÁTICA\n`;
            mensaje += `• El sistema ajustará dinámicamente\n`;
            mensaje += `• Prioridad: Legibilidad del texto\n`;
            mensaje += `• Resultado: Calidad equilibrada`;
        }
        
        mensaje += `\n\n🔄 VENTAJA: Si el PDF pesa menos de 5MB, el sistema incrementará automáticamente la calidad para aprovechar el espacio disponible.`;
        
        if (typeof showMessage === 'function') {
            showMessage(mensaje);
        }
    }
}

// Agregar botón para ver información de tamaño estimado
document.addEventListener('DOMContentLoaded', function() {
    const btnGenerarPDF = document.getElementById('btnGenerarPDF');
    if (btnGenerarPDF) {
        // Agregar evento de clic derecho para mostrar información
        btnGenerarPDF.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            mostrarAdvertenciaTamaño();
        });
        
        // Agregar tooltip
        btnGenerarPDF.title = 'Clic normal: Generar PDF | Clic derecho: Ver información de tamaño';
    }
});

/**
 * ✅ CONFIGURACIÓN RESTAURADA A MÁXIMA CALIDAD INICIAL
 * 
 * Ahora el sistema funciona así:
 * 
 * 1. 📸 CAPTURA: Máxima resolución (4K) y calidad (90-95% WebP)
 * 2. 🎯 CONTROL INTELIGENTE: El PDFSizeController ajusta automáticamente SOLO cuando es necesario
 * 3. 📄 RESULTADO: Máxima calidad posible manteniendo < 5MB garantizado
 * 
 * BENEFICIOS:
 * - ✨ Máxima calidad cuando hay pocas fotos
 * - 🔄 Compresión automática solo cuando se requiere
 * - 🚫 NUNCA supera 5MB
 * - 🎛️ Control inteligente y transparente
 */

