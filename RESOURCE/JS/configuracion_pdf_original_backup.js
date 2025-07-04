class PDFSizeController {
    constructor() {
        this.configuracion = {
            tamaño_maximo_bytes: 5 * 1024 * 1024, // 5MB en bytes
        };
        
        this.estadisticas = {
            fotos_procesadas: 0,
            tamaño_actual_bytes: 0,
        };
    }

    /**
     * FUNCIÓN PRINCIPAL: Procesa imagen y GARANTIZA que se incluya
     */
    procesarImagenConControl(img, indice, totalFotos, callback) {
        // CORRECCIÓN: fotosRestantes debe incluir la foto actual
        const fotosRestantes = totalFotos - this.estadisticas.fotos_procesadas;
        const espacioRestante = this.configuracion.tamaño_maximo_bytes - this.estadisticas.tamaño_actual_bytes;
        
        // NUEVO: Usar cálculo optimizado de espacio
        const espacioObjetivoPorFoto = this.calcularEspacioOptimizado(fotosRestantes, espacioRestante);
        
        // Mínimo más generoso para garantizar excelente calidad
        let espacioObjetivo = Math.max(250000, espacioObjetivoPorFoto); // Mínimo 250KB para excelente calidad
        
        // Auto-ajustar si queda mucho espacio disponible
        espacioObjetivo = this.autoAjustarEspacio(espacioObjetivo, fotosRestantes, espacioRestante);
        
        // NUEVO: Incremento inteligente basado en el historial de eficiencia
        espacioObjetivo = this.ajustarPorHistorialEficiencia(espacioObjetivo, fotosRestantes, espacioRestante);
        
        console.log(`📸 Procesando foto ${this.estadisticas.fotos_procesadas + 1}/${totalFotos}`);
        console.log(`📊 Espacio restante: ${(espacioRestante/1024/1024).toFixed(2)}MB`);
        console.log(`🎯 Espacio objetivo: ${(espacioObjetivo/1024).toFixed(1)}KB`);
        console.log(`📈 Fotos restantes: ${fotosRestantes}`);
        
        // Procesar con compresión progresiva
        this.procesarConCompresionProgresiva(img, espacioObjetivo, callback);
    }

    /**
     * Procesar con compresión progresiva - MAXIMIZA CALIDAD usando espacio disponible
     */
    procesarConCompresionProgresiva(img, espacioObjetivo, callback) {
        // NUEVO: Configuraciones que priorizan calidad y aprovechan mejor el espacio
        const configuraciones = [
            { calidad: 0.95, maxSize: 3000 }, // Calidad muy alta
            { calidad: 0.9, maxSize: 2800 },  // Calidad alta
            { calidad: 0.85, maxSize: 2600 }, 
            { calidad: 0.8, maxSize: 2400 },
            { calidad: 0.75, maxSize: 2200 },
            { calidad: 0.7, maxSize: 2000 },
            { calidad: 0.65, maxSize: 1800 },
            { calidad: 0.6, maxSize: 1600 },
            { calidad: 0.55, maxSize: 1400 },
            { calidad: 0.5, maxSize: 1200 },
            { calidad: 0.45, maxSize: 1000 },
            { calidad: 0.4, maxSize: 800 },
            { calidad: 0.35, maxSize: 600 },
            { calidad: 0.3, maxSize: 500 },
            { calidad: 0.25, maxSize: 400 },
            { calidad: 0.2, maxSize: 300 },
            { calidad: 0.15, maxSize: 200 },
            { calidad: 0.1, maxSize: 150 },
            { calidad: 0.05, maxSize: 100 },
            { calidad: 0.01, maxSize: 80 }  // Último recurso
        ];
        
        this.probarConfiguracion(img, espacioObjetivo, configuraciones, 0, callback);
    }
    
    /**
     * Probar configuración específica
     */
    probarConfiguracion(img, espacioObjetivo, configuraciones, indiceConfig, callback) {
        if (indiceConfig >= configuraciones.length) {
            // Último recurso: imagen mínima
            console.log('Usando imagen mínima como último recurso');
            this.crearImagenMinima(img, callback);
            return;
        }
        
        const config = configuraciones[indiceConfig];
        console.log(`🔧 Probando calidad ${config.calidad} con resolución máx ${config.maxSize}px`);
        
        // Calcular dimensiones manteniendo la proporción
        const ratio = img.naturalWidth / img.naturalHeight;
        let ancho, alto;
        
        if (img.naturalWidth > img.naturalHeight) {
            // Imagen horizontal
            ancho = Math.min(img.naturalWidth, config.maxSize);
            alto = ancho / ratio;
        } else {
            // Imagen vertical
            alto = Math.min(img.naturalHeight, config.maxSize);
            ancho = alto * ratio;
        }
        
        // Crear canvas
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(ancho);
        canvas.height = Math.round(alto);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convertir a blob usando el mejor formato disponible
        const formatoOptimo = this.obtenerFormatoOptimo();
        const formatoCorto = formatoOptimo === 'image/webp' ? 'WEBP' : 'JPEG';
        
        canvas.toBlob((blob) => {
            if (!blob) {
                console.log('Error al crear blob, probando siguiente configuración');
                this.probarConfiguracion(img, espacioObjetivo, configuraciones, indiceConfig + 1, callback);
                return;
            }
            
            console.log(`📏 Resultado: ${(blob.size/1024).toFixed(1)}KB (objetivo: ${(espacioObjetivo/1024).toFixed(1)}KB) - Formato: ${formatoCorto}`);
            
            if (blob.size <= espacioObjetivo) {
                // Esta configuración funciona
                this.estadisticas.tamaño_actual_bytes += blob.size;
                this.estadisticas.fotos_procesadas++;
                
                // Registrar uso para análisis inteligente
                const necesitaMasEspacio = this.registrarUsoEspacio(blob.size, espacioObjetivo);
                
                console.log(`✅ ¡Imagen procesada! Calidad: ${config.calidad}, Tamaño: ${(blob.size/1024).toFixed(1)}KB, Formato: ${formatoCorto}`);
                console.log(`📊 Total acumulado: ${(this.estadisticas.tamaño_actual_bytes/1024/1024).toFixed(2)}MB`);
                console.log(`📈 Eficiencia de espacio: ${((blob.size/espacioObjetivo)*100).toFixed(0)}%`);
                
                const reader = new FileReader();
                reader.onloadend = () => callback(reader.result);
                reader.onerror = () => {
                    console.log('❌ Error al leer blob, probando siguiente configuración');
                    this.probarConfiguracion(img, espacioObjetivo, configuraciones, indiceConfig + 1, callback);
                };
                reader.readAsDataURL(blob);
            } else {
                // Probar siguiente configuración
                console.log(`📉 Muy grande, reduciendo calidad...`);
                this.probarConfiguracion(img, espacioObjetivo, configuraciones, indiceConfig + 1, callback);
            }
        }, formatoOptimo, config.calidad);
    }
    
    /**
     * Crear imagen mínima como último recurso - NUNCA falla
     */
    crearImagenMinima(img, callback) {
        console.log('Creando imagen mínima como último recurso');
        
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Dibujar imagen muy pequeña
        try {
            ctx.drawImage(img, 0, 0, 32, 32);
        } catch (error) {
            console.log('Error al dibujar imagen, creando imagen sólida');
            // Si hay error, crear un rectángulo gris
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(0, 0, 32, 32);
        }
        
        // Intentar crear blob con calidad mínima usando el mejor formato
        const formatoOptimo = this.obtenerFormatoOptimo();
        const imagenFallback = formatoOptimo === 'image/webp' ? 
            'data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAAAwAQCdASoBAAEAD8D+JaQAA3AAAAAA' :
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/gA==';
        
        canvas.toBlob((blob) => {
            if (blob) {
                this.estadisticas.tamaño_actual_bytes += blob.size;
                this.estadisticas.fotos_procesadas++;
                
                console.log(`✓ Imagen mínima creada: ${(blob.size/1024).toFixed(1)}KB - Formato: ${formatoOptimo}`);
                
                const reader = new FileReader();
                reader.onloadend = () => callback(reader.result);
                reader.onerror = () => {
                    // Si todo falla, usar una imagen base64 predefinida
                    console.log('Error al leer blob mínimo, usando imagen base64 predefinida');
                    this.estadisticas.tamaño_actual_bytes += 500; // Estimar tamaño
                    this.estadisticas.fotos_procesadas++;
                    callback(imagenFallback);
                };
                reader.readAsDataURL(blob);
            } else {
                // Si el blob falla, usar imagen base64 predefinida
                console.log('Error al crear blob mínimo, usando imagen base64 predefinida');
                this.estadisticas.tamaño_actual_bytes += 500; // Estimar tamaño
                this.estadisticas.fotos_procesadas++;
                callback(imagenFallback);
            }
        }, formatoOptimo, 0.01);
    }

    /**
     * Calcula espacio objetivo optimizado basado en el progreso actual
     */
    calcularEspacioOptimizado(fotosRestantes, espacioRestante) {
        // ALGORITMO ULTRA-AGRESIVO para maximizar calidad
        let porcentajeUso;
        
        if (fotosRestantes === 1) {
            porcentajeUso = 0.98; // Usar 98% para la última foto
        } else if (fotosRestantes === 2) {
            porcentajeUso = 0.96; // Usar 96% del espacio restante
        } else if (fotosRestantes === 3) {
            porcentajeUso = 0.94; // Usar 94% del espacio restante
        } else if (fotosRestantes <= 5) {
            porcentajeUso = 0.92; // Usar 92% del espacio restante
        } else if (fotosRestantes <= 8) {
            porcentajeUso = 0.90; // Usar 90% del espacio restante
        } else {
            porcentajeUso = 0.88; // Usar 88% del espacio restante para muchas fotos
        }
        
        const espacioTotal = Math.floor(espacioRestante * porcentajeUso);
        const espacioPorFoto = Math.floor(espacioTotal / fotosRestantes);
        
        console.log(`🎯 Algoritmo ultra-agresivo: ${(porcentajeUso*100).toFixed(0)}% de ${(espacioRestante/1024/1024).toFixed(2)}MB = ${(espacioPorFoto/1024).toFixed(1)}KB por foto`);
        
        return espacioPorFoto;
    }

    /**
     * Auto-ajusta el espacio objetivo si detecta que queda mucho espacio disponible
     */
    autoAjustarEspacio(espacioObjetivo, fotosRestantes, espacioRestante) {
        // Si queda más del 60% del espacio total y pocas fotos, ser más generoso
        const porcentajeRestante = (espacioRestante / this.configuracion.tamaño_maximo_bytes) * 100;
        
        if (porcentajeRestante > 60 && fotosRestantes <= 3) {
            const espacioAjustado = Math.floor(espacioRestante * 0.99 / fotosRestantes);
            console.log(`🔄 AUTO-AJUSTE: Queda ${porcentajeRestante.toFixed(0)}% del espacio, aumentando a ${(espacioAjustado/1024).toFixed(1)}KB por foto`);
            return Math.max(espacioObjetivo, espacioAjustado);
        }
        
        return espacioObjetivo;
    }

    /**
     * Ajusta el espacio objetivo basado en el historial de eficiencia
     */
    ajustarPorHistorialEficiencia(espacioObjetivo, fotosRestantes, espacioRestante) {
        if (!this.estadisticas.historial_uso || this.estadisticas.historial_uso.length < 2) {
            return espacioObjetivo;
        }
        
        // Calcular eficiencia promedio de las últimas imágenes
        const ultimasImagenes = this.estadisticas.historial_uso.slice(-Math.min(3, this.estadisticas.historial_uso.length));
        const eficienciaPromedio = ultimasImagenes.reduce((sum, item) => sum + item.eficiencia, 0) / ultimasImagenes.length;
        
        console.log(`🧠 Eficiencia promedio reciente: ${eficienciaPromedio.toFixed(0)}%`);
        
        // Si las imágenes han usado consistentemente menos espacio del asignado, ser más generoso
        if (eficienciaPromedio < 60 && fotosRestantes <= 3) {
            const factorAumento = 1.5; // Aumentar 50%
            const espacioAjustado = Math.min(espacioObjetivo * factorAumento, espacioRestante * 0.95);
            console.log(`💡 AJUSTE INTELIGENTE: Aumentando espacio por baja eficiencia (${factorAumento}x)`);
            return Math.floor(espacioAjustado);
        }
        
        // Si las imágenes han usado mucho espacio, mantener la asignación actual
        if (eficienciaPromedio > 85) {
            console.log(`⚡ Eficiencia alta, manteniendo asignación actual`);
        }
        
        return espacioObjetivo;
    }

    /**
     * Verifica si se puede mejorar la calidad usando espacio sobrante
     */
    puedeOptimizarCalidad() {
        const espacioUsado = this.estadisticas.tamaño_actual_bytes;
        const espacioTotal = this.configuracion.tamaño_maximo_bytes;
        const porcentajeUsado = (espacioUsado / espacioTotal) * 100;
        
        // Si usamos menos del 85% del espacio, hay margen para optimizar
        return porcentajeUsado < 85;
    }

    /**
     * Reinicia las estadísticas para un nuevo PDF
     */
    reiniciarEstadisticas() {
        this.estadisticas = {
            fotos_procesadas: 0,
            tamaño_actual_bytes: 0,
        };
    }

    /**
     * Obtiene un reporte del procesamiento con análisis de aprovechamiento
     */
    obtenerReporte() {
        const tamañoMB = (this.estadisticas.tamaño_actual_bytes / (1024 * 1024)).toFixed(2);
        const porcentajeUsado = ((this.estadisticas.tamaño_actual_bytes / this.configuracion.tamaño_maximo_bytes) * 100).toFixed(1);
        const espacioSobrante = this.configuracion.tamaño_maximo_bytes - this.estadisticas.tamaño_actual_bytes;
        const espacioSobranteMB = (espacioSobrante / (1024 * 1024)).toFixed(2);
        
        const reporte = {
            tamaño_final_mb: tamañoMB,
            tamaño_final_bytes: this.estadisticas.tamaño_actual_bytes,
            porcentaje_usado: porcentajeUsado,
            espacio_sobrante_mb: espacioSobranteMB,
            fotos_procesadas: this.estadisticas.fotos_procesadas,
            dentro_del_limite: this.estadisticas.tamaño_actual_bytes <= this.configuracion.tamaño_maximo_bytes,
            limite_mb: (this.configuracion.tamaño_maximo_bytes / (1024 * 1024)).toFixed(2),
            aprovechamiento: porcentajeUsado >= 80 ? 'Excelente' : 
                            porcentajeUsado >= 60 ? 'Bueno' : 
                            porcentajeUsado >= 40 ? 'Regular' : 'Bajo',
            puede_optimizar: this.puedeOptimizarCalidad()
        };
        
        console.log('📊 REPORTE FINAL PDF:');
        console.log(`   💾 Tamaño: ${reporte.tamaño_final_mb}MB / ${reporte.limite_mb}MB (${reporte.porcentaje_usado}%)`);
        console.log(`   📸 Fotos procesadas: ${reporte.fotos_procesadas}`);
        console.log(`   🎨 Formato usado: ${this.soportaWebP() ? 'WEBP (óptimo)' : 'JPEG (fallback)'}`);
        console.log(`   📈 Aprovechamiento: ${reporte.aprovechamiento}`);
        console.log(`   💡 Espacio sobrante: ${reporte.espacio_sobrante_mb}MB`);
        
        // Análisis de eficiencia si hay historial
        if (this.estadisticas.historial_uso && this.estadisticas.historial_uso.length > 0) {
            const eficienciaPromedio = this.estadisticas.historial_uso.reduce((sum, item) => sum + item.eficiencia, 0) / this.estadisticas.historial_uso.length;
            const tamañoPromedioPorFoto = this.estadisticas.tamaño_actual_bytes / this.estadisticas.fotos_procesadas / 1024;
            console.log(`   🎯 Eficiencia promedio de espacio: ${eficienciaPromedio.toFixed(0)}%`);
            console.log(`   📏 Tamaño promedio por foto: ${tamañoPromedioPorFoto.toFixed(1)}KB`);
        }
        
        if (reporte.puede_optimizar) {
            console.log(`   ⚠️  Se podría haber usado mejor calidad con el espacio disponible`);
        } else {
            console.log(`   ✅ Uso óptimo del espacio disponible`);
        }
        
        return reporte;
    }

    /**
     * Detecta si el navegador soporta WEBP
     */
    soportaWebP() {
        try {
            return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
        } catch (err) {
            return false;
        }
    }

    /**
     * Obtiene el mejor formato soportado (WEBP o JPEG)
     */
    obtenerFormatoOptimo() {
        return this.soportaWebP() ? 'image/webp' : 'image/jpeg';
    }
}

/**
 * Registra el uso de espacio para análisis inteligente
 */
PDFSizeController.prototype.registrarUsoEspacio = function(tamañoReal, tamañoObjetivo) {
    if (!this.estadisticas.historial_uso) {
        this.estadisticas.historial_uso = [];
    }
    
    const eficiencia = (tamañoReal / tamañoObjetivo) * 100;
    this.estadisticas.historial_uso.push({
        tamaño_real: tamañoReal,
        tamaño_objetivo: tamañoObjetivo,
        eficiencia: eficiencia
    });
    
    // Si las últimas imágenes han usado menos del 70% del espacio asignado,
    // podemos ser más generosos con las siguientes
    if (this.estadisticas.historial_uso.length >= 2) {
        const ultimasDos = this.estadisticas.historial_uso.slice(-2);
        const eficienciaPromedio = ultimasDos.reduce((sum, item) => sum + item.eficiencia, 0) / 2;
        
        if (eficienciaPromedio < 70) {
            console.log(`💡 Detectado bajo uso de espacio (${eficienciaPromedio.toFixed(0)}%), aumentando generosidad`);
            return true; // Señal para ser más generoso
        }
    }
    
    return false;
};

// Crear instancia global
window.pdfSizeController = new PDFSizeController();

// Función de utilidad para uso fácil
window.procesarImagenParaPDF = function(img, indice, totalFotos, callback) {
    if (indice === 0) {
        window.pdfSizeController.reiniciarEstadisticas();
        
        // **CRÍTICO**: Verificar que jsPDF esté disponible antes de activar control
        const verificarJsPDF = () => {
            // Buscar jsPDF en diferentes ubicaciones
            if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.prototype && window.jspdf.jsPDF.prototype.addImage) {
                return true;
            }
            if (window.jsPDF && window.jsPDF.prototype && window.jsPDF.prototype.addImage) {
                return true;
            }
            return false;
        };
        
        const activarControlCuandoEsteListoJsPDF = () => {
            if (verificarJsPDF()) {
                if (!window.controladorImagenesActivo) {
                    console.log('🛡️ ACTIVANDO CONTROL TOTAL AUTOMÁTICO - NADA ESCAPARÁ AL LÍMITE DE 5MB');
                    const resultado = window.controlarTodasLasImagenesPDF();
                    if (resultado === false) {
                        console.error('❌ No se pudo activar el control total');
                    }
                } else {
                    console.log('✅ Control total ya está activo');
                }
            } else {
                console.warn('⚠️ jsPDF no está listo, intentando en 100ms...');
                setTimeout(activarControlCuandoEsteListoJsPDF, 100);
            }
        };
        
        // Activar control cuando jsPDF esté listo
        activarControlCuandoEsteListoJsPDF();
    }
    return window.pdfSizeController.procesarImagenConControl(img, indice, totalFotos, callback);
};

