// SCRIPT TEMPORAL DE CONTROL PDF SIMPLIFICADO - Usar mientras se arregla el archivo principal
// Ejecutar en consola: 
// const script = document.createElement('script'); script.src = './RESOURCE/JS/control_pdf_temporal.js'; document.head.appendChild(script);

console.log('� CARGANDO CONTROL PDF TEMPORAL...');

// Función de control simplificada que funciona sin problemas de sintaxis
window.activarControlPDFTemporal = function() {
    console.log('🛡️ INICIANDO CONTROL TEMPORAL...');
    
    // Detectar jsPDF
    let jsPDFClass = null;
    let ubicacion = null;
    
    if (window.jspdf && window.jspdf.jsPDF) {
        jsPDFClass = window.jspdf.jsPDF;
        ubicacion = 'window.jspdf.jsPDF';
        console.log('✅ jsPDF detectado en window.jspdf.jsPDF');
    } else if (window.jsPDF) {
        jsPDFClass = window.jsPDF;
        ubicacion = 'window.jsPDF';
        console.log('✅ jsPDF detectado en window.jsPDF');
    } else {
        console.error('❌ jsPDF no encontrado');
        return false;
    }
    
    // Probar creación de instancia
    let testDoc = null;
    try {
        testDoc = new jsPDFClass();
        console.log('✅ Instancia de prueba creada exitosamente');
    } catch (error) {
        console.error('❌ Error creando instancia:', error);
        return false;
    }
    
    if (!testDoc.addImage || typeof testDoc.addImage !== 'function') {
        console.error('❌ addImage no disponible en la instancia');
        return false;
    }
    
    console.log('✅ addImage funciona correctamente');
    
    // Guardar constructor original
    const originalConstructor = jsPDFClass;
    
    // Estadísticas de control
    const stats = {
        total: 0,
        permitidas: 0,
        bloqueadas: 0,
        tamañoMB: 0
    };
    
    // Interceptor de addImage
    function interceptorAddImage(imageData, format, x, y, width, height, ...args) {
        stats.total++;
        console.log(`🔍 [CONTROL TEMPORAL] Imagen #${stats.total}: ${typeof imageData === 'string' ? imageData.substring(0, 50) : 'No string'}...`);
        
        // Bloquear imágenes del servidor
        if (typeof imageData === 'string' && imageData.startsWith('http')) {
            stats.bloqueadas++;
            console.log(`🚫 [CONTROL TEMPORAL] BLOQUEADA imagen del servidor #${stats.bloqueadas}`);
            return; // NO agregar
        }
        
        // Permitir imagen
        stats.permitidas++;
        console.log(`✅ [CONTROL TEMPORAL] PERMITIDA imagen #${stats.permitidas}`);
        
        // Llamar método original de esta instancia específica
        return this.originalAddImage.call(this, imageData, format, x, y, width, height, ...args);
    }
    
    // Wrapper del constructor
    function jsPDFWrapper(...args) {
        const instance = new originalConstructor(...args);
        
        // Guardar función original de esta instancia
        instance.originalAddImage = instance.addImage;
        
        // Reemplazar addImage con interceptor
        instance.addImage = interceptorAddImage;
        
        console.log('🛡️ [CONTROL TEMPORAL] Nueva instancia interceptada');
        return instance;
    }
    
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
    if (ubicacion === 'window.jspdf.jsPDF') {
        window.jspdf.jsPDF = jsPDFWrapper;
    } else if (ubicacion === 'window.jsPDF') {
        window.jsPDF = jsPDFWrapper;
    }
    
    console.log(`✅ [CONTROL TEMPORAL] ACTIVADO desde ${ubicacion}`);
    
    // Función para obtener estadísticas
    window.obtenerStatsTemporales = function() {
        console.log('📊 ESTADÍSTICAS TEMPORALES:');
        console.log(`   🔍 Total imágenes: ${stats.total}`);
        console.log(`   ✅ Permitidas: ${stats.permitidas}`);
        console.log(`   🚫 Bloqueadas: ${stats.bloqueadas}`);
        return stats;
    };
    
    return true;
};

