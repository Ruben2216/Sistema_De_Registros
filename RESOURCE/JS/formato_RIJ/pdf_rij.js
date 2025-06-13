async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); /*crea pdf vacio*/

    // DATOS DE FORMULARIO
    const departamento = document.querySelector('select[id="departamento"]').value;
    const categoria_maxima = document.querySelector('select[id="categoria_max"]').value;
    const nombre = document.querySelector('input[id="nombre"]').value;
    const rpe = document.querySelector('input[id="rpe"]').value;
    const hora_inicio = document.querySelector('input[id="hora_inicio"]').value;
    const hora_termino = document.querySelector('input[id="hora_termino"]').value;
    const inicio_jornada = document.querySelector('select[id="inicio_jornada"]').value;

    // ENCABEZADO
    doc.setFont("helvetica", "bold"); /*tipo de letra y negritas*/
    doc.setFontSize(12);
    doc.text("Comisión Federal de Electricidad", 15, 15);
    doc.setFontSize(10);
    doc.text("Política Transversal de Calidad de CFE", 15, 20);
    doc.text("Sistema Integral de Gestión (SIG-CFE)", 15, 25);

    doc.setFontSize(13);
    doc.text("LISTA DE VERIFICACIÓN DE LA REUNIÓN DE INICIO DE JORNADA", 105, 40, null, null, "center");
    /*doc.text(texto, x, y, opciones, transformaciones, alineación);*/

    doc.setFontSize(10);

    // DATOS GENERALES
    let y = 60;
    doc.setFont("helvetica", "normal");
    doc.text(`DEPARTAMENTO Y/O COMPAÑIA: ${departamento}`, 15, y);
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 150, y);

    y += 7;
    doc.text(`CATEGORIA MÁXIMA PRESENTE EN LA REUNIÓN: ${categoria_maxima}`, 15, y);

    y+= 7;
    doc.text(`NOMBRE: ${nombre}`, 15, y);
    doc.text(`R.P.E: ${rpe}`, 85, y);
    doc.text(`FIRMA`, 150, y);

    y += 7;
    doc.text(`HR. DE INICIO: ${hora_inicio}`, 15, y);
    doc.text(`TERMINO: ${hora_termino}`, 150, y);
    
    // TABLA DE INICIO
    y += 25;
    doc.setFont("helvetica", "bold");
    doc.text("INICIO", 15, y);
    doc.text("SI", 112, y);
    doc.text("NO", 127, y);
    doc.text("OBSERVACIONES", 153, y);

    doc.setFont("helvetica", "normal");

    const inicio = [ /*arreglo de actividades "cadena de texto"*/
        "1. ¿Se realizó el saludo de inicio de jornada?",
        "2. ¿Se enumeró el personal participante?",
        "3. ¿Se preguntó el estado de salud a los participantes?",
        "4. ¿Se realizaron los ejercicios?",
        "4.1 ¿Se detectaron anomalías en el estado de salud?",    
    ];

    y += 10;
    inicio.forEach((act) => { /*Se recorre cada elemento (act) del arreglo actividades, con su índice (index)*/
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
            if (inicio_jornada === "si") {
                doc.text("x", 114, y);
            } else if (inicio_jornada === "no") {
                doc.text("x", 129, y);
                const motivo = document.querySelector('input[name="input_inicio_jornada"]').value;
                if (motivo) {
                    doc.setFontSize(8); // tamaño más pequeño para caber
                    doc.text(motivo, 142, y); // dentro del cuadro OBSERVACIONES
                    doc.setFontSize(10); // regresar a tamaño normal
                }
            }
        }

        y += 11; /*Se incrementa y para la siguiente actividad*/
    });

    y += 5;//siguiente seccion de tabla
    // TABLA DE INFORMACIÓN
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN", 15, y);
    doc.text("SI", 112, y);
    doc.text("NO", 127, y);
    doc.text("OBSERVACIONES", 153, y);
    
    doc.setFont("helvetica", "normal");
    const informacion = [ /*arreglo de actividades "cadena de texto"*/
        "5.1 ¿Se comentaron trabajos de mantenimiento relevantes?",
        "5.2 ¿Se comentaron trabajos de operación relevantes?",
        "5.3 ¿Se comentaron trabajos con potencial de alto riesgo?",
        "5.4 ¿Se comentaron incidentes y/o accidentes ocurridos?",
        "5.5 "
    ];
    y += 10;
    informacion.forEach((act) => { /*Se recorre cada elemento (act) del arreglo actividades, con su índice (index)*/
        if (y > 270) { /*Si la posición y es mayor a 270, se agrega una nueva página*/
            doc.addPage(); /*agrega pagina nueva*/
            y = 15;
        }
        doc.text(`${act}`, 10, y); /*Se usa `${index + 1}. ${act}` para que cada actividad esté numerada y se coloque en y*/
        doc.rect(110, y - 4, 10, 6); // Cuadro SI
        /*doc.rect(x, y, width, height) dibuja un rectángulo*/
        doc.rect(125, y - 4, 10, 6); // Cuadro NO
        doc.rect(140, y - 4, 60, 6); // Cuadro OBS
        

        y += 11; /*Se incrementa y para la siguiente actividad*/
    });


    doc.save("mantenimiento_preventivo_tableta.pdf");
}