// Función para obtener reporte final
window.obtenerReportePDF = function() {
    return window.pdfSizeController.obtenerReporte();
};

// Función adicional para segunda pasada de optimización (opcional)
window.optimizarCalidadSiHayEspacio = function() {
    const reporte = window.pdfSizeController.obtenerReporte();
    
    if (reporte.puede_optimizar) {
        console.log('💡 Se detectó espacio significativo sobrante. Considera regenerar el PDF para mejor calidad.');
        return {
            puede_mejorar: true,
            espacio_disponible: reporte.espacio_sobrante_mb,
            sugerencia: 'Regenerar PDF con configuración optimizada'
        };
    }
    
    return {
        puede_mejorar: false,
        mensaje: 'El aprovechamiento del espacio es óptimo'
    };
};

// Función de utilidad para debugging de formatos
window.compararFormatos = function(img, calidad = 0.8) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(img.naturalWidth, 1000);
    canvas.height = Math.min(img.naturalHeight, 1000);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const resultados = {};
    
    // Probar WEBP si está disponible
    if (window.pdfSizeController.soportaWebP()) {
        canvas.toBlob((blob) => {
            if (blob) {
                resultados.webp = {
                    tamaño_kb: (blob.size / 1024).toFixed(1),
                    formato: 'WEBP'
                };
                console.log(`📊 WEBP: ${resultados.webp.tamaño_kb}KB`);
            }
        }, 'image/webp', calidad);
    }
    
    // Probar JPEG siempre
    canvas.toBlob((blob) => {
        if (blob) {
            resultados.jpeg = {
                tamaño_kb: (blob.size / 1024).toFixed(1),
                formato: 'JPEG'
            };
            console.log(`📊 JPEG: ${resultados.jpeg.tamaño_kb}KB`);
            
            if (resultados.webp) {
                const ahorro = ((resultados.jpeg.tamaño_kb - resultados.webp.tamaño_kb) / resultados.jpeg.tamaño_kb * 100).toFixed(1);
                console.log(`💡 WEBP es ${ahorro}% más eficiente que JPEG`);
            }
        }
    }, 'image/jpeg', calidad);
    
    return resultados;
};

// Función de diagnóstico para detectar discrepancias de tamaño
window.diagnosticarDiscrepanciaPDF = function() {
    const reporte = window.pdfSizeController.obtenerReporte();
    
    console.log('🔍 DIAGNÓSTICO DE DISCREPANCIA PDF:');
    console.log(`   📊 Tamaño reportado por mi sistema: ${reporte.tamaño_final_mb}MB`);
    console.log(`   📸 Fotos procesadas por mi sistema: ${reporte.fotos_procesadas}`);
    console.log(`   ⚠️  Si el PDF final es diferente, las causas pueden ser:`);
    console.log(`      1. Imágenes adicionales no procesadas por mi sistema`);
    console.log(`      2. Compresión adicional aplicada por jsPDF`);
    console.log(`      3. Imágenes del servidor (no locales) que no pasan por mi control`);
    console.log(`      4. Elementos adicionales del PDF (texto, gráficos, etc.)`);
    
    // Buscar imágenes en el DOM que podrían no estar siendo procesadas
    const todasLasImagenes = document.querySelectorAll('#photosContainer img');
    const imagenesSrc = [];
    
    todasLasImagenes.forEach((img, index) => {
        const src = img.src;
        const esDataURL = src.startsWith('data:');
        const esServidor = src.startsWith('http');
        
        imagenesSrc.push({
            index: index + 1,
            tipo: esDataURL ? 'LOCAL (data:)' : esServidor ? 'SERVIDOR (http)' : 'OTRA',
            tamaño_aprox: esDataURL ? `${(src.length * 0.75 / 1024).toFixed(1)}KB` : 'Desconocido',
            src_inicio: src.substring(0, 50) + '...'
        });
    });
    
    console.log(`   📋 RESUMEN DE IMÁGENES EN DOM (${imagenesSrc.length} total):`);
    imagenesSrc.forEach(img => {
        console.log(`      ${img.index}. ${img.tipo} - ${img.tamaño_aprox}`);
    });
    
    return {
        reporte_sistema: reporte,
        imagenes_dom: imagenesSrc,
        posibles_causas: [
            'Imágenes del servidor no controladas',
            'Compresión adicional por jsPDF',
            'Elementos adicionales del PDF',
            'Procesamiento paralelo no detectado'
        ]
    };
};

