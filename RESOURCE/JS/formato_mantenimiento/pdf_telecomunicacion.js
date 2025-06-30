async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); /*crea pdf vacio*/

    //DATOS DEL FORMULARIO 
    const zona = document.querySelector('input[id="zona"]').value;
    const site = document.querySelector('input[id="site"]').value;
    const clave_documento = document.querySelector('input[id="clave_documento"]').value;
    const version = document.querySelector('input[id="NoVersion"]').value;
    const fecha_publicacion = document.querySelector('input[id="fecha_publicacion"]').value;
    const fecha_realizacion = document.querySelector('input[id="fecha_realizacion"]').value;

    // IMAGEN -- LOGO
    await new Promise((resolve, reject) => {
    const img = new Image(); // Este objeto representa la imagen que se va a insertar en el PDF
    img.src = '/RESOURCE/IMG/Comisión_Federal_de_Electricidad_(logo)_.svg.png';
    img.onload = function () { // esta función se ejecutará automáticamente cuando la imagen haya terminado de cargarse correctamente
        const imgWidth = 40;
        const imgHeight = 20;
        doc.addImage(img, 'PNG', 15, 8, imgWidth, imgHeight);
        resolve();
    };
    img.onerror = reject;
    });

    // ENCABEZADO
    doc.setFont("helvetica"); /*tipo de letra y negritas*/
    doc.setFontSize(10);
    doc.text("Comisión Federal de Electricidad", 105, 15, null, null, "center");
    doc.text("Política Transversal de Calidad de CFE", 105, 20, null, null, "center");
    doc.text("Sistema Integral de Gestión (SIG-CFE)", 105, 25, null, null, "center");

    let y=45;
    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const Titulo = "Titulo: ";
    doc.text(Titulo, 15, y);

    doc.setFont("helvetica", "normal");
    const tituloMedida = doc.getTextWidth(Titulo);
    doc.text(`Formato Inspección de Salas de Telecomunicaciones`, 15 + tituloMedida, y );

    y+=8;
    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const clave = "Clave de documento: ";
    doc.text(clave, 15, y);

    doc.setFont("helvetica", "normal");
    const claveMedida = doc.getTextWidth(clave);
    doc.text(clave_documento, 17 + claveMedida, y );

    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const versionT = "No. de versión: ";
    doc.text(versionT, 95, y);

    doc.setFont("helvetica", "normal");
    const versionMedida = doc.getTextWidth(versionT);
    doc.text(version, 97 + versionMedida, y );

    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const Fecha1 = "Fecha publicación: ";
    doc.text(Fecha1, 150, y);

    doc.setFont("helvetica", "normal");
    const fechaMedida = doc.getTextWidth(Fecha1);
    doc.text(fecha_publicacion, 152 + fechaMedida, y );

    y+=12;

    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const ZonaT = "Zona: ";
    doc.text(ZonaT, 15, y);

    doc.setFont("helvetica", "normal");
    const zonaMedida = doc.getTextWidth(ZonaT);
    doc.text(zona, 17 + zonaMedida, y );

    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const siteUbi = "Ubicación del Site: ";
    doc.text(siteUbi, 95, y);

    doc.setFont("helvetica", "normal");
    const siteMedida = doc.getTextWidth(siteUbi);
    doc.text(site, 97 + siteMedida, y );

    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const realizacion = "Fecha de realización: ";
    doc.text(realizacion, 150, y);

    doc.setFont("helvetica", "normal");
    const realizacionMedida = doc.getTextWidth(siteUbi);
    doc.text(fecha_realizacion, 152 + realizacionMedida, y );

    
    doc.save("mantenimiento_preventivo_telecomunicacion.pdf");
}
