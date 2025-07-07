document.addEventListener('DOMContentLoaded', function () {
    const btnGenerarPDF = document.querySelector('.boton--primario');
    btnGenerarPDF.addEventListener('click', validarFormulario);
});

function validarFormulario() {
    const camposRequeridos = [
        { id: 'zona', errorId: 'mensajeError' },
        { id: 'folio', errorId: 'mensajeError2' },
        { id: 'hrinicio', errorId: 'mensajeError3' },
        { id: 'hrtermino', errorId: 'mensajeError4' },
        { id: 'serie', errorId: 'mensajeError5' },
        { id: 'division', errorId: 'mensajeError6' },
        { id: 'numero_inventario', errorId: 'mensajeError7' },
        { id: 'usuario', errorId: 'mensajeError8' },
        { id: 'marca', errorId: 'mensajeError9' },
        { id: 'modelo', errorId: 'mensajeError10' },
        { id: 'tipo_uso', errorId: 'mensajeError11' },
        { id: 'centro_trabajo', errorId: 'mensajeError12' },
        { id: 'justificacion', errorId: 'mensajeError13' },
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
    const tipo = document.getElementById('tipo_equipo');
    const servicio = document.getElementById('servicio');

    if (tipo.value === "") {
        tipo.classList.add('campo-error');
        esValido = false;
    } else {
        tipo.classList.remove('campo-error');
    }

    if (servicio.value === "") {
        servicio.classList.add('campo-error');
        esValido = false;
    } else {
        servicio.classList.remove('campo-error');
    }

    // Validar radios obligatorios
    const radios = ['sopleteado', 'touch', 'bateria', 'Sw', 'conector', 'teclado', 
        'verificar'
    ];

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
/** Carga dinamica de configuracion_pdf.js si es necesario */
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
    return Promise.resolve();
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
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', calidad);
}

async function addCompressedImage(doc, source, x, y, w, h, calidad, descripcion) {
    if (descripcion === 'logo' || descripcion.startsWith('firma')) {
        doc.addImage(source, 'PNG', x, y, w, h);
        return;
    }
    let dURL = source;
    if (!source.startsWith('data:')) {
        const resp = await fetch(source, { mode: 'cors' });
        const blob = await resp.blob();
        dURL = await blobAdataURL(blob);
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

    const zona = document.querySelector('input[id="zona"').value;
    const folio = document.querySelector('input[id="folio"').value;
    const tipo_equipo = document.querySelector('select[id="tipo_equipo"').value;
    const servicio = document.querySelector('select[id="servicio"').value;
    const hora_inicio = document.querySelector('input[id="hrinicio"').value;
    const hora_termino = document.querySelector('input[id="hrtermino"').value;
    const serie = document.querySelector('input[id="serie"').value;
    const fecha = document.querySelector('input[id="fecha"').value;
    //const division = document.querySelector('input[id="division"').value;
    //const numero_inventario = document.querySelector('input[id="numero_inventario"').value;
    const usuario = document.querySelector('input[id="usuario"').value;
    const marca = document.querySelector('input[id="marca"').value;
    const modelo = document.querySelector('input[id="modelo"').value;
    const uso = document.querySelector('input[id="tipo_uso"').value;
    const centro = document.querySelector('input[id="centro_trabajo"').value;
    //const justificacion = document.querySelector('input[id="justificacion"').value;
    const sopleteado = document.querySelector('input[name="sopleteado"]:checked').value;
    const touch = document.querySelector('input[name="touch"]:checked').value;
    const bateria = document.querySelector('input[name="bateria"]:checked').value;
    const Sw = document.querySelector('input[name="Sw"]:checked').value;
    const conector = document.querySelector('input[name="conector"]:checked').value;
    const teclado = document.querySelector('input[name="teclado"]:checked').value;
    const verificar = document.querySelector('input[name="verificar"]:checked').value;
    const realizo_servicio = document.querySelector('input[id="realizo_servicio"').value;
    const responsable = document.querySelector('input[id="responsable"').value;
    const visto_bueno = document.querySelector('input[id="visto_bueno"').value;
    const firma3Base64 = document.getElementById("firma-input-3").value;
    const firma2Base64 = document.getElementById("firma-input-2").value;
    const firma1Base64 = document.getElementById("firma-input-1").value;


    // IMAGEN -- LOGO
    await addCompressedImage(doc, '/RESOURCE/IMG/Comisión_Federal_de_Electricidad_(logo)_.svg.png', 15, 8, 40, 20, compConfig.calidad_webp, 'logo');

    // ENCABEZADO
    doc.setFont("helvetica"); /*tipo de letra y negritas*/
    doc.setFontSize(10);
    doc.text("Comisión Federal de Electricidad", 105, 15, null, null, "center");
    doc.text("Política Transversal de Calidad de CFE", 105, 20, null, null, "center");
    doc.text("Sistema Integral de Gestión (SIG-CFE)", 105, 25, null, null, "center");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("FORMATO MANTENIMIENTO PREVENTIVO TPS HONEYWELL", 105, 40, null, null, "center");
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

    doc.rect(15, y - 4, 55, 14); 
    doc.line(15, y+.7, 70, y+.7);
    doc.rect(73, y - 4, 46, 14); 
    doc.line(73, y+.7, 119, y+.5);
    doc.rect(122, y - 4, 33, 14);
    doc.line(122, y+.7, 155, y+.5);
    doc.rect(158, y - 4, 44, 14);
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

    doc.rect(15, y - 4, 55, 14); 
    doc.line(15, y+.7, 70, y+.7);
    doc.rect(73, y - 4, 46, 14); 
    doc.line(73, y+.7, 119, y+.5);
    doc.rect(122, y - 4, 33, 14);
    doc.line(122, y+.7, 155, y+.5);
    doc.rect(158, y - 4, 44, 14);
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
 
    doc.rect(15, y - 4, 55, 14); 
    doc.line(15, y+.7, 70, y+.7);
    doc.rect(73, y - 4, 46, 14); 
    doc.line(73, y+.7, 119, y+.5);
    doc.rect(122, y - 4, 33, 14);
    doc.line(122, y+.7, 155, y+.5);
    doc.rect(158, y - 4, 44, 14);
    doc.line(158, y+.7, 202, y+.5);
    
    y+= 15;
    // === USO ===
    doc.setFont("helvetica", "normal", "bold");
    label = "Uso de que se le da al equipo:";
    labelWidth = doc.getTextWidth(label);
    let xUso = 15 + (rectWidthSeccion1 - labelWidth) / 2;
    doc.text(label, xUso, y);

    doc.setFont("helvetica", "normal");
    let usoWidth = doc.getTextWidth(uso);
    let xUsoVal = 15 + (rectWidthSeccion1 - usoWidth) / 2;
    doc.text(uso, xUsoVal, y + 5);

    doc.rect(15, y - 4, 55, 14); 
    doc.line(15, y+.7, 70, y+.7);

    // TABLA DE ACTIVIDADES
    y += 25;
    doc.setFont("helvetica", "bold");
    doc.text("ACTIVIDADES", 16, y);
    doc.text("SI", 110, y);
    doc.text("NO", 118, y);
    doc.text("OBSERVACIONES", 150, y);

    doc.setFont("helvetica", "normal");
    const pageWidth = doc.internal.pageSize.getWidth();
    const z = pageWidth - 23;
    doc.rect(15, y-4, z, 48); // TABLA
    const top = y - 4;
    const bottom = y - 4 + 48;

    doc.line(108, top, 108, bottom); // primera línea vertical
    doc.line(116, top, 116, bottom); // segunda línea vertical
    doc.line(125, top, 125, bottom)

    const w = pageWidth - 8;

    doc.line(15,y+2, w, y+2 );

    y+=6;
    doc.text(`Limpieza y sopleteado extremo del equipo`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (sopleteado === "si") {
        doc.text("x", 112, y);
    } else if (sopleteado === "no") {
        doc.text("x", 120, y);
        const motivo = document.querySelector('input[id="input_sopleteado"]').value;
        if (motivo) {
            doc.setFontSize(8); // tamaño más pequeño para caber
            doc.text(motivo, 126, y); // dentro del cuadro OBSERVACIONES
            doc.setFontSize(10); // regresar a tamaño normal
        }
    }
    y+=6;
    doc.text(`Validar touch pantalla`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (touch === "si") {
        doc.text("x", 112, y);
    } else if (touch === "no") {
        doc.text("x", 120, y);
        const motivo = document.querySelector('input[id="input_sopleteado"]').value;
        if (motivo) {
            doc.setFontSize(8); // tamaño más pequeño para caber
            doc.text(motivo, 126, y); // dentro del cuadro OBSERVACIONES
            doc.setFontSize(10); // regresar a tamaño normal
        }
    }

    y+=6;
    doc.text(`Revisión de batería`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (bateria === "si") {
        doc.text("x", 112, y);
    } else if (bateria === "no") {
        doc.text("x", 120, y);
        const motivo = document.querySelector('input[id="input_bateria"]').value;
        if (motivo) {
            doc.setFontSize(8); // tamaño más pequeño para caber
            doc.text(motivo, 126, y); // dentro del cuadro OBSERVACIONES
            doc.setFontSize(10); // regresar a tamaño normal
        }
    }

    y+=6;
    doc.text(`Verificar Sw institucional actualizado`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (Sw === "si") {
        doc.text("x", 112, y);
    } else if (Sw === "no") {
        doc.text("x", 120, y);
        const motivo = document.querySelector('input[id="input_Sw"]').value;
        if (motivo) {
            doc.setFontSize(8); // tamaño más pequeño para caber
            doc.text(motivo, 126, y); // dentro del cuadro OBSERVACIONES
            doc.setFontSize(10); // regresar a tamaño normal
        }
    }

    y+=6;
    doc.text(`Verificar estado del conector de datos`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (conector === "si") {
        doc.text("x", 112, y);
    } else if (conector === "no") {
        doc.text("x", 120, y);
        const motivo = document.querySelector('input[id="input_conector"]').value;
        if (motivo) {
            doc.setFontSize(8); // tamaño más pequeño para caber
            doc.text(motivo, 126, y); // dentro del cuadro OBSERVACIONES
            doc.setFontSize(10); // regresar a tamaño normal
        }
    }

    y+=6;
    doc.text(`Validar estado del teclado`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (teclado === "si") {
        doc.text("x", 112, y);
    } else if (teclado === "no") {
        doc.text("x", 120, y);
        const motivo = document.querySelector('input[id="input_teclado"]').value;
        if (motivo) {
            doc.setFontSize(8); // tamaño más pequeño para caber
            doc.text(motivo, 126, y); // dentro del cuadro OBSERVACIONES
            doc.setFontSize(10); // regresar a tamaño normal
        }
    }

    y+=6;
    doc.text(`Verificar funcionamiento del equipo después del servicio`, 16, y);

    if (verificar === "si") {
        doc.text("x", 112, y);
    } else if (verificar === "no") {
        doc.text("x", 120, y);
        const motivo = document.querySelector('input[id="input_teclado"]').value;
        if (motivo) {
            doc.setFontSize(8); // tamaño más pequeño para caber
            doc.text(motivo, 126, y); // dentro del cuadro OBSERVACIONES
            doc.setFontSize(10); // regresar a tamaño normal
        }
    }

    // FIRMAS
    y+=55;

   

    y += 12;
    doc.text(`Realizó servicio:`, 15, y-5);
    doc.setFontSize(7);
    doc.text(realizo_servicio, 15, y + 30);
    doc.setFontSize(10);
    doc.text(`Responsable del Equipo:`, 105, y-5, "center");
    doc.setFontSize(7);
    doc.text(responsable, 80, y + 30);
    doc.setFontSize(10);
    doc.text(`Visto Bueno:`, 145, y-5);
    doc.setFontSize(7);
    doc.text(visto_bueno, 145, y + 30);
    y += 8;
     if (firma1Base64) await addCompressedImage(doc, firma1Base64, 15, y, 40, 20, compConfig.calidad_webp, 'firma1');
    if (firma2Base64) await addCompressedImage(doc, firma2Base64, 82, y, 40, 20, compConfig.calidad_webp, 'firma2');
    if (firma3Base64) await addCompressedImage(doc, firma3Base64, 147, y, 40, 20, compConfig.calidad_webp, 'firma3');
        y += 23;

    doc.line(15, y, 60, y);
    doc.line(80, y, 130, y);
    doc.line(145, y, 200, y);
    y += 5;
    doc.setFontSize(10);
    doc.text("Nombre y firma", 20, y);
    doc.text("Nombre y firma", 95, y);
    doc.text("Nombre y firma", 165, y);

    // Usar el sistema de nombrado automático basado en número de serie
    requestPDFFilename((filename) => {
        // Procesar el PDF: descarga, guardar en repositorio y mostrar modal
        procesarPDFMantenimiento(doc, filename, 'TPS_HONEYWELL');
    }, serie, 'TPS_HONEYWELL');
}

function validarYGenerarPDF() {
    // Alias para compatibilidad con onclick en TPS_Honeywell.html
    validarFormulario();
}