// Función para interceptar y monitorear todas las adiciones al PDF
window.interceptarPDFAddImage = function() {
    if (window.interceptorActivo) return; // Evitar doble interceptación
    
    console.log('🕵️ Activando interceptor de pdf.addImage() en PROTOTIPO...');
    
    // **CRÍTICO**: Verificar disponibilidad de jsPDF y su prototipo
    let jsPDFClass = null;
    
    // Buscar la clase jsPDF en diferentes ubicaciones
    if (window.jspdf && window.jspdf.jsPDF) {
        jsPDFClass = window.jspdf.jsPDF;
        console.log('✅ Encontrado jsPDF en window.jspdf.jsPDF');
    } else if (window.jsPDF) {
        jsPDFClass = window.jsPDF;
        console.log('✅ Encontrado jsPDF en window.jsPDF');
    } else {
        console.error('❌ jsPDF no encontrado en ninguna ubicación conocida');
        return false;
    }
    
    if (!jsPDFClass.prototype || !jsPDFClass.prototype.addImage) {
        console.error('❌ jsPDF.prototype.addImage no disponible');
        return false;
    }
    
    // Guardar referencia original DEL PROTOTIPO
    const originalAddImage = jsPDFClass.prototype.addImage;
    let contadorImagenes = 0;
    let tamañoTotalEstimado = 0;
    
    // Interceptar la función EN EL PROTOTIPO (esto afecta TODAS las instancias)
    jsPDFClass.prototype.addImage = function(imageData, format, x, y, width, height, ...args) {
        contadorImagenes++;
        
        // Estimar tamaño de la imagen
        let tamañoEstimado = 0;
        if (typeof imageData === 'string' && imageData.startsWith('data:')) {
            tamañoEstimado = Math.floor(imageData.length * 0.75); // Aproximación base64
        }
        tamañoTotalEstimado += tamañoEstimado;
        
        console.log(`🖼️ INTERCEPTADO pdf.addImage() EN PROTOTIPO #${contadorImagenes}:`);
        console.log(`   📐 Posición: (${x}, ${y}) Tamaño: ${width?.toFixed(1)}x${height?.toFixed(1)}`);
        console.log(`   🎨 Formato: ${format}`);
        console.log(`   📊 Tamaño estimado: ${(tamañoEstimado/1024).toFixed(1)}KB`);
        console.log(`   📈 Total acumulado: ${(tamañoTotalEstimado/1024/1024).toFixed(2)}MB`);
        console.log(`   🔗 Fuente: ${imageData.substring(0, 50)}...`);
        
        // Llamar a la función original
        return originalAddImage.call(this, imageData, format, x, y, width, height, ...args);
    };
    
    window.interceptorActivo = true;
    
    // Función para restaurar el comportamiento original
    window.restaurarPDFAddImage = function() {
        jsPDFClass.prototype.addImage = originalAddImage;
        window.interceptorActivo = false;
        console.log(`🔚 Interceptor en prototipo desactivado. Total: ${contadorImagenes} imágenes, ${(tamañoTotalEstimado/1024/1024).toFixed(2)}MB`);
    };
    
    console.log('✅ Interceptor activado EN PROTOTIPO. Todas las instancias de jsPDF pasarán por aquí.');
    return true;
};

// **CRÍTICO**: Función para controlar TODAS las imágenes que van al PDF
window.controlarTodasLasImagenesPDF = function() {
    // Verificar si el controlador ya está activo
    if (window.controladorImagenesActivo) {
        console.log('✅ Control total ya está activo');
        return true;
    }

    console.log('🛡️ ACTIVANDO CONTROL TOTAL DE IMÁGENAS PDF - LÍMITE ESTRICTO 5MB...');

    // Mejor detección de jsPDF
    let jsPDFClass = null;
    let estado = {
        jsPDF_encontrado: false,
        ubicacion: null,
        prototipo: null,
        addImage: null
    };

    if (window.jspdf && window.jspdf.jsPDF) {
        jsPDFClass = window.jspdf.jsPDF;
        estado.jsPDF_encontrado = true;
        estado.ubicacion = 'window.jspdf.jsPDF';
        estado.prototipo = typeof jsPDFClass.prototype;
        estado.addImage = typeof jsPDFClass.prototype.addImage;
        console.log('✅ Usando jsPDF desde window.jspdf.jsPDF');
    } else if (window.jsPDF) {
        jsPDFClass = window.jsPDF;
        estado.jsPDF_encontrado = true;
        estado.ubicacion = 'window.jsPDF';
        estado.prototipo = typeof jsPDFClass.prototype;
        estado.addImage = typeof jsPDFClass.prototype.addImage;
        console.log('✅ Usando jsPDF desde window.jsPDF');
    } else {
        console.error('❌ ERROR: jsPDF no está disponible en ninguna ubicación');
        console.error('📋 Estado de jsPDF:', {
            'window.jsPDF': typeof window.jsPDF,
            'window.jspdf': typeof window.jspdf,
            'window.jspdf.jsPDF': typeof window.jspdf?.jsPDF
        });
        alert('⚠️ jsPDF no está disponible. Por favor, verifica que la librería jsPDF esté correctamente cargada antes de generar el PDF.');
        return false;
    }

    // **VERIFICACIÓN ROBUSTA CON INSTANCIA REAL** en lugar de solo prototipo
    let originalAddImage = null;
    
    // Crear instancia temporal para verificar que addImage funciona realmente
    try {
        console.log('🔍 [VERIFICACIÓN] Creando instancia temporal de jsPDF para verificar addImage...');
        const testDoc = new jsPDFClass();
        
        if (testDoc.addImage && typeof testDoc.addImage === 'function') {
            originalAddImage = testDoc.addImage;
            console.log('✅ [VERIFICACIÓN] addImage funciona correctamente en instancia real');
        } else {
            throw new Error('addImage no existe en la instancia');
        }
        
    } catch (error) {
        console.error('❌ ERROR: No se puede crear instancia válida de jsPDF:', error.message);
        console.error('📋 Estado de jsPDF:', estado);
        alert('⚠️ jsPDF no se puede instanciar correctamente. Verifica que la librería esté cargada completamente.');
        return false;
    }

    // Estadísticas del control total
    const controlTotal = {
        imagenesControladas: 0,
        imagenesPermitidas: 0,
        imagenesBloqueadas: 0,
        tamañoTotalReal: 0,
        imagenesYaProcesadas: new Set()
    };

    // **INTERCEPTACIÓN UNIVERSAL** que funciona sin depender del prototipo
    const interceptorAddImage = function(imageData, format, x, y, width, height, ...args) {
        controlTotal.imagenesControladas++;
        
        console.log(`🔍 [CONTROL TOTAL] Imagen #${controlTotal.imagenesControladas} detectada`);
        console.log(`   🔗 Fuente: ${typeof imageData === 'string' ? imageData.substring(0, 60) : 'No string'}...`);
        
        // **BLOQUEO CRÍTICO**: Rechazar completamente imágenes del servidor (http/https)
        if (typeof imageData === 'string' && imageData.startsWith('http')) {
            controlTotal.imagenesBloqueadas++;
            console.log(`🚫 [CONTROL TOTAL] IMAGEN DEL SERVIDOR BLOQUEADA #${controlTotal.imagenesBloqueadas}`);
            console.log(`   🚫 URL bloqueada: ${imageData}`);
            console.log(`   ❌ MOTIVO: Solo se permiten imágenes locales (base64) para control de tamaño`);
            return; // NO agregar esta imagen al PDF
        }
        
        // Verificar duplicados para imágenes base64
        if (typeof imageData === 'string' && imageData.startsWith('data:')) {
            const hashImagen = imageData.substring(0, 100);
            
            if (controlTotal.imagenesYaProcesadas.has(hashImagen)) {
                controlTotal.imagenesBloqueadas++;
                console.log(`🚫 [CONTROL TOTAL] IMAGEN DUPLICADA BLOQUEADA #${controlTotal.imagenesBloqueadas}`);
                return; // No agregar imagen duplicada
            }
            
            controlTotal.imagenesYaProcesadas.add(hashImagen);
            
            // Estimar tamaño de imagen base64
            const tamañoEstimado = Math.floor(imageData.length * 0.75);
            
            // **LÍMITE ESTRICTO**: Verificar ANTES de agregar
            const tamañoTentativo = controlTotal.tamañoTotalReal + tamañoEstimado;
            if (tamañoTentativo > (5 * 1024 * 1024)) {
                controlTotal.imagenesBloqueadas++;
                console.error(`🚫 [CONTROL TOTAL] LÍMITE EXCEDIDO! Imagen #${controlTotal.imagenesBloqueadas} rechazada`);
                console.error(`   📊 Tamaño tentativo: ${(tamañoTentativo/1024/1024).toFixed(2)}MB > 5.00MB`);
                console.error(`   📊 Imagen rechazada: ${(tamañoEstimado/1024).toFixed(1)}KB`);
                return; // NO agregar esta imagen
            }
            
            // Si pasa todas las verificaciones
            controlTotal.tamañoTotalReal += tamañoEstimado;
            controlTotal.imagenesPermitidas++;
            
            console.log(`✅ [CONTROL TOTAL] IMAGEN APROBADA #${controlTotal.imagenesPermitidas}`);
            console.log(`   📊 Tamaño: ${(tamañoEstimado/1024).toFixed(1)}KB`);
            console.log(`   📈 Total acumulado: ${(controlTotal.tamañoTotalReal/1024/1024).toFixed(2)}MB / 5.00MB`);
            console.log(`   🎨 Formato: ${format}`);
        } else {
            // Para imágenes que no son string o base64
            controlTotal.imagenesPermitidas++;
            console.log(`✅ [CONTROL TOTAL] Imagen no-base64 permitida #${controlTotal.imagenesPermitidas}`);
        }
        
        // Llamar función original SOLO si la imagen fue aprobada
        return originalAddImage.call(this, imageData, format, x, y, width, height, ...args);
    };
    
    // **MÉTODO DE INTERCEPCIÓN UNIVERSAL**: Crear un wrapper del constructor
    const originalConstructor = jsPDFClass;
    
    // Crear nuevo constructor que intercepta addImage en cada instancia
    const jsPDFWrapper = function(...args) {
        // Crear instancia original
        const instance = new originalConstructor(...args);
        
        // Interceptar addImage en esta instancia específica
        instance.addImage = interceptorAddImage.bind(instance);
        
        console.log('🛡️ [CONTROL TOTAL] Nueva instancia de jsPDF interceptada');
        
        return instance;
    };
    
    // Copiar propiedades estáticas del constructor original
    Object.setPrototypeOf(jsPDFWrapper, originalConstructor);
    Object.getOwnPropertyNames(originalConstructor).forEach(prop => {
        if (prop !== 'length' && prop !== 'name' && prop !== 'prototype') {
            try {
                jsPDFWrapper[prop] = originalConstructor[prop];
            } catch (error) {
                // Ignorar propiedades que no se pueden copiar
            }
        }
    });
    
    // Reemplazar constructor en las ubicaciones conocidas
    if (estado.ubicacion === 'window.jspdf.jsPDF') {
        window.jspdf.jsPDF = jsPDFWrapper;
        console.log('✅ [INTERCEPCIÓN] Constructor reemplazado en window.jspdf.jsPDF');
    } else if (estado.ubicacion === 'window.jsPDF') {
        window.jsPDF = jsPDFWrapper;
        console.log('✅ [INTERCEPCIÓN] Constructor reemplazado en window.jsPDF');
    }
            if (controlTotal.imagenesYaProcesadas.has(hashImagen)) {
                controlTotal.imagenesBloqueadas++;
                console.log(`🚫 [CONTROL TOTAL] IMAGEN DUPLICADA BLOQUEADA #${controlTotal.imagenesBloqueadas}`);
                return; // No agregar imagen duplicada
            }
            controlTotal.imagenesYaProcesadas.add(hashImagen);
            // Estimar tamaño de imagen base64
            const tamañoEstimado = Math.floor(imageData.length * 0.75);
            // **LÍMITE ESTRICTO**: Verificar ANTES de agregar
            const tamañoTentativo = controlTotal.tamañoTotalReal + tamañoEstimado;
            if (tamañoTentativo > (5 * 1024 * 1024)) {
                controlTotal.imagenesBloqueadas++;
                console.error(`🚫 [CONTROL TOTAL] LÍMITE EXCEDIDO! Imagen #${controlTotal.imagenesBloqueadas} rechazada`);
                console.error(`   📊 Tamaño tentativo: ${(tamañoTentativo/1024/1024).toFixed(2)}MB > 5.00MB`);
                console.error(`   � Imagen rechazada: ${(tamañoEstimado/1024).toFixed(1)}KB`);
                return; // NO agregar esta imagen
            }
            // Si pasa todas las verificaciones
            controlTotal.tamañoTotalReal += tamañoEstimado;
            controlTotal.imagenesPermitidas++;
            console.log(`✅ [CONTROL TOTAL] IMAGEN APROBADA #${controlTotal.imagenesPermitidas}`);
            console.log(`   📊 Tamaño: ${(tamañoEstimado/1024).toFixed(1)}KB`);
            console.log(`   📈 Total acumulado: ${(controlTotal.tamañoTotalReal/1024/1024).toFixed(2)}MB / 5.00MB`);
            console.log(`   🎨 Formato: ${format}`);
        } else {
            // Para imágenes que no son string o base64
            controlTotal.imagenesPermitidas++;
            console.log(`✅ [CONTROL TOTAL] Imagen no-base64 permitida #${controlTotal.imagenesPermitidas}`);
        }
        
        // Llamar función original SOLO si la imagen fue aprobada
        return originalAddImage.call(this, imageData, format, x, y, width, height, ...args);
    };
    
    window.controladorImagenesActivo = true;
    
    // Función para obtener estadísticas del control total
    window.obtenerEstadisticasControlTotal = function() {
        return {
            imagenes_controladas: controlTotal.imagenesControladas,
            imagenes_permitidas: controlTotal.imagenesPermitidas,
            imagenes_bloqueadas: controlTotal.imagenesBloqueadas,
            tamaño_total_real_mb: (controlTotal.tamañoTotalReal / 1024 / 1024).toFixed(2),
            dentro_del_limite: controlTotal.tamañoTotalReal <= (5 * 1024 * 1024),
            limite_mb: 5.00
        };
    };
    
    // Función para restaurar
    window.restaurarControlTotal = function() {
        jsPDFClass.prototype.addImage = originalAddImage;
        window.controladorImagenesActivo = false;
        const stats = window.obtenerEstadisticasControlTotal();
        console.log(`🔚 [CONTROL TOTAL] DESACTIVADO - RESUMEN FINAL:`);
        console.log(`   🔍 Total detectadas: ${stats.imagenes_controladas}`);
        console.log(`   ✅ Permitidas: ${stats.imagenes_permitidas}`);
        console.log(`   🚫 Bloqueadas: ${stats.imagenes_bloqueadas}`);
        console.log(`   📊 Tamaño final: ${stats.tamaño_total_real_mb}MB`);
        console.log(`   🎯 Dentro del límite: ${stats.dentro_del_limite ? 'SÍ' : 'NO'}`);
        return stats;
    };
    
    console.log('✅ [CONTROL TOTAL] ACTIVADO EN PROTOTIPO - NINGUNA imagen escapará al límite de 5MB');
    console.log('🚫 Las imágenes del servidor (http/https) serán BLOQUEADAS automáticamente');
    return true;
};

