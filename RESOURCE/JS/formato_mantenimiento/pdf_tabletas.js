document.addEventListener('DOMContentLoaded', function () {
    const btnGenerarPDF = document.querySelector('.boton--primario');
    btnGenerarPDF.addEventListener('click', validarFormulario);
});

function validarFormulario() {
    const camposRequeridos = [
        { id: 'zona', errorId: 'mensajeError' },
        { id: 'folio', errorId: 'mensajeError2' },
        { id: 'hr.inicio', errorId: 'mensajeError3' },
        { id: 'hr.termino', errorId: 'mensajeError4' },
        { id: 'RPE', errorId: 'mensajeError5' },
        { id: 'serie', errorId: 'mensajeError6' },
        { id: 'division', errorId: 'mensajeError7' },
        { id: 'numero_inventario', errorId: 'mensajeError8' },
        { id: 'usuario', errorId: 'mensajeError9' },
        { id: 'marca', errorId: 'mensajeError10' },
        { id: 'modelo', errorId: 'mensajeError11' },
        { id: 'centro_trabajo', errorId: 'mensajeError12' },
        { id: 'procesos', errorId: 'mensajeError13' },
    ];

    let esValido = true;

    camposRequeridos.forEach(campo => {
        const input = document.getElementById(campo.id);
        const mensaje = document.getElementById(campo.errorId);

        if (!input.value.trim()) {
            input.classList.add('campo-error');
            mensaje.textContent = '¿Esta seguro en dejar este campo vacío?';
            esValido = false;
        } else {
            input.classList.remove('campo-error');
            mensaje.textContent = '';
        }
    });

    // Validar selects
    const servicio = document.getElementById('servicio');

    if (servicio.value === "") {
        servicio.classList.add('campo-error');
        esValido = false;
    } else {
        servicio.classList.remove('campo-error');
    }

    // Validar radios obligatorios
    const radios = ['inspeccion', 'limpieza_cepillo', 'limpieza_paño', 'limpieza_cubierta', 'sopleteado', 'touch', 'bateria', 'software', 'conector',
        'alimentacion', 'carga_comunicacion', 'teclado', 'gps', 'funcionamiento'];

    radios.forEach(nombre => {
        const opciones = document.getElementsByName(nombre);
        const algunoSeleccionado = [...opciones].some(op => op.checked);

        if (!algunoSeleccionado) {
            const contenedor = opciones[0]?.closest('.campo');
            if (contenedor) contenedor.classList.add('campo-error');
            esValido = false;
        } else {
            const contenedor = opciones[0]?.closest('.campo');
            if (contenedor) contenedor.classList.remove('campo-error');
        }
    });

    if (esValido) {
        generarPDF();
    } else {
        const continuar = confirm("Hay campos vacíos. ¿Está seguro de que desea continuar?");
        if (continuar) {
            generarPDF();
        }   // Si no confirma, no se genera el PDF y los campos vacíos ya están marcados en rojo
}
}

function blobAdataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function convertirPNGtoJPEG(dataSource, calidad) {
    let dataURL = dataSource;
    if (!dataSource.startsWith('data:')) {
        const resp = await fetch(dataSource, { mode: 'cors' });
        const blob = await resp.blob();
        dataURL = await blobAdataURL(blob);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataURL;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', calidad);
}

async function addCompressedImage(doc, source, x, y, w, h, calidad, descripcion) {
    if (descripcion === 'logo' || descripcion.startsWith('firma')) {
        doc.addImage(source, 'PNG', x, y, w, h);
        return;
    }
    let dURL = source;
    if (!source.startsWith('data:')) {
        const r = await fetch(source, { mode: 'cors' });
        const b = await r.blob();
        dURL = await blobAdataURL(b);
    }
    const jpeg = await convertirPNGtoJPEG(dURL, calidad);
    doc.addImage(jpeg, 'JPEG', x, y, w, h);
}

async function generarPDF() {
    await cargarConfiguracionPDF();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ compress: true });
    const sizeController = new PDFSizeController();
    const compConfig = sizeController.calcularConfiguracionInicial(4);
    // IMAGEN LOGO
    await addCompressedImage(doc, '/RESOURCE/IMG/Comisión_Federal_de_Electricidad_(logo)_.svg.png', 15, 8, 40, 20, compConfig.calidad_webp, 'logo');
    //CAPTURADO DE DATOS
    const zona = document.querySelector('input[id="zona"]').value;
        const fecha = document.querySelector('input[id="fecha"]').value;

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

    doc.rect(15, y - 4, 65, 14); 
    doc.line(15, y+.7, 80, y+.7);
    doc.rect(82, y - 4, 65, 14); 
    doc.line(82, y+.7, 147, y+.5);
    doc.rect(149, y - 4, 53, 14);
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

    doc.rect(15, y - 4, 65, 14); 
    doc.line(15, y+.7, 80, y+.7);
    doc.rect(82, y - 4, 65, 14); 
    doc.line(82, y+.7, 147, y+.5);
    doc.rect(149, y - 4, 53, 14);
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

    doc.rect(15, y - 4, 65, 14); 
    doc.line(15, y+.7, 80, y+.7);
    doc.rect(82, y - 4, 65, 14); 
    doc.line(82, y+.7, 147, y+.5);
    doc.rect(149, y - 4, 53, 14);
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

    doc.rect(82, y - 4, 65, 14); 
    doc.line(82, y+.7, 147, y+.5);
    doc.rect(149, y - 4, 53, 14);
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
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text("ACTIVIDADES", 16, y);
    doc.text("SI", 110, y);
    doc.text("NO", 120, y);
    doc.text("OBSERVACIONES", 153, y);

    doc.setFont("helvetica", "normal");
    const pageWidth2 = doc.internal.pageSize.getWidth();
    const z = pageWidth2 - 23;
    doc.rect(15, y-4, z, 95); // TABLA
    const top = y - 4;
    const bottom = y - 4 + 95;

    doc.line(108, top, 108, bottom); // primera línea vertical
    doc.line(118, top, 118, bottom); // segunda línea vertical
    doc.line(128, top, 128, bottom)

    const w = pageWidth2 - 8;

    doc.line(15,y+2, w, y+2 );

    y+=6;
    doc.text(`Realizar inspección inicial del equipo`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (inspeccion === "si") {
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
        } else if (inspeccion === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_inspeccion"]').value;
            if (motivo) {
                doc.setFontSize(8); // tamaño más pequeño para caber
                doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                doc.setFontSize(10); // regresar a tamaño normal
            }
        }

    y+=6;
    doc.setFontSize(8.3);
    doc.text(`Limpieza externa usando cepillo de cerdas suaves antiestáticas`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (limpieza_cepillo === "si") {
         doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
        } else if (limpieza_cepillo === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_limpieza_cepillo"]').value;
            if (motivo) {
                doc.setFontSize(8); // tamaño más pequeño para caber
                doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                doc.setFontSize(9); // regresar a tamaño normal
            }
    }

    y+=6;
    doc.setFontSize(8.3);
    doc.text(`Limpieza de touch con paño suave, sin detergentes o abrasivos`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (limpieza_paño === "si") {
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
        } else if (limpieza_paño === "no") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 
        const motivo = document.querySelector('input[id="input_limpieza_paño"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }

    y+=6;
    doc.setFontSize(8.3);
    const texto = "La cubierta de franela o tela microfibra limpia y humedecida con líquido para limpieza de equipo de cómputo";
    const anchoMax = 90; // espacio antes de la línea vertical (108 - 16 - margen extra)
    const textoDividido = doc.splitTextToSize(texto, anchoMax);

    doc.text(textoDividido, 16, y); // dibuja el texto en varias líneas automáticas

    // Marca con "x" en SI o NO (alineado con la primera línea del texto)
    if (limpieza_cubierta === "si") {
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica");  // columna SI
    } else if (limpieza_cubierta === "no") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica");  // columna NO

        const motivo = document.querySelector('input[id="input_limpieza_cubierta"]').value;
        if (motivo) {
            doc.setFontSize(8);
            doc.text(motivo, 129, y); // columna observaciones
            doc.setFontSize(10);
        }
    }

    // Línea horizontal al final del texto
    doc.line(15,y+6, w, y+6 );
    
    y+=10;
    doc.text(`Sopleteado externo del equipo`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (sopleteado === "si") {
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
    } else if (sopleteado === "no") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 
        const motivo = document.querySelector('input[id="input_sopleteado"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }

    y+=6;
    doc.text(`Calibración de touch pantalla`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if(touch === "si"){
    doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
    } else if (touch === "no"){
    doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 

        
        const motivo = document.querySelector('input[id="input_touch"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }

    y+=6;
    doc.text(`Revisión de batería`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if(bateria === "si"){
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
    } else if (bateria === "no"){
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 
        const motivo = document.querySelector('input[id="input_bateria"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }

    y+=6;
    doc.text(`Verificar software institucional actualizado`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if(software === "si"){
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
    } else if(software === "no"){
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 
        const motivo = document.querySelector('input[id="input_software"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }

    y+=6;
    doc.text(`Verificar estado del conector de datos`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if(carga_comunicacion === "si"){
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
    } else if(carga_comunicacion === "no"){
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica");         
    const motivo = document.querySelector('input[id="input_carga_comunicacion"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }

    y+=6;
    doc.text(`Conexión a alimentación eléctrica para la carga total`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if(alimentacion === "si"){
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
    } else if(alimentacion === "no"){
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 
        const motivo = document.querySelector('input[id="input_alimentacion"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }

    y+=6;
    doc.text(`Verificar estado del conector de datos`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if(conector === "si"){
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
    } else if(conector === "no"){
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 
        const motivo = document.querySelector('input[id="input_conector"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }
    
    y+=6;
    doc.text(`Validar estado del teclado`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if(teclado === "si"){
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
    } else if(teclado === "no"){
        doc.text("x", 122, y)
        const motivo = document.querySelector('input[id="input_teclado"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }

    y+=6;
    doc.text(`Verificar estado de GPS(TPS)`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if(gps === "si"){
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
    } else if(gps === "no"){
        doc.text("x", 122, y)
        const motivo = document.querySelector('input[id="input_gps"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }

    y+=6;
    doc.text(`Verificar funcionamiento del equopo después del servicio`, 16, y);
    if(funcionamiento === "si"){
             doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica"); 
    } else if(funcionamiento === "no"){
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 
        const motivo = document.querySelector('input[id="input_funcionamiento"]').value;
        if(motivo){
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(9);
        }
    }

    y+=5;
    // FIRMAS
        y+=20;
    doc.setFontSize(10);
    doc.text(`Realizó servicio:`, 25, y-8);
    doc.setFontSize(7);
    doc.text(realizo_servicio, 15, y + 21);
    doc.setFontSize(10);
    doc.text(`Responsable del Equipo:`, 105, y-8, "center");
    doc.setFontSize(7);
    doc.text(responsable, 80, y + 21);
    doc.setFontSize(10);
    doc.text(`Visto Bueno:`, 155, y-8);
    doc.setFontSize(7);
    doc.text(visto_bueno, 145, y + 21);
    if(firma1Base64)
            doc.addImage(firma1Base64, 'PNG', 17, y-2, 40, 20 );
    
        if(firma2Base64)
        doc.addImage(firma2Base64, 'PNG', 82, y-2, 40, 20,  );
    
        if(firma3Base64)
            doc.addImage(firma3Base64, 'PNG', 150, y-2, 40, 20 );
    y += 22;
    doc.line(15, y, 60, y);
    doc.line(80, y, 130, y);
    doc.line(145, y, 200, y);
    y += 5;
    doc.text("Nombre y firma", 28, y);
    doc.text("Nombre y firma", 95, y);
    doc.text("Nombre y firma", 165, y);

    // Usar el sistema de nombrado automático basado en número de serie
    requestPDFFilename((filename) => {
        doc.save(filename);
    }, serie, 'TABLETA');
}

/** Carga dinámica de configuracion_pdf.js si es necesario */
async function cargarConfiguracionPDF() {
    if (typeof PDFSizeController === 'undefined') {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/RESOURCE/JS/configuracion_pdf.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}
