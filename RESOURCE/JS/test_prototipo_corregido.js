// Test del interceptor de prototipo corregido - Control total de imágenes PDF
// Ejecutar en consola después de cargar jsPDF y configuracion_pdf.js

console.log('🧪 INICIANDO PRUEBA DEL INTERCEPTOR DE PROTOTIPO CORREGIDO...');

// **PASO 1**: Verificar disponibilidad de jsPDF
function verificarEstadoJsPDF() {
    console.log('\n📋 VERIFICANDO ESTADO DE jsPDF:');
    
    const estado = {
        'window.jsPDF': typeof window.jsPDF,
        'window.jspdf': typeof window.jspdf,
        'window.jspdf.jsPDF': typeof window.jspdf?.jsPDF,
        'prototipo jspdf.jsPDF': typeof window.jspdf?.jsPDF?.prototype,
        'addImage en prototipo': typeof window.jspdf?.jsPDF?.prototype?.addImage,
        'window.jsPDF.prototype': typeof window.jsPDF?.prototype,
        'addImage en window.jsPDF': typeof window.jsPDF?.prototype?.addImage
    };
    
    console.table(estado);
    
    // Determinar cuál usar
    if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.prototype && window.jspdf.jsPDF.prototype.addImage) {
        console.log('✅ Se usará: window.jspdf.jsPDF');
        return window.jspdf.jsPDF;
    } else if (window.jsPDF && window.jsPDF.prototype && window.jsPDF.prototype.addImage) {
        console.log('✅ Se usará: window.jsPDF');
        return window.jsPDF;
    } else {
        console.error('❌ jsPDF no disponible o sin prototipo');
        return null;
    }
}

// **PASO 2**: Activar control total corregido
function activarControlCorregido() {
    console.log('\n🛡️ ACTIVANDO CONTROL TOTAL CORREGIDO...');
    
    const resultado = window.controlarTodasLasImagenesPDF();
    if (resultado) {
        console.log('✅ Control total activado correctamente');
        return true;
    } else {
        console.error('❌ Error activando control total');
        return false;
    }
}

// **PASO 3**: Simular creación de PDF con imágenes del servidor y locales
function simularGeneracionPDF() {
    console.log('\n🧪 SIMULANDO GENERACIÓN PDF CON DIFERENTES TIPOS DE IMÁGENES...');
    
    const jsPDFClass = verificarEstadoJsPDF();
    if (!jsPDFClass) {
        console.error('❌ No se puede crear PDF - jsPDF no disponible');
        return;
    }
    
    // Crear nueva instancia de PDF
    const pdf = new jsPDFClass();
    
    console.log('\n📸 PROBANDO DIFERENTES TIPOS DE IMÁGENES:');
    
    // 1. Imagen del servidor (debe ser BLOQUEADA)
    console.log('\n1️⃣ Probando imagen del servidor (debe ser bloqueada):');
    try {
        pdf.addImage('https://example.com/imagen.jpg', 'JPEG', 10, 10, 50, 50);
        console.log('❌ ERROR: Imagen del servidor NO fue bloqueada');
    } catch (error) {
        console.log('✅ Excepción esperada o bloqueo correcto');
    }
    
    // 2. Imagen base64 pequeña (debe ser PERMITIDA)
    console.log('\n2️⃣ Probando imagen base64 pequeña (debe ser permitida):');
    const imagenPequeña = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    try {
        pdf.addImage(imagenPequeña, 'JPEG', 10, 70, 50, 50);
        console.log('✅ Imagen base64 pequeña procesada correctamente');
    } catch (error) {
        console.log('❌ Error procesando imagen base64:', error);
    }
    
    // 3. Otra imagen del servidor HTTP (debe ser BLOQUEADA)
    console.log('\n3️⃣ Probando otra imagen del servidor HTTP (debe ser bloqueada):');
    try {
        pdf.addImage('http://localhost/imagen.png', 'PNG', 10, 130, 50, 50);
        console.log('❌ ERROR: Segunda imagen del servidor NO fue bloqueada');
    } catch (error) {
        console.log('✅ Excepción esperada o bloqueo correcto');
    }
    
    // 4. Imagen base64 duplicada (debe ser BLOQUEADA)
    console.log('\n4️⃣ Probando imagen base64 duplicada (debe ser bloqueada):');
    try {
        pdf.addImage(imagenPequeña, 'JPEG', 10, 190, 50, 50);
        console.log('❌ ERROR: Imagen duplicada NO fue bloqueada');
    } catch (error) {
        console.log('✅ Imagen duplicada bloqueada correctamente');
    }
    
    return pdf;
}

// **PASO 4**: Obtener estadísticas finales
function obtenerEstadisticasFinales() {
    console.log('\n📊 OBTENIENDO ESTADÍSTICAS FINALES...');
    
    if (typeof window.obtenerEstadisticasControlTotal === 'function') {
        const stats = window.obtenerEstadisticasControlTotal();
        console.log('\n📈 ESTADÍSTICAS DEL CONTROL TOTAL:');
        console.table(stats);
        
        // Validaciones críticas
        console.log('\n🔍 VALIDACIONES CRÍTICAS:');
        
        if (stats.imagenes_bloqueadas >= 3) {
            console.log('✅ CRÍTICO: Se bloquearon las imágenes del servidor y duplicadas');
        } else {
            console.error('❌ CRÍTICO: NO se bloquearon todas las imágenes que debían bloquearse');
        }
        
        if (stats.imagenes_permitidas <= 1) {
            console.log('✅ CRÍTICO: Solo se permitió la imagen base64 válida');
        } else {
            console.error('❌ CRÍTICO: Se permitieron más imágenes de las esperadas');
        }
        
        if (parseFloat(stats.tamaño_total_real_mb) < 1.0) {
            console.log('✅ CRÍTICO: Tamaño del PDF se mantiene bajo control');
        } else {
            console.error('❌ CRÍTICO: Tamaño del PDF puede estar fuera de control');
        }
        
        return stats;
    } else {
        console.error('❌ Función obtenerEstadisticasControlTotal no disponible');
        return null;
    }
}

// **EJECUCIÓN PRINCIPAL**
async function ejecutarPruebaCompleta() {
    console.log('🚀 EJECUTANDO PRUEBA COMPLETA DEL INTERCEPTOR CORREGIDO...');
    
    // Verificar estado inicial
    const jsPDFClass = verificarEstadoJsPDF();
    if (!jsPDFClass) {
        console.error('❌ No se puede continuar - jsPDF no disponible');
        return;
    }
    
    // Activar control
    const controlActivado = activarControlCorregido();
    if (!controlActivado) {
        console.error('❌ No se puede continuar - control no activado');
        return;
    }
    
    // Simular generación PDF
    const pdf = simularGeneracionPDF();
    
    // Obtener estadísticas
    const stats = obtenerEstadisticasFinales();
    
    console.log('\n🎯 RESUMEN FINAL DE LA PRUEBA:');
    
    if (stats && stats.imagenes_bloqueadas >= 3 && stats.imagenes_permitidas <= 1) {
        console.log('🎉 ÉXITO: El interceptor de prototipo funciona correctamente');
        console.log('✅ Las imágenes del servidor fueron bloqueadas');
        console.log('✅ Las imágenes duplicadas fueron bloqueadas');
        console.log('✅ Solo las imágenes locales válidas fueron permitidas');
    } else {
        console.error('❌ FALLO: El interceptor de prototipo NO funciona correctamente');
        console.error('❌ Revisar la implementación del control total');
    }
    
    return {
        exitoso: stats && stats.imagenes_bloqueadas >= 3 && stats.imagenes_permitidas <= 1,
        estadisticas: stats,
        pdf_generado: pdf
    };
}

// Ejecutar automáticamente
ejecutarPruebaCompleta().then(resultado => {
    console.log('\n✅ Prueba completada. Resultado:', resultado?.exitoso ? 'ÉXITO' : 'FALLO');
}).catch(error => {
    console.error('❌ Error ejecutando la prueba:', error);
});
