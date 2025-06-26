async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); /*crea pdf vacio*/

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
    const textArea1 = document.querySelector('textarea[id="extra_info"]').value;
    const textArea2 = document.querySelector('textarea[id="actividades_seguridad"]').value;
    const textArea3 = document.querySelector('textarea[id="observaciones"]').value;
    const conductor = document.querySelector('input[id="conductor"]').value;
    const firma1Base64 = document.getElementById("firma-input-1").value;

    // ENCABEZADO
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("LISTA DE VERIFICACIÓN DE LA REUNIÓN DIARIA DE INICIO DE JORNADA", 105, 15, null, null, "center");

    // DATOS GENERALES
    y = 30;
    // Texto en negritas
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const dep = "DEPARTAMENTO: ";
    doc.text(dep, 15, y);

    // Texto normal justo después del anterior
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const depWidth = doc.getTextWidth(dep);
    doc.text(departamento, 15 + depWidth, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const fech = "FECHA: ";
    doc.text(fech, 105, y, "center");

    y+=8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const cate = "CATEGORÍA MÁXIMA PRESENTE EN LA REUNÓN:";
    doc.text(cate, 15, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const catWidth = doc.getTextWidth(cate);
    doc.text(categoria_max, 10 + catWidth, y);

    y+=8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const nom = "NOMBRE: ";
    doc.text(nom, 15, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const nomWidth = doc.getTextWidth(nom);
    doc.text(nombre, 15 + nomWidth, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const rpe = "R.P.E: ";
    doc.text(rpe, 98, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const rpeWidth = doc.getTextWidth(rpe);
    doc.text(RPE, 98 + rpeWidth, y);

    y+=8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const inicio = "HR. INICIO: ";
    doc.text(inicio, 15, y);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const inicioWidth = doc.getTextWidth(inicio);
    doc.text(hora_inicio, 15 + inicioWidth, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const termino = "TÉRMINO: ";
    doc.text(termino, 98, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const terminoWidth = doc.getTextWidth(termino);
    doc.text(hora_termino, 98 + terminoWidth, y);

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
    doc.setTextColor(39, 34, 193)
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
    doc.setTextColor(39, 34, 193);
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
    y+=7;
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
    doc.setTextColor(39, 34, 193);
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
    doc.text(`R.P.E: ${RPE}`, 15, y);
    y+=1;
    doc.line(27, y, 50, y);

    const firma = "Firma: ";
    doc.text(firma, 105, y, "center");

    y+=1;

    const anchoFirma = doc.getTextWidth(firma);
    doc.line(anchoFirma + 106, y, anchoFirma + 146, y);

     if(firma1Base64)
        doc.addImage(firma1Base64, 'PNG', 15, y, 30, 30 );

    doc.save("RIJ.pdf");
}
