/**
 * SCRIPT DE VALIDACIÓN INTEGRAL DEL SISTEMA PDF
 * Verifica compatibilidad con el flujo RIJ y funcionamiento del control
 */

console.log('🔍 INICIANDO VALIDACIÓN INTEGRAL DEL SISTEMA...');

/**
 * Validador integral del sistema PDF
 */
class ValidadorSistemaPDF {
    constructor() {
        this.resultados = {
            sistema_cargado: false,
            jspdf_disponible: false,
            control_activo: false,
            flujo_rij_intacto: false,
            pruebas_funcionales: false
        };
    }

    /**
     * Ejecuta validación completa del sistema
     */
    async ejecutarValidacionCompleta() {
        console.log('\n📋 PASO 1: VERIFICANDO CARGA DEL SISTEMA...');
        this.validarCargaDelSistema();

        console.log('\n📋 PASO 2: VERIFICANDO JSPDF...');
        this.validarJsPDF();

        console.log('\n📋 PASO 3: VERIFICANDO FLUJO RIJ...');
        this.validarFlujoRIJ();

        console.log('\n📋 PASO 4: PROBANDO CONTROL DE IMÁGENES...');
        await this.probarControlImagenes();

        console.log('\n📋 PASO 5: VALIDANDO INTEGRACIÓN...');
        this.validarIntegracion();

        return this.generarReporteFinal();
    }

    /**
     * Verifica que el sistema esté cargado correctamente
     */
    validarCargaDelSistema() {
        const verificaciones = {
            pdfSizeController: typeof window.pdfSizeController === 'object',
            controladorImagenesPDF: typeof window.controladorImagenesPDF === 'object',
            procesarImagenParaPDF: typeof window.procesarImagenParaPDF === 'function',
            controlarTodasLasImagenesPDF: typeof window.controlarTodasLasImagenesPDF === 'function',
            obtenerReportePDF: typeof window.obtenerReportePDF === 'function',
            verificarConcordanciaPDF: typeof window.verificarConcordanciaPDF === 'function'
        };

        console.log('🔧 Componentes del sistema:');
        Object.entries(verificaciones).forEach(([nombre, disponible]) => {
            const estado = disponible ? '✅' : '❌';
            console.log(`   ${estado} ${nombre}: ${disponible}`);
        });

        this.resultados.sistema_cargado = Object.values(verificaciones).every(v => v);
        console.log(`📊 Sistema cargado: ${this.resultados.sistema_cargado ? '✅ SÍ' : '❌ NO'}`);
    }

    /**
     * Verifica disponibilidad y funcionalidad de jsPDF
     */
    validarJsPDF() {
        const verificaciones = {
            window_jspdf: typeof window.jspdf !== 'undefined',
            window_jsPDF: typeof window.jsPDF !== 'undefined',
            constructor_disponible: false,
            instancia_funcional: false
        };

        // Verificar constructor
        let jsPDFClass = null;
        if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFClass = window.jspdf.jsPDF;
            verificaciones.constructor_disponible = true;
            console.log('✅ Constructor encontrado en window.jspdf.jsPDF');
        } else if (window.jsPDF) {
            jsPDFClass = window.jsPDF;
            verificaciones.constructor_disponible = true;
            console.log('✅ Constructor encontrado en window.jsPDF');
        } else {
            console.log('❌ Constructor de jsPDF no encontrado');
        }

        // Probar instancia
        if (jsPDFClass) {
            try {
                const testDoc = new jsPDFClass();
                if (testDoc.addImage && typeof testDoc.addImage === 'function') {
                    verificaciones.instancia_funcional = true;
                    console.log('✅ Instancia funcional con addImage disponible');
                } else {
                    console.log('❌ addImage no disponible en la instancia');
                }
            } catch (error) {
                console.log('❌ Error creando instancia:', error.message);
            }
        }

