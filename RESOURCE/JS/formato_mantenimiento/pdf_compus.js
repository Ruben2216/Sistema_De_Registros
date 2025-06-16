async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); /*crea pdf vacio*/

    // DATOS DE FORMULARIO
    //const division = document.querySelector('input[id="division"]').value;
    const zona = document.querySelector('select[id="zona"]').value;
    const centro = document.querySelector('input[id="centro_trabajo"]').value;
    //const inventario = document.querySelector('input[id="numero_inventario"]').value;
    const folio = document.querySelector('input[id="folio"]').value;
    const fecha = document.querySelector('input[id="fecha"]').value;
    const usuario = document.querySelector('input[id="usuario"]').value;
    const tipo_equipo = document.querySelector('select[id="tipo_equipo"]').value;
    const uso = document.querySelector('input[id="tipo_uso"]').value;
    const marca = document.querySelector('input[id="marca"]').value;
    const modelo = document.querySelector('input[id="modelo"]').value;
    const serie = document.querySelector('input[id="numero_serie"]').value;
    const servicio = document.querySelector('select[id="servicio"]').value;
    const hora_inicio = document.querySelector('input[id="hora_inicio"]').value;
    const hora_termino = document.querySelector('input[id="hora_termino"]').value;
    const limpieza_externa = document.querySelector('input[name="limpieza_externa"]:checked').value;
    const pantalla = document.querySelector('input[name="pantalla"]:checked').value;
    const teclado = document.querySelector('input[name="teclado"]:checked').value;
    const conexiones = document.querySelector('input[name="conexiones"]:checked').value;
    const despues_servicio = document.querySelector('input[name="despues_servicio"]:checked').value;
    const antivirus = document.querySelector('input[name="antivirus"]:checked').value;
    const defrag = document.querySelector('input[name="defrag"]:checked').value;
    const dominio = document.querySelector('input[name="dominio"]:checked').value;
    const Windows_update = document.querySelector('input[name="Windows_update"]:checked').value;
    const realizo_servicio = document.querySelector('input[id="realizo_servicio"]').value;
    const responsable = document.querySelector('input[id="responsable"]').value;
    const visto_bueno = document.querySelector('input[id="visto_bueno"]').value;

    
    // ENCABEZADO
    doc.setFont("helvetica"); /*tipo de letra y negritas*/
    doc.setFontSize(12);
    doc.text("Comisión Federal de Electricidad", 15, 15);
    doc.setFontSize(10);
    doc.text("Política Transversal de Calidad de CFE", 15, 20);
    doc.text("Sistema Integral de Gestión (SIG-CFE)", 15, 25);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("FORMATO MANTENIMIENTO PREVENTIVO TABLETAS", 105, 40, null, null, "center");
    /*doc.text(texto, x, y, opciones, transformaciones, alineación);*/

    // DATOS GENERALES

    const rectWidth = 43;
    doc.setFontSize(9);
    let y = 55;

    doc.setFont("helvetica", "normal", "bold");
    let label = "Zona:";
    let labelWidth = doc.getTextWidth(label);
    let xZona = 15 + (rectWidth - labelWidth) / 2;
    doc.text(label, xZona, y);

    doc.setFont("helvetica", "normal");
    let zonaWidth = doc.getTextWidth(zona);
    let xZonaVal = 15 + (rectWidth - zonaWidth) / 2;
    doc.text(zona, xZonaVal, y + 5);

    doc.setFont("helvetica", "normal", "bold");
    label = "Marca:";
    labelWidth = doc.getTextWidth(label);
    let xMarca = 63 + (rectWidth - labelWidth) / 2;
    doc.text(label, xMarca, y);

    doc.setFont("helvetica", "normal");
    let marcaWidth = doc.getTextWidth(marca);
    let xMarcaVal = 63 + (rectWidth - marcaWidth) / 2;
    doc.text(marca, xMarcaVal, y + 5);

    // === FECHA ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Fecha:";
    labelWidth = doc.getTextWidth(label);
    let xFecha = 111 + (rectWidth - labelWidth) / 2;
    doc.text(label, xFecha, y);

    doc.setFont("helvetica", "normal");
    let fechaWidth = doc.getTextWidth(fecha);
    let xFechaVal = 111 + (rectWidth - fechaWidth) / 2; //calcular la anchura del texto y restarla del ancho del rectángulo, 
                                                        // dividiendo el resultado entre 2 para obtener la posición x correcta.
    doc.text(fecha, xFechaVal, y + 5);

    // === FOLIO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Folio:";
    labelWidth = doc.getTextWidth(label);
    let xFolio = 159 + (rectWidth - labelWidth) / 2;
    doc.text(label, xFolio, y);

    doc.setFont("helvetica", "normal");
    let folioWidth = doc.getTextWidth(folio);
    let xFolioVal = 159 + (rectWidth - folioWidth) / 2;
    doc.text(folio, xFolioVal, y + 5);

    doc.rect(15, y - 4, 43, 12.5); 
    doc.line(15, y+.7, 58, y+.7);
    doc.rect(63, y - 4, 43, 12.5); 
    doc.line(63, y+.7, 106, y+.5);
    doc.rect(111, y - 4, 43, 12.5);
    doc.line(111, y+.7, 154, y+.5);
    doc.rect(159, y - 4, 43, 12.5);
    doc.line(159, y+.7, 202, y+.5);

    y += 15;
    // === CENTRO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Centro de trabajo:";
    labelWidth = doc.getTextWidth(label);
    let xCentro = 15 + (rectWidth - labelWidth) / 2;
    doc.text(label, xCentro, y);

    doc.setFont("helvetica", "normal");
    let centroWidth = doc.getTextWidth(centro);
    let xCentroVal = 15 + (rectWidth - centroWidth) / 2;
    doc.text(centro, xCentroVal, y + 5);

    // == MODELO ==
    doc.setFont("helvetica", "bold");
    label = "Modelo:";
    labelWidth = doc.getTextWidth(label);
    let xModelo = 63 + (rectWidth - labelWidth) / 2;
    doc.text(label, xModelo, y);

    doc.setFont("helvetica", "normal");
    let modeloWith = doc.getTextWidth(modelo);
    let xModeloVal = 63 + (rectWidth - modeloWith) / 2;
    doc.text(modelo, xModeloVal, y + 5);

    // == HORA DE INICIO ==
    doc.setFont("helvetica", "bold");
    label = "Hora inicio:";
    labelWidth = doc.getTextWidth(label);
    let xHoraInicio = 111 + (rectWidth - labelWidth) / 2;
    doc.text(label, xHoraInicio, y);

    doc.setFont("helvetica", "normal");
    let HoraInicioWidth = doc.getTextWidth(hora_inicio);
    let xHoraInicioVal = 111 + (rectWidth - HoraInicioWidth) / 2;
    doc.text(hora_inicio, xHoraInicioVal, y + 5);

    // == TIPO DE EQUIPO ==
    doc.setFont("helvetica", "bold");
    label = "Tipo de equipo:";
    labelWidth = doc.getTextWidth(label);
    let xTipoEquipo = 159 + (rectWidth - labelWidth) / 2;
    doc.text(label, xTipoEquipo, y);

    doc.setFont("helvetica", "normal");
    let TipoEquipoWidth = doc.getTextWidth(tipo_equipo);
    let xTipoEquipoVal = 159 + (rectWidth - TipoEquipoWidth) / 2;
    doc.text(tipo_equipo, xTipoEquipoVal, y + 5);

    doc.rect(15, y - 4, 43, 12.5); 
    doc.line(15, y+.7, 58, y+.7);
    doc.rect(63, y - 4, 43, 12.5); 
    doc.line(63, y+.7, 106, y+.5);
    doc.rect(111, y - 4, 43, 12.5);
    doc.line(111, y+.7, 154, y+.5);
    doc.rect(159, y - 4, 43, 12.5);
    doc.line(159, y+.7, 202, y+.5);

    y += 15;
    // === USUARIO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Nombre del usuario:";
    labelWidth = doc.getTextWidth(label);
    let xUsuario = 15 + (rectWidth - labelWidth) / 2;
    doc.text(label, xUsuario, y);

    doc.setFont("helvetica", "normal");
    let usuarioWidth = doc.getTextWidth(usuario);
    let xUsuarioVal = 15 + (rectWidth - usuarioWidth) / 2;
    doc.text(usuario, xUsuarioVal, y + 5);

    // === NUMERO DE SERIE ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Número de serie:";
    labelWidth = doc.getTextWidth(label);
    let xSerie = 63 + (rectWidth - labelWidth) / 2;
    doc.text(label, xSerie, y);

    doc.setFont("helvetica", "normal");
    let serieWidth = doc.getTextWidth(serie);
    let xSerieVal = 63 + (rectWidth - serieWidth) / 2;
    doc.text(serie, xSerieVal, y + 5);

    // === HORA FINAL ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Hora final:";
    labelWidth = doc.getTextWidth(label);
    let xHoraFinal = 111 + (rectWidth - labelWidth) / 2;
    doc.text(label, xHoraFinal, y);

    doc.setFont("helvetica", "normal");
    let horaFinalWidht = doc.getTextWidth(hora_termino);
    let xHoraFinalVal = 111 + (rectWidth - horaFinalWidht) / 2;
    doc.text(hora_termino, xHoraFinalVal, y + 5);

    // === SERVICIO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Servicio:";
    labelWidth = doc.getTextWidth(label);
    let xServicio = 159 + (rectWidth - labelWidth) / 2;
    doc.text(label, xServicio, y);

    doc.setFont("helvetica", "normal");
    let servicioWidth = doc.getTextWidth(servicio);
    let xServicioVal = 159 + (rectWidth - servicioWidth) / 2;
    doc.text(servicio, xServicioVal, y + 5);
 
    doc.rect(15, y - 4, 43, 12.5); 
    doc.line(15, y+.7, 58, y+.7);
    doc.rect(63, y - 4, 43, 12.5); 
    doc.line(63, y+.7, 106, y+.5);
    doc.rect(111, y - 4, 43, 12.5);
    doc.line(111, y+.7, 154, y+.5);
    doc.rect(159, y - 4, 43, 12.5);
    doc.line(159, y+.7, 202, y+.5);
    
    y+= 15;
    // === USO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Servicio:";
    labelWidth = doc.getTextWidth(label);
    let xUso = 15 + (rectWidth - labelWidth) / 2;
    doc.text(label, xUso, y);

    doc.setFont("helvetica", "normal");
    let usoWidth = doc.getTextWidth(uso);
    let xUsoVal = 15 + (rectWidth - usoWidth) / 2;
    doc.text(uso, xUsoVal, y + 5);

    doc.rect(15, y - 4, 43, 12.5); 
    doc.line(15, y+.7, 58, y+.5);

    // TABLA DE ACTIVIDADES
    y += 25;
    doc.setFont("helvetica", "bold");
    doc.text("ACTIVIDADES", 15, y);
    doc.text("SI", 112, y);
    doc.text("NO", 127, y);
    doc.text("OBSERVACIONES", 153, y);

    doc.setFont("helvetica", "normal");

    const actividades = [ /*arreglo de actividades "cadena de texto"*/
        "Limpieza externa del equipo",
        "Limpieza externa de pantalla",
        "Limpieza externa de teclado",
        "Verificar conexiones eléctricas en buen estado",
        "Verificar que funcione correctamente después del servicio",
        "Antivirus instituional actualizado",
        "Ejecución de Defrag",
        "Equipo dentro del dominio",
        "Sistema operativo actualizado (Windows update)",
    ];

    y += 10;
    actividades.forEach((act, index) => { /*Se recorre cada elemento (act) del arreglo actividades, con su índice (index)*/
        if (y > 270) { /*Si la posición y es mayor a 270, se agrega una nueva página*/
            doc.addPage(); /*agrega pagina nueva*/
            y = 15;
        }
        doc.text(`${index + 1}. ${act}`, 10, y); /*Se usa `${index + 1}. ${act}` para que cada actividad esté numerada y se coloque en y*/
        doc.rect(110, y - 4, 10, 6); // Cuadro SI
        /*doc.rect(x, y, width, height) dibuja un rectángulo*/
        doc.rect(125, y - 4, 10, 6); // Cuadro NO
        doc.rect(140, y - 4, 60, 6); // Cuadro OBS

        if (index === 0) {
            if (limpieza_externa === "si") {
                doc.text("x", 114, y);
            } else if (limpieza_externa === "no") {
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_limpieza_externa"]').value;
                if (motivo) {
                    doc.setFontSize(8); // tamaño más pequeño para caber
                    doc.text(motivo, 142, y); // dentro del cuadro OBSERVACIONES
                    doc.setFontSize(10); // regresar a tamaño normal
                }
            }
        }
        if (index === 1) {
            if (pantalla === "si") {
                doc.text("x", 114, y);
            } else if (pantalla === "no") {
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_pantalla"]').value;
                if (motivo) {
                    doc.setFontSize(8); // tamaño más pequeño para caber
                    doc.text(motivo, 142, y); // dentro del cuadro OBSERVACIONES
                    doc.setFontSize(10); // regresar a tamaño normal
                }
            }
        }
        if(index === 2) {
            if (teclado === "si") {
                doc.text("x", 114, y);
            } else if (teclado === "no") {
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_teclado"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(10);
                }
            }
        }
        if(index === 3){
            if(conexiones === "si"){
                doc.text("x", 114, y);
            } else if(conexiones === "no"){
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_conexiones"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(10);
                }
            }
        }
        if(index === 4) {
            if (despues_servicio === "si") {
                doc.text("x", 114, y);
            } else if (despues_servicio === "no") {
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_despues_servicio"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(10);
                }
            }
        }
        if(index === 5){
            if(antivirus === "si"){
                doc.text("x", 114, y)
            } else if (antivirus === "no"){
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_antivirus"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(10);
                }
            }
        }
        if(index === 6){
            if(defrag === "si"){
                doc.text("x", 114, y);
            } else if (defrag === "no"){
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_defrag"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(10);
                }
            }
        }
        if(index === 7){
            if(dominio === "si"){
                doc.text("x", 114, y);
            } else if(dominio === "no"){
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[id="input_dominio"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(10);
                }
            }
        }
        if(index === 8){
            if(Windows_update === "si"){
                doc.text("x", 114, y);
            } else if(Windows_update === "no"){
                doc.text("x", 129, y)
                const motivo = document.querySelector('input[id="input_Windows_update"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 142, y);
                    doc.setFontSize(10);
                }
            }
        }
        y += 11; /*Se incrementa y para la siguiente actividad*/
    });

     y += 5;

    // FIRMAS
    y += 8;
    doc.text(`Realizó servicio:`, 15, y);
    doc.text(realizo_servicio, 15, y + 21);
    doc.text(`Responsable del Equipo:`, 80, y);
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
