document.addEventListener('DOMContentLoaded', function () {
    const btnGenerarPDF = document.querySelector('.boton--primario');
    btnGenerarPDF.addEventListener('click', validarFormulario);
});

function validarFormulario() {
    const camposRequeridos = [
        { id: 'nombre', errorId: 'mensajeError' },
        { id: 'rpe', errorId: 'mensajeError2' },
        { id: 'hora_termino', errorId: 'mensajeError4' },
        { id: 'enumeracion', errorId: 'mensajeError5'},
        { id: 'conductor' , errorId: 'mensajeError6' },
        { id: 'rpe_conductor' , errorId: 'mensajeError7' },
        { id: 'extra_info', errorId: 'mensajeError8' },
        { id: 'actividades_seguridad', errorId: 'mensajeError9' },
        { id: 'observaciones', errorId: 'mensajeError10' },
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
    const departamento = document.getElementById('departamento');
    const categoria_max = document.getElementById('categoria_max');

    if (departamento.value === "seleccion_categoria") {
        departamento.classList.add('campo-error');
        esValido = false;
    } else {
        departamento.classList.remove('campo-error');
    }

    if (categoria_max.value === "") {
        categoria_max.classList.add('campo-error');
        esValido = false;
    } else {
        categoria_max.classList.remove('campo-error');
    }

    // Validar radios obligatorios
    const radios = ['inicio_jornada', '#personal', 'salud', 'ejercicio', 'anomalias', 'mantenimiento', 'operacion', 'riesgo', 'incidentes',
        'informacion_extra', 'espejo', 'prediccion_peligro', 'articulo', 'experiencia', 'actividades_relevantes', 'reglas_vida', 'politicas', 'colaborador', 
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

    //CAPTURADO DE DATOS
    const departamento = document.querySelector('select[id="departamento"]').value;
    const categoria_max = document.querySelector('select[id="categoria_max"').value;
    const nombre = document.querySelector('input[id="nombre"]').value;
    const hora_inicio = document.querySelector('input[id="hora_inicio"]').value;
    const hora_termino = document.querySelector('input[id="hora_termino"]').value;
    const RPE = document.querySelector('input[id="rpe"]').value;
    const inicio_jornada = document.querySelector('input[name="inicio_jornada"]:checked').value;
    const personal = document.querySelector('input[name="#personal"]:checked').value;
    const salud = document.querySelector('input[name="salud"]:checked').value;
    const ejercicio = document.querySelector('input[name="ejercicio"]:checked').value;
    const anomalias = document.querySelector('input[name="anomalias"]:checked').value;
    const mantenimiento = document.querySelector('input[name="mantenimiento"]:checked').value;
   // const enumeracion = document.querySelector('input[id="enumeracion"]').value;
    const operacion = document.querySelector('input[name="operacion"]:checked').value;
    const riesgo = document.querySelector('input[name="riesgo"]:checked').value;
    const incidentes = document.querySelector('input[name="incidentes"]:checked').value;
    const espejo = document.querySelector('input[name="espejo"]:checked').value;
    const prediccion_peligro = document.querySelector('input[name="prediccion_peligro"]:checked').value;
    const articulo = document.querySelector('input[name="articulo"]:checked').value;
    const experiencia = document.querySelector('input[name="experiencia"]:checked').value;
    const actividades_relevantes = document.querySelector('input[name="actividades_relevantes"]:checked').value;
    const reglas_vida = document.querySelector('input[name="reglas_vida"]:checked').value;
    const politicas = document.querySelector('input[name="politicas"]:checked').value;
    const colaborador = document.querySelector('input[name="colaborador"]:checked').value;
    const metaTextArea = document.querySelector('textarea[id="meta"]').value;
    const textArea1 = document.querySelector('textarea[id="extra_info"]').value;
    const textArea2 = document.querySelector('textarea[id="actividades_seguridad"]').value;
    const textArea3 = document.querySelector('textarea[id="observaciones"]').value;
    const conductor = document.querySelector('input[id="conductor"]').value;
    const firma1Base64 = document.getElementById("firma-input-1").value;
    const firma2Base64 = document.getElementById("firma-input-2").value;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("LISTA DE VERIFICACIÓN DE LA REUNIÓN DIARIA DE INICIO DE JORNADA", 105, 15, null, null, "center");
    doc.line(14, 17 , 199, 17);

    // DATOS GENERALES
    y = 30;

    // Texto en negritas
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const dep = "DEPARTAMENTO Y/O COMPAÑIA: ";
    doc.text(dep, 15, y);

    // Texto normal justo después del anterior
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const depWidth = doc.getTextWidth(dep);
    doc.text(departamento, 17 + depWidth, y);
    doc.line(depWidth + 17, y + 1, depWidth + 113, y + 1);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const fech = "FECHA: ";
    //const fechaActual = new Date();
    const fechWidth = doc.getTextWidth(fech);
    doc.text(fech, 157, y);
    doc.line(fechWidth + 157, y + 1, fechWidth + 175, y + 1);


    y+=8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const cate = "CATEGORÍA MÁXIMA PRESENTE EN LA REUNÓN:";
    doc.text(cate, 15, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const catWidth = doc.getTextWidth(cate);
    doc.line(catWidth + 17, y + 1, catWidth + 48, y + 1);
    doc.text(categoria_max, 18 + catWidth, y);

    y+=8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const nom = "NOMBRE: ";
    doc.text(nom, 15, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const nomWidth = doc.getTextWidth(nom);
    doc.line(nomWidth + 15, y + 1, nomWidth + 46, y + 1);
    doc.text(nombre, 16 + nomWidth, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const rpe = "R.P.E: ";
    doc.text(rpe, 100, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const rpeWidth = doc.getTextWidth(rpe);
    doc.line(rpeWidth + 100, y + 1, rpeWidth + 131, y + 1);
    doc.text(RPE, 101 + rpeWidth, y);

    doc.setFont("helvetica", "bold");
     doc.setFontSize(7);
    const firma1 = "FIRMA: ";
    doc.text(firma1, 155, y);

    y+=1;

    const anchoFirma1 = doc.getTextWidth(firma1);
    doc.line(anchoFirma1 + 155, y, anchoFirma1 + 176, y);

     if(firma2Base64)
        doc.addImage(firma2Base64, 'PNG', 165, y-19, 30, 20 );

    y+=8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const inicio = "HR. INICIO: ";
    doc.text(inicio, 15, y);
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const inicioWidth = doc.getTextWidth(inicio);
    doc.text(hora_inicio, 16 + inicioWidth, y);
    doc.line(inicioWidth + 15, y + 1, inicioWidth + 46, y + 1);


    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const termino = "TÉRMINO: ";
    doc.text(termino, 100, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const terminoWidth = doc.getTextWidth(termino);
    doc.text(hora_termino, 101 + terminoWidth, y);
    doc.line(terminoWidth + 100, y + 1, terminoWidth + 129, y + 1);

    //ACTIVIDADES
    /*y+=15;
    doc.text("OBSERVACIONES", 153, y);*/
    y+=10;
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.text(`1. ¿Se realizó el saludo de inicio de jornada?`, 15, y);
    if (inicio_jornada === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (inicio_jornada === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }
    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.text(`2. ¿Se enumeró el personal participante?`, 15, y);
    if (personal === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (personal === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }
    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.text(`3. ¿Se preguntó el estado de salud de los participantes?`, 15, y);
    if (salud === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (salud === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }
    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.text(`4. ¿Se realizaron los ejercicios?`, 15, y);
    if (ejercicio === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (ejercicio === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }
    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.text(`4. ¿Se detectaron anomalías en el estado de salud?`, 15, y);
    if (anomalias === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (anomalias === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(9)
    doc.text(`5. Información`, 15, y)

    y+=6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.text(`5.1. ¿Se comentaron trabajos de mantenimiento relevante?`, 15, y);
    if (mantenimiento === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (mantenimiento === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");
    doc.text(`5.2. ¿Se comentaron condiciones de operación relevantes?`, 15, y);
    if (operacion === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (operacion === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");
    doc.text(`5.3. ¿Se comentaron trabajos con potencial alto de riesgo?`, 15, y);
    if (riesgo === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (riesgo === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");
    doc.text(`5.4. ¿Se comentaron incidentes y/o accidentes ocurridos?`, 15, y);
    if (incidentes === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (incidentes === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");
    doc.text(`5.5. Otra información`, 15, y);
    y+=7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const info = "Información:";
    doc.text(info, 15, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const infoWidth = doc.getTextWidth(info);
    const mas = "(Especificar el nombre de los temas de los cuales se dio información)"
    doc.text(mas, 14 + infoWidth, y);

    y+=6;
    doc.setFont("helvetica","normal")
    doc.text(textArea1, 15, y);
    y+=1;
    doc.line(15, y, 195, y);

    y+=8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(9)
    doc.text(`6. Actividades de seguridad.`, 15, y)

    y+=6;
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");
    doc.text(`6.1. ¿Se realizó la revisión espejo?`, 15, y);
    if (espejo === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (espejo === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");
    doc.text(`6.2. ¿Se realizó Actividad de predicción de Peligro (APP)?`, 15, y);
    if (prediccion_peligro === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (prediccion_peligro === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");

    const texto = "6.3. ¿Se dio lectura a un artículo del Reglamento de Seguridad e Higiene o ficha tecnica de una regla de vida?"
    const anchoMax  = 96;
    const textoDividido = doc.splitTextToSize(texto, anchoMax);
    doc.text(textoDividido, 15, y);
    
    if (articulo === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (articulo === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=9;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");
    doc.text(`6.4. ¿Se relató una Experiencia de Sentir el Peligro (Susto)?`, 15, y);
    if (experiencia === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (experiencia === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");

    const texto2 = "6.5. Actividades relevantes posteriores (Inspecciones, Campañas, etc.)"
    const anchoMax2  = 96;
    const textoDividido2 = doc.splitTextToSize(texto2, anchoMax2);
    doc.text(textoDividido2, 15, y);

    if (actividades_relevantes === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (actividades_relevantes === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=9;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");
    doc.text(`6.6. Lectura de las Reglas de Vida)`, 15, y);
    if (reglas_vida === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (reglas_vida === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");
    doc.text(`6.7. Lectura de politicas)`, 15, y);
    if (politicas === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (politicas === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }

    y+=6;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFontSize(8)
    doc.text("Si", 115, y);
    doc.text("No", 125, y);
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal");

    const texto3 = "6.8. Solicitar que un colaborador de un mensaje en materia de Seguridad"
    const anchoMax3 = 96;
    const textoDividido3 = doc.splitTextToSize(texto3, anchoMax3);
    doc.text(textoDividido3, 15, y);

    if (colaborador === "si") {
        doc.setFontSize(13)
        doc.setTextColor(255, 0, 0); // Rojo
        doc.text("x", 115.5, y);
        } else if (colaborador === "no") {
            doc.setFontSize(13)
            doc.setTextColor(255, 0, 0); // Rojo
            doc.text("x", 125.5, y);
    }
//------------------------------------------------------------------------------------
    y+=9;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const actividad = "Actividad: ";
    doc.text(info, 15, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const actividadWidth = doc.getTextWidth(actividad);
    const more = "(Especificar el nombre de las actividades de Seguridad que se realizaron)"
    doc.text(more, 17 + actividadWidth, y);

    y+=6;
    doc.setFont("helvetica", "normal");
    doc.text(textArea2, 15, y);

    y+=1;
    doc.line(15, y, 195, y);
    y+=5;
    doc.line(15, y, 195, y);

//---------------------------------------------------------------------
    y+=8;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    doc.text(`Meta o proposito de la jornada: `, 15, y);

    const meta = "(Anotar el compromiso de seguridad que los miembros del grupo se proponen a cumplir ese día)"
    const anchoMaxMeta = 136;
    const textDividido = doc.splitTextToSize(meta, anchoMaxMeta);
    doc.text(textDividido, 60, y);
    y+=6;
    doc.text(metaTextArea, 15, y);
    y+=1;
    doc.line(15, y, 195, y);
//--------------------------------------------------------------------
    y+=8;
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    doc.text(`OBSERVACIONES: `, 15, y);
    
    doc.setFont("helvetica", "bold");
    const obser = "(Anotar las preguntas, inquietudes, sugerencias y/o acciones tomadas en caso de que las condiciones de salud del personal no sean las adecuadas)"
    const maxAncho = 136;
    const dividido = doc.splitTextToSize(obser, maxAncho);
    doc.text(dividido, 44, y);

    y+=9;
    doc.setFont("helvetica", "normal");
    doc.text(textArea3, 15, y);

    y+=1;
    doc.line(15, y, 195, y);
    y+=5;
    doc.line(15, y, 195, y);
//-----------------------------------------------------------------
    y+=8;
    doc.setTextColor(0,0,0)
    doc.text(`CONDUCTOR DE LA REUNIÓN: ${conductor}`, 15, y);
    y+=1;
    doc.line(63, y, 195, y);

//----------------------------------------------------------------
    y+=14;
    doc.text(`R.P.E: ${RPE}`, 15, y+1);
    y+=1;
    doc.line(25, y+1, 50, y+1);


    const firma = "Firma: ";
    doc.text(firma, 105, y, "center");

    y+=1;

    const anchoFirma2 = doc.getTextWidth(firma);
    doc.line(anchoFirma2 + 100, y, anchoFirma2 + 146, y);

     if(firma2Base64)
        doc.addImage(firma2Base64, 'PNG', 115, y-19, 30, 20 );

    // ENCABEZADO
    const pageHeight = doc.internal.pageSize.getHeight();
    z=15
    //MARGEN
    doc.rect(14, z-4, 185, pageHeight - 20); // TABLA 1
    doc.rect(13, z-5, 187, pageHeight - 18); // TABLA 2

    // **NUEVO**: Convertir PDF a imagen antes de guardar
    try {
        // Obtener el PDF como base64
        const pdfBase64 = doc.output('datauristring');
        
        // Obtener identificador único del usuario
        const identificador = window.rijPDFManager ? window.rijPDFManager.obtenerIdentificadorUsuario() : 'RIJ_' + Date.now() + '_' + Math.random().toString(36).substring(7);
        
        // Guardar identificador si no existe
        if (!localStorage.getItem('usuario_identificador_rij')) {
            localStorage.setItem('usuario_identificador_rij', identificador);
        }
        
        // Guardar PDF en localStorage como respaldo
        localStorage.setItem('ultimo_pdf_rij', pdfBase64);
        localStorage.setItem('rij_pdf_procesado', 'true');
        
        // Intentar convertir a imagen en el backend (sin bloquear si falla)
        fetch('/api/rij/convertir_pdf_imagen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pdf_base64: pdfBase64,
                identificador: identificador
            }),
            credentials: 'include'
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Error del servidor');
        })
        .then(data => {
            if (data.success) {
                // Guardar referencias para uso posterior
                localStorage.setItem('rij_imagen_url', data.url);
            }
        })
        .catch(error => {
            // Error silencioso - el sistema seguirá funcionando con las imágenes existentes
        });
        
    } catch (error) {
        // Error silencioso
    }

    doc.save("RIJ.pdf");
}