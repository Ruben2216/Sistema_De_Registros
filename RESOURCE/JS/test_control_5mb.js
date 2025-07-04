// 🧪 SCRIPT DE PRUEBA PARA VALIDAR EL CONTROL DE 5MB
// Ejecutar en la consola ANTES de generar el PDF

console.log('🧪 INICIANDO PRUEBA DEL SISTEMA DE CONTROL PDF...');
console.log('================================================');

// Verificar que todos los componentes estén cargados
const verificaciones = {
    'configuracion_pdf.js': typeof window.pdfSizeController !== 'undefined',
    'controlarTodasLasImagenesPDF': typeof window.controlarTodasLasImagenesPDF === 'function',
    'procesarImagenParaPDF': typeof window.procesarImagenParaPDF === 'function',
    'jsPDF': typeof window.jspdf !== 'undefined',
    'imagenes_disponibles': document.querySelectorAll('#photosContainer img.foto-principal').length
};

console.log('📋 VERIFICACIÓN DE COMPONENTES:');
Object.entries(verificaciones).forEach(([nombre, resultado]) => {
    const estado = typeof resultado === 'boolean' ? (resultado ? '✅' : '❌') : `📊 ${resultado}`;
    console.log(`   ${estado} ${nombre}: ${resultado}`);
});

// Verificar que no haya control activo previo
if (window.controladorImagenesActivo) {
    console.log('⚠️  Control previo detectado - Limpiando...');
    if (window.restaurarControlTotal) {
        window.restaurarControlTotal();
    }
}

// Simular activación del control
console.log('\n🛡️ SIMULANDO ACTIVACIÓN DEL CONTROL...');
if (typeof window.controlarTodasLasImagenesPDF === 'function') {
    window.controlarTodasLasImagenesPDF();
    console.log('✅ Control activado correctamente');
    
    // Verificar que el interceptor esté funcionando
    if (window.controladorImagenesActivo) {
        console.log('✅ Variable de estado correcta');
    } else {
        console.error('❌ Variable de estado incorrecta');
    }
    
    // Desactivar para no interferir
    if (window.restaurarControlTotal) {
        window.restaurarControlTotal();
        console.log('🔄 Control desactivado para no interferir');
    }
} else {
    console.error('❌ Función de control no disponible');
}

// Análisis de imágenes disponibles
const imagenes = document.querySelectorAll('#photosContainer img.foto-principal');
console.log(`\n📸 ANÁLISIS DE IMÁGENES (${imagenes.length} total):`);

let tamañoEstimadoTotal = 0;
imagenes.forEach((img, index) => {
    const src = img.src;
    const esLocal = src.startsWith('data:');
    let tamañoEstimado = 0;
    
    if (esLocal) {
        tamañoEstimado = Math.floor(src.length * 0.75); // Aproximación base64
        tamañoEstimadoTotal += tamañoEstimado;
    }
    
    console.log(`   ${index + 1}. ${esLocal ? 'LOCAL' : 'SERVIDOR'} - ${esLocal ? (tamañoEstimado/1024).toFixed(1) + 'KB' : 'Tamaño desconocido'}`);
});

const tamañoEstimadoMB = (tamañoEstimadoTotal / 1024 / 1024).toFixed(2);
console.log(`\n📊 ESTIMACIÓN TOTAL: ${tamañoEstimadoMB}MB`);

if (tamañoEstimadoTotal > (5 * 1024 * 1024)) {
    console.warn(`⚠️  Las imágenes actuales parecen exceder 5MB (${tamañoEstimadoMB}MB)`);
    console.log('💡 El sistema debería comprimir automáticamente para cumplir el límite');
} else {
    console.log(`✅ Estimación dentro del límite (${tamañoEstimadoMB}MB < 5MB)`);
}

// Instrucciones finales
console.log('\n🚀 INSTRUCCIONES:');
console.log('================');
console.log('1. ✅ Si todas las verificaciones son correctas, el sistema está listo');
console.log('2. 🛡️ Al generar PDF, verás mensajes de "CONTROL TOTAL ACTIVADO"');
console.log('3. 🖼️ Cada imagen dirá "IMAGEN APROBADA" o "IMAGEN RECHAZADA"');
console.log('4. 📊 Al final verás "VERIFICACIÓN FINAL" con el tamaño real');
console.log('5. 🚫 Si el PDF excede 5MB, aparecerá una alerta de error');
console.log('');
console.log('🔍 AHORA PUEDES GENERAR EL PDF Y OBSERVAR LOS MENSAJES');

// Resultado final
const sistemaListo = Object.entries(verificaciones).every(([clave, valor]) => {
    if (clave === 'imagenes_disponibles') return valor > 0;
    if (typeof valor === 'boolean') return valor;
    return true;
});

console.log(`\n🎯 RESULTADO: ${sistemaListo ? '✅ SISTEMA LISTO PARA USAR' : '❌ REVISAR PROBLEMAS DETECTADOS'}`);

return {
    sistema_listo: sistemaListo,
    verificaciones: verificaciones,
    imagenes_detectadas: imagenes.length,
    tamaño_estimado_mb: tamañoEstimadoMB
};
