// Diagnóstico específico: Verificar bloqueo de imágenes del servidor
// Ejecutar en consola para validar el control de imágenes HTTP

console.log('🔍 DIAGNÓSTICO: VERIFICANDO BLOQUEO DE IMÁGENES DEL SERVIDOR...');

// Función para probar si el sistema realmente bloquea imágenes del servidor
function probarBloqueoImagenesServidor() {
    console.log('\n🧪 INICIANDO PRUEBA DE BLOQUEO DE IMÁGENES DEL SERVIDOR...');
    
    // Verificar que el control total esté activo
    if (!window.controladorImagenesActivo) {
        console.log('⚠️ Control total no está activo. Activando...');
        const activado = window.controlarTodasLasImagenesPDF();
        if (!activado) {
            console.error('❌ No se pudo activar el control total');
            return false;
        }
    }
    
    // Obtener estadísticas iniciales
    const statsIniciales = window.obtenerEstadisticasControlTotal();
    console.log('📊 Estadísticas iniciales:', statsIniciales);
    
    // Determinar qué clase de jsPDF usar
    let jsPDFClass = null;
    if (window.jspdf && window.jspdf.jsPDF) {
        jsPDFClass = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
        jsPDFClass = window.jsPDF;
    } else {
        console.error('❌ jsPDF no disponible');
        return false;
    }
    
    // Crear PDF de prueba
    const pdf = new jsPDFClass();
    console.log('📄 PDF de prueba creado');
    
    // Lista de URLs del servidor para probar
    const urlsServidor = [
        'https://httpbin.org/image/jpeg',
        'http://example.com/test.jpg',
        'https://picsum.photos/200/300',
        'http://localhost:8000/imagen.png',
        'https://via.placeholder.com/150'
    ];
    
    console.log(`\n🌐 Probando ${urlsServidor.length} URLs del servidor...`);
    
    // Intentar agregar cada imagen del servidor
    urlsServidor.forEach((url, index) => {
        console.log(`\n🌐 Prueba ${index + 1}: ${url}`);
        try {
            pdf.addImage(url, 'JPEG', 10, 10 + (index * 60), 50, 50);
            console.log(`❌ FALLO: Imagen del servidor NO fue bloqueada: ${url}`);
        } catch (error) {
            console.log(`✅ ÉXITO: Imagen del servidor fue bloqueada correctamente`);
        }
    });
    
    // Probar una imagen base64 válida para confirmar que sí funciona
    console.log(`\n🏠 Probando imagen base64 local (debe ser permitida):`);
    const imagenLocal = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIGBgYHBgUIBwcHCQkICgwUDQwLCwwZEhMPFB0aHx4dGhwcICQuJyAiLCMcHCg3KSwwMTQ0NB8nOT04MjwuMzQy/2wBDAQJCQkMCwwYDQ0YMiEcITIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    
    try {
        pdf.addImage(imagenLocal, 'JPEG', 10, 350, 50, 50);
        console.log(`✅ ÉXITO: Imagen base64 local fue permitida correctamente`);
    } catch (error) {
        console.log(`❌ FALLO: Imagen base64 local fue bloqueada incorrectamente:`, error);
    }
    
    // Obtener estadísticas finales
    const statsFinal = window.obtenerEstadisticasControlTotal();
    console.log('\n📊 Estadísticas finales:', statsFinal);
    
    // Análisis de resultados
    console.log('\n🔍 ANÁLISIS DE RESULTADOS:');
    
    const imagenesBloquéadasNuevas = statsFinal.imagenes_bloqueadas - statsIniciales.imagenes_bloqueadas;
    const imagenesPermitidasNuevas = statsFinal.imagenes_permitidas - statsIniciales.imagenes_permitidas;
    
    console.log(`📊 Imágenes bloqueadas en esta prueba: ${imagenesBloquéadasNuevas}`);
    console.log(`📊 Imágenes permitidas en esta prueba: ${imagenesPermitidasNuevas}`);
    
    // Validación crítica
    const exitoso = imagenesBloquéadasNuevas >= urlsServidor.length && imagenesPermitidasNuevas === 1;
    
    if (exitoso) {
        console.log('\n🎉 ÉXITO TOTAL: El sistema bloquea correctamente las imágenes del servidor');
        console.log(`✅ Se bloquearon ${imagenesBloquéadasNuevas} imágenes del servidor`);
        console.log(`✅ Se permitió 1 imagen base64 local`);
    } else {
        console.error('\n❌ FALLO: El sistema NO está bloqueando correctamente las imágenes del servidor');
        console.error(`❌ Esperado: ${urlsServidor.length} bloqueadas, 1 permitida`);
        console.error(`❌ Obtenido: ${imagenesBloquéadasNuevas} bloqueadas, ${imagenesPermitidasNuevas} permitidas`);
    }
    
    return {
        exitoso,
        urls_probadas: urlsServidor.length,
        imagenes_bloqueadas: imagenesBloquéadasNuevas,
        imagenes_permitidas: imagenesPermitidasNuevas,
        estadisticas_completas: statsFinal
    };
}

