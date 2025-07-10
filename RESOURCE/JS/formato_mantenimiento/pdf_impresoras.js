document.addEventListener('DOMContentLoaded', function () {
    const btnGenerarPDF = document.querySelector('.boton--PDF');
    btnGenerarPDF.addEventListener('click', validarFormulario);
});

function validarFormulario() {
    const camposRequeridos = [
        { id: 'folio', errorId: 'mensajeError' },
        { id: 'hrInicio', errorId: 'mensajeError2' },
        { id: 'hrTermino', errorId: 'mensajeError3' },
        { id: 'numero_inventario', errorId: 'mensajeError4' },
        { id: 'serie', errorId: 'mensajeError5' },
        { id: 'usuario', errorId: 'mensajeError6' },
        { id: 'marca', errorId: 'mensajeError7' },
        { id: 'modelo', errorId: 'mensajeError8' },
        { id: 'tipo_equipo', errorId: 'mensajeError9' },
        { id: 'division', errorId: 'mensajeError10' },
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
    const centro = document.getElementById('centro_trabajo');
    const servicio = document.getElementById('servicio');

    if (centro.value === "") {
        centro.classList.add('campo-error');
        esValido = false;
    } else {
        centro.classList.remove('campo-error');
    }

    if (servicio.value === "") {
        servicio.classList.add('campo-error');
        esValido = false;
    } else {
        servicio.classList.remove('campo-error');
    }

    // Validar radios obligatorios
    const radios = ['limpieza_interna', 'sopleteado', 'bandejas', 'fusion', 'papel', 'laser', 'consumibles', 'red', 'prueba',
        'operando'
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




/*function validarYGenerarPDF() {
    let camposIncompletos = [];

    // Validar campos de texto visibles
    const camposTextoVisibles = document.querySelectorAll('.campo__control[type="text"]');
    camposTextoVisibles.forEach(campo => {
        const estilo = window.getComputedStyle(campo);
        if (estilo.display !== "none" && campo.value.trim() === "") {
            camposIncompletos.push(campo);
            campo.classList.add("campo__control--error");
        } else {
            campo.classList.remove("campo__control--error");
        }
    });

    // Validar radios (1 por cada pregunta)
    const radios = [
        "limpieza_interna", "sopleteado", "bandejas", "papel", "fusion", "laser",
        "consumibles", "red", "prueba", "operando"
    ];

    nombresRadios.forEach(nombre => {
        const seleccionado = document.querySelector(`input[name ="${nombre}"]:checked`);
        if (!seleccionado) {
            camposIncompletos.push(nombre);
        }
    });

    // Validación final
    if (camposIncompletos.length > 0) {
        alert("Por favor, complete todos los campos obligatorios.");
    }        
    generarPDF();
}*/
    
   

/** Carga configuracion_pdf.js si es necesario */
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

    // DATOS DE FORMULARIO
    const zona = document.querySelector('input[id="zona"]').value;
    const folio = document.querySelector('input[id="folio"]').value;
    const fecha = document.querySelector('input[id="fecha"]').value;
    const hora_inicio = document.querySelector('input[id="hrInicio"]').value;
    const hora_termino = document.querySelector('input[id="hrTermino"]').value;
    const numero_inventario = document.querySelector('input[id="numero_inventario"]').value;
    const serie = document.querySelector('input[id="serie"]').value;
    const usuario = document.querySelector('input[id="usuario"]').value;
    const marca = document.querySelector('input[id="marca"]').value;
    const modelo = document.querySelector('input[id="modelo"]').value;
    const tipo_equipo = document.querySelector('input[id="tipo_equipo"]').value;
    const division = document.querySelector('input[id="division"]').value;
    const centro = document.getElementById('centro_trabajo').value;
    const servicio = document.getElementById('servicio').value;

    // Declarar variables de radios para evitar ReferenceError
    const limpieza_interna = document.querySelector('input[name="limpieza_interna"]:checked').value;
    const sopleteado = document.querySelector('input[name="sopleteado"]:checked').value;
    const bandejas = document.querySelector('input[name="bandejas"]:checked').value;
    const papel = document.querySelector('input[name="papel"]:checked').value;
    const fusion = document.querySelector('input[name="fusion"]:checked').value;
    const laser = document.querySelector('input[name="laser"]:checked').value;
    const consumibles = document.querySelector('input[name="consumibles"]:checked').value;
    const red = document.querySelector('input[name="red"]:checked').value;
    const prueba = document.querySelector('input[name="prueba"]:checked').value;
    const operando = document.querySelector('input[name="operando"]:checked').value;

    // Declarar variables de firmas y datos finales
    const firma1Base64 = document.getElementById("firma-input-1").value;
    const firma2Base64 = document.getElementById("firma-input-2").value;
    const firma3Base64 = document.getElementById("firma-input-3").value;
    const realizo_servicio = document.getElementById("realizo_servicio").value;
    const responsable = document.getElementById("responsable").value;
    const visto_bueno = document.getElementById("visto_bueno").value;

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

    // Dividir texto si es muy largo 
    const maxWidth = rectWidthSeccion1 - 4; 
    const lineasUsuario = doc.splitTextToSize(usuario, maxWidth);

    const xTexto = 15 + 2; // margen izquierdo
    const yTexto = y + 5;
    doc.text(lineasUsuario, xTexto, yTexto);


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

    // TABLA DE ACTIVIDADES
    y += 25;
    doc.setFont("helvetica", "bold");
    doc.text("ACTIVIDADES", 16, y);
    doc.text("SI", 117, y);
    doc.text("NO", 127, y);
    doc.text("OBSERVACIONES", 153, y);

    doc.setFont("helvetica", "normal");
    const pageWidth = doc.internal.pageSize.getWidth();
    const z = pageWidth - 23;
    doc.rect(15, y-4, z, 66); // TABLA
    const top = y - 4;
    const bottom = y - 4 + 66;


    doc.line(112, top, 112, bottom); // primera línea vertical
    doc.line(123.5, top, 123.5, bottom); // segunda línea vertical
    doc.line(135, top, 135, bottom)

    const w = pageWidth - 8;

    doc.line(15,y+2, w, y+2 );

    y+=6;
    doc.text(`Desarmar equipo para su limpieza interna`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (limpieza_interna === "si") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 117, y); 
    doc.setFont("helvetica");
    } else if (limpieza_interna === "no") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 129, y);
    doc.setFont("helvetica"); 
        const motivo = document.querySelector('input[id="input_limpieza_interna"]').value;
        if (motivo) {
            doc.setFontSize(8); // tamaño más pequeño para caber
            doc.text(motivo, 136, y); // dentro del cuadro OBSERVACIONES
            doc.setFontSize(10); // regresar a tamaño normal
        }
    }

    y+=6;
    doc.text(`Limpieza y sopleteado interna y externa del equipo`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (sopleteado === "si") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 117, y); 
    doc.setFont("helvetica");
        } else if (sopleteado === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 129, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_sopleteado"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 136, y);
                doc.setFontSize(10);
            }
    }
    y+=6;
    doc.text(`Limpieza de bandejas o charolas`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (bandejas === "si") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 117, y); 
    doc.setFont("helvetica");
        } else if (bandejas === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 129, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_bandejas"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 136, y);
                doc.setFontSize(10);
            }
    }
    y+=6;
    doc.text(`Limpieza y revisión de mecanismo alimentación del papel`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (papel === "si") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 117, y); 
    doc.setFont("helvetica");
        } else if (papel === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 129, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_papel"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 136, y);
                doc.setFontSize(10);
            }
    }
    y+=6;
    doc.text(`Limpieza y revisión de la unidad de fusión`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (fusion === "si") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 117, y); 
    doc.setFont("helvetica");
        } else if (fusion === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 129, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_fusion"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 136, y);
                doc.setFontSize(10);
            }
    }
    y+=6;
    doc.text(`Limpieza y revisión de la unidad lasér`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (laser === "si") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 117, y); 
    doc.setFont("helvetica");
        } else if (laser === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 129, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_laser"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 136, y);
                doc.setFontSize(10);
            }
    }
    y+=6;
    doc.text(`Validar estado de consumibles`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (consumibles === "si") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 117, y); 
    doc.setFont("helvetica");
        } else if (consumibles === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 129, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_consumibles"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 136, y);
                doc.setFontSize(10);
            }
    }
    y+=6;
    doc.text(`Equipo de red`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (red === "si") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 117, y); 
    doc.setFont("helvetica");
        } else if (red === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 129, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_red"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 136, y);
                doc.setFontSize(10);
            }
    }
    y+=6;
    doc.text(`Realizar auto prueba`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (prueba === "si") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 117, y); 
    doc.setFont("helvetica");
        } else if (prueba === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 129, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_prueba"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 136, y);
                doc.setFontSize(10);
            }
    }
    y+=6;
    doc.text(`Equipo operando después del servicio`, 16, y);
    if (operando === "si") {
    doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 117, y); 
    doc.setFont("helvetica");
        } else if (operando === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 129, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_operando"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 136, y);
                doc.setFontSize(10);
            }
    }
    doc.setFontSize(10);