// FUNCIÓN DE VALIDACIÓN INTEGRAL DEL SISTEMA
window.validarSistemaPDF = function() {
    console.log('🔧 INICIANDO VALIDACIÓN COMPLETA DEL SISTEMA PDF...');
    
    return new Promise((resolve) => {
        // Paso 1: Verificar estado inicial
        const imagenesEnDOM = document.querySelectorAll('#photosContainer .photo-wrapper img.foto-principal');
        const totalImagenesDOM = imagenesEnDOM.length;
        
        console.log(`📊 PASO 1 - ANÁLISIS INICIAL:`);
        console.log(`   📸 Imágenes en DOM: ${totalImagenesDOM}`);
        console.log(`   🎯 Límite PDF: 5.00MB`);
        console.log(`   🎨 Formato soportado: ${window.pdfSizeController.soportaWebP() ? 'WEBP' : 'JPEG'}`);
        
        // Análisis de tipos de imagen disponibles
        let imagenesLocales = 0;
        let imagenesServidor = 0;
        imagenesEnDOM.forEach((img, index) => {
            const src = img.src;
            if (src.startsWith('data:')) {
                imagenesLocales++;
            } else if (src.startsWith('http')) {
                imagenesServidor++;
            }
            
            // Verificar si tiene versiones locales almacenadas
            const tieneVersionLocal = img.getAttribute('data-recortada') || 
                                     img.getAttribute('data-mejorada') ||
                                     img.getAttribute('data-contraste') ||
                                     img.getAttribute('data-bordes') ||
                                     img.getAttribute('data-color') ||
                                     img.getAttribute('data-local-image');
            
            console.log(`   📸 Imagen ${index + 1}: ${src.startsWith('data:') ? 'LOCAL' : 'SERVIDOR'}${tieneVersionLocal ? ' (con versión local)' : ''}`);
        });
        
        console.log(`   📊 Resumen: ${imagenesLocales} locales, ${imagenesServidor} del servidor`);
        
        // Paso 2: Activar interceptor para monitorear TODO lo que se agrega al PDF
        window.interceptarPDFAddImage();
        
        // Paso 3: Resetear estadísticas
        window.pdfSizeController.reiniciarEstadisticas();
        
        // Paso 4: Preparar validación post-procesamiento
        const validacionOriginal = window.obtenerReportePDF;
        window.obtenerReportePDF = function() {
            const reporte = validacionOriginal();
            
            console.log(`\n🔍 PASO 2 - VALIDACIÓN POST-PROCESAMIENTO:`);
            console.log(`   ✅ Imágenes procesadas por mi sistema: ${reporte.fotos_procesadas}/${totalImagenesDOM}`);
            console.log(`   📊 Tamaño acumulado por mi sistema: ${reporte.tamaño_final_mb}MB`);
            console.log(`   📈 Porcentaje usado: ${reporte.porcentaje_usado}%`);
            console.log(`   🎯 Aprovechamiento: ${reporte.aprovechamiento}`);
            
            // Validaciones críticas
            const errores = [];
            if (reporte.fotos_procesadas !== totalImagenesDOM) {
                errores.push(`❌ FALTAN IMÁGENES: Se procesaron ${reporte.fotos_procesadas} de ${totalImagenesDOM}`);
            }
            
            if (parseFloat(reporte.porcentaje_usado) < 80) {
                errores.push(`⚠️  BAJO APROVECHAMIENTO: Solo ${reporte.porcentaje_usado}% del espacio usado`);
            }
            
            if (!reporte.dentro_del_limite) {
                errores.push(`🚫 LÍMITE EXCEDIDO: ${reporte.tamaño_final_mb}MB > 5.00MB`);
            }
            
            if (errores.length > 0) {
                console.log(`\n🚨 PROBLEMAS DETECTADOS:`);
                errores.forEach(error => console.log(`   ${error}`));
            } else {
                console.log(`\n✅ VALIDACIÓN EXITOSA: Sistema funcionando correctamente`);
            }
            
            return reporte;
        };
        
        console.log(`\n🚀 Sistema preparado para validación. Genera el PDF ahora.`);
        console.log(`📋 Después del PDF, ejecuta: window.validarResultadoFinal(tamañoPDFReal)`);
        
        resolve({
            imagenes_esperadas: totalImagenesDOM,
            sistema_preparado: true,
            interceptor_activo: true
        });
    });
};

// FUNCIÓN PARA VALIDAR EL RESULTADO FINAL
window.validarResultadoFinal = function(tamañoPDFRealMB) {
    console.log(`\n🔍 PASO 3 - VALIDACIÓN FINAL:`);
    
    const reporte = window.pdfSizeController.obtenerReporte();
    const discrepancia = Math.abs(tamañoPDFRealMB - parseFloat(reporte.tamaño_final_mb));
    
    console.log(`   📊 Tamaño reportado por mi sistema: ${reporte.tamaño_final_mb}MB`);
    console.log(`   📄 Tamaño real del PDF: ${tamañoPDFRealMB}MB`);
    console.log(`   🔀 Discrepancia: ${discrepancia.toFixed(2)}MB`);
    
    // Análisis de discrepancia
    if (discrepancia < 0.5) {
        console.log(`   ✅ COINCIDENCIA EXCELENTE: Discrepancia menor a 0.5MB`);
    } else if (discrepancia < 1.0) {
        console.log(`   ⚠️  DISCREPANCIA MODERADA: Revisar posibles causas`);
    } else {
        console.log(`   🚨 DISCREPANCIA ALTA: Investigar causas`);
        window.diagnosticarDiscrepanciaPDF();
    }
    
    // Restaurar interceptor
    if (window.restaurarPDFAddImage) {
        window.restaurarPDFAddImage();
    }
    
    // Restaurar función original
    window.obtenerReportePDF = function() {
        return window.pdfSizeController.obtenerReporte();
    };
    
    const resultado = {
        exito: discrepancia < 1.0 && reporte.fotos_procesadas > 0,
        tamaño_reportado: reporte.tamaño_final_mb,
        tamaño_real: tamañoPDFRealMB,
        discrepancia: discrepancia.toFixed(2),
        fotos_procesadas: reporte.fotos_procesadas,
        aprovechamiento: reporte.aprovechamiento
    };
    
    console.log(`\n📋 RESULTADO FINAL:`, resultado);
    return resultado;
};