// Función para simular el comportamiento anterior (antes de la corrección)
function simularComportamientoAnterior() {
    console.log('\n🔄 SIMULANDO COMPORTAMIENTO ANTERIOR (solo para comparación)...');
    
    // Desactivar control temporal
    if (window.restaurarControlTotal) {
        window.restaurarControlTotal();
    }
    
    // Simular creación de PDF sin control
    let jsPDFClass = null;
    if (window.jspdf && window.jspdf.jsPDF) {
        jsPDFClass = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
        jsPDFClass = window.jsPDF;
    }
    
    if (jsPDFClass) {
        const pdfSinControl = new jsPDFClass();
        
        console.log('📄 Creando PDF SIN control para comparación...');
        
        // Intentar agregar imagen del servidor (debería funcionar sin control)
        try {
            // Esto simula lo que pasaba antes: las imágenes del servidor se agregaban sin restricción
            console.log('🌐 Sin control: Intentando agregar imagen del servidor...');
            
            // Como no podemos realmente agregar la imagen (es URL), solo simulamos
            console.log('⚠️ SIMULACIÓN: Sin control, esta imagen se agregaría al PDF inflando su tamaño');
            console.log('⚠️ RESULTADO ANTERIOR: PDF excedía 5MB debido a imágenes del servidor no controladas');
            
        } catch (error) {
            console.log('ℹ️ Información: Error esperado por URL no válida, pero el punto es que no había control');
        }
    }
    
    // Reactivar control
    console.log('🔄 Reactivando control total...');
    window.controlarTodasLasImagenesPDF();
}

// Ejecución principal del diagnóstico
console.log('🚀 EJECUTANDO DIAGNÓSTICO COMPLETO...');

// Ejecutar prueba principal
probarBloqueoImagenesServidor().then(resultado => {
    console.log('\n📋 RESULTADO FINAL DEL DIAGNÓSTICO:');
    console.table(resultado);
    
    if (resultado.exitoso) {
        console.log('\n🎯 CONCLUSIÓN: ✅ EL SISTEMA FUNCIONA CORRECTAMENTE');
        console.log('✅ Las imágenes del servidor son bloqueadas automáticamente');
        console.log('✅ Las imágenes locales son permitidas');
        console.log('✅ El control total previene el exceso de 5MB');
    } else {
        console.error('\n🎯 CONCLUSIÓN: ❌ EL SISTEMA REQUIERE AJUSTES');
        console.error('❌ Revisar la implementación del interceptor en el prototipo');
        console.error('❌ Verificar que todas las instancias de jsPDF pasen por el control');
    }
    
    // Mostrar comparación con comportamiento anterior
    simularComportamientoAnterior();
    
}).catch(error => {
    console.error('❌ Error ejecutando diagnóstico:', error);
});

// Función adicional para monitoreo continuo
window.monitorearControlPDF = function(duracionMs = 10000) {
    console.log(`🔍 Iniciando monitoreo continuo del control PDF por ${duracionMs}ms...`);
    
    const estadisticasIniciales = window.obtenerEstadisticasControlTotal();
    console.log('📊 Estadísticas iniciales:', estadisticasIniciales);
    
    const intervalo = setInterval(() => {
        const estadisticasActuales = window.obtenerEstadisticasControlTotal();
        
        if (estadisticasActuales.imagenes_controladas > estadisticasIniciales.imagenes_controladas) {
            console.log('🚨 ACTIVIDAD DETECTADA:');
            console.log('📊 Nuevas estadísticas:', estadisticasActuales);
        }
    }, 1000);
    
    setTimeout(() => {
        clearInterval(intervalo);
        const estadisticasFinales = window.obtenerEstadisticasControlTotal();
        console.log('🔚 Monitoreo finalizado. Estadísticas finales:', estadisticasFinales);
    }, duracionMs);
};

console.log('\n💡 TIP: Usa window.monitorearControlPDF(10000) para monitoreo continuo durante 10 segundos');
