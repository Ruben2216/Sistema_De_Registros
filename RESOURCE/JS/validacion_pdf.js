/**
 * GUÍA DE VALIDACIÓN DEL SISTEMA PDF
 * ===================================
 * 
 * Este script contiene funciones para validar que el sistema PDF funcione correctamente
 * y que coincida lo reportado en consola con el archivo PDF generado.
 * 
 * OBJETIVO: Asegurar que todas las imágenes se incluyan con la mejor calidad posible
 * dentro del límite de 5MB, sin discrepancias entre el sistema y el resultado final.
 */

// FUNCIÓN PRINCIPAL DE VALIDACIÓN
function validarSistemaCompleto() {
    console.log('🔍 INICIANDO VALIDACIÓN COMPLETA DEL SISTEMA PDF');
    console.log('================================================');
    
    // Ejecutar chequeo rápido primero
    const estadoSistema = window.chequeoRapidoPDF();
    
    if (!estadoSistema.sistema_listo) {
        console.error('❌ Sistema no está listo. Corregir problemas antes de continuar.');
        return false;
    }
    
    // Ejecutar prueba completa
    window.ejecutarPruebaCompletaPDF().then((resultado) => {
        if (resultado.exito) {
            console.log('\n🎉 SISTEMA VALIDADO EXITOSAMENTE');
            console.log('✅ Procede a generar el PDF siguiendo las instrucciones');
        } else {
            console.error('❌ Error durante la validación:', resultado.error);
        }
    });
    
    return true;
}

// FUNCIÓN DE VALIDACIÓN POST-GENERACIÓN
function validarResultadoPDF(archivoPDF) {
    console.log('\n🔍 VALIDANDO RESULTADO DEL PDF GENERADO');
    console.log('=====================================');
    
    if (!archivoPDF) {
        console.error('❌ No se proporcionó el archivo PDF para validar');
        return false;
    }
    
    // Si se proporciona el tamaño en MB
    if (typeof archivoPDF === 'number') {
        return window.validarResultadoFinal(archivoPDF);
    }
    
    // Si se proporciona un blob/archivo
    if (archivoPDF.size) {
        const tamañoMB = archivoPDF.size / (1024 * 1024);
        return window.verificarConcordanciaPDF(archivoPDF);
    }
    
    console.error('❌ Formato de archivo PDF no reconocido');
    return false;
}

// FUNCIÓN DE DIAGNÓSTICO DE PROBLEMAS
function diagnosticarProblemas() {
    console.log('\n🔧 DIAGNÓSTICO DE PROBLEMAS');
    console.log('===========================');
    
    // Ejecutar todos los diagnósticos disponibles
    const diagnosticos = [];
    
    // Diagnóstico del sistema
    if (typeof window.chequeoRapidoPDF === 'function') {
        diagnosticos.push(window.chequeoRapidoPDF());
    }
    
    // Diagnóstico de discrepancias
    if (typeof window.diagnosticarDiscrepanciaPDF === 'function') {
        diagnosticos.push(window.diagnosticarDiscrepanciaPDF());
    }
    
    return diagnosticos;
}