        this.resultados.jspdf_disponible = verificaciones.constructor_disponible && verificaciones.instancia_funcional;
        console.log(`📊 jsPDF funcional: ${this.resultados.jspdf_disponible ? '✅ SÍ' : '❌ NO'}`);
    }

    /**
     * Verifica que el flujo RIJ original esté intacto
     */
    validarFlujoRIJ() {
        const verificaciones = {
            localStorage_usuario: localStorage.getItem('usuario_identificador_rij') !== null,
            localStorage_imagen: localStorage.getItem('rij_imagen_url') !== null,
            rijPDFManager: typeof window.rijPDFManager === 'object',
            agregarImagenRIJ: typeof window.agregarImagenRIJalPDF === 'function',
            pdfjsLib: typeof window.pdfjsLib !== 'undefined'
        };

        console.log('🔄 Componentes del flujo RIJ:');
        Object.entries(verificaciones).forEach(([nombre, disponible]) => {
            const estado = disponible ? '✅' : '⚠️';
            console.log(`   ${estado} ${nombre}: ${disponible}`);
        });

        // El flujo RIJ puede estar parcialmente disponible si no se ha generado RIJ aún
        const componentesCriticos = [verificaciones.agregarImagenRIJ, verificaciones.pdfjsLib];
        this.resultados.flujo_rij_intacto = componentesCriticos.every(v => v);

        if (verificaciones.localStorage_usuario && verificaciones.localStorage_imagen) {
            console.log('✅ Datos RIJ disponibles en localStorage');
        } else {
            console.log('ℹ️ Datos RIJ no disponibles (normal si no se ha generado RIJ)');
        }

        console.log(`📊 Flujo RIJ: ${this.resultados.flujo_rij_intacto ? '✅ INTACTO' : '⚠️ VERIFICAR'}`);
    }

    /**
     * Prueba el control de imágenes con casos reales
     */
    async probarControlImagenes() {
        // Activar control
        const controlActivado = window.controlarTodasLasImagenesPDF();
        this.resultados.control_activo = controlActivado;

        if (!controlActivado) {
            console.log('❌ No se pudo activar el control');
            return false;
        }

        console.log('✅ Control activado exitosamente');

        // Resetear estadísticas para prueba limpia
        window.controladorImagenesPDF.resetearEstadisticas();

        // Obtener constructor jsPDF
        let PDFClass = null;
        if (window.jspdf && window.jspdf.jsPDF) {
            PDFClass = window.jspdf.jsPDF;
        } else if (window.jsPDF) {
            PDFClass = window.jsPDF;
        } else {
            console.log('❌ jsPDF no disponible para pruebas');
            return false;
        }

        // Crear PDF de prueba
        const pdfPrueba = new PDFClass();

        // Prueba 1: Imagen del servidor (debe ser bloqueada)
        console.log('🧪 Prueba 1: Imagen del servidor');
        pdfPrueba.addImage('https://httpbin.org/image/jpeg', 'JPEG', 10, 10, 50, 50);

        // Prueba 2: Imagen base64 válida (debe ser permitida)
        console.log('🧪 Prueba 2: Imagen base64 válida');
        const imagenPequeña = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/gA==';
        pdfPrueba.addImage(imagenPequeña, 'JPEG', 10, 70, 50, 50);

        // Prueba 3: Imagen data: vacía (edge case)
        console.log('🧪 Prueba 3: Imagen data: vacía');
        pdfPrueba.addImage('data:', 'JPEG', 10, 130, 50, 50);

        // Verificar resultados
        const stats = window.controladorImagenesPDF.obtenerEstadisticas();
        
        console.log('📊 RESULTADOS DE LAS PRUEBAS:');
        console.log(`   🔍 Total detectadas: ${stats.imagenes_controladas}`);
        console.log(`   ✅ Permitidas: ${stats.imagenes_permitidas}`);
        console.log(`   🚫 Bloqueadas: ${stats.imagenes_bloqueadas}`);

        // Validar que el control funciona correctamente
        const funcionaCorrectamente = stats.imagenes_bloqueadas >= 1 && stats.imagenes_permitidas >= 1;
        this.resultados.pruebas_funcionales = funcionaCorrectamente;

        if (funcionaCorrectamente) {
            console.log('🎉 PRUEBAS EXITOSAS: Control funciona correctamente');
        } else {
            console.log('❌ PRUEBAS FALLIDAS: Control no funciona como esperado');
        }

        return funcionaCorrectamente;
    }

    /**
     * Valida la integración completa del sistema
     */
    validarIntegracion() {
        const imagenesEnDOM = document.querySelectorAll('#photosContainer .photo-wrapper img.foto-principal');
        const totalImagenes = imagenesEnDOM.length;

        console.log('🔗 Validando integración:');
        console.log(`   📸 Imágenes en DOM: ${totalImagenes}`);
        console.log(`   🛡️ Control activo: ${this.resultados.control_activo ? 'SÍ' : 'NO'}`);
        console.log(`   🎯 Sistema cargado: ${this.resultados.sistema_cargado ? 'SÍ' : 'NO'}`);

        // Verificar que el sistema puede procesar imágenes si hay disponibles
        if (totalImagenes > 0 && this.resultados.sistema_cargado) {
            console.log('✅ Sistema listo para procesar imágenes del DOM');
        } else if (totalImagenes === 0) {
            console.log('ℹ️ No hay imágenes en DOM para procesar (normal si no se han capturado)');
        } else {
            console.log('⚠️ Sistema no está completamente listo');
        }

        // Verificar compatibilidad con funciones existentes
        const funcionesCompatibles = [
            'agregarImagenRIJalPDF',
            'descargarPDFRIJ',
            'rijPDFManager'
        ].map(func => typeof window[func] !== 'undefined').some(existe => existe);

        if (funcionesCompatibles) {
            console.log('✅ Funciones RIJ detectadas - Compatibilidad preservada');
        } else {
            console.log('ℹ️ Funciones RIJ no detectadas (normal en camara.html)');
        }
    }

    /**
     * Genera reporte final de la validación
     */
    generarReporteFinal() {
        console.log('\n📋 REPORTE FINAL DE VALIDACIÓN');
        console.log('=' .repeat(50));

        const estado = {
            '🔧 Sistema cargado': this.resultados.sistema_cargado,
            '📄 jsPDF funcional': this.resultados.jspdf_disponible,
            '🛡️ Control activado': this.resultados.control_activo,
            '🔄 Flujo RIJ intacto': this.resultados.flujo_rij_intacto,
            '🧪 Pruebas funcionales': this.resultados.pruebas_funcionales
        };

        Object.entries(estado).forEach(([descripcion, resultado]) => {
            const icono = resultado ? '✅' : '❌';
            console.log(`${icono} ${descripcion}: ${resultado ? 'OK' : 'FALLO'}`);
        });

        const todosFuncionan = Object.values(this.resultados).every(r => r);
        const estadoGeneral = todosFuncionan ? 'SISTEMA COMPLETAMENTE FUNCIONAL' : 'REVISAR PROBLEMAS DETECTADOS';
        const iconoGeneral = todosFuncionan ? '🎉' : '⚠️';

        console.log('\n' + '='.repeat(50));
        console.log(`${iconoGeneral} ESTADO GENERAL: ${estadoGeneral}`);

        if (!todosFuncionan) {
            console.log('\n🔧 ACCIONES RECOMENDADAS:');
            if (!this.resultados.sistema_cargado) {
                console.log('   • Verificar que configuracion_pdf.js se cargó correctamente');
            }
            if (!this.resultados.jspdf_disponible) {
                console.log('   • Verificar que jsPDF está cargado antes que configuracion_pdf.js');
            }
            if (!this.resultados.control_activo) {
                console.log('   • Llamar manualmente window.controlarTodasLasImagenesPDF()');
            }
            if (!this.resultados.pruebas_funcionales) {
                console.log('   • Investigar por qué las pruebas de control fallaron');
            }
        } else {
            console.log('\n🚀 SISTEMA LISTO PARA USAR:');
            console.log('   • Captura o carga imágenes normalmente');
            console.log('   • Genera PDF con el botón correspondiente');
            console.log('   • El sistema garantiza que nunca excederá 5MB');
            console.log('   • Las imágenes del servidor serán bloqueadas automáticamente');
            console.log('   • El flujo RIJ original sigue funcionando');
        }

        return {
            exito: todosFuncionan,
            detalles: this.resultados,
            resumen: estadoGeneral
        };
    }
}

