document.addEventListener('DOMContentLoaded', function () {
    const btnGenerarPDF = document.querySelector('.boton--primario');
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
            mensaje.textContent = 'Este campo es obligatorio';
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
    
   


async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); /*crea pdf vacio*/

    // DATOS DE FORMULARIO
    const zona = document.querySelector('input[id="zona"]').value;
    const centro = document.querySelector('select[id="centro_trabajo"]').value;
    const folio = document.querySelector('input[id="folio"]').value;
    const fecha = document.querySelector('input[id="fecha"]').value;
    const usuario = document.querySelector('input[id="usuario"]').value;
    const tipo_equipo = document.querySelector('input[id="tipo_equipo"]').value;
    const marca = document.querySelector('input[id="marca"]').value;
    const modelo = document.querySelector('input[id="modelo"]').value;
    const serie = document.querySelector('input[id="serie"]').value;
    const servicio = document.querySelector('select[id="servicio"]').value;
    const hora_inicio = document.querySelector('input[id="hrInicio"]').value;
    const hora_termino = document.querySelector('input[id="hrTermino"]').value;

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

    const realizo_servicio = document.querySelector('input[id="realizo_servicio"]').value;
    const responsable = document.querySelector('input[id="responsable"]').value;
    const visto_bueno = document.querySelector('input[id="visto_bueno"]').value;
    const firma3Base64 = document.getElementById("firma-input-3").value;
    const firma2Base64 = document.getElementById("firma-input-2").value;
    const firma1Base64 = document.getElementById("firma-input-1").value;

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
    doc.text("ACTIVIDADES", 16, y);
    doc.text("SI", 114, y);
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
        doc.text("x", 117, y);
    } else if (limpieza_interna === "no") {
        doc.text("x", 129, y);
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
        doc.text("x", 117, y);
        } else if (sopleteado === "no") {
            doc.text("x", 129, y);
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
        doc.text("x", 117, y);
        } else if (bandejas === "no") {
            doc.text("x", 129, y);
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
        doc.text("x", 117, y);
        } else if (papel === "no") {
            doc.text("x", 129, y);
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
        doc.text("x", 117, y);
        } else if (fusion === "no") {
            doc.text("x", 129, y);
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
        doc.text("x", 117, y);
        } else if (laser === "no") {
            doc.text("x", 129, y);
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
        doc.text("x", 117, y);
        } else if (consumibles === "no") {
            doc.text("x", 129, y);
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
        doc.text("x", 117, y);
        } else if (red === "no") {
            doc.text("x", 129, y);
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
        doc.text("x", 117, y);
        } else if (prueba === "no") {
            doc.text("x", 129, y);
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
        doc.text("x", 117, y);
        } else if (operando === "no") {
            doc.text("x", 129, y);
            const motivo = document.querySelector('input[id="input_operando"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 136, y);
                doc.setFontSize(10);
            }
    }

    y += 5;

    // FIRMAS
    y+=65;
    if(firma1Base64)
        doc.addImage(firma1Base64, 'PNG', 15, y, 30, 30 );
    
    if(firma2Base64)
        doc.addImage(firma2Base64, 'PNG', 105, y, 30, 30, "center" );
    
    if(firma3Base64)
        doc.addImage(firma3Base64, 'PNG', 145, y, 30, 30 );
    
    y += 8;
    doc.text(`Realizó servicio:`, 15, y);
    doc.setFontSize(7);
    doc.text(realizo_servicio, 15, y + 21);
    doc.setFontSize(10);
    doc.text(`Responsable del Equipo:`, 105, y, "center");
    doc.setFontSize(7);
    doc.text(responsable, 80, y + 21);
    doc.setFontSize(10);
    doc.text(`Visto Bueno:`, 145, y);
    doc.setFontSize(7);
    doc.text(visto_bueno, 145, y + 21);
    y += 22;
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
        doc.save(filename);
    }, serie, 'IMPRESORA');
}
