// Prueba de verificación de PDF correcto
// Este archivo se puede ejecutar en la consola del navegador para verificar el formato

function verificarFormatoPDF() {
    // Simular el formato que jsPDF genera por defecto (problemático)
    const pdfProblematico = 'data:application/pdf;filename=generated.pdf;base64,JVBERi0xLjQKMSAwIG9iag==';
    
    // Función de corrección
    function corregirFormatoPDF(pdfBase64) {
        if (pdfBase64.includes(';filename=')) {
            return pdfBase64.replace(/;filename=[^;]+/, '');
        }
        return pdfBase64;
    }
    
    const pdfCorregido = corregirFormatoPDF(pdfProblematico);
    
    console.log('VERIFICACIÓN DE FORMATO PDF:');
    console.log('Original (problemático):', pdfProblematico);
    console.log('Corregido:', pdfCorregido);
    console.log('Formato válido:', pdfCorregido.startsWith('data:application/pdf;base64,'));
    console.log('Sin filename:', !pdfCorregido.includes(';filename='));
    
    return {
        original: pdfProblematico,
        corregido: pdfCorregido,
        valido: pdfCorregido.startsWith('data:application/pdf;base64,') && !pdfCorregido.includes(';filename=')
    };
}

// Ejecutar verificación
verificarFormatoPDF();
