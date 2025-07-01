function validarYGenerarPDF() {
    const camposTexto = document.querySelectorAll('.campo__control[type="text"]:not([style*="display: none"])');
    let camposIncompletos = [];

    // Validar campos de texto visibles
    camposTexto.forEach(campo => {
        if (campo.value.trim() === "") {
            camposIncompletos.push(campo);
            campo.classList.add("campo__control--error");
        } else {
            campo.classList.remove("campo__control--error");
        }
    });

    // Validar radios (1 por cada pregunta)
    const radios = [
        "tierra_fisica", "UPS", "respaldo", "bateria", "voltaje", "control_acceso",
        "seguridad_fisica", "aire", "aire_funcionando", "bitacora", "orden_impieza",
        "etiquetado", "polvo", "switch", "APS"
    ];
    radios.forEach(name => {
        const seleccionado = document.querySelector(`input[name="${name}"]:checked`);
        if (!seleccionado) {
            camposIncompletos.push(name);
        }
    });

    if (camposIncompletos.length > 0) {
        alert("Por favor, completa todos los campos obligatorios.");
    } else {
        generarPDF();
    }
}




async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); /*crea pdf vacio*/

    //DATOS DEL FORMULARIO 
    const zona = document.querySelector('input[id="zona"]').value;
    const site = document.querySelector('input[id="site"]').value;
    const clave_documento = document.querySelector('input[id="clave_documento"]').value;
    const version = document.querySelector('input[id="NoVersion"]').value;
    const fecha_publicacion = document.querySelector('input[id="fecha_publicacion"]').value;
    const fecha_realizacion = document.querySelector('input[id="fecha_realizacion"]').value;
    const tierra_fisica = document.querySelector('input[name="tierra_fisica"]:checked').value;
    const UPS = document.querySelector('input[name="UPS"]:checked').value;
    const respaldo = document.querySelector('input[name="respaldo"]:checked').value;
    const bateria = document.querySelector('input[name="bateria"]:checked').value;
    const voltaje = document.querySelector('input[name="voltaje"]:checked').value;
    const control = document.querySelector('input[name="control_acceso"]:checked').value;
    const seguridad_fisica = document.querySelector('input[name="seguridad_fisica"]:checked').value;
    const aire = document.querySelector('input[name="aire"]:checked')?.value;
    const switchAcceso = document.querySelector('input[name="switch"]:checked')?.value;
    const APS = document.querySelector('input[name="APS"]:checked')?.value;
    const polvo = document.querySelector('input[name="polvo"]:checked')?.value;
    const etiquetado = document.querySelector('input[name="etiquetado"]:checked')?.value;
    const orden_impieza = document.querySelector('input[name="orden_impieza"]:checked')?.value;
    const bitacora = document.querySelector('input[name="bitacora"]:checked')?.value;
    const aire_funcionando = document.querySelector('input[name="aire_funcionando"]:checked')?.value;




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

    await new Promise((resolve, reject) => {
    const img = new Image(); // Este objeto representa la imagen que se va a insertar en el PDF
    img.src = '/RESOURCE/IMG/suterm.png';
    img.onload = function () { // esta función se ejecutará automáticamente cuando la imagen haya terminado de cargarse correctamente
        const imgWidth = 40;
        const imgHeight = 20;
        doc.addImage(img, 'PNG', 155, 8, imgWidth, imgHeight);
        resolve();
    };
    img.onerror = reject;
    });

    await new Promise((resolve, reject) => {
    const img = new Image(); // Este objeto representa la imagen que se va a insertar en el PDF
    img.src = '/RESOURCE/IMG/SIG.jpeg';
    img.onload = function () { // esta función se ejecutará automáticamente cuando la imagen haya terminado de cargarse correctamente
        const imgWidth = 35;
        const imgHeight = 15;
        doc.addImage(img, 'PNG', 17, 44, imgWidth, imgHeight);
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

    let y=45;
    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const Titulo = "Titulo: ";
    doc.text(Titulo, 57, y);

    doc.setFont("helvetica", "normal");
    const tituloMedida = doc.getTextWidth(Titulo);
    doc.text(`Formato Inspección de Salas de Telecomunicaciones`, 57 + tituloMedida, y );

    doc.line(55, y+4, 201, y+4)

    const pageWidth = doc.internal.pageSize.getWidth();
    const z = pageWidth - 23;
    doc.rect(14, y-4, z, 23); // TABLA 1
    doc.line(55, y - 4, 55, 64)// LINEA 1

    y+=8;
    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const clave = "Clave de documento: ";
    doc.text(clave, 57, y);

    doc.setFont("helvetica", "normal");
    const claveMedida = doc.getTextWidth(clave);
    doc.text(clave_documento, 59 + claveMedida, y );

    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const versionT = "No. de versión: ";
    doc.text(versionT, 105, y);

    doc.setFont("helvetica", "normal");
    const versionMedida = doc.getTextWidth(versionT);
    doc.text(version, 107 + versionMedida, y );

    doc.line(104, y-4 , 104, 64);//LINEA 2

    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    const Fecha1 = "Fecha publicación: ";
    doc.text(Fecha1, 160, y);

    doc.setFont("helvetica", "normal");
    const fechaMedida = doc.getTextWidth(Fecha1);
    doc.text(fecha_publicacion, 160 + fechaMedida, y );

    doc.line(159, y-4 , 159, 64); //LINEA 3

    y+=20;

    doc.rect(14, y-4, z, 13); // TABLA 2
    doc.line(14, y+1, 201, y+1);

    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    doc.text(`Zona: `,15, y );

    doc.setFont("helvetica", "normal")
    doc.text(zona, 15, y+6);

    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    doc.text(`Ubicación del Site:`, 105, y, "center");

    doc.setFont("helvetica", "normal")
    doc.text(site, 85, y+6);

    doc.line(76, y-4, 76, 82);

    doc.setFont("helvetica", "normal", "bold");
    doc.setFontSize(9);
    doc.text(`Fecha de realización: `, 150, y);

    doc.setFont("helvetica", "normal")
    doc.text(site, 150, y+6);

    doc.line(138, y-4, 138, 82 );

    //----------------------------------------------------------------
    // TABLA DE ACTIVIDADES
    y += 25;
    doc.setFont("helvetica", "bold");
    doc.text("ACTIVIDADES", 16, y);
    doc.text("SI", 110, y);
    doc.text("NO", 120, y);
    doc.text("OBSERVACIONES", 153, y);

    doc.setFont("helvetica", "normal");
    const pageWidth2 = doc.internal.pageSize.getWidth();
    const p = pageWidth2 - 23;
    doc.rect(15, y-4, p, 106); // TABLA
    const top = y - 4;
    const bottom = y - 4 + 106;

    doc.line(108, top, 108, bottom); // primera línea vertical
    doc.line(118, top, 118, bottom); // segunda línea vertical
    doc.line(128, top, 128, bottom);

    const w = pageWidth2 - 8;

    doc.line(15,y+2, w, y+2 );

    y+=6;
    doc.text(`1. ¿Cuenta con tierra física?`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (tierra_fisica === "si") {
        doc.text("x", 112, y);
        } else if (tierra_fisica === "no") {
            doc.text("x", 122, y);
            const motivo = document.querySelector('input[id="input_tierra_fisica"]').value;
            if (motivo) {
                doc.setFontSize(8); // tamaño más pequeño para caber
                doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                doc.setFontSize(10); // regresar a tamaño normal
            }
        }
    y+=6;
    doc.text(`2. ¿Cuenta con equipos UPS?`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (UPS === "si") {
        doc.text("x", 112, y);
        } else if (UPS === "no") {
            doc.text("x", 122, y);
            const motivo = document.querySelector('input[id="input_UPS"]').value;
            if (motivo) {
                doc.setFontSize(8); // tamaño más pequeño para caber
                doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                doc.setFontSize(10); // regresar a tamaño normal
            }
        }

    y+=6;

    const texto3 = "3. ¿El tiempo de respaldo de la UPS es de al menos 30 minutos?";
    const anchoMax = 90; // espacio antes de la línea vertical (108 - 16 - margen extra)
    const textoDividido = doc.splitTextToSize(texto3, anchoMax);

    doc.text(textoDividido, 16, y); // dibuja el texto en varias líneas automáticas
    doc.line(15,y+6, w, y+6 );

    if (respaldo === "si") {
        doc.text("x", 112, y);
        } else if (respaldo === "no") {
            doc.text("x", 122, y);
            const motivo = document.querySelector('input[id="input_respaldo"]').value;
            if (motivo) {
                doc.setFontSize(8); // tamaño más pequeño para caber
                doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                doc.setFontSize(10); // regresar a tamaño normal
            }
        }

    y+=9;
    doc.text(`4. ¿El estado de las baterías es correcto?`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (bateria === "si") {
        doc.text("x", 112, y);
        } else if (bateria === "no") {
            doc.text("x", 122, y);
            const motivo = document.querySelector('input[id="input_bateria"]').value;
            if (motivo) {
                doc.setFontSize(8); // tamaño más pequeño para caber
                doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                doc.setFontSize(10); // regresar a tamaño normal
            }
        }

    y+=6;
    doc.text(`5. ¿El voltaje es correcto? (±10% permitido)`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (voltaje === "si") {
        doc.text("x", 112, y);
        } else if (voltaje === "no") {
            doc.text("x", 122, y);
            const motivo = document.querySelector('input[id="input_voltaje"]').value;
            if (motivo) {
                doc.setFontSize(8); // tamaño más pequeño para caber
                doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                doc.setFontSize(10); // regresar a tamaño normal
            }
        }

    y+=6;
    doc.text(`6. ¿Cuenta con control de acceso?`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (control === "si") {
        doc.text("x", 112, y);
        } else if (control === "no") {
            doc.text("x", 122, y);
            const motivo = document.querySelector('input[id="input_voltaje"]').value;
            if (motivo) {
                doc.setFontSize(8); // tamaño más pequeño para caber
                doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                doc.setFontSize(10); // regresar a tamaño normal
            }
        }

    y+=6;
    doc.text(`6. ¿Cuenta con control de acceso?`, 16, y);
    doc.line(15,y+2, w, y+2 );

    if (control === "si") {
        doc.text("x", 112, y);
        } else if (control === "no") {
            doc.text("x", 122, y);
            const motivo = document.querySelector('input[id="input_voltaje"]').value;
            if (motivo) {
                doc.setFontSize(8); // tamaño más pequeño para caber
                doc.text(motivo, 129, y); // dentro del cuadro OBSERVACIONES
                doc.setFontSize(10); // regresar a tamaño normal
            }
        }

    // Pregunta 7
    y += 6;
    doc.text(`7. ¿El edificio cuenta con seguridad física?`, 16, y);
    doc.line(15, y + 2, w, y + 2);
    if (seguridad_fisica === "si") {
        doc.text("x", 112, y);
    } else if (seguridad_fisica === "no") {
        doc.text("x", 122, y);
        const motivo = document.querySelector('#input_seguridad_fisica').value;
        if (motivo) {
            doc.setFontSize(8);
            doc.text(motivo, 129, y);
            doc.setFontSize(10);
        }
    }
    // Pregunta 8
y += 6;
doc.text(`8. ¿Se cuenta con aire acondicionado?`, 16, y);
doc.line(15, y + 2, w, y + 2);
if (aire === "si") {
    doc.text("x", 112, y);
} else if (aire === "no") {
    doc.text("x", 122, y);
    const motivo = document.querySelector('#input_aire').value;
    if (motivo) {
        doc.setFontSize(8);
        doc.text(motivo, 129, y);
        doc.setFontSize(10);
    }
}

    // Pregunta 9
y += 6;
doc.text(`9. ¿Se encuentra operando normal el aire acondicionado?`, 16, y);
doc.line(15, y + 2, w, y + 2);
if (aire_funcionando === "si") {
    doc.text("x", 112, y);
} else if (aire_funcionando === "no") {
    doc.text("x", 122, y);
    const motivo = document.querySelector('#input_aire_funcionando').value;
    if (motivo) {
        doc.setFontSize(8);
        doc.text(motivo, 129, y);
        doc.setFontSize(10);
    }
}

// Pregunta 10
y += 6;
doc.text(`10. ¿Se cuenta con bitácora de registro?`, 16, y);
doc.line(15, y + 2, w, y + 2);
if (bitacora === "si") {
    doc.text("x", 112, y);
} else if (bitacora === "no") {
    doc.text("x", 122, y);
    const motivo = document.querySelector('#input_bitacora').value;
    if (motivo) {
        doc.setFontSize(8);
        doc.text(motivo, 129, y);
        doc.setFontSize(10);
    }
}

// Pregunta 11
y += 6;
doc.text(`11. ¿Existe orden y limpieza en sala de Telecomunicaciones (5s)?`, 16, y);
doc.line(15, y + 2, w, y + 2);
if (orden_impieza === "si") {
    doc.text("x", 112, y);
} else if (orden_impieza === "no") {
    doc.text("x", 122, y);
    const motivo = document.querySelector('#input_orden_impieza').value;
    if (motivo) {
        doc.setFontSize(8);
        doc.text(motivo, 129, y);
        doc.setFontSize(10);
    }
}

// Pregunta 12
y += 6;
doc.text(`12. ¿Se cuenta con cableado de red estructurado etiquetado?`, 16, y);
doc.line(15, y + 2, w, y + 2);
if (etiquetado === "si") {
    doc.text("x", 112, y);
} else if (etiquetado === "no") {
    doc.text("x", 122, y);
    const motivo = document.querySelector('#input_etiquetado').value;
    if (motivo) {
        doc.setFontSize(8);
        doc.text(motivo, 129, y);
        doc.setFontSize(10);
    }
}

// Pregunta 13
y += 6;
doc.text(`13. ¿Switch se encuentra libre de polvo?`, 16, y);
doc.line(15, y + 2, w, y + 2);
if (polvo === "si") {
    doc.text("x", 112, y);
} else if (polvo === "no") {
    doc.text("x", 122, y);
    const motivo = document.querySelector('#input_polvo').value;
    if (motivo) {
        doc.setFontSize(8);
        doc.text(motivo, 129, y);
        doc.setFontSize(10);
    }
}

// Pregunta 14
y += 6;
doc.text(`14. ¿Los puntos de acceso están correctamente instalados en plafón, pared o rack?`, 16, y);
doc.line(15, y + 2, w, y + 2);
if (switchAcceso === "si") {
    doc.text("x", 112, y);
} else if (switchAcceso === "no") {
    doc.text("x", 122, y);
    const motivo = document.querySelector('#input_switch').value;
    if (motivo) {
        doc.setFontSize(8);
        doc.text(motivo, 129, y);
        doc.setFontSize(10);
    }
}

// Pregunta 15
y += 6;
doc.text(`15. ¿Se encuentra operando el o los puntos de acceso (AP's)?`, 16, y);
if (APS === "si") {
    doc.text("x", 112, y);
} else if (APS === "no") {
    doc.text("x", 122, y);
    const motivo = document.querySelector('#input_APS').value;
    if (motivo) {
        doc.setFontSize(8);
        doc.text(motivo, 129, y);
        doc.setFontSize(10);
    }
}

    
    doc.save("mantenimiento_preventivo_telecomunicacion.pdf");
}