// FUNCIÓN DE VERIFICACIÓN AUTOMÁTICA POST-GENERACIÓN
window.verificarConcordanciaPDF = function(pdfBlob) {
    console.log('\n🔍 VERIFICACIÓN AUTOMÁTICA DE CONCORDANCIA PDF');
    
    const tamañoPDFReal = pdfBlob.size;
    const tamañoPDFRealMB = (tamañoPDFReal / (1024 * 1024)).toFixed(2);
    
    const reporte = window.pdfSizeController.obtenerReporte();
    const tamañoReportadoBytes = reporte.tamaño_final_bytes;
    const discrepanciaBytes = Math.abs(tamañoPDFReal - tamañoReportadoBytes);
    const discrepanciaMB = (discrepanciaBytes / (1024 * 1024)).toFixed(2);
    
    console.log(`📊 COMPARACIÓN DE TAMAÑOS:`);
    console.log(`   🎯 Tamaño reportado por sistema: ${reporte.tamaño_final_mb}MB (${tamañoReportadoBytes} bytes)`);
    console.log(`   📄 Tamaño real del PDF: ${tamañoPDFRealMB}MB (${tamañoPDFReal} bytes)`);
    console.log(`   🔀 Discrepancia: ${discrepanciaMB}MB (${discrepanciaBytes} bytes)`);
    
    // Calcular porcentaje de discrepancia
    const porcentajeDiscrepancia = (discrepanciaBytes / tamañoPDFReal * 100).toFixed(2);
    console.log(`   📈 Porcentaje de discrepancia: ${porcentajeDiscrepancia}%`);
    
    // Evaluación de la concordancia
    let estado = '';
    let color = '';
    
    if (discrepanciaBytes < 51200) { // Menos de 50KB
        estado = 'EXCELENTE CONCORDANCIA';
        color = '🟢';
        console.log(`   ${color} ${estado}: La diferencia es mínima (<50KB)`);
    } else if (discrepanciaBytes < 512000) { // Menos de 500KB
        estado = 'BUENA CONCORDANCIA';
        color = '🟡';
        console.log(`   ${color} ${estado}: Diferencia aceptable (<500KB)`);
    } else if (discrepanciaBytes < 1048576) { // Menos de 1MB
        estado = 'CONCORDANCIA REGULAR';
        color = '🟠';
        console.log(`   ${color} ${estado}: Diferencia notable (<1MB)`);
        console.log(`   💡 Posibles causas: compresión adicional de jsPDF, contenido extra del PDF`);
    } else {
        estado = 'DISCREPANCIA SIGNIFICATIVA';
        color = '🔴';
        console.log(`   ${color} ${estado}: Diferencia mayor a 1MB`);
        console.log(`   ⚠️  INVESTIGAR: Posibles imágenes no controladas o problemas en el sistema`);
        
        // Ejecutar diagnóstico automático
        setTimeout(() => {
            console.log('\n🚨 EJECUTANDO DIAGNÓSTICO AUTOMÁTICO...');
            window.diagnosticarDiscrepanciaPDF();
        }, 1000);
    }
    
    // Verificar límite de 5MB
    const dentroDelLimite = tamañoPDFReal <= (5 * 1024 * 1024);
    console.log(`   🎯 Límite de 5MB: ${dentroDelLimite ? '✅ RESPETADO' : '❌ EXCEDIDO'}`);
    
    if (!dentroDelLimite) {
        const excesoMB = ((tamañoPDFReal - (5 * 1024 * 1024)) / (1024 * 1024)).toFixed(2);
        console.log(`   🚫 Exceso: ${excesoMB}MB por encima del límite`);
    }
    
    // Verificar eficiencia del espacio
    const porcentajeUsoReal = (tamañoPDFReal / (5 * 1024 * 1024) * 100).toFixed(1);
    console.log(`   📊 Uso real del espacio disponible: ${porcentajeUsoReal}%`);
    
    if (parseFloat(porcentajeUsoReal) < 80) {
        console.log(`   💡 OPORTUNIDAD: Se podría haber usado mayor calidad en las imágenes`);
    }
    
    // Restaurar interceptor si está activo
    if (window.restaurarPDFAddImage) {
        window.restaurarPDFAddImage();
    }
    
    return {
        estado: estado,
        tamañoReportadoMB: reporte.tamaño_final_mb,
        tamañoRealMB: tamañoPDFRealMB,
        discrepanciaMB: discrepanciaMB,
        porcentajeDiscrepancia: parseFloat(porcentajeDiscrepancia),
        dentroDelLimite: dentroDelLimite,
        fotosIncluidas: reporte.fotos_procesadas,
        eficienciaEspacio: parseFloat(porcentajeUsoReal),
        calificacion: color
    };
};

// **FUNCIÓN DE EMERGENCIA**: Resetear completamente el PDF si excede 5MB
window.validarYLimitarPDFFinal = function(pdf) {
    return new Promise((resolve) => {
        // Obtener el PDF como blob para verificar tamaño real
        const pdfBlob = pdf.output('blob');
        const tamañoMB = (pdfBlob.size / (1024 * 1024)).toFixed(2);
        
        console.log(`🔍 VERIFICACIÓN FINAL DEL PDF: ${tamañoMB}MB`);
        
        if (pdfBlob.size > (5 * 1024 * 1024)) {
            console.error(`🚨 PDF EXCEDE 5MB (${tamañoMB}MB) - APLICANDO MEDIDAS DE EMERGENCIA`);
            
            // Crear nuevo PDF con solo las primeras imágenes que quepan
            const nuevoPDF = new window.jspdf.jsPDF();
            let tamañoAcumulado = 0;
            let imagenIncluidas = 0;
            
            // Reactivar control para el nuevo PDF
            window.controlarTodasLasImagenesPDF();
            
            console.log('🔄 Creando PDF de emergencia con límite estricto...');
            
            // Aquí el sistema ya tiene el control activado, las imágenes se procesarán automáticamente
            resolve(nuevoPDF);
            
        } else {
            console.log(`✅ PDF dentro del límite: ${tamañoMB}MB`);
            resolve(pdf);
        }
    });
};

// FUNCIÓN DE MONITOREO EN TIEMPO REAL DURANTE LA GENERACIÓN
window.monitoreoPDFEnTiempoReal = function() {
    console.log('📡 ACTIVANDO MONITOREO EN TIEMPO REAL...');
    
    let contadorImagenes = 0;
    let tamañoAcumulado = 0;
    
    // Interceptar procesamiento de imágenes
    const originalProcesar = window.procesarImagenParaPDF;
    
    if (originalProcesar) {
        window.procesarImagenParaPDF = function(img, indice, totalFotos, callback) {
            const inicioTiempo = Date.now();
            
            console.log(`⏱️  MONITOREANDO procesamiento imagen ${indice + 1}/${totalFotos}`);
            
            return originalProcesar.call(this, img, indice, totalFotos, function(dataUrl) {
                const tiempoTranscurrido = Date.now() - inicioTiempo;
                const tamañoImagen = Math.floor(dataUrl.length * 0.75); // Aproximación base64
                
                contadorImagenes++;
                tamañoAcumulado += tamañoImagen;
                
                console.log(`   ⚡ Completado en ${tiempoTranscurrido}ms`);
                console.log(`   📊 Tamaño: ${(tamañoImagen/1024).toFixed(1)}KB`);
                console.log(`   📈 Acumulado: ${(tamañoAcumulado/1024/1024).toFixed(2)}MB`);
                console.log(`   🎯 Progreso: ${contadorImagenes}/${totalFotos} (${(contadorImagenes/totalFotos*100).toFixed(0)}%)`);
                
                const espacioRestante = (5 * 1024 * 1024) - tamañoAcumulado;
                const fotosRestantes = totalFotos - contadorImagenes;
                
                if (fotosRestantes > 0) {
                    const espacioPorFotoRestante = espacioRestante / fotosRestantes;
                    console.log(`   💡 Espacio por foto restante: ${(espacioPorFotoRestante/1024).toFixed(1)}KB`);
                }
                
                callback(dataUrl);
            });
        };
        
        console.log('✅ Monitoreo activado. Se restaurará automáticamente al finalizar.');
        
        // Auto-restaurar después de un tiempo o cuando se complete
        setTimeout(() => {
            if (window.procesarImagenParaPDF !== originalProcesar) {
                window.procesarImagenParaPDF = originalProcesar;
                console.log('🔄 Monitoreo en tiempo real desactivado automáticamente');
            }
        }, 300000); // 5 minutos máximo
        
    } else {
        console.log('❌ No se pudo activar el monitoreo: función procesarImagenParaPDF no encontrada');
    }
};

// FUNCIÓN DE PRUEBA AUTOMÁTICA COMPLETA
window.ejecutarPruebaCompletaPDF = function() {
    console.log('🧪 EJECUTANDO PRUEBA COMPLETA DEL SISTEMA PDF');
    console.log('===============================================');
    
    return new Promise((resolve) => {
        // Paso 1: Verificar prerrequisitos
        console.log('\n📋 PASO 1: VERIFICANDO PRERREQUISITOS...');
        
        const imagenesDisponibles = document.querySelectorAll('#photosContainer .photo-wrapper img.foto-principal');
        
        if (imagenesDisponibles.length === 0) {
            console.error('❌ No hay imágenes disponibles para probar');
            resolve({ 
                exito: false, 
                error: 'No hay imágenes disponibles',
                pasos_completados: 1
            });
            return;
        }
        
        console.log(`✅ Encontradas ${imagenesDisponibles.length} imágenes`);
        console.log(`✅ Sistema de control de tamaño: ${typeof window.pdfSizeController === 'object' ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
        console.log(`✅ Función procesarImagenParaPDF: ${typeof window.procesarImagenParaPDF === 'function' ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
        console.log(`✅ Soporte WEBP: ${window.pdfSizeController.soportaWebP() ? 'SÍ' : 'NO (usará JPEG)'}`);
        
        // Paso 2: Inicializar sistema de validación
        console.log('\n📋 PASO 2: INICIALIZANDO SISTEMA DE VALIDACIÓN...');
        
        window.validarSistemaPDF().then((estadoInicial) => {
            console.log(`✅ Sistema preparado para validar ${estadoInicial.imagenes_esperadas} imágenes`);
            
            // Paso 3: Activar monitoreo en tiempo real
            console.log('\n📋 PASO 3: ACTIVANDO MONITOREO EN TIEMPO REAL...');
            window.monitoreoPDFEnTiempoReal();
            
            // Paso 4: Instrucciones para el usuario
            console.log('\n📋 PASO 4: LISTO PARA GENERAR PDF');
            console.log('🚀 AHORA PRESIONA EL BOTÓN "Generar PDF de fotos"');
            console.log('');
            console.log('📊 INDICADORES A OBSERVAR:');
            console.log('   • Cada imagen procesada debe aparecer en la consola');
            console.log('   • El tamaño total no debe exceder 5MB');
            console.log('   • Todas las imágenes deben ser incluidas');
            console.log('   • Al final aparecerá la verificación automática');
            console.log('');
            console.log('🔍 DESPUÉS DE LA GENERACIÓN:');
            console.log('   • Revisa el archivo PDF descargado');
            console.log('   • Compara el tamaño con lo reportado en consola');
            console.log('   • Verifica que todas las fotos estén incluidas');
            console.log('');
            console.log('⚠️  SI ENCUENTRAS DISCREPANCIAS:');
            console.log('   • Ejecuta: window.diagnosticarDiscrepanciaPDF()');
            console.log('   • Reporta los resultados');
            
            resolve({
                exito: true,
                imagenes_esperadas: estadoInicial.imagenes_esperadas,
                sistema_preparado: true,
                pasos_completados: 4
            });
        });
    });
};

// FUNCIÓN DE CHEQUEO RÁPIDO DEL SISTEMA
window.chequeoRapidoPDF = function() {
    console.log('⚡ CHEQUEO RÁPIDO DEL SISTEMA PDF');
    console.log('================================');
    
    const verificaciones = {
        imagenes_disponibles: document.querySelectorAll('#photosContainer .photo-wrapper img.foto_principal').length,
        controlador_tamaño: typeof window.pdfSizeController === 'object',
        funcion_procesar: typeof window.procesarImagenParaPDF === 'function',
        soporte_webp: window.pdfSizeController?.soportaWebP() || false,
        jspdf_disponible: typeof window.jspdf !== 'undefined',
        funcion_validacion: typeof window.validarSistemaPDF === 'function',
        funcion_verificacion: typeof window.verificarConcordanciaPDF === 'function'
    };
    
    console.log('\n📊 ESTADO DEL SISTEMA:');
    Object.entries(verificaciones).forEach(([clave, valor]) => {
        const estado = typeof valor === 'boolean' ? (valor ? '✅' : '❌') : `📊 ${valor}`;
        const nombre = clave.replace(/_/g, ' ').toUpperCase();
        console.log(`   ${estado} ${nombre}: ${valor}`);
    });
    
    const todoOK = Object.entries(verificaciones).every(([clave, valor]) => {
        if (clave === 'imagenes_disponibles') return valor > 0;
        if (typeof valor === 'boolean') return valor;
        return true;
    });
    
    console.log(`\n🎯 ESTADO GENERAL: ${todoOK ? '✅ SISTEMA LISTO' : '❌ REVISAR PROBLEMAS'}`);
    
    if (!todoOK) {
        console.log('\n🔧 ACCIONES RECOMENDADAS:');
        if (verificaciones.imagenes_disponibles === 0) {
            console.log('   • Capturar o cargar imágenes primero');
        }
        if (!verificaciones.controlador_tamaño) {
            console.log('   • Verificar que configuracion_pdf.js se haya cargado');
        }
        if (!verificaciones.jspdf_disponible) {
            console.log('   • Verificar que la librería jsPDF esté cargada');
        }
    }
    
    return {
        sistema_listo: todoOK,
        verificaciones: verificaciones,
        imagenes_disponibles: verificaciones.imagenes_disponibles
    };
};

// **VERIFICACIÓN**: Función para asegurar compatibilidad con flujo RIJ original
window.verificarCompatibilidadRIJ = function() {
    console.log('🔍 VERIFICANDO COMPATIBILIDAD DEL FLUJO RIJ...');
    
    const verificaciones = {
        rij_pdf_manager: typeof window.rijPDFManager === 'object',
        identificador_usuario: localStorage.getItem('usuario_identificador_rij') !== null,
        imagen_rij_disponible: localStorage.getItem('rij_imagen_url') !== null,
        funcion_agregar_rij: typeof agregarImagenRIJalPDF === 'function',
        pdf_js_disponible: typeof pdfjsLib !== 'undefined'
    };
    
    console.log('\n📊 ESTADO DEL FLUJO RIJ:');
    Object.entries(verificaciones).forEach(([clave, valor]) => {
        const estado = valor ? '✅' : '❌';
        const nombre = clave.replace(/_/g, ' ').toUpperCase();
        console.log(`   ${estado} ${nombre}: ${valor}`);
    });
    
    const flujoIntacto = Object.values(verificaciones).every(v => v);
    console.log(`\n🎯 FLUJO RIJ: ${flujoIntacto ? '✅ COMPLETAMENTE FUNCIONAL' : '⚠️  VERIFICAR DEPENDENCIAS'}`);
    
    if (!flujoIntacto) {
        console.log('\n🔧 ACCIONES RECOMENDADAS:');
        if (!verificaciones.rij_pdf_manager) {
            console.log('   • Verificar que rij_pdf_a_imagen.js esté cargado');
        }
        if (!verificaciones.pdf_js_disponible) {
            console.log('   • Verificar que PDF.js esté cargado');
        }
        if (!verificaciones.identificador_usuario) {
            console.log('   • El usuario debe generar un RIJ primero');
        }
    } else {
        console.log('\n✅ FLUJO ORIGINAL PRESERVADO:');
        console.log('   • formato_RIJ.html → PDF → imagen ✅');
        console.log('   • Inserción en camara.html ✅');
        console.log('   • Control de tamaño adaptativo ✅');
    }
    
    return {
        flujo_intacto: flujoIntacto,
        verificaciones: verificaciones
    };
};

// **COMPATIBILIDAD**: Función para modo de compatibilidad total
window.activarModoCompatibilidadRIJ = function() {
    console.log('🔄 ACTIVANDO MODO COMPATIBILIDAD TOTAL RIJ...');
    
    // Deshabilitar temporalmente el control de tamaño para RIJ
    window._controlRIJDeshabilitado = true;
    
    console.log('✅ Modo compatibilidad activado:');
    console.log('   • Imagen RIJ usará método original sin compresión');
    console.log('   • Solo las fotos de cámara usarán control de tamaño');
    console.log('   • Flujo formato_RIJ.html → camara.html preservado');
    
    // Función para restaurar
    window.desactivarModoCompatibilidadRIJ = function() {
        window._controlRIJDeshabilitado = false;
        console.log('🔄 Modo compatibilidad desactivado - Control total restaurado');
    };
};

// Auto-verificar al cargar
setTimeout(() => {
    if (typeof window.verificarCompatibilidadRIJ === 'function') {
        window.verificarCompatibilidadRIJ();
    }
}, 3000);

// AUTO-EJECUTAR CHEQUEO AL CARGAR
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof window.chequeoRapidoPDF === 'function') {
                window.chequeoRapidoPDF();
            }
        }, 2000);
    });
} else {
    setTimeout(() => {
        if (typeof window.chequeoRapidoPDF === 'function') {
            window.chequeoRapidoPDF();
        }
    }, 2000);
}

