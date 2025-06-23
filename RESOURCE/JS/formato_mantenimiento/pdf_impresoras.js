async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); /*crea pdf vacio*/

    // DATOS DE FORMULARIO
    const zona = document.querySelector('select[id="zona"]').value;
    const centro = document.querySelector('input[id="centro_trabajo"]').value;
    const folio = document.querySelector('input[id="folio"]').value;
    const fecha = document.querySelector('input[id="fecha"]').value;
    const usuario = document.querySelector('input[id="usuario"]').value;
    const tipo_equipo = document.querySelector('select[id="tipo_equipo"]').value;
    const marca = document.querySelector('input[id="marca"]').value;
    const modelo = document.querySelector('input[id="modelo"]').value;
    const serie = document.querySelector('input[id="numero_serie"]').value;
    const servicio = document.querySelector('select[id="servicio"]').value;
    const hora_inicio = document.querySelector('input[id="hora_inicio"]').value;
    const hora_termino = document.querySelector('input[id="hora_termino"]').value;
    
    const realizo_servicio = document.querySelector('input[id="realizo_servicio"]').value;
    const responsable = document.querySelector('input[id="responsable"]').value;
    const visto_bueno = document.querySelector('input[id="visto_bueno"]').value;
    const firma3Base64 = document.getElementById("firma-input-3").value;
    const firma2Base64 = document.getElementById("firma-input-2").value;
    const firma1Base64 = document.getElementById("firma-input-1").value
    
    // ENCABEZADO
    doc.setFont("helvetica"); /*tipo de letra y negritas*/
    doc.setFontSize(10);
    doc.text("Comisión Federal de Electricidad", 105, 40, null, null, "center");
    doc.text("Política Transversal de Calidad de CFE", 105, 40, null, null, "center");
    doc.text("Sistema Integral de Gestión (SIG-CFE)", 105, 40, null, null, "center");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("FORMATO MANTENIMIENTO PREVENTIVO IMPRESORAS", 105, 40, null, null, "center");
    /*doc.text(texto, x, y, opciones, transformaciones, alineación);*/

    // DATOS GENERALES

    const rectWidthSeccion1 = 55;
    const rectWidthSeccion2 = 46;
    const rectWidthSeccion3 = 33;
    const rectWidthSeccion4 = 44;
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

    //MARCA
    doc.setFont("helvetica", "normal", "bold");
    label = "Marca:";
    labelWidth = doc.getTextWidth(label);
    let xMarca = 73 + (rectWidthSeccion2 - labelWidth) / 2;
    doc.text(label, xMarca, y);

    doc.setFont("helvetica", "normal");
    let marcaWidth = doc.getTextWidth(marca);
    let xMarcaVal = 73 + (rectWidthSeccion2 - marcaWidth) / 2;
    doc.text(marca, xMarcaVal, y + 5);

    // === FECHA ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Fecha:";
    labelWidth = doc.getTextWidth(label);
    let xFecha = 122 + (rectWidthSeccion3 - labelWidth) / 2;
    doc.text(label, xFecha, y);

    doc.setFont("helvetica", "normal");
    let fechaWidth = doc.getTextWidth(fecha);
    let xFechaVal = 122 + (rectWidthSeccion3 - fechaWidth) / 2; //calcular la anchura del texto y restarla del ancho del rectángulo, 
                                                        // dividiendo el resultado entre 2 para obtener la posición x correcta.
    doc.text(fecha, xFechaVal, y + 5);

    // === FOLIO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Folio:";
    labelWidth = doc.getTextWidth(label);
    let xFolio = 158 + (rectWidthSeccion4 - labelWidth) / 2;
    doc.text(label, xFolio, y);

    doc.setFont("helvetica", "normal");
    let folioWidth = doc.getTextWidth(folio);
    let xFolioVal = 158 + (rectWidthSeccion4 - folioWidth) / 2;
    doc.text(folio, xFolioVal, y + 5);

    doc.rect(15, y - 4, 55, 12.5); 
    doc.line(15, y+.7, 70, y+.7);
    doc.rect(73, y - 4, 46, 12.5); 
    doc.line(73, y+.7, 119, y+.5);
    doc.rect(122, y - 4, 33, 12.5);
    doc.line(122, y+.7, 155, y+.5);
    doc.rect(158, y - 4, 44, 12.5);
    doc.line(158, y+.7, 202, y+.5);

    y += 15;
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

    // == MODELO ==
    doc.setFont("helvetica", "bold");
    label = "Modelo:";
    labelWidth = doc.getTextWidth(label);
    let xModelo = 73 + (rectWidthSeccion2 - labelWidth) / 2;
    doc.text(label, xModelo, y);

    doc.setFont("helvetica", "normal");
    let modeloWith = doc.getTextWidth(modelo);
    let xModeloVal = 73 + (rectWidthSeccion2 - modeloWith) / 2;
    doc.text(modelo, xModeloVal, y + 5);

    // == HORA DE INICIO ==
    doc.setFont("helvetica", "bold");
    label = "Hora inicio:";
    labelWidth = doc.getTextWidth(label);
    let xHoraInicio = 122 + (rectWidthSeccion3 - labelWidth) / 2;
    doc.text(label, xHoraInicio, y);

    doc.setFont("helvetica", "normal");
    let HoraInicioWidth = doc.getTextWidth(hora_inicio);
    let xHoraInicioVal = 122 + (rectWidthSeccion3 - HoraInicioWidth) / 2;
    doc.text(hora_inicio, xHoraInicioVal, y + 5);

    // == TIPO DE EQUIPO ==
    doc.setFont("helvetica", "bold");
    label = "Tipo de equipo:";
    labelWidth = doc.getTextWidth(label);
    let xTipoEquipo = 158 + (rectWidthSeccion4 - labelWidth) / 2;
    doc.text(label, xTipoEquipo, y);

    doc.setFont("helvetica", "normal");
    let TipoEquipoWidth = doc.getTextWidth(tipo_equipo);
    let xTipoEquipoVal = 158 + (rectWidthSeccion4 - TipoEquipoWidth) / 2;
    doc.text(tipo_equipo, xTipoEquipoVal, y + 5);

    doc.rect(15, y - 4, 55, 12.5); 
    doc.line(15, y+.7, 70, y+.7);
    doc.rect(73, y - 4, 46, 12.5); 
    doc.line(73, y+.7, 119, y+.5);
    doc.rect(122, y - 4, 33, 12.5);
    doc.line(122, y+.7, 155, y+.5);
    doc.rect(158, y - 4, 44, 12.5);
    doc.line(158, y+.7, 202, y+.5);

    y += 15;
    // === USUARIO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Nombre del usuario:";
    labelWidth = doc.getTextWidth(label);
    let xUsuario = 15 + (rectWidthSeccion1 - labelWidth) / 2;
    doc.text(label, xUsuario, y);

    doc.setFont("helvetica", "normal");
    let usuarioWidth = doc.getTextWidth(usuario);
    let xUsuarioVal = 15 + (rectWidthSeccion1 - usuarioWidth) / 2;
    doc.text(usuario, xUsuarioVal, y + 5);

    // === NUMERO DE SERIE ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Número de serie:";
    labelWidth = doc.getTextWidth(label);
    let xSerie = 73 + (rectWidthSeccion2 - labelWidth) / 2;
    doc.text(label, xSerie, y);

    doc.setFont("helvetica", "normal");
    let serieWidth = doc.getTextWidth(serie);
    let xSerieVal = 73 + (rectWidthSeccion2 - serieWidth) / 2;
    doc.text(serie, xSerieVal, y + 5);

    // === HORA FINAL ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Hora final:";
    labelWidth = doc.getTextWidth(label);
    let xHoraFinal = 122 + (rectWidthSeccion3 - labelWidth) / 2;
    doc.text(label, xHoraFinal, y);

    doc.setFont("helvetica", "normal");
    let horaFinalWidht = doc.getTextWidth(hora_termino);
    let xHoraFinalVal = 122 + (rectWidthSeccion3 - horaFinalWidht) / 2;
    doc.text(hora_termino, xHoraFinalVal, y + 5);

    // === SERVICIO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Servicio:";
    labelWidth = doc.getTextWidth(label);
    let xServicio = 158 + (rectWidthSeccion4 - labelWidth) / 2;
    doc.text(label, xServicio, y);

    doc.setFont("helvetica", "normal");
    let servicioWidth = doc.getTextWidth(servicio);
    let xServicioVal = 158 + (rectWidthSeccion4 - servicioWidth) / 2;
    doc.text(servicio, xServicioVal, y + 5);
 
    doc.rect(15, y - 4, 55, 12.5); 
    doc.line(15, y+.7, 70, y+.7);
    doc.rect(73, y - 4, 46, 12.5); 
    doc.line(73, y+.7, 119, y+.5);
    doc.rect(122, y - 4, 33, 12.5);
    doc.line(122, y+.7, 155, y+.5);
    doc.rect(158, y - 4, 44, 12.5);
    doc.line(158, y+.7, 202, y+.5);

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
        
        y += 11; /*Se incrementa y para la siguiente actividad*/
    });

     y += 5;

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
