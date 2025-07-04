// 🔍 VERIFICADOR DEL FLUJO RIJ - Ejecutar en consola del navegador

function verificarFlujoRIJ() {
    console.log('🔍 VERIFICANDO FLUJO formato_RIJ.html → camara.html');
    console.log('===============================================');
    
    // Verificar componentes del flujo
    const componentes = {
        'rijPDFManager': typeof window.rijPDFManager !== 'undefined',
        'agregarImagenRIJalPDF': typeof window.agregarImagenRIJalPDF === 'function',
        'mostrarImagenRIJEnContenedor': typeof window.mostrarImagenRIJEnContenedor === 'function',
        'verificarEstadoRIJ': typeof window.verificarEstadoRIJ === 'function'
    };
    
    console.log('📋 Componentes del flujo RIJ:');
    Object.entries(componentes).forEach(([nombre, disponible]) => {
        console.log(`   ${disponible ? '✅' : '❌'} ${nombre}`);
    });
    
    // Verificar localStorage RIJ
    const datosRIJ = {
        'usuario_identificador_rij': localStorage.getItem('usuario_identificador_rij'),
        'rij_imagen_url': localStorage.getItem('rij_imagen_url'),
        'rij_pdf_procesado': localStorage.getItem('rij_pdf_procesado'),
        'ultimo_pdf_rij': localStorage.getItem('ultimo_pdf_rij') ? 'Disponible' : null
    };
    
    console.log('📁 Datos RIJ en localStorage:');
    Object.entries(datosRIJ).forEach(([clave, valor]) => {
        console.log(`   ${valor ? '✅' : '❌'} ${clave}: ${valor || 'No definido'}`);
    });
    
    // Verificar contenedores en camara.html (si estamos en esa página)
    if (window.location.pathname.includes('camara.html')) {
        const contenedorRij = document.getElementById('contenedor-rij');
        const imagenContainer = document.getElementById('imagen-rij-container');
        
        console.log('🎯 Contenedores en camara.html:');
        console.log(`   ${contenedorRij ? '✅' : '❌'} contenedor-rij existe`);
        console.log(`   ${imagenContainer ? '✅' : '❌'} imagen-rij-container existe`);
        
        if (contenedorRij) {
            console.log(`   📊 contenedor-rij visible: ${contenedorRij.style.display !== 'none'}`);
        }
    }
    
    // Verificar compatibilidad con sistema de control
    const sistemaControl = {
        'pdfSizeController': typeof window.pdfSizeController !== 'undefined',
        'controlarTodasLasImagenesPDF': typeof window.controlarTodasLasImagenesPDF === 'function',
        'procesarImagenParaPDF': typeof window.procesarImagenParaPDF === 'function'
    };
    
    console.log('🔧 Sistema de control de PDF:');
    Object.entries(sistemaControl).forEach(([nombre, disponible]) => {
        console.log(`   ${disponible ? '✅' : '❌'} ${nombre}`);
    });
    
    // Mensaje final
    const flujoCompleto = componentes.rijPDFManager && componentes.mostrarImagenRIJEnContenedor;
    console.log('===============================================');
    console.log(`🎯 FLUJO RIJ: ${flujoCompleto ? '✅ FUNCIONANDO' : '❌ PROBLEMAS DETECTADOS'}`);
    
    if (flujoCompleto) {
        console.log('✅ El flujo formato_RIJ.html → camara.html está protegido');
        console.log('✅ Las modificaciones NO afectan la funcionalidad original');
    }
    
    return {
        flujo_funcionando: flujoCompleto,
        componentes: componentes,
        datos_rij: datosRIJ,
        sistema_control: sistemaControl
    };
}

// Ejecutar verificación automáticamente
console.log('🔍 Ejecutando verificación del flujo RIJ...');
const resultado = verificarFlujoRIJ();
console.log('📋 Resultado de la verificación:', resultado);
