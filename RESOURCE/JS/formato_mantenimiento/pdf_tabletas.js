async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); /*crea pdf vacio*/

    //CAPTURADO DE DATOS
    const zona = document.querySelector('select[id="zona"]').value;
    const centro = document.querySelector('input[id="centro_trabajo"').value;
    const folio = document.querySelector('input[id="folio"]').value;
    const servicio = document.querySelector('select[id="servicio"]').value;
    const hrinicio = document.querySelector('input[id="hr.inicio"]').value;
    const hora_termino = document.querySelector('input[id="hr.termino"]').value;
    const serie = document.querySelector('input[id="serie"]').value;
    const inventario = document.querySelector('input[id="numero_inventario"]').value;
    const usuario = document.querySelector('input[id="usuario"]').value;
    const marca = document.querySelector('input[id="marca"]').value;
    const modelo = document.querySelector('input[id="modelo"]').value;
    const procesos = document.querySelector('input[id="procesos"]').value;
    const RPE = document.querySelector('input[id="RPE"]').value;
    const inspeccion = document.querySelector('input[name="inspeccion"]:checked').value;
    const limpieza_cepillo = document.querySelector('input[name="limpieza_cepillo"]:checked').value;
    const limpieza_paño = document.querySelector('input[name="limpieza_paño"]:checked').value;
    const limpieza_cubierta = document.querySelector('input[name="limpieza_cubierta"]:checked').value;
    const sopleteado = document.querySelector('input[name="sopleteado"]:checked').value;
    const touch = document.querySelector('input[name="touch"]:checked').value;
    const bateria = document.querySelector('input[name="bateria"]:checked').value;
    const software = document.querySelector('input[name="software"]:checked').value;
    const conector = document.querySelector('input[name="conector"]:checked').value;
    const alimentacion = document.querySelector('input[name="alimentacion"]:checked').value;
    const carga_comunicacion = document.querySelector('input[name="carga_comunicacion"]:checked').value;
    const teclado = document.querySelector('input[name="teclado"]:checked').value;
    const gps = document.querySelector('input[name="gps"]:checked').value;
    const funcionamiento = document.querySelector('input[name="funcionamiento"]:checked').value;
    const realizo_servicio = document.querySelector('input[id="realizo_servicio"]').value;
    const responsable = document.querySelector('input[id="responsable"]').value;
    const visto_bueno = document.querySelector('input[id="visto_bueno"]').value;
    const firma3Base64 = document.getElementById("firma-input-3").value;
    const firma2Base64 = document.getElementById("firma-input-2").value;
    const firma1Base64 = document.getElementById("firma-input-1").value;

    await new Promise((resolve, reject) => {
    const img = new Image(); // Este objeto representa la imagen se va a insertar en el PDF
    img.src = '/RESOURCE/IMG/Comisión_Federal_de_Electricidad_(logo)_.svg.png';
    img.onload = function () { // esta función se ejecutará automáticamente cuando la imagen haya terminado de cargarse correctamente
        const pageWidth = doc.internal.pageSize.getWidth();
        const imgWidth = 40;
        const imgHeight = 20;
        const x = pageWidth - imgWidth - 15;
        const y = 8;
        doc.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
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

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("FORMATO MANTENIMIENTO PREVENTIVO TABLETAS", 105, 40, null, null, "center");

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(`Fecha: ${fecha}`, 155, 45);

    // DATOS GENERALES

    const rectWidthSeccion1 = 65;
    const rectWidthSeccion2 = 65;
    const rectWidthSeccion3 = 53;
    doc.setFontSize(9);
    let y = 55;

    // ZONA
    doc.setFont("helvetica", "normal", "bold");
    let label = "Zona:";
    let labelWidth = doc.getTextWidth(label);
    let xZona = 15 + (rectWidthSeccion1 - labelWidth) / 2;
    doc.text(label, xZona, y);

    doc.setFont("helvetica", "normal");
    let zonaWidth = doc.getTextWidth(zona);
    let xZonaVal = 15 + (rectWidthSeccion1 - zonaWidth) / 2;
    doc.text(zona, xZonaVal, y + 5);

    // === NUMERO DE SERIE ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Número de serie:";
    labelWidth = doc.getTextWidth(label);
    let xSerie = 83 + (rectWidthSeccion2 - labelWidth) / 2;
    doc.text(label, xSerie, y);

    doc.setFont("helvetica", "normal");
    let serieWidth = doc.getTextWidth(serie);
    let xSerieVal = 83 + (rectWidthSeccion2 - serieWidth) / 2;
    doc.text(serie, xSerieVal, y + 5);

    // === FOLIO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Folio:";
    labelWidth = doc.getTextWidth(label);
    let xFolio = 150 + (rectWidthSeccion3 - labelWidth) / 2;
    doc.text(label, xFolio, y);

    doc.setFont("helvetica", "normal");
    let folioWidth = doc.getTextWidth(folio);
    let xFolioVal = 150 + (rectWidthSeccion3 - folioWidth) / 2;
    doc.text(folio, xFolioVal, y + 5);

    doc.rect(15, y - 4, 65, 12.5); 
    doc.line(15, y+.7, 80, y+.7);
    doc.rect(82, y - 4, 65, 12.5,); 
    doc.line(82, y+.7, 147, y+.5);
    doc.rect(149, y - 4, 53, 12.5);
    doc.line(149, y+.7, 202, y+.5);

    y+=15;

    // === CENTRO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Centro de trabajo:";
    labelWidth = doc.getTextWidth(label);
    let xCentro = 15 + (rectWidthSeccion1 - labelWidth) / 2;
    doc.text(label, xCentro, y);

    doc.setFont("helvetica", "normal");
    let centroWidth = doc.getTextWidth(centro);
    let xCentroVal = 15 + (rectWidthSeccion1 - centroWidth) / 2;
    doc.text(centro, xCentroVal, y + 5);

    // === NUMERO DE INVENTARIO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Número de Inventario:";
    labelWidth = doc.getTextWidth(label);
    let xInventario = 82 + (rectWidthSeccion2 - labelWidth) / 2;
    doc.text(label, xInventario, y);

    doc.setFont("helvetica", "normal");
    let inventarioWidth = doc.getTextWidth(inventario);
    let xInventarioVal = 82 + (rectWidthSeccion2 - inventarioWidth) / 2;
    doc.text(inventario, xInventarioVal, y + 5);

    // === SERVICIO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Servicio:";
    labelWidth = doc.getTextWidth(label);
    let xServicio = 150 + (rectWidthSeccion3 - labelWidth) / 2;
    doc.text(label, xServicio, y);

    doc.setFont("helvetica", "normal");
    let servicioWidth = doc.getTextWidth(servicio);
    let xServicioVal = 150 + (rectWidthSeccion3 - servicioWidth) / 2;
    doc.text(servicio, xServicioVal, y + 5);

    doc.rect(15, y - 4, 65, 12.5); 
    doc.line(15, y+.7, 80, y+.7);
    doc.rect(82, y - 4, 65, 12.5,); 
    doc.line(82, y+.7, 147, y+.5);
    doc.rect(149, y - 4, 53, 12.5);
    doc.line(149, y+.7, 202, y+.5);

    y+=15;

    // === PROCESO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Centro de trabajo:";
    labelWidth = doc.getTextWidth(label);
    let xProceso = 15 + (rectWidthSeccion1 - labelWidth) / 2;
    doc.text(label, xProceso, y);

    doc.setFont("helvetica", "normal");
    let procesoWidth = doc.getTextWidth(procesos);
    let xProcesoVal = 15 + (rectWidthSeccion1 - procesoWidth) / 2;
    doc.text(procesos, xProcesoVal, y + 5);

    //MARCA
    doc.setFont("helvetica", "normal", "bold");
    label = "Marca:";
    labelWidth = doc.getTextWidth(label);
    let xMarca = 82 + (rectWidthSeccion2 - labelWidth) / 2;
    doc.text(label, xMarca, y);

    doc.setFont("helvetica", "normal");
    let marcaWidth = doc.getTextWidth(marca);
    let xMarcaVal = 82 + (rectWidthSeccion2 - marcaWidth) / 2;
    doc.text(marca, xMarcaVal, y + 5);

    // == HORA DE INICIO ==
    doc.setFont("helvetica", "bold");
    label = "Hora inicio:";
    labelWidth = doc.getTextWidth(label);
    let xHoraInicio = 150 + (rectWidthSeccion3 - labelWidth) / 2;
    doc.text(label, xHoraInicio, y);

    doc.setFont("helvetica", "normal");
    let HoraInicioWidth = doc.getTextWidth(hrinicio);
    let xHoraInicioVal = 150 + (rectWidthSeccion3 - HoraInicioWidth) / 2;
    doc.text(hrinicio, xHoraInicioVal, y + 5);

    doc.rect(15, y - 4, 65, 12.5); 
    doc.line(15, y+.7, 80, y+.7);
    doc.rect(82, y - 4, 65, 12.5,); 
    doc.line(82, y+.7, 147, y+.5);
    doc.rect(149, y - 4, 53, 12.5);
    doc.line(149, y+.7, 202, y+.5);

    y+=15;

    // == MODELO ==
    doc.setFont("helvetica", "bold");
    label = "Modelo:";
    labelWidth = doc.getTextWidth(label);
    let xModelo = 82 + (rectWidthSeccion2 - labelWidth) / 2;
    doc.text(label, xModelo, y);

    doc.setFont("helvetica", "normal");
    let modeloWith = doc.getTextWidth(modelo);
    let xModeloVal = 82 + (rectWidthSeccion2 - modeloWith) / 2;
    doc.text(modelo, xModeloVal, y + 5);

    // === HORA FINAL ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Hora final:";
    labelWidth = doc.getTextWidth(label);
    let xHoraFinal = 150 + (rectWidthSeccion3 - labelWidth) / 2;
    doc.text(label, xHoraFinal, y);

    doc.setFont("helvetica", "normal");
    let horaFinalWidht = doc.getTextWidth(hora_termino);
    let xHoraFinalVal = 150 + (rectWidthSeccion3 - horaFinalWidht) / 2;
    doc.text(hora_termino, xHoraFinalVal, y + 5);

    doc.rect(82, y - 4, 65, 12.5,); 
    doc.line(82, y+.7, 147, y+.5);
    doc.rect(149, y - 4, 53, 12.5);
    doc.line(149, y+.7, 202, y+.5);
    
    const pageWidth = 210;
    const xMargin = 15;
    const anchoTotal = pageWidth - xMargin * 2;
    y+=15;
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre de usuario (Nombre(s) y Apellido(s)): ${usuario} `, 16, y);
    doc.rect(15, y-4, anchoTotal + 7, 6 );
    y+=8;
    doc.text(`RPE/RTT: ${RPE}`, 16, y);
    doc.rect(15, y-4, anchoTotal + 7, 6);

    // TABLA DE ACTIVIDADES
    y += 13;
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold");
    doc.text("ACTIVIDAD", 15, y);
    doc.text("SI", 112, y);
    doc.text("NO", 127, y);
    doc.text("OBSERVACIONES", 153, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const actividades = [ /*arreglo de actividades "cadena de texto"*/
        "Realizar inspección inicial del equipo",
        "Limpieza externa usando cepillo de cerdas suaves antiestáticas",
        "Limpieza de touch con paño suave, sin detergentes o abrasivos",
        "La cubierta de franela o tela microfibra limpia y humedecida con líquido para limpieza de equipo de cómputo",
        "Sopleteado externo del equipo",
        "Calibración de touch pantalla",
        "Revisión de batería",
        "Verificar software institucional actualizado",
        "Verificar estado del coenctor de datos",
        "Conexión a alimentacion eléctrica para carga y comunicación",
        "Verificar estado y operación de cable de carga y comunicación",
        "Validar estado del teclado",
        "Verificar estado de GPS(TPS)",
        "Verificar funcionamiento del equopo después del servicio"
    ];
    y += 8;
    actividades.forEach((act, index) => { /*Se recorre cada elemento (act) del arreglo actividades, con su índice (index)*/
        if (y > 270) { /*Si la posición y es mayor a 270, se agrega una nueva página*/
            doc.addPage(); /*agrega pagina nueva*/
            y = 15;
        }
        const texto = `${index + 1}. ${act}`;
        const lineas = doc.splitTextToSize(texto, 95); // divide el texto en líneas de máx 95 px

        const altoLinea = 7;
        const altura = lineas.length * altoLinea;

        doc.text(lineas, 10, y); // escribe las líneas en x=10, y=y

        doc.rect(110, y - 4, 10, 6); // Cuadro SI
        /*doc.rect(x, y, width, height) dibuja un rectángulo*/
        doc.rect(125, y - 4, 10, 6); // Cuadro NO
        doc.rect(140, y - 4, 60, altura); // Cuadro OBS

        if (index === 0) {
            if (inspeccion === "si") {
                doc.text("x", 114, y);
            } else if (inspeccion === "no") {
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_inspeccion"]').value;
                if (motivo) {
                    doc.setFontSize(8); // tamaño más pequeño para caber
                    doc.text(doc.splitTextToSize(motivo, 58), 142, y); // ajusta texto en OBS
                    doc.setFontSize(9); // regresar a tamaño normal
                }
            }
        }
        if (index === 1) {
            if (limpieza_cepillo === "si") {
                doc.text("x", 114, y);
            } else if (limpieza_cepillo === "no") {
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_limpieza_cepillo"]').value;
                if (motivo) {
                    doc.setFontSize(8); // tamaño más pequeño para caber
                    doc.text(motivo, 142, y); // dentro del cuadro OBSERVACIONES
                    doc.setFontSize(9); // regresar a tamaño normal
                }
            }
        }
        if(index === 2) {
            if (limpieza_paño === "si") {
                doc.text("x", 114, y);
            } else if (limpieza_paño === "no") {
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_limpieza_paño"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 3){
            if(limpieza_cubierta === "si"){
                doc.text("x", 114, y);
            } else if(limpieza_cubierta === "no"){
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_limpieza_cubierta"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 4) {
            if (sopleteado === "si") {
                doc.text("x", 114, y);
            } else if (sopleteado === "no") {
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_sopleteado"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 5){
            if(touch === "si"){
                doc.text("x", 114, y)
            } else if (touch === "no"){
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_touch"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 6){
            if(bateria === "si"){
                doc.text("x", 114, y);
            } else if (bateria === "no"){
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_bateria"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 7){
            if(software === "si"){
                doc.text("x", 114, y);
            } else if(software === "no"){
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_software"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 8){
            if(conector === "si"){
                doc.text("x", 114, y);
            } else if(conector === "no"){
                doc.text("x", 129, y)
                const motivo = document.querySelector('input[id="input_conector"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 9){
            if(alimentacion === "si"){
                doc.text("x", 114, y);
            }else if(alimentacion === "no"){
                doc.text("x", 129, y)
                const motivo = document.querySelector('input[id="input_alimentacion"]').value;
                if (motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 10){
            if(carga_comunicacion === "si"){
                doc.text("x", 114, y);
            }else if(carga_comunicacion === "no"){
                doc.text("x", 129, y)
                const motivo = document.querySelector('input[id="input_carga_comunicacion"]').value;
                if (motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 11){
            if(teclado === "si"){
                doc.text("x", 114, y);
            }else if(teclado === "no"){
                doc.text("x", 129, y)
                const motivo = document.querySelector('input[id="input_teclado"]').value
                if (motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 12){
            if(gps === "si"){
                doc.text("x", 114, y);
            }else if(gps === "no"){
                doc.text("x", 129, y)
                const motivo = document.querySelector('input[id="input_gps"]').value
                if (motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        if(index === 13){
            if(funcionamiento === "si"){
                doc.text("x", 114, y);
            }else if(funcionamiento === "no"){
                doc.text("x", 129, y)
                const motivo = document.querySelector('input[id="input_funcionamiento"]').value;
                if (motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(9);
                }
            }
        }
        y += 6 * lineas.length + 4; // 7 px por línea + espacio extra
    });

    y+=5;
    // FIRMAS
        y+=8;
        if(firma1Base64)
            doc.addImage(firma1Base64, 'PNG', 15, y, 30, 30 );
    
        if(firma2Base64)
        doc.addImage(firma2Base64, 'PNG', 105, y, 30, 30, "center" );
    
        if(firma3Base64)
            doc.addImage(firma3Base64, 'PNG', 145, y, 30, 30 );
    
        y += 8;
        doc.text(`Realizó servicio:`, 15, y);
        doc.text(realizo_servicio, 15, y + 21);
        doc.text(`Responsable del Equipo:`, 105, y, "center");
        doc.text(responsable, 80, y + 21);
        doc.text(`Visto Bueno:`, 145, y);
        doc.text(visto_bueno, 145, y + 21);
        y += 22;
        doc.line(15, y, 60, y);
        doc.line(80, y, 130, y);
        doc.line(145, y, 200, y);
        y += 5;
        doc.text("Nombre y firma", 20, y);
        doc.text("Nombre y firma", 95, y);
        doc.text("Nombre y firma", 165, y);

    doc.save("mantenimiento_preventivo_tableta.pdf");
}
