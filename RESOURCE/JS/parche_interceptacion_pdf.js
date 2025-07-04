/**
 * PARCHE DE INTERCEPTACIÓN PARA PDF_FOTOS.JS
 * Garantiza que el control se active ANTES de generar cualquier PDF
 */

console.log('🔧 CARGANDO PARCHE DE INTERCEPTACIÓN PDF...');

// **INTERCEPTOR PARA GENERARPDFCOMPLETO**
(function() {
    // Esperar a que el DOM esté listo y luego interceptar
    function aplicarParche() {
        // Buscar la función generarPDFCompleto en el contexto global
        if (typeof window.generarPDFCompleto === 'function') {
            console.log('🎯 Interceptando generarPDFCompleto...');
            
            const originalGenerarPDF = window.generarPDFCompleto;
            window.generarPDFCompleto = function(...args) {
                console.log('🛡️ PARCHE: Forzando activación de control antes de PDF...');
                
                // **FORZAR ACTIVACIÓN DEL CONTROL**
                if (!window.controladorImagenesPDF || !window.controladorImagenesPDF.activo) {
                    console.log('🔄 Activando control desde parche...');
                    if (typeof window.controlarTodasLasImagenesPDF === 'function') {
                        const activado = window.controlarTodasLasImagenesPDF();
                        if (activado) {
                            console.log('✅ Control activado exitosamente desde parche');
                        } else {
                            console.error('❌ FALLO: No se pudo activar control desde parche');
                        }
                    }
                }
                
                // **VERIFICAR QUE EL CONTROL ESTÉ FUNCIONANDO**
                if (typeof window.probarSistemaPDF === 'function') {
                    console.log('🧪 Verificando funcionamiento del control...');
                    const funcionaCorrectamente = window.probarSistemaPDF();
                    if (!funcionaCorrectamente) {
                        console.error('❌ ADVERTENCIA: El control no funciona correctamente');
                    }
                }
                
                // Llamar función original
                return originalGenerarPDF.apply(this, args);
            };
            
            console.log('✅ Parche de generarPDFCompleto aplicado');
        } else {
            console.log('⚠️ generarPDFCompleto no encontrado, buscando alternativas...');
            
            // Buscar otras funciones que puedan generar PDFs
            const funcionesPDF = [
                'generarPDF',
                'crearPDF',
                'descargarPDF',
                'exportarPDF'
            ];
            
            funcionesPDF.forEach(nombreFuncion => {
                if (typeof window[nombreFuncion] === 'function') {
                    console.log(`🎯 Interceptando ${nombreFuncion}...`);
                    
                    const originalFuncion = window[nombreFuncion];
                    window[nombreFuncion] = function(...args) {
                        console.log(`🛡️ PARCHE: Control activado antes de ${nombreFuncion}...`);
                        
                        if (!window.controladorImagenesPDF?.activo) {
                            window.controlarTodasLasImagenesPDF?.();
                        }
                        
                        return originalFuncion.apply(this, args);
                    };
                    
                    console.log(`✅ Parche de ${nombreFuncion} aplicado`);
                }
            });
        }
        
        // **INTERCEPTOR PARA EL BOTÓN DE GENERAR PDF**
        const btnGenerar = document.getElementById('btnGenerarPDF');
        if (btnGenerar) {
            console.log('🎯 Interceptando botón de generar PDF...');
            
            // Remover listeners existentes y agregar el nuestro
            const originalClick = btnGenerar.onclick;
            
            btnGenerar.addEventListener('click', function(event) {
                console.log('🛡️ PARCHE: Botón presionado, verificando control...');
                
                // **ACTIVACIÓN FORZADA**
                if (!window.controladorImagenesPDF?.activo) {
                    console.log('🔄 Activando control desde click del botón...');
                    const activado = window.controlarTodasLasImagenesPDF?.();
                    if (!activado) {
                        console.error('❌ CRÍTICO: No se pudo activar el control');
                        alert('Error crítico: No se pudo activar el control de tamaño del PDF. Por favor, recarga la página.');
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }
                }
                
                // **VERIFICACIÓN PRE-GENERACIÓN**
                if (typeof window.validacionRapidaPDF === 'function') {
                    const sistemaListo = window.validacionRapidaPDF();
                    if (!sistemaListo) {
                        console.error('❌ Sistema no está listo para generar PDF');
                        alert('El sistema de control PDF no está completamente cargado. Por favor, espera unos segundos y vuelve a intentar.');
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }
                }
                
                console.log('✅ Control verificado, procediendo con la generación...');
            }, true); // Usar capture para ejecutar antes que otros listeners
            
            console.log('✅ Parche de botón aplicado');
        }
    }
    
    // **INTERCEPTOR PARA INSTANCIAS DE jsPDF**
    function interceptarCreacionjsPDF() {
        if (window.jspdf?.jsPDF || window.jsPDF) {
            console.log('🎯 Interceptando creación de instancias jsPDF...');
            
            const originalConstructor = window.jspdf?.jsPDF || window.jsPDF;
            
            const jsPDFWrapper = function(...args) {
                console.log('🛡️ PARCHE: Nueva instancia de jsPDF creada');
                
                // **FORZAR ACTIVACIÓN SI NO ESTÁ ACTIVA**
                if (!window.controladorImagenesPDF?.activo) {
                    console.log('🔄 Forzando activación desde creación de jsPDF...');
                    window.controlarTodasLasImagenesPDF?.();
                }
                
                // Crear instancia normal
                const instance = new originalConstructor(...args);
                
                // **MONITOREO DE OUTPUT**
                const originalOutput = instance.output;
                instance.output = function(type, options) {
                    const result = originalOutput.call(this, type, options);
                    
                    if (type === 'blob' || type === 'dataurlstring' || !type) {
                        const blob = type === 'blob' ? result : this.output('blob');
                        const tamañoMB = (blob.size / (1024 * 1024)).toFixed(2);
                        
                        console.log(`🔍 PARCHE: PDF generado de ${tamañoMB}MB`);
                        
                        if (blob.size > (5 * 1024 * 1024)) {
                            console.error(`🚨 PARCHE: PDF EXCEDE 5MB (${tamañoMB}MB)`);
                            throw new Error(`PDF excede el límite de 5MB (${tamañoMB}MB). El control de tamaño falló.`);
                        }
                    }
                    
                    return result;
                };
                
                return instance;
            };
            
            // Copiar propiedades
            Object.setPrototypeOf(jsPDFWrapper, originalConstructor);
            for (const prop in originalConstructor) {
                if (prop !== 'length' && prop !== 'name' && prop !== 'prototype') {
                    try {
                        jsPDFWrapper[prop] = originalConstructor[prop];
                    } catch (e) {
                        // Ignorar errores
                    }
                }
            }
            
            // Reemplazar constructor
            if (window.jspdf?.jsPDF) {
                window.jspdf.jsPDF = jsPDFWrapper;
            }
            if (window.jsPDF) {
                window.jsPDF = jsPDFWrapper;
            }
            
            console.log('✅ Parche de jsPDF aplicado');
        }
    }
    
    // Aplicar parches cuando esté todo listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(aplicarParche, 500);
            setTimeout(interceptarCreacionjsPDF, 1000);
        });
    } else {
        setTimeout(aplicarParche, 500);
        setTimeout(interceptarCreacionjsPDF, 1000);
    }
    
    // También aplicar cuando jsPDF esté disponible
    window.addEventListener('jspdfLoaded', () => {
        setTimeout(interceptarCreacionjsPDF, 100);
    });
    
})();