const observaciones = document.querySelector('input[id="input_Observaciones"]').value;
if (observaciones) {
    // Dividir el texto de observaciones para evitar desbordamiento
    const maxWidth = 180; 
    const lineasObservaciones = doc.splitTextToSize(`Observaciones: ${observaciones}`, maxWidth );
    doc.text(lineasObservaciones, 15, y + 8);
}

    y += 5;

    // FIRMAS
    y+=65;
    if(firma1Base64) await addCompressedImage(doc, firma1Base64, 17, y, 40, 20, compConfig.calidad_webp, 'firma1');
    if(firma2Base64) await addCompressedImage(doc, firma2Base64, 82, y, 40, 20, compConfig.calidad_webp, 'firma2');
    if(firma3Base64) await addCompressedImage(doc, firma3Base64, 150, y, 40, 20, compConfig.calidad_webp, 'firma3');
    
    y += 8;
    doc.text(`Realizó servicio:`, 24, y-10);
    doc.setFontSize(7);
    
    const centerRealizoServicio = 37.5;
    doc.text(realizo_servicio, centerRealizoServicio, y + 21, null, null, "center");
    
    let lineStartX1, lineEndX1;
    if (realizo_servicio && realizo_servicio.trim()) {
        const realizoServicioWidth = doc.getTextWidth(realizo_servicio);
        const margin = 1;
        lineStartX1 = centerRealizoServicio - (realizoServicioWidth / 2) - margin;
        lineEndX1 = centerRealizoServicio + (realizoServicioWidth / 2) + margin;
    } else {
        lineStartX1 = 15;
        lineEndX1 = 60;
    }
    
    doc.setFontSize(10);
    doc.text(`Responsable del Equipo:`, 105, y-10, "center");
    doc.setFontSize(7);
    
    const centerOriginal = 105;
    doc.text(responsable, centerOriginal, y + 21, null, null, "center");
    
    let lineStartX, lineEndX;
    if (responsable && responsable.trim()) {
        const responsableWidth = doc.getTextWidth(responsable);
        const margin = 1;
        lineStartX = centerOriginal - (responsableWidth / 2) - margin;
        lineEndX = centerOriginal + (responsableWidth / 2) + margin;
    } else {
        lineStartX = 80;
        lineEndX = 130;
    }
    
    doc.setFontSize(10);
    doc.text(`Visto Bueno:`, 158, y-10);
    doc.setFontSize(7);
    
    const centerVistoBueno = 172.5;
    doc.text(visto_bueno, centerVistoBueno, y + 21, null, null, "center");
    
    let lineStartX3, lineEndX3;
    if (visto_bueno && visto_bueno.trim()) {
        const vistoBuenoWidth = doc.getTextWidth(visto_bueno);
        const margin = 1;
        lineStartX3 = centerVistoBueno - (vistoBuenoWidth / 2) - margin;
        lineEndX3 = centerVistoBueno + (vistoBuenoWidth / 2) + margin;
    } else {
        lineStartX3 = 145;
        lineEndX3 = 200;
    }
    y += 22;
    doc.line(lineStartX1, y, lineEndX1, y);
    doc.line(lineStartX, y, lineEndX, y);
    doc.line(lineStartX3, y, lineEndX3, y);
    y += 5;
    doc.setFontSize(10);
    doc.text("Nombre y firma", 25, y);
    doc.text("Nombre y firma", 95, y);
    doc.text("Nombre y firma", 165, y);

    // Usar el sistema de nombrado automático basado en número de serie
    requestPDFFilename((filename) => {
        // Procesar el PDF: descarga, guardar en repositorio y mostrar modal
        procesarPDFMantenimiento(doc, filename, 'impresoras');
    }, serie, 'IMPRESORA');
}
