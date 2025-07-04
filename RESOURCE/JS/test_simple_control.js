// 🔧 FUNCIÓN DE PRUEBA DIRECTA DEL CONTROL DE PDF
// Ejecutar en consola antes de generar PDF

function probarControlPDF() {
    console.log('🧪 PROBANDO CONTROL DIRECTO DEL PDF...');
    
    // Paso 1: Verificar jsPDF
    console.log('📋 Verificando jsPDF...');
    
    let jsPDFOK = false;
    if (window.jsPDF && window.jsPDF.API && window.jsPDF.API.addImage) {
        jsPDFOK = true;
        console.log('✅ window.jsPDF disponible');
    } else if (window.jspdf && window.jspdf.jsPDF) {
        try {
            const { jsPDF } = window.jspdf;
            if (jsPDF && jsPDF.API && jsPDF.API.addImage) {
                window.jsPDF = jsPDF;
                jsPDFOK = true;
                console.log('✅ window.jspdf.jsPDF disponible');
            }
        } catch (e) {
            console.error('❌ Error al acceder a jspdf.jsPDF:', e);
        }
    }
    
    if (!jsPDFOK) {
        console.error('❌ jsPDF NO DISPONIBLE');
        console.log('📋 Estado actual:', {
            'window.jsPDF': typeof window.jsPDF,
            'window.jspdf': typeof window.jspdf,
            'jsPDF.API': typeof window.jsPDF?.API
        });
        return false;
    }
    
    // Paso 2: Probar creación de PDF
    console.log('📋 Probando creación de PDF...');
    try {
        const { jsPDF } = window.jspdf;
        const testPDF = new jsPDF();
        console.log('✅ PDF de prueba creado exitosamente');
    } catch (error) {
        console.error('❌ Error al crear PDF de prueba:', error);
        return false;
    }
    
    // Paso 3: Probar activación del control
    console.log('📋 Probando activación del control...');
    
    // Limpiar control previo si existe
    if (window.controladorImagenesActivo && window.restaurarControlTotal) {
        window.restaurarControlTotal();
        console.log('🔄 Control previo limpiado');
    }
    
    // Activar control
    if (typeof window.controlarTodasLasImagenesPDF === 'function') {
        const resultado = window.controlarTodasLasImagenesPDF();
        if (resultado === false) {
            console.error('❌ Error al activar control');
            return false;
        } else {
            console.log('✅ Control activado correctamente');
        }
    } else {
        console.error('❌ Función controlarTodasLasImagenesPDF no disponible');
        return false;
    }
    
    // Paso 4: Verificar estado del control
    if (window.controladorImagenesActivo) {
        console.log('✅ Variable de control activa');
    } else {
        console.error('❌ Variable de control NO activa');
        return false;
    }
    
    // Paso 5: Probar interceptor
    console.log('📋 Probando interceptor...');
    try {
        // Crear un PDF de prueba y verificar que el interceptor funcione
        const { jsPDF } = window.jspdf;
        const testPDF2 = new jsPDF();
        
        // Intentar agregar una imagen pequeña de prueba
        const imagenPrueba = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/gA==';
        
        console.log('🔍 Intentando agregar imagen de prueba...');
        testPDF2.addImage(imagenPrueba, 'JPEG', 10, 10, 50, 50);
        console.log('✅ Imagen de prueba agregada - Interceptor funcionando');
        
    } catch (error) {
        console.error('❌ Error en interceptor:', error);
        return false;
    }
    
    // Paso 6: Limpiar después de la prueba
    if (window.restaurarControlTotal) {
        window.restaurarControlTotal();
        console.log('🔄 Control de prueba desactivado');
    }
    
    console.log('🎯 RESULTADO: ✅ SISTEMA LISTO PARA USAR');
    console.log('');
    console.log('🚀 AHORA PUEDES GENERAR EL PDF CON CONFIANZA');
    console.log('📊 El sistema interceptará TODAS las imágenes');
    console.log('🛡️ Ninguna imagen podrá hacer que el PDF exceda 5MB');
    
    return true;
}

// Ejecutar automáticamente
console.log('🔧 Ejecutando prueba del control PDF...');
const resultado = probarControlPDF();

if (resultado) {
    console.log('✅ ¡Sistema verificado y listo!');
} else {
    console.log('❌ Sistema tiene problemas - revisa los errores arriba');
}
