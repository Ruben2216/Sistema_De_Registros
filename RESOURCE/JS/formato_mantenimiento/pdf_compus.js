document.addEventListener('DOMContentLoaded', function () {
    const btnGenerarPDF = document.querySelector('.boton--primario');
    btnGenerarPDF.addEventListener('click', validarFormulario);
});

function validarFormulario() {
    const camposRequeridos = [
        { id: 'zona', errorId: 'mensajeError' },
        { id: 'hora_inicio', errorId: 'mensajeError3' },
        { id: 'hora_termino', errorId: 'mensajeError4' },
        { id: 'division', errorId: 'mensajeError6' },
        { id: 'centro_trabajo', errorId: 'mensajeError7' },
        { id: 'serie', errorId: 'mensajeError8' },
        { id: 'usuario', errorId: 'mensajeError9' },
        { id: 'marca', errorId: 'mensajeError10' },
        { id: 'modelo', errorId: 'mensajeError11' },
        { id: 'tipo_uso', errorId: 'mensajeError12' }

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
    const tipoEquipo = document.getElementById('tipo_equipo');
    const servicio = document.getElementById('servicio');

    if (tipoEquipo.value === "Seleccionar_Zona") {
        tipoEquipo.classList.add('campo-error');
        esValido = false;
    } else {
        tipoEquipo.classList.remove('campo-error');
    }

    if (servicio.value === "Seleccionar_Tipo_servicio") {
        servicio.classList.add('campo-error');
        esValido = false;
    } else {
        servicio.classList.remove('campo-error');
    }

    // Validar radios obligatorios
    const radios = ['limpieza_externa', 'pantalla', 'teclado', 'conexiones', 'despues_servicio', 'antivirus', 'defrag', 'dominio', 'Windows_update'];

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

async function convertirPNGtoJPEG(dataURL, calidad) {
    const img = new Image();
    img.src = dataURL;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', calidad);
}

/**
 * Función para añadir imagen al PDF con compresión y registro de logs.
 */
async function addCompressedImage(doc, dataURL, x, y, w, h, calidad, descripcion) {
    const originalSizeKB = Math.round(((dataURL.length * 3 / 4) / 1024));
    console.log(`Imagen ${descripcion} - tamaño original: ${originalSizeKB} KB`);
    const jpegDataURL = await convertirPNGtoJPEG(dataURL, calidad);
    const compressedSizeKB = Math.round(((jpegDataURL.length * 3 / 4) / 1024));
    console.log(`Imagen ${descripcion} - tamaño después de compresión: ${compressedSizeKB} KB (calidad ${calidad})`);
    doc.addImage(jpegDataURL, 'JPEG', x, y, w, h);
}

/**
 * Asegura que PDFSizeController esté disponible cargando el script de configuración si es necesario.
 */
async function cargarConfiguracionPDF() {
    if (typeof PDFSizeController === 'undefined') {
        return new Promise(function(resolve, reject) {
            var script = document.createElement('script');
            script.src = '/RESOURCE/JS/configuracion_pdf.js';
            script.onload = function() { console.log('configuracion_pdf.js cargado'); resolve(); };
            script.onerror = function() { console.error('Error cargando configuracion_pdf.js'); reject(new Error('No se pudo cargar configuracion_pdf.js')); };
            document.head.appendChild(script);
        });
    } else {
        return Promise.resolve();
    }
}

/**
 * Convierte un Blob a DataURL.
 */
function blobAdataURL(blob) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function() { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Convierte una imagen (dataURL o URL) a JPEG con calidad dada, usando crossOrigin para evitar canvas taint.
 */
async function convertirPNGtoJPEG(dataSource, calidad) {
    var dataURL;
    if (dataSource.startsWith('data:')) {
        dataURL = dataSource;
    } else {
        // Obtener blob desde URL
        const response = await fetch(dataSource, { mode: 'cors' });
        const blob = await response.blob();
        dataURL = await blobAdataURL(blob);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataURL;
    await img.decode();
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', calidad);
}

/**
 * Añade imagen al PDF with compresión y registro de logs, maneja URLs y dataURIs.
 */
async function addCompressedImage(doc, source, x, y, w, h, calidad, descripcion) {
    // Para firmas, usar PNG original y conservar transparencia
    if (descripcion && descripcion.startsWith('firma')) {
        console.log(`Imagen ${descripcion} - usando PNG original sin compresión`);
        doc.addImage(source, 'PNG', x, y, w, h);
        return;
    }
    // Para logo, usar PNG original y conservar transparencia
    if (descripcion === 'logo') {
        console.log(`Imagen ${descripcion} - usando PNG original sin compresión`);
        doc.addImage(source, 'PNG', x, y, w, h);
        return;
    }
    var originalBytes = 0;
    if (source.startsWith('data:')) {
        // calcular bytes aproximados
        originalBytes = Math.round((source.length * 3) / 4);
    } else {
        const resp = await fetch(source, { mode: 'cors' });
        const blob = await resp.blob();
        originalBytes = blob.size;
    }
    console.log(`Imagen ${descripcion} - tamaño original: ${Math.round(originalBytes / 1024)} KB`);
    const jpegDataURL = await convertirPNGtoJPEG(source, calidad);
    const compressedBytes = Math.round(((jpegDataURL.length * 3) / 4));
    console.log(`Imagen ${descripcion} - tamaño después de compresión: ${Math.round(compressedBytes / 1024)} KB (calidad ${calidad})`);
    doc.addImage(jpegDataURL, 'JPEG', x, y, w, h);
}

async function generarPDF() {
    await cargarConfiguracionPDF();
    const { jsPDF } = window.jspdf;

    // Activar compresión de contenido en jsPDF
    const doc = new jsPDF({ compress: true });

    // Inicializar controlador de tamaño de PDF
    const sizeController = new PDFSizeController();
    const totalFotos = 4; // Logo + 3 firmas
    const compConfig = sizeController.calcularConfiguracionInicial(totalFotos);
    console.log('Configuración de compresión PDF:', compConfig);

    // DATOS DE FORMULARIO
    const zona = document.querySelector('input[id="zona"]').value;
    const centro = document.querySelector('input[id="centro_trabajo"]').value;
    const folio = document.querySelector('input[id="folio"]').value;
    const fecha = document.querySelector('input[id="fecha"]').value;
    const usuario = document.querySelector('input[id="usuario"]').value;
    const tipo_equipo = document.querySelector('select[id="tipo_equipo"]').value;
    const uso = document.querySelector('input[id="tipo_uso"]').value;
    const marca = document.querySelector('input[id="marca"]').value;
    const modelo = document.querySelector('input[id="modelo"]').value;
    const serie = document.querySelector('input[id="serie"]').value;
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
    const firma3Base64 = document.getElementById("firma-input-3").value;
    const firma2Base64 = document.getElementById("firma-input-2").value;
    const firma1Base64 = document.getElementById("firma-input-1").value;

    // IMAGEN -- LOGO
    // Añadir logo comprimido
    const imgLogoUrl = '/RESOURCE/IMG/Comisión_Federal_de_Electricidad_(logo)_.svg.png';
    const logoWidth = 40;
    const logoHeight = 20;
    await addCompressedImage(doc, imgLogoUrl, 15, 8, logoWidth, logoHeight, compConfig.calidad_webp, 'logo');

    // ENCABEZADO
    doc.setFont("helvetica"); /*tipo de letra y negritas*/
    doc.setFontSize(10);
    doc.text("Comisión Federal de Electricidad", 105, 15, null, null, "center");
    doc.text("Política Transversal de Calidad de CFE", 105, 20, null, null, "center");
    doc.text("Sistema Integral de Gestión (SIG-CFE)", 105, 25, null, null, "center");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("FORMATO MANTENIMIENTO PREVENTIVO COMPUTADORAS", 105, 40, null, null, "center");
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
    doc.text("SI", 111.5, y);
    doc.text("NO", 120, y);
    doc.text("OBSERVACIONES", 153, y);

    doc.setFont("helvetica", "normal");
    const pageWidth = doc.internal.pageSize.getWidth();
    const z = pageWidth - 23;
    doc.rect(15, y-4, z, 60); // TABLA
    const top = y - 4;
    const bottom = y - 4 + 60;

    doc.line(108, top, 108, bottom); // primera línea vertical
    doc.line(118, top, 118, bottom); // segunda línea vertical
    doc.line(128, top, 128, bottom)

    const w = pageWidth - 8;

    doc.line(15,y+2, w, y+2 );

    y+=6;
    doc.text(`Limpieza externa del equipo`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (limpieza_externa === "si") {
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica");        } else if (limpieza_externa === "no") {
            doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica"); 
            const motivo = document.querySelector('input[id="input_limpieza_externa"]').value;
            if (motivo) {
                doc.setFontSize(8); // tamaño más pequeño para caber
                doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                doc.setFontSize(10); // regresar a tamaño normal
            }
        }
    
    y+=6;
    doc.text(`Limpieza externa de pantalla`, 16, y);
    doc.line(15,y+2, w, y+2 );
            if (pantalla === "si") {
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica");            
} else if (pantalla === "no") {
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica");                 const motivo = document.querySelector('input[id="input_pantalla"]').value;
                if (motivo) {
                    doc.setFontSize(8); // tamaño más pequeño para caber
                    doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                    doc.setFontSize(10); // regresar a tamaño normal
                }
            }

    y+=6;
    doc.text(`Limpieza externa de teclado`, 16, y);
    doc.line(15,y+2, w, y+2 );
            if (teclado === "si") {
                doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica");
            } else if (teclado === "no") {
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica");                 const motivo = document.querySelector('input[id="input_teclado"]').value;
                if (motivo) {
                    doc.setFontSize(8); // tamaño más pequeño para caber
                    doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                    doc.setFontSize(10); // regresar a tamaño normal
                }
            }

    y+=6;
    doc.text(`Verificar conexiones eléctricas en buen estado`, 16, y);
    doc.line(15,y+2, w, y+2 );
    if (conexiones === "si") {
        doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica");
        } else if (conexiones === "no") {
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica");             const motivo = document.querySelector('input[id="input_conexiones"]').value;
            if(motivo){
                doc.setFontSize(8);
                doc.text(motivo, 129, y);
                doc.setFontSize(10);
            }
        }

    y+=6;
    doc.text(`Verificar que funcione correctamente después del servicio`, 16, y);
    doc.line(15,y+2, w, y+2 );
            if (despues_servicio === "si") {
                doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica");
            } else if (despues_servicio === "no") {
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica");                 const motivo = document.querySelector('input[id="input_despues_servicio"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 129, y);
                    doc.setFontSize(10);
                }
            }

    y+=6;
    doc.text(`Antivirus institucional actualizado`, 16, y);
    doc.line(15,y+2, w, y+2 );
            if(antivirus === "si"){
                doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica");
            } else if (antivirus === "no"){
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica");                 const motivo = document.querySelector('input[id="input_antivirus"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 129, y);
                    doc.setFontSize(10);
                }
            }

    y+=6;
    doc.text(`Ejecución de Defrag`, 16, y);
    doc.line(15,y+2, w, y+2 );
            if(defrag === "si"){
                doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica");
            } else if (defrag === "no"){
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica");                 const motivo = document.querySelector('input[id="input_defrag"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 129, y);
                    doc.setFontSize(10);
                }
            }

    y+=6;
    doc.text(`Equipo dentro del dominio`, 16, y);
    doc.line(15,y+2, w, y+2 );
            if(dominio === "si"){
                doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica");
            } else if(dominio === "no"){
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica");                 const motivo = document.querySelector('input[id="input_dominio"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 129, y);
                    doc.setFontSize(10);
                }
            }
    y+=6;
    doc.text(`Sistema operativo actualizado (Windows update)`, 16, y);
            if(Windows_update === "si"){
                doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("3", 112, y); 
    doc.setFont("helvetica");
            } else if(Windows_update === "no"){
doc.setFont("zapfdingbats");
    doc.setFontSize(9);
    doc.text("7", 122, y);
    doc.setFont("helvetica");                 
    const motivo = document.querySelector('input[id="input_Windows_update"]').value;
                if(motivo){
                    doc.setFontSize(8);
                    doc.text(motivo, 129, y);
                    doc.setFontSize(10);
                }
            }

     y += 55;

    // FIRMAS
    y += 6.5;
    if (firma1Base64) {
        await addCompressedImage(doc, firma1Base64, 17, y, 40, 20, compConfig.calidad_webp, 'firma1');
    }
    
    if (firma2Base64) {
        await addCompressedImage(doc, firma2Base64, 82, y, 40, 20, compConfig.calidad_webp, 'firma2');
    }
    
    if (firma3Base64) {
        await addCompressedImage(doc, firma3Base64, 150, y, 40, 20, compConfig.calidad_webp, 'firma3');
    }

    y += 5;
    doc.text(`Realizó servicio:`, 25, y-12);
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
    doc.text(`Responsable del Equipo:`, 105, y-12, "center");
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
    doc.text(`Visto Bueno:`, 160, y-12);
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
    
    doc.setFontSize(10); //esto es para 
    y += 22;
    doc.line(lineStartX1, y, lineEndX1, y);
    doc.line(lineStartX, y, lineEndX, y);
    doc.line(lineStartX3, y, lineEndX3, y);
    y += 5;
    doc.text("Nombre y firma", 25, y);
    doc.text("Nombre y firma", 95, y);
    doc.text("Nombre y firma", 160, y);

    // Usar el sistema de nombrado automático basado en número de serie
    requestPDFFilename((filename) => {
        // Usar la función helper para procesar el PDF
        procesarPDFMantenimiento(doc, filename, 'computo');
    }, serie, 'COMPUTADORA');
}