// FUNCIÓN DE PRUEBA RÁPIDA CON IMAGEN DE PRUEBA
function pruebaRapidaConImagenMuestra() {
    console.log('\n🧪 EJECUTANDO PRUEBA RÁPIDA CON IMAGEN DE MUESTRA');
    console.log('==============================================');
    
    // Crear una imagen de prueba
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // Crear patrón de prueba colorido
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(0.5, '#4ECDC4');
    gradient.addColorStop(1, '#45B7D1');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Añadir texto
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('IMAGEN DE PRUEBA', canvas.width/2, canvas.height/2);
    ctx.font = '24px Arial';
    ctx.fillText('Sistema PDF Test', canvas.width/2, canvas.height/2 + 60);
    
    // Convertir a imagen
    canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = function() {
            const img = new Image();
            img.onload = function() {
                console.log('🖼️ Imagen de prueba creada: 800x600px');
                
                // Probar el sistema con esta imagen
                if (typeof window.procesarImagenParaPDF === 'function') {
                    console.log('⚡ Probando sistema con imagen de muestra...');
                    
                    window.pdfSizeController.reiniciarEstadisticas();
                    
                    window.procesarImagenParaPDF(img, 0, 1, function(dataUrlProcesada) {
                        if (dataUrlProcesada) {
                            const tamañoKB = Math.floor(dataUrlProcesada.length * 0.75 / 1024);
                            console.log(`✅ Imagen procesada exitosamente: ${tamañoKB}KB`);
                            
                            const reporte = window.obtenerReportePDF();
                            console.log('📊 Reporte del sistema:', reporte);
                            
                            console.log('\n🎉 PRUEBA RÁPIDA COMPLETADA EXITOSAMENTE');
                        } else {
                            console.error('❌ Error al procesar imagen de prueba');
                        }
                    });
                } else {
                    console.error('❌ Función procesarImagenParaPDF no disponible');
                }
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
}

// MANUAL DE USO
function mostrarManualUso() {
    console.log('\n📖 MANUAL DE USO - VALIDACIÓN SISTEMA PDF');
    console.log('========================================');
    console.log('');
    console.log('🔧 FUNCIONES DISPONIBLES:');
    console.log('');
    console.log('1️⃣ validarSistemaCompleto()');
    console.log('   • Valida que el sistema esté listo');
    console.log('   • Prepara el monitoreo');
    console.log('   • Ejecutar ANTES de generar PDF');
    console.log('');
    console.log('2️⃣ pruebaRapidaConImagenMuestra()');
    console.log('   • Prueba el sistema con imagen artificial');
    console.log('   • Verifica que la compresión funcione');
    console.log('   • Útil para pruebas sin fotos reales');
    console.log('');
    console.log('3️⃣ validarResultadoPDF(tamañoMB)');
    console.log('   • Valida el PDF generado');
    console.log('   • Compara tamaños y detecta discrepancias');
    console.log('   • Ejecutar DESPUÉS de generar PDF');
    console.log('');
    console.log('4️⃣ diagnosticarProblemas()');
    console.log('   • Ejecuta todos los diagnósticos');
    console.log('   • Útil cuando hay problemas');
    console.log('');
    console.log('🚀 FLUJO RECOMENDADO:');
    console.log('   1. validarSistemaCompleto()');
    console.log('   2. Generar PDF normalmente');
    console.log('   3. Observar logs automáticos');
    console.log('   4. Si hay problemas: diagnosticarProblemas()');
    console.log('');
    console.log('⚡ CHEQUEOS AUTOMÁTICOS:');
    console.log('   • window.chequeoRapidoPDF() - Estado actual');
    console.log('   • window.verificarConcordanciaPDF() - Post-generación');
    console.log('   • window.diagnosticarDiscrepanciaPDF() - Análisis detallado');
}

// Exportar funciones al scope global INMEDIATAMENTE
window.validarSistemaCompleto = validarSistemaCompleto;
window.validarResultadoPDF = validarResultadoPDF;
window.diagnosticarProblemas = diagnosticarProblemas;
window.pruebaRapidaConImagenMuestra = pruebaRapidaConImagenMuestra;
window.mostrarManualUso = mostrarManualUso;

// Mostrar manual al cargar
console.log('📋 SISTEMA DE VALIDACIÓN PDF CARGADO');
console.log('💡 Funciones disponibles: validarSistemaCompleto(), diagnosticarProblemas(), mostrarManualUso()');
console.log('🔧 Ejecuta mostrarManualUso() para ver instrucciones completas');

// Ejecutar chequeo automático
if (typeof window.chequeoRapidoPDF === 'function') {
    setTimeout(() => {
        console.log('\n🔍 EJECUTANDO CHEQUEO AUTOMÁTICO...');
        window.chequeoRapidoPDF();
    }, 1000);
}