// Activar automáticamente
if (window.activarControlPDFTemporal()) {
    console.log('🎉 CONTROL TEMPORAL ACTIVADO EXITOSAMENTE');
    console.log('📋 Usa window.obtenerStatsTemporales() para ver estadísticas');
} else {
    console.error('❌ FALLO AL ACTIVAR CONTROL TEMPORAL');
}

// Función de prueba para validar el control temporal
window.probarControlTemporal = function() {
    console.log('🧪 PROBANDO CONTROL TEMPORAL...');
    
    // Obtener estadísticas iniciales
    const statsIniciales = window.obtenerStatsTemporales();
    
    // Detectar qué constructor usar
    let PDFClass = null;
    if (window.jspdf && window.jspdf.jsPDF) {
        PDFClass = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
        PDFClass = window.jsPDF;
    } else {
        console.error('❌ jsPDF no disponible para la prueba');
        return false;
    }
    
    // Crear PDF de prueba
    console.log('📄 Creando PDF de prueba...');
    const pdfPrueba = new PDFClass();
    
    // Probar imagen del servidor (debe ser bloqueada)
    console.log('🌐 Probando imagen del servidor (debe ser bloqueada)...');
    try {
        pdfPrueba.addImage('https://example.com/test.jpg', 'JPEG', 10, 10, 50, 50);
    } catch (error) {
        console.log('✅ Imagen del servidor manejada correctamente');
    }
    
    // Probar imagen base64 (debe ser permitida)
    console.log('🏠 Probando imagen base64 (debe ser permitida)...');
    const imagenBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/gA==';
    try {
        pdfPrueba.addImage(imagenBase64, 'JPEG', 10, 70, 50, 50);
    } catch (error) {
        console.log('❌ Error con imagen base64:', error);
    }
    
    // Obtener estadísticas finales
    const statsFinales = window.obtenerStatsTemporales();
    
    // Análisis de resultados
    const diferenciaBloqueadas = statsFinales.bloqueadas - statsIniciales.bloqueadas;
    const diferenciaPermitidas = statsFinales.permitidas - statsIniciales.permitidas;
    
    console.log('📊 RESULTADO DE LA PRUEBA:');
    console.log(`   🔍 Imágenes detectadas: ${statsFinales.total - statsIniciales.total}`);
    console.log(`   🚫 Nuevas bloqueadas: ${diferenciaBloqueadas}`);
    console.log(`   ✅ Nuevas permitidas: ${diferenciaPermitidas}`);
    
    // Validación
    if (diferenciaBloqueadas >= 1 && diferenciaPermitidas >= 1) {
        console.log('🎉 ÉXITO: El control temporal funciona correctamente');
        console.log('✅ Bloquea imágenes del servidor');
        console.log('✅ Permite imágenes base64');
        return true;
    } else {
        console.error('❌ FALLO: El control temporal no funciona como esperado');
        console.error(`   Esperado: 1+ bloqueadas, 1+ permitidas`);
        console.error(`   Obtenido: ${diferenciaBloqueadas} bloqueadas, ${diferenciaPermitidas} permitidas`);
        return false;
    }
};

// Función para reemplazar la función problemática del archivo principal
window.repararControlPrincipal = function() {
    console.log('🔧 REPARANDO FUNCIÓN PRINCIPAL...');
    
    // Reemplazar la función problemática
    if (typeof window.controlarTodasLasImagenesPDF === 'function') {
        window.controlarTodasLasImagenesPDF = function() {
            console.log('🔄 Usando control temporal como reemplazo...');
            return window.activarControlPDFTemporal();
        };
        console.log('✅ Función principal reparada');
    } else {
        console.log('ℹ️ Función principal no encontrada, creando nueva...');
        window.controlarTodasLasImagenesPDF = function() {
            console.log('🔄 Usando control temporal...');
            return window.activarControlPDFTemporal();
        };
    }
    
    return true;
};

console.log('🔧 FUNCIONES DE PRUEBA Y REPARACIÓN CARGADAS');
console.log('🎯 Usa window.probarControlTemporal() para probar');
console.log('🔧 Usa window.repararControlPrincipal() para reparar');