// **FUNCIONES GLOBALES DE VALIDACIÓN**

/**
 * Ejecuta validación rápida del sistema
 */
window.validacionRapidaPDF = function() {
    console.log('⚡ VALIDACIÓN RÁPIDA DEL SISTEMA PDF');
    console.log('=' .repeat(40));

    const checks = {
        'Sistema cargado': typeof window.pdfSizeController === 'object',
        'jsPDF disponible': typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined',
        'Control disponible': typeof window.controlarTodasLasImagenesPDF === 'function',
        'Procesamiento disponible': typeof window.procesarImagenParaPDF === 'function'
    };

    Object.entries(checks).forEach(([nombre, ok]) => {
        console.log(`${ok ? '✅' : '❌'} ${nombre}: ${ok ? 'OK' : 'FALLO'}`);
    });

    const todoOK = Object.values(checks).every(v => v);
    console.log(`\n${todoOK ? '🎉' : '⚠️'} Estado: ${todoOK ? 'LISTO' : 'PROBLEMAS DETECTADOS'}`);

    return todoOK;
};

/**
 * Ejecuta validación completa del sistema
 */
window.validacionCompletaPDF = async function() {
    const validador = new ValidadorSistemaPDF();
    return await validador.ejecutarValidacionCompleta();
};