// **MONITOR GLOBAL DE PDFs**
window.monitorGlobalPDF = {
    pdfsGenerados: 0,
    tamañoTotal: 0,
    
    registrarPDF: function(tamaño) {
        this.pdfsGenerados++;
        this.tamañoTotal += tamaño;
        
        console.log(`📊 PDF #${this.pdfsGenerados} registrado: ${(tamaño/1024/1024).toFixed(2)}MB`);
        console.log(`📈 Total acumulado: ${(this.tamañoTotal/1024/1024).toFixed(2)}MB en ${this.pdfsGenerados} PDFs`);
        
        if (tamaño > (5 * 1024 * 1024)) {
            console.error(`🚨 ALERTA GLOBAL: PDF excede límite`);
            
            // Disparar evento de error
            window.dispatchEvent(new CustomEvent('pdfExcedeLimite', {
                detail: { tamaño: tamaño, numero: this.pdfsGenerados }
            }));
        }
    },
    
    obtenerEstadisticas: function() {
        return {
            pdfs_generados: this.pdfsGenerados,
            tamaño_total_mb: (this.tamañoTotal/1024/1024).toFixed(2),
            tamaño_promedio_mb: this.pdfsGenerados > 0 ? (this.tamañoTotal/this.pdfsGenerados/1024/1024).toFixed(2) : '0.00'
        };
    }
};

// **EVENTO DE EMERGENCIA**
window.addEventListener('pdfExcedeLimite', function(event) {
    console.error('🚨 EVENTO DE EMERGENCIA: PDF excede límite');
    
    if (confirm('⚠️ Se ha detectado un PDF que excede 5MB. ¿Deseas activar el modo de reparación de emergencia?')) {
        if (typeof window.repararControlPDFDeEmergencia === 'function') {
            window.repararControlPDFDeEmergencia();
        }
    }
});

console.log('✅ PARCHE DE INTERCEPTACIÓN CARGADO');
console.log('🛡️ Todas las generaciones de PDF serán interceptadas y controladas');
