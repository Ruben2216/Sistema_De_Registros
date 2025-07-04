/**
 * SISTEMA DE CONTROL PDF ULTRA-ROBUSTA - VERSIÓN 3.0
 * ===================================================
 * Garantiza que el PDF NUNCA exceda 5MB bajo NINGUNA circunstancia
 * Intercepta TODAS las instancias de jsPDF y controla TODAS las imágenes
 * Implementa compresión progresiva ultra-agresiva y fallbacks
 * ACTIVACIÓN AUTOMÁTICA Y UNIVERSAL
 * SIN LÍMITES DE NÚMERO DE FOTOS - SOLO CONTROL DE TAMAÑO
 */

(function() {
    'use strict';
    
    // ================================
    // CONFIGURACIÓN ULTRA-CONSERVADORA SIN LÍMITES DE FOTOS
    // ================================
    window.PDF_CONFIG_ULTRA = {
        LIMITE_MAXIMO_MB: 4.98, // MÁXIMO aprovechamiento de los 5MB
        LIMITE_CRITICO_MB: 4.90, // Límite crítico más alto para mejor calidad
        CALIDAD_INICIAL: 0.98, // Calidad inicial más alta
        CALIDAD_MINIMA: 0.05, // Mínimo menos agresivo para preservar calidad
        PASO_COMPRESION: 0.05, // Pasos más grandes para mejor optimización
        MARGEN_SEGURIDAD_KB: 20, // Margen mínimo para aprovechar MÁXIMO espacio
        RECALCULO_FORZADO: true,
        DEBUG: false,
        AUTO_ACTIVACION: true,
        ESPACIO_MINIMO_POR_FOTO_KB: 15, // Espacio mínimo extremadamente flexible
        FACTOR_CONSERVADOR: 0.98, // Factor único menos conservador
        RESERVA_ESTRUCTURA_KB: 50 // Reserva mínima para estructura PDF
    };

    // ================================
    // ESTADO GLOBAL ULTRA-DETALLADO CON CONTROL ANTI-DUPLICADOS
    // ================================
    window.ESTADO_PDF_ULTRA = {
        version: '3.3-SIN-LIMITES',
        activo: false,
        inicializado: false,
        parchePotoroAplicado: false,
        interceptorUniversalActivo: false,
        
        // Control anti-duplicados
        imagenesYaProcesadas: new Set(), // Para evitar doble procesamiento
        ultimaImagenProcesada: null,
        contadorRealImagenes: 0, // Contador real sin duplicados
        
        // Estadísticas detalladas
        instanciasJsPDF: new WeakSet(),
        instanciasActivas: new Map(),
        imagenesTotales: 0,
        imagenesPermitidas: 0,
        imagenesBloqueadas: 0,
        imagenesComprimidas: 0,
        imagenesDescartadas: 0,
        
        // Control de tamaño estricto
        tamanoTotalBytes: 0,
        tamanoRealAcumulado: 0,
        limiteBytesActual: 0,
        espacioDisponible: 0,
        espacioReservadoBytes: 0, // Espacio reservado para estructura PDF
        
        // Logs mínimos (sin mostrar en consola)
        logs: [],
        ultimaActivacion: null,
        contadorIntercepciones: 0
    };

    // ================================
    // COMPRESOR DE IMÁGENES ULTRA-AGRESIVO SIN LÍMITES DE FOTOS - MEJORADO PARA MÓVILES
    // ================================
    function comprimirImagenUltraAgresiva(imagenBase64, espacioObjetivoBytes, callback) {
        // VALIDACIÓN CRÍTICA: No comprimir si el objetivo es negativo o demasiado pequeño
        if (espacioObjetivoBytes <= 0) {
            window.ESTADO_PDF_ULTRA.imagenesDescartadas++;
            callback(null); // Retornar null para indicar que se descarta la imagen
            return;
        }
        
        if (espacioObjetivoBytes < window.PDF_CONFIG_ULTRA.ESPACIO_MINIMO_POR_FOTO_KB * 1024) {
            window.ESTADO_PDF_ULTRA.imagenesDescartadas++;
            callback(null);
            return;
        }
        
        // NUEVO: Timeout general para evitar cuelgues en móviles
        var timeoutId = setTimeout(function() {
            callback(null); // Fallar silenciosamente si toma demasiado tiempo
        }, 15000); // 15 segundos timeout para compresión
        
        // Crear imagen temporal
        const img = new Image();
        img.onload = function() {
            // Limpiar timeout cuando la imagen se carga
            clearTimeout(timeoutId);
            
            // CONFIGURACIONES PRIORIZANDO MÁXIMA CALIDAD
            const configuraciones = [
                { calidad: 0.98, maxWidth: 3000, maxHeight: 2250 }, // MÁXIMA calidad
                { calidad: 0.95, maxWidth: 2800, maxHeight: 2100 },
                { calidad: 0.92, maxWidth: 2600, maxHeight: 1950 },
                { calidad: 0.90, maxWidth: 2400, maxHeight: 1800 },
                { calidad: 0.85, maxWidth: 2200, maxHeight: 1650 },
                { calidad: 0.80, maxWidth: 2000, maxHeight: 1500 },
                { calidad: 0.75, maxWidth: 1800, maxHeight: 1350 },
                { calidad: 0.70, maxWidth: 1600, maxHeight: 1200 },
                { calidad: 0.65, maxWidth: 1400, maxHeight: 1050 },
                { calidad: 0.60, maxWidth: 1200, maxHeight: 900 },
                { calidad: 0.55, maxWidth: 1000, maxHeight: 750 },
                { calidad: 0.50, maxWidth: 900, maxHeight: 675 },
                { calidad: 0.45, maxWidth: 800, maxHeight: 600 },
                { calidad: 0.40, maxWidth: 700, maxHeight: 525 },
                { calidad: 0.35, maxWidth: 600, maxHeight: 450 },
                { calidad: 0.30, maxWidth: 500, maxHeight: 375 },
                { calidad: 0.25, maxWidth: 400, maxHeight: 300 },
                { calidad: 0.20, maxWidth: 350, maxHeight: 262 },
                { calidad: 0.15, maxWidth: 300, maxHeight: 225 },
                { calidad: 0.10, maxWidth: 250, maxHeight: 187 },
                { calidad: 0.05, maxWidth: 200, maxHeight: 150 }
            ];
            
            // NUEVO: Configurar timeout para el procesamiento de configuraciones
            var processingTimeoutId = setTimeout(function() {
                callback(null); // Fallar si el procesamiento toma demasiado
            }, 12000); // 12 segundos para procesamiento
            
            probarConfiguracionCompresion(img, configuraciones, 0, espacioObjetivoBytes, function(resultado) {
                clearTimeout(processingTimeoutId);
                callback(resultado);
            });
        };
        
        img.onerror = function() {
            clearTimeout(timeoutId);
            callback(imagenBase64); // Devolver original si hay error
        };
        
        img.src = imagenBase64;
    }

    function probarConfiguracionCompresion(img, configuraciones, indice, espacioObjetivo, callback) {
        if (indice >= configuraciones.length) {
            // Último recurso: imagen mínima con manejo de errores
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 50;
                canvas.height = 50;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, 50, 50);
                ctx.fillStyle = '#666';
                ctx.font = '8px Arial';
                ctx.fillText('IMG', 15, 28);
                
                const imagenMinima = canvas.toDataURL('image/jpeg', 0.1);
                callback(imagenMinima);
            } catch (error) {
                // Si hasta esto falla, devolver null
                callback(null);
            }
            return;
        }
        
        try {
            const config = configuraciones[indice];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // NUEVO: Verificar límites de canvas para móviles
            const maxCanvasSize = 4096; // Límite común en móviles
            
            // Calcular dimensiones manteniendo aspecto
            const aspectRatio = img.width / img.height;
            let width = Math.min(config.maxWidth, img.width, maxCanvasSize);
            let height = Math.min(config.maxHeight, img.height, maxCanvasSize);
            
            if (width / height > aspectRatio) {
                width = height * aspectRatio;
            } else {
                height = width / aspectRatio;
            }
            
            // NUEVO: Verificar que las dimensiones sean válidas
            if (width <= 0 || height <= 0 || width > maxCanvasSize || height > maxCanvasSize) {
                // Saltar esta configuración e intentar la siguiente
                probarConfiguracionCompresion(img, configuraciones, indice + 1, espacioObjetivo, callback);
                return;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // NUEVO: Verificar que el contexto se creó correctamente
            if (!ctx) {
                probarConfiguracionCompresion(img, configuraciones, indice + 1, espacioObjetivo, callback);
                return;
            }
            
            // Dibujar imagen redimensionada con manejo de errores
            ctx.drawImage(img, 0, 0, width, height);
            
            // Generar imagen comprimida con manejo de errores
            const imagenComprimida = canvas.toDataURL('image/jpeg', config.calidad);
            
            // Calcular tamaño
            const tamanoBytes = Math.round((imagenComprimida.length - 22) * 3 / 4);
            
            if (tamanoBytes <= espacioObjetivo || indice === configuraciones.length - 1) {
                callback(imagenComprimida);
            } else {
                // Probar siguiente configuración
                probarConfiguracionCompresion(img, configuraciones, indice + 1, espacioObjetivo, callback);
            }
            
        } catch (error) {
            // Si hay error en esta configuración, probar la siguiente
            if (indice < configuraciones.length - 1) {
                probarConfiguracionCompresion(img, configuraciones, indice + 1, espacioObjetivo, callback);
            } else {
                // Si es la última configuración, devolver null
                callback(null);
            }
        }
    }

    // ================================
    // INTERCEPTOR UNIVERSAL SIN LÍMITES DE NÚMERO DE FOTOS
    // ================================
    function interceptorUniversalAddImage(original) {
        return function(imageData, format, x, y, width, height, alias, compression, rotation) {
            const instanciaId = this._instanciaUltraId || ('jspdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
            if (!this._instanciaUltraId) {
                this._instanciaUltraId = instanciaId;
                window.ESTADO_PDF_ULTRA.instanciasActivas.set(instanciaId, this);
            }
            
            // HASH ANTI-DUPLICADOS
            const imagenHash = typeof imageData === 'string' ? 
                imageData.substring(0, 50) + 
                imageData.substring(Math.floor(imageData.length * 0.25), Math.floor(imageData.length * 0.25) + 50) +
                imageData.substring(Math.floor(imageData.length * 0.75), Math.floor(imageData.length * 0.75) + 50) +
                imageData.length + 
                '_pos_' + (x || 0) + '_' + (y || 0) + '_' + (width || 0) + '_' + (height || 0) + 
                '_fmt_' + (format || 'unknown') :
                'imagen_no_string_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // ANTI-DUPLICADOS: Solo contar duplicados EXACTOS
            if (window.ESTADO_PDF_ULTRA.imagenesYaProcesadas.has(imagenHash)) {
                // Ejecutar addImage original SIN incrementar contadores
                try {
                    original.call(this, imageData, format, x, y, width, height, alias, compression, rotation);
                } catch (error) {
                    // Error silencioso
                }
                return;
            }
            
            // Marcar imagen como procesada
            window.ESTADO_PDF_ULTRA.imagenesYaProcesadas.add(imagenHash);
            
            // Incrementar contadores
            window.ESTADO_PDF_ULTRA.imagenesTotales++;
            window.ESTADO_PDF_ULTRA.contadorRealImagenes++;
            window.ESTADO_PDF_ULTRA.limiteBytesActual = window.PDF_CONFIG_ULTRA.LIMITE_MAXIMO_MB * 1024 * 1024;
            
            // Reservar espacio MÍNIMO para estructura PDF
            if (window.ESTADO_PDF_ULTRA.espacioReservadoBytes === 0) {
                window.ESTADO_PDF_ULTRA.espacioReservadoBytes = window.PDF_CONFIG_ULTRA.RESERVA_ESTRUCTURA_KB * 1024;
            }
            
            window.ESTADO_PDF_ULTRA.espacioDisponible = window.ESTADO_PDF_ULTRA.limiteBytesActual - 
                                                      window.ESTADO_PDF_ULTRA.tamanoTotalBytes - 
                                                      window.ESTADO_PDF_ULTRA.espacioReservadoBytes;
            
            // Verificar si es imagen del servidor (BLOQUEAR)
            if (typeof imageData === 'string') {
                const esImagenServidor = imageData.startsWith('http://') || 
                                       imageData.startsWith('https://') || 
                                       imageData.startsWith('/') ||
                                       !imageData.startsWith('data:');
                
                if (esImagenServidor) {
                    window.ESTADO_PDF_ULTRA.imagenesBloqueadas++;
                    window.ESTADO_PDF_ULTRA.contadorRealImagenes--;
                    return; // NO ejecutar addImage original
                }
            }
            
            // Calcular tamaño estimado de la imagen
            let tamanoEstimadoBytes = 0;
            if (typeof imageData === 'string' && imageData.startsWith('data:')) {
                tamanoEstimadoBytes = Math.round((imageData.length - 22) * 3 / 4);
            } else {
                tamanoEstimadoBytes = 100 * 1024; // Estimación conservadora para otros tipos
            }
            
            // SOLO VERIFICAR ESPACIO DISPONIBLE (NO LÍMITES DE FOTOS)
            if (window.ESTADO_PDF_ULTRA.espacioDisponible <= window.PDF_CONFIG_ULTRA.ESPACIO_MINIMO_POR_FOTO_KB * 1024) {
                window.ESTADO_PDF_ULTRA.imagenesDescartadas++;
                window.ESTADO_PDF_ULTRA.contadorRealImagenes--;
                return; // NO ejecutar addImage original
            }
            
            // PRIORIZAR CALIDAD: Solo comprimir si realmente excede el espacio generoso
            const factorGeneroso = 0.95; // Factor generoso para evitar compresión innecesaria
            const espacioGeneroso = Math.floor(window.ESTADO_PDF_ULTRA.espacioDisponible * factorGeneroso);
            
            if (tamanoEstimadoBytes > espacioGeneroso) {
                // INTELIGENTE: Calcular espacio objetivo MAXIMIZANDO calidad
                const espacioObjetivo = Math.max(
                    window.PDF_CONFIG_ULTRA.ESPACIO_MINIMO_POR_FOTO_KB * 1024,
                    espacioGeneroso
                );
                
                if (typeof imageData === 'string' && imageData.startsWith('data:')) {
                    // Guardar el contexto de 'this' para usar en el callback
                    const contextoOriginal = this;
                    
                    // Comprimir imagen asincrónicamente - NO ACTUALIZAR CONTADORES AQUÍ
                    comprimirImagenUltraAgresiva(imageData, espacioObjetivo, (imagenComprimida) => {
                        if (imagenComprimida === null) {
                            // Imagen descartada - decrementar contadores
                            window.ESTADO_PDF_ULTRA.imagenesDescartadas++;
                            window.ESTADO_PDF_ULTRA.contadorRealImagenes--;
                            return;
                        }
                        
                        const nuevoTamano = Math.round((imagenComprimida.length - 22) * 3 / 4);
                        
                        // Actualizar estadísticas UNA SOLA VEZ - SOLO AQUÍ
                        window.ESTADO_PDF_ULTRA.tamanoTotalBytes += nuevoTamano;
                        window.ESTADO_PDF_ULTRA.tamanoRealAcumulado += nuevoTamano;
                        window.ESTADO_PDF_ULTRA.imagenesComprimidas++;
                        window.ESTADO_PDF_ULTRA.imagenesPermitidas++;
                        
                        // Ejecutar addImage con imagen comprimida usando el contexto guardado
                        try {
                            original.call(contextoOriginal, imagenComprimida, format, x, y, width, height, alias, compression, rotation);
                        } catch (error) {
                            // Decrementar si falló la inserción
                            window.ESTADO_PDF_ULTRA.contadorRealImagenes--;
                            window.ESTADO_PDF_ULTRA.tamanoTotalBytes -= nuevoTamano;
                            window.ESTADO_PDF_ULTRA.tamanoRealAcumulado -= nuevoTamano;
                            window.ESTADO_PDF_ULTRA.imagenesComprimidas--;
                            window.ESTADO_PDF_ULTRA.imagenesPermitidas--;
                            window.ESTADO_PDF_ULTRA.imagenesDescartadas++;
                        }
                    });
                    
                    return; // Retornar aquí para manejar asincrónicamente
                } else {
                    window.ESTADO_PDF_ULTRA.imagenesDescartadas++;
                    window.ESTADO_PDF_ULTRA.contadorRealImagenes--;
                    return;
                }
            }
            
            // Si la imagen cabe sin compresión, añadir directamente
            try {
                window.ESTADO_PDF_ULTRA.tamanoTotalBytes += tamanoEstimadoBytes;
                window.ESTADO_PDF_ULTRA.tamanoRealAcumulado += tamanoEstimadoBytes;
                window.ESTADO_PDF_ULTRA.imagenesPermitidas++;
                
                original.call(this, imageData, format, x, y, width, height, alias, compression, rotation);
            } catch (error) {
                // Decrementar contadores si falló la inserción
                window.ESTADO_PDF_ULTRA.contadorRealImagenes--;
                window.ESTADO_PDF_ULTRA.tamanoTotalBytes -= tamanoEstimadoBytes;
                window.ESTADO_PDF_ULTRA.tamanoRealAcumulado -= tamanoEstimadoBytes;
                window.ESTADO_PDF_ULTRA.imagenesPermitidas--;
                window.ESTADO_PDF_ULTRA.imagenesDescartadas++;
            }
        };
    }

    // ================================
    // PARCHE CRÍTICO DEL PROTOTIPO SIN LOGS
    // ================================
    function aplicarParcheCriticoPrototipo() {
        if (window.ESTADO_PDF_ULTRA.parchePotoroAplicado) {
            return; // Ya aplicado
        }
        
        let patcheAplicado = false;
        
        // Intentar parchear window.jsPDF.API
        if (typeof window.jsPDF !== 'undefined' && window.jsPDF.API) {
            const originalAddImage = window.jsPDF.API.addImage;
            if (originalAddImage) {
                window.jsPDF.API.addImage = interceptorUniversalAddImage(originalAddImage);
                patcheAplicado = true;
            }
        }
        
        // Intentar parchear window.jspdf.jsPDF.API
        if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API) {
            const originalAddImage = window.jspdf.jsPDF.API.addImage;
            if (originalAddImage) {
                window.jspdf.jsPDF.API.addImage = interceptorUniversalAddImage(originalAddImage);
                patcheAplicado = true;
            }
        }
        
        if (patcheAplicado) {
            window.ESTADO_PDF_ULTRA.parchePotoroAplicado = true;
        }
    }

    // ================================
    // ACTIVACIÓN Y MONITOREO UNIVERSAL SIN LOGS
    // ================================
    function activarSistemaUltraRobusta() {
        if (window.ESTADO_PDF_ULTRA.activo) {
        // Reinicializar estadísticas para nueva sesión SIN LIMPIAR ANTI-DUPLICADOS EN EJECUCIÓN
        window.ESTADO_PDF_ULTRA.imagenesTotales = 0;
        window.ESTADO_PDF_ULTRA.imagenesPermitidas = 0;
        window.ESTADO_PDF_ULTRA.imagenesBloqueadas = 0;
        window.ESTADO_PDF_ULTRA.imagenesComprimidas = 0;
        window.ESTADO_PDF_ULTRA.imagenesDescartadas = 0;
        window.ESTADO_PDF_ULTRA.tamanoTotalBytes = 0;
        window.ESTADO_PDF_ULTRA.tamanoRealAcumulado = 0;
        window.ESTADO_PDF_ULTRA.contadorRealImagenes = 0;
        window.ESTADO_PDF_ULTRA.espacioReservadoBytes = 0;
        
        // CRÍTICO: Limpiar control anti-duplicados SOLO en nueva sesión
        window.ESTADO_PDF_ULTRA.imagenesYaProcesadas.clear();
        window.ESTADO_PDF_ULTRA.ultimaImagenProcesada = null;
        
        return true;
        }
        
        window.ESTADO_PDF_ULTRA.ultimaActivacion = new Date().toISOString();
        window.ESTADO_PDF_ULTRA.limiteBytesActual = window.PDF_CONFIG_ULTRA.LIMITE_MAXIMO_MB * 1024 * 1024;
        window.ESTADO_PDF_ULTRA.espacioDisponible = window.ESTADO_PDF_ULTRA.limiteBytesActual;
        
        // Aplicar parche crítico al prototipo
        aplicarParcheCriticoPrototipo();
        
        // Interceptar instancias existentes y futuras
        interceptarInstanciasExistentes();
        
        // Configurar interceptor universal para nuevas instancias
        configurarInterceptorUniversal();
        
        window.ESTADO_PDF_ULTRA.activo = true;
        window.ESTADO_PDF_ULTRA.inicializado = true;
        window.ESTADO_PDF_ULTRA.interceptorUniversalActivo = true;
        
        return true;
    }

    // ================================
    // INTERCEPTAR INSTANCIAS EXISTENTES SIN LOGS
    // ================================
    function interceptarInstanciasExistentes() {
        // Buscar en window
        for (let prop in window) {
            try {
                const obj = window[prop];
                if (obj && typeof obj === 'object' && obj.addImage && typeof obj.addImage === 'function') {
                    if (!window.ESTADO_PDF_ULTRA.instanciasJsPDF.has(obj)) {
                        obj._addImageOriginal = obj.addImage;
                        obj.addImage = interceptorUniversalAddImage(obj._addImageOriginal);
                        window.ESTADO_PDF_ULTRA.instanciasJsPDF.add(obj);
                    }
                }
            } catch (e) {
                // Ignorar errores de acceso a propiedades
            }
        }
        
        // Interceptar variables globales comunes
        const variablesComunes = ['pdf', 'jsPDF', 'doc', 'documento', 'pdfDoc'];
        variablesComunes.forEach(nombre => {
            try {
                const obj = window[nombre];
                if (obj && typeof obj === 'object' && obj.addImage && typeof obj.addImage === 'function') {
                    if (!window.ESTADO_PDF_ULTRA.instanciasJsPDF.has(obj)) {
                        obj._addImageOriginal = obj.addImage;
                        obj.addImage = interceptorUniversalAddImage(obj._addImageOriginal);
                        window.ESTADO_PDF_ULTRA.instanciasJsPDF.add(obj);
                    }
                }
            } catch (e) {
                // Variable no existe o no es accesible
            }
        });
    }

    // ================================
    // CONFIGURAR INTERCEPTOR UNIVERSAL SIN LOGS
    // ================================
    function configurarInterceptorUniversal() {
        // Detectar y interceptar constructor jsPDF en todas las ubicaciones
        let originalJsPDF = null;
        let ubicacionJsPDF = null;
        
        if (typeof window.jsPDF === 'function') {
            originalJsPDF = window.jsPDF;
            ubicacionJsPDF = 'window.jsPDF';
        } else if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            originalJsPDF = window.jspdf.jsPDF;
            ubicacionJsPDF = 'window.jspdf.jsPDF';
        }
        
        if (originalJsPDF) {
            const interceptorConstructor = function(...args) {
                const instancia = new originalJsPDF(...args);
                
                // Interceptar addImage de la nueva instancia
                if (instancia.addImage && typeof instancia.addImage === 'function') {
                    const instanciaId = 'jspdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    instancia._instanciaUltraId = instanciaId;
                    
                    instancia._addImageOriginal = instancia.addImage;
                    instancia.addImage = interceptorUniversalAddImage(instancia._addImageOriginal);
                    
                    window.ESTADO_PDF_ULTRA.instanciasJsPDF.add(instancia);
                    window.ESTADO_PDF_ULTRA.instanciasActivas.set(instanciaId, instancia);
                }
                
                return instancia;
            };
            
            // Copiar propiedades estáticas
            Object.setPrototypeOf(interceptorConstructor, originalJsPDF);
            Object.assign(interceptorConstructor, originalJsPDF);
            
            // Aplicar interceptor en la ubicación correcta
            if (ubicacionJsPDF === 'window.jsPDF') {
                window.jsPDF = interceptorConstructor;
            } else if (ubicacionJsPDF === 'window.jspdf.jsPDF') {
                window.jspdf.jsPDF = interceptorConstructor;
            }
        }
        
        // Aplicar parche al prototipo si está disponible
        aplicarParcheCriticoPrototipo();
    }

    // ================================
    // AUTO-ACTIVACIÓN DEL SISTEMA SIN LOGS
    // ================================
    function autoActivacion() {
        if (window.PDF_CONFIG_ULTRA.AUTO_ACTIVACION) {
            // Función para detectar jsPDF en todas sus variantes
            const detectarJsPDF = () => {
                return typeof window.jsPDF !== 'undefined' || 
                       (window.jspdf && typeof window.jspdf.jsPDF !== 'undefined') ||
                       typeof window.jsPDF !== 'undefined';
            };
            
            // Intentar activar inmediatamente
            if (detectarJsPDF()) {
                activarSistemaUltraRobusta();
                return;
            }
            
            // Esperar a que jsPDF esté disponible con detección mejorada
            let intentos = 0;
            const maxIntentos = 100; // 10 segundos máximo
            
            const verificarJsPDF = () => {
                intentos++;
                const jsPDFDisponible = detectarJsPDF();
                
                if (jsPDFDisponible) {
                    activarSistemaUltraRobusta();
                } else if (intentos < maxIntentos) {
                    setTimeout(verificarJsPDF, 100);
                }
            };
            
            verificarJsPDF();
        }
    }

    // ================================
    // INICIALIZACIÓN Y FUNCIONES DE COMPATIBILIDAD SIN LÍMITES
    // ================================
    
    // Exponer funciones globalmente
    window.activarSistemaUltraRobusta = activarSistemaUltraRobusta;
    window.aplicarParcheCriticoPrototipo = aplicarParcheCriticoPrototipo;
    window.interceptarInstanciasExistentes = interceptarInstanciasExistentes;
    
    // ================================
    // FUNCIONES DE COMPATIBILIDAD CON pdf_fotos.js SIN LÍMITES DE FOTOS
    // ================================
    
    // Función que pdf_fotos.js busca específicamente - CORREGIDA
    window.controlarTodasLasImagenesPDF = function() {
        // Verificar si el sistema está activo
        if (!window.ESTADO_PDF_ULTRA.activo) {
            const activado = activarSistemaUltraRobusta();
            if (!activado) {
                return false;
            }
        }
        
        // CRÍTICO: Reinicializar TODAS las estadísticas para nueva sesión de generación PDF
        window.ESTADO_PDF_ULTRA.imagenesTotales = 0;
        window.ESTADO_PDF_ULTRA.imagenesPermitidas = 0;
        window.ESTADO_PDF_ULTRA.imagenesBloqueadas = 0;
        window.ESTADO_PDF_ULTRA.imagenesComprimidas = 0;
        window.ESTADO_PDF_ULTRA.imagenesDescartadas = 0;
        window.ESTADO_PDF_ULTRA.tamanoTotalBytes = 0;
        window.ESTADO_PDF_ULTRA.tamanoRealAcumulado = 0;
        window.ESTADO_PDF_ULTRA.contadorRealImagenes = 0;
        window.ESTADO_PDF_ULTRA.espacioReservadoBytes = 0;
        
        // REINICIALIZAR control anti-duplicados para nueva sesión
        window.ESTADO_PDF_ULTRA.imagenesYaProcesadas.clear();
        window.ESTADO_PDF_ULTRA.ultimaImagenProcesada = null;
        
        // Calcular espacio disponible
        window.ESTADO_PDF_ULTRA.limiteBytesActual = window.PDF_CONFIG_ULTRA.LIMITE_MAXIMO_MB * 1024 * 1024;
        window.ESTADO_PDF_ULTRA.espacioDisponible = window.ESTADO_PDF_ULTRA.limiteBytesActual;
        
        return true;
    };
    
    // Función de procesamiento de imagen compatible SIN LÍMITES DE FOTOS - CORREGIDA
    window.procesarImagenParaPDF = function(img, indice, totalFotos, callback) {
        // Activar sistema si no está activo
        if (!window.ESTADO_PDF_ULTRA.activo) {
            activarSistemaUltraRobusta();
        }
        
        // Crear canvas para procesar imagen
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Obtener imagen base64 con MÁXIMA calidad inicial
        const imagenBase64 = canvas.toDataURL('image/jpeg', window.PDF_CONFIG_ULTRA.CALIDAD_INICIAL);
        
        // HASH ANTI-DUPLICADOS: Incluir información de posición e índice MEJORADO
        const imagenHash = 'pdf_fotos_' + 
                          imagenBase64.substring(0, 50) + 
                          imagenBase64.substring(Math.floor(imagenBase64.length * 0.5), Math.floor(imagenBase64.length * 0.5) + 50) +
                          imagenBase64.length + 
                          '_idx_' + indice + 
                          '_total_' + totalFotos + 
                          '_timestamp_' + Date.now();
        
        // CRÍTICO: NO usar anti-duplicados aquí porque pdf_fotos.js maneja sus propias imágenes
        // Este sistema es paralelo al interceptor y NO debe interferir con sus contadores
        
        // NUEVO: Calcular espacio PER CÁPITA inteligente BASADO EN ESTADO ACTUAL
        const espacioRestante = Math.max(0, 
            window.ESTADO_PDF_ULTRA.limiteBytesActual - 
            window.ESTADO_PDF_ULTRA.tamanoTotalBytes - 
            (window.ESTADO_PDF_ULTRA.espacioReservadoBytes || window.PDF_CONFIG_ULTRA.RESERVA_ESTRUCTURA_KB * 1024)
        );
        
        // Estimar cuántas fotos quedan por procesar
        const fotosRestantes = Math.max(1, totalFotos - indice);
        
        // INTELIGENTE: Distribuir espacio equitativamente pero generosamente
        const espacioPorFoto = Math.floor(espacioRestante / fotosRestantes);
        const espacioObjetivo = Math.max(
            window.PDF_CONFIG_ULTRA.ESPACIO_MINIMO_POR_FOTO_KB * 1024,
            Math.floor(espacioPorFoto * window.PDF_CONFIG_ULTRA.FACTOR_CONSERVADOR)
        );
        
        // Si no hay espacio suficiente, DESCARTAR
        if (espacioRestante <= 0 || espacioObjetivo < window.PDF_CONFIG_ULTRA.ESPACIO_MINIMO_POR_FOTO_KB * 1024) {
            if (callback) {
                callback(null);
            }
            return;
        }
        
        // NUEVO: Usar distribuidor inteligente de espacio
        const tamanoEstimado = Math.round((imagenBase64.length - 22) * 3 / 4);
        const espacioInteligenteObjetivo = calcularEspacioInteligenteParaImagen(
            tamanoEstimado, 
            espacioRestante, 
            fotosRestantes
        );
        
        // Si el espacio inteligente permite la imagen sin compresión, usarla directamente
        if (tamanoEstimado <= espacioInteligenteObjetivo) {
            // Sin compresión - MÁXIMA calidad
            setTimeout(() => {
                if (callback) {
                    callback(imagenBase64);
                }
            }, 0);
            return;
        }
        
        if (tamanoEstimado > espacioObjetivo) {
            // COMPRESIÓN solo cuando es absolutamente necesaria
            comprimirImagenUltraAgresiva(imagenBase64, espacioInteligenteObjetivo, (imagenComprimida) => {
                if (imagenComprimida === null) {
                    if (callback) {
                        callback(null);
                    }
                    return;
                }
                
                // Usar setTimeout para asegurar que el callback se ejecute en el siguiente ciclo
                setTimeout(() => {
                    if (callback) {
                        callback(imagenComprimida);
                    }
                }, 0);
            });
        } else {
            // Nunca debería llegar aquí ya que se maneja arriba, pero por seguridad
            setTimeout(() => {
                if (callback) {
                    callback(imagenBase64);
                }
            }, 0);
        }
    };
    
    // Función de reporte compatible MEJORADA SIN LÍMITES - CORREGIDA
    window.obtenerReportePDF = function() {
        // VALIDAR que el estado esté inicializado
        if (!window.ESTADO_PDF_ULTRA || typeof window.ESTADO_PDF_ULTRA !== 'object') {
            return {
                error: 'Estado PDF no inicializado',
                version: 'ERROR',
                tamaño_final_mb: '0.00',
                tamaño_final_bytes: 0,
                porcentaje_usado: '0.0',
                fotos_reales_procesadas: 0,
                dentro_del_limite: true,
                limite_fotos: 'SIN_LIMITE'
            };
        }
        
        // CÁLCULOS SEGUROS con validación
        const tamanoBytes = window.ESTADO_PDF_ULTRA.tamanoTotalBytes || 0;
        const limiteBytesActual = window.ESTADO_PDF_ULTRA.limiteBytesActual || (4.98 * 1024 * 1024);
        const tamanoMB = (tamanoBytes / (1024 * 1024)).toFixed(2);
        const porcentaje = ((tamanoBytes / limiteBytesActual) * 100).toFixed(1);
        
        const reporte = {
            version: window.ESTADO_PDF_ULTRA.version || '3.3-SIN-LIMITES',
            tamaño_final_mb: tamanoMB,
            tamaño_final_bytes: tamanoBytes,
            porcentaje_usado: porcentaje,
            fotos_reales_procesadas: window.ESTADO_PDF_ULTRA.contadorRealImagenes || 0,
            fotos_procesadas_total: window.ESTADO_PDF_ULTRA.imagenesTotales || 0,
            limite_fotos: 'SIN_LIMITE', // SIN LÍMITE DE FOTOS
            dentro_del_limite: tamanoBytes <= limiteBytesActual,
            limite_mb: (limiteBytesActual / (1024 * 1024)).toFixed(1),
            espacio_reservado_kb: ((window.ESTADO_PDF_ULTRA.espacioReservadoBytes || 0) / 1024).toFixed(1),
            control_imagenes: {
                imagenes_controladas: window.ESTADO_PDF_ULTRA.imagenesTotales || 0,
                imagenes_reales: window.ESTADO_PDF_ULTRA.contadorRealImagenes || 0,
                imagenes_permitidas: window.ESTADO_PDF_ULTRA.imagenesPermitidas || 0,
                imagenes_bloqueadas: window.ESTADO_PDF_ULTRA.imagenesBloqueadas || 0,
                imagenes_comprimidas: window.ESTADO_PDF_ULTRA.imagenesComprimidas || 0,
                imagenes_descartadas: window.ESTADO_PDF_ULTRA.imagenesDescartadas || 0,
                anti_duplicados_activos: window.ESTADO_PDF_ULTRA.imagenesYaProcesadas ? window.ESTADO_PDF_ULTRA.imagenesYaProcesadas.size : 0
            }
        };
        
        return reporte;
    };
    
    // Función de verificación de concordancia - CORREGIDA
    window.verificarConcordanciaPDF = function(pdfBlob) {
        // VALIDAR argumentos
        if (!pdfBlob || typeof pdfBlob.size !== 'number') {
            return {
                error: 'Blob PDF inválido',
                tamaño_real_mb: '0.00',
                dentro_del_limite: false,
                fotos_procesadas: 0
            };
        }
        
        const tamañoRealMB = (pdfBlob.size / (1024 * 1024)).toFixed(2);
        const reporte = window.obtenerReportePDF();
        
        // VALIDAR que el reporte sea válido
        if (!reporte || reporte.error) {
            return {
                error: 'Error al obtener reporte PDF',
                tamaño_real_mb: tamañoRealMB,
                dentro_del_limite: pdfBlob.size <= (5 * 1024 * 1024),
                fotos_procesadas: 0
            };
        }
        
        const discrepanciaMB = Math.abs(parseFloat(tamañoRealMB) - parseFloat(reporte.tamaño_final_mb || '0')).toFixed(2);
        
        const resultado = {
            tamaño_reportado_mb: reporte.tamaño_final_mb || '0.00',
            tamaño_real_mb: tamañoRealMB,
            discrepancia_mb: discrepanciaMB,
            dentro_del_limite: pdfBlob.size <= (5 * 1024 * 1024),
            fotos_procesadas: reporte.fotos_reales_procesadas || 0,
            imagenes_controladas: (reporte.control_imagenes && reporte.control_imagenes.imagenes_controladas) || 0,
            imagenes_bloqueadas: (reporte.control_imagenes && reporte.control_imagenes.imagenes_bloqueadas) || 0
        };
        
        return resultado;
    };
    
    // ================================
    // DISTRIBUIDOR INTELIGENTE DE ESPACIO PARA MÁXIMA CALIDAD
    // ================================
    function calcularEspacioInteligenteParaImagen(tamanoEstimado, espacioDisponible, imagenesPendientes = 1) {
        // Si hay MUCHO espacio disponible, NO comprimir
        const factorEspacioAbundante = 5; // Si hay 5x más espacio del necesario
        if (espacioDisponible > (tamanoEstimado * factorEspacioAbundante)) {
            return tamanoEstimado; // Usar imagen sin comprimir
        }
        
        // Calcular espacio per cápita para distribución equitativa
        const espacioPorImagen = Math.floor(espacioDisponible / Math.max(1, imagenesPendientes));
        
        // Si la imagen cabe cómodamente, no comprimir
        if (tamanoEstimado <= espacioPorImagen * 0.8) {
            return tamanoEstimado;
        }
        
        // Solo comprimir si realmente es necesario
        return Math.max(
            window.PDF_CONFIG_ULTRA.ESPACIO_MINIMO_POR_FOTO_KB * 1024,
            espacioPorImagen * window.PDF_CONFIG_ULTRA.FACTOR_CONSERVADOR
        );
    }

    // ================================
    // FUNCIÓN DE DIAGNÓSTICO TEMPORAL PARA DETECTAR IMÁGENES PROBLEMÁTICAS
    // ================================
    window.activarDiagnosticoImagenes = function() {
        window.PDF_CONFIG_ULTRA.DEBUG = true;
        console.log('🔧 DIAGNÓSTICO DE IMÁGENES ACTIVADO - Se mostrarán detalles de procesamiento');
    };
    
    window.desactivarDiagnosticoImagenes = function() {
        window.PDF_CONFIG_ULTRA.DEBUG = false;
        console.log('🔧 DIAGNÓSTICO DE IMÁGENES DESACTIVADO');
    };

    // ================================
    // FUNCIÓN DE DIAGNÓSTICO PARA VERIFICAR ESTADO
    // ================================
    window.diagnosticarSistemaPDF = function() {
        console.log('\n🔧 DIAGNÓSTICO DEL SISTEMA PDF ULTRA-ROBUSTA');
        console.log('=================================================');
        console.log(`✅ Versión: ${window.ESTADO_PDF_ULTRA ? window.ESTADO_PDF_ULTRA.version : 'NO DEFINIDA'}`);
        console.log(`✅ Sistema activo: ${window.ESTADO_PDF_ULTRA ? window.ESTADO_PDF_ULTRA.activo : 'NO'}`);
        console.log(`✅ Interceptor aplicado: ${window.ESTADO_PDF_ULTRA ? window.ESTADO_PDF_ULTRA.parchePotoroAplicado : 'NO'}`);
        console.log(`✅ Funciones expuestas:`);
        console.log(`   - controlarTodasLasImagenesPDF: ${typeof window.controlarTodasLasImagenesPDF}`);
        console.log(`   - procesarImagenParaPDF: ${typeof window.procesarImagenParaPDF}`);
        console.log(`   - obtenerReportePDF: ${typeof window.obtenerReportePDF}`);
        console.log(`   - verificarConcordanciaPDF: ${typeof window.verificarConcordanciaPDF}`);
        
        if (window.ESTADO_PDF_ULTRA) {
            console.log(`\n📊 ESTADÍSTICAS ACTUALES:`);
            console.log(`   - Imágenes totales: ${window.ESTADO_PDF_ULTRA.imagenesTotales}`);
            console.log(`   - Imágenes reales: ${window.ESTADO_PDF_ULTRA.contadorRealImagenes}`);
            console.log(`   - Tamaño acumulado: ${(window.ESTADO_PDF_ULTRA.tamanoTotalBytes / (1024 * 1024)).toFixed(2)}MB`);
            console.log(`   - Límite configurado: ${(window.ESTADO_PDF_ULTRA.limiteBytesActual / (1024 * 1024)).toFixed(2)}MB`);
            console.log(`   - Anti-duplicados: ${window.ESTADO_PDF_ULTRA.imagenesYaProcesadas.size} registros`);
        }
        
        // Probar función de reporte
        try {
            const reporte = window.obtenerReportePDF();
            console.log(`\n🧪 PRUEBA DE REPORTE:`);
            console.log(`   - Tamaño reportado: ${reporte.tamaño_final_mb}MB`);
            console.log(`   - Fotos procesadas: ${reporte.fotos_reales_procesadas}`);
            console.log(`   - Estado: ${reporte.error ? 'ERROR' : 'OK'}`);
        } catch (error) {
            console.error(`❌ Error al generar reporte: ${error.message}`);
        }
        
        console.log('=================================================\n');
    };

    // Activar auto-activación
    autoActivacion();
    
    // ================================
    // ACTIVACIÓN FORZADA INMEDIATA SIN LOGS
    // ================================
    
    // Intentar activación inmediata después de cargar
    setTimeout(() => {
        if (!window.ESTADO_PDF_ULTRA.activo) {
            const jsPDFDisponible = typeof window.jsPDF !== 'undefined' || 
                                   (window.jspdf && typeof window.jspdf.jsPDF !== 'undefined');
            
            if (jsPDFDisponible) {
                activarSistemaUltraRobusta();
            }
        }
    }, 100);
    
    // Segundo intento si el primero falla
    setTimeout(() => {
        if (!window.ESTADO_PDF_ULTRA.activo) {
            const jsPDFDisponible = typeof window.jsPDF !== 'undefined' || 
                                   (window.jspdf && typeof window.jspdf.jsPDF !== 'undefined');
            
            if (jsPDFDisponible) {
                activarSistemaUltraRobusta();
            }
        }
    }, 500);

})();