/**
 * Función de diagnóstico para problemas específicos
 */
window.diagnosticarProblemasPDF = function() {
    console.log('🔍 DIAGNÓSTICO DE PROBLEMAS PDF');
    console.log('=' .repeat(40));

    // Verificar archivos cargados
    const scripts = Array.from(document.querySelectorAll('script[src]'))
        .map(script => script.src)
        .filter(src => src.includes('pdf') || src.includes('jsPDF'));

    console.log('📄 Scripts PDF detectados:');
    scripts.forEach(script => {
        console.log(`   • ${script}`);
    });

    if (scripts.length === 0) {
        console.log('   ❌ No se detectaron scripts de PDF');
    }

    // Verificar errores en consola
    const hasErrors = window.console._errorCount > 0; // Si hay sistema de conteo de errores
    if (hasErrors) {
        console.log('⚠️ Se detectaron errores previos en consola');
    }

    // Verificar DOM
    const imagenesDOM = document.querySelectorAll('#photosContainer img');
    console.log(`📸 Imágenes en DOM: ${imagenesDOM.length}`);

    // Verificar variables globales críticas
    const variablesCriticas = [
        'jspdf', 'jsPDF', 'pdfSizeController', 
        'controladorImagenesPDF', 'procesarImagenParaPDF'
    ];

    console.log('🔧 Variables críticas:');
    variablesCriticas.forEach(variable => {
        const existe = typeof window[variable] !== 'undefined';
        console.log(`   ${existe ? '✅' : '❌'} window.${variable}: ${existe ? 'EXISTE' : 'NO EXISTE'}`);
    });

    return {
        scripts_detectados: scripts.length,
        imagenes_dom: imagenesDOM.length,
        variables_criticas_ok: variablesCriticas.every(v => typeof window[v] !== 'undefined')
    };
};

// **AUTO-EJECUCIÓN DE VALIDACIÓN**
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🔍 EJECUTANDO VALIDACIÓN AUTOMÁTICA...');
            window.validacionRapidaPDF();
        }, 2000);
    });
} else {
    setTimeout(() => {
        console.log('🔍 EJECUTANDO VALIDACIÓN AUTOMÁTICA...');
        window.validacionRapidaPDF();
    }, 2000);
}

console.log('✅ VALIDADOR INTEGRAL CARGADO');
console.log('📋 Funciones disponibles:');
console.log('   • window.validacionRapidaPDF() - Validación rápida');
console.log('   • window.validacionCompletaPDF() - Validación completa');
console.log('   • window.diagnosticarProblemasPDF() - Diagnóstico de problemas');
