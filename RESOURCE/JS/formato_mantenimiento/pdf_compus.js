async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); /*crea pdf vacio*/


    // DATOS DE FORMULARIO
    const division = document.querySelector('input[id="division"]').value;
    const zona = document.querySelector('select[id="zona"]').value;
    const centro = document.querySelector('input[id="centro_trabajo"]').value;
    const inventario = document.querySelector('input[id="numero_inventario"]').value;
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

    
    // ENCABEZADO
    doc.setFont("helvetica", "bold"); /*tipo de letra y negritas*/
    doc.setFontSize(12);
    doc.text("Comisión Federal de Electricidad", 15, 15);
    doc.setFontSize(10);
    doc.text("Política Transversal de Calidad de CFE", 15, 20);
    doc.text("Sistema Integral de Gestión (SIG-CFE)", 15, 25);

    doc.setFontSize(13);
    doc.text("FORMATO MANTENIMIENTO PREVENTIVO TABLETAS", 105, 40, null, null, "center");
    /*doc.text(texto, x, y, opciones, transformaciones, alineación);*/

    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 170, 40);

    // DATOS GENERALES
    let y = 60;
    doc.setFont("helvetica", "normal");
    doc.text(`División: ${division}`, 15, y);
    doc.text(`Servicio: ${servicio}`, 87, y);
    doc.text(`Serie: ${serie}`, 165, y);

    y += 7;
    doc.text(`Zona: ${zona}`, 15, y);
    doc.text(`Tipo de equipo: ${tipo_equipo}`, 87, y);
    doc.text(`Marca: ${marca}`, 165, y);

    y += 7;
    doc.text(`Centro de Trabajo: ${centro}`, 15, y);
    doc.text(`Usuario: ${usuario}`, 87, y);
    doc.text(`Modelo: ${modelo}`, 165, y);
    
    y+= 7;
    doc.text(`Hora Inicio: ${hora_inicio}`, 15, y);
    doc.text(`Folio: ${folio}`, 87, y);
    doc.text(`Uso: ${uso}`, 165, y);

    y += 7;
    doc.text(`Hora Término: ${hora_termino}`, 15, y);
    doc.text(`Número de Inventario: ${inventario} `, 87, y);

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

        if (index === 0) {
            if (limpieza_externa === "si") {
                doc.text("x", 114, y);
            } else if (limpieza_externa === "no") {
                doc.text("x", 129, y);
            }
        }
        if (index === 1) {
            if (pantalla === "si") {
                doc.text("x", 114, y);
            } else if (pantalla === "no") {
                doc.text("x", 129, y);
            }
        }
        if(index === 2) {
            if (teclado === "si") {
                doc.text("x", 114, y);
            } else if (teclado === "no") {
                doc.text("x", 129, y);
            }
        }
        if(index === 3){
            if(conexiones === "si"){
                doc.text("x", 114, y);
            } else if(conexiones === "no"){
                doc.text("x", 129, y);
            }
        }
        if(index === 4) {
            if (despues_servicio === "si") {
                doc.text("x", 114, y);
            } else if (despues_servicio === "no") {
                doc.text("x", 129, y);
            }
        }
        if(index === 5){
            if(antivirus === "si"){
                doc.text("x", 114, y)
            } else if (antivirus === "no"){
                doc.text("x", 129, y);
            }
        }
        if(index === 6){
            if(defrag === "si"){
                doc.text("x", 114, y);
            } else if (defrag === "no"){
                doc.text("x", 129, y)
            }
        }
        if(index === 7){
            if(dominio === "si"){
                doc.text("x", 114, y);
            } else if(dominio === "no"){
                doc.text("x", 129, y);
            }
        }
        if(index === 8){
            if(Windows_update === "si"){
                doc.text("x", 114, y);
            } else if(Windows_update === "no"){
                doc.text("x", 129, y)
            }
        }
        y += 11; /*Se incrementa y para la siguiente actividad*/
    });

     y += 5;

    // FIRMAS
    y += 23;
    doc.text(`Realizó servicio:`, 15, y);
    doc.text(`${realizo_servicio}`, 15, y + 24);
    doc.text(`Responsable del Equipo:`, 80, y);
    doc.text(`${responsable}`, 80, y + 24);
    doc.text(`Visto Bueno:`, 145, y);
    doc.text(`${visto_bueno}`, 145, y + 24);
    y += 25;
    doc.line(15, y, 60, y);
    doc.line(80, y, 130, y);
    doc.line(145, y, 200, y);
    y += 5;
    doc.text("Nombre y firma", 20, y);
    doc.text("Nombre y firma", 95, y);
    doc.text("Nombre y firma", 165, y);

    doc.save("mantenimiento_preventivo_tableta.pdf");
}
