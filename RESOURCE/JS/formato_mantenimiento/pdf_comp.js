
async function generarPDF() {
    const { jsPDF } = window.jspdf; /*importa la libreria jsPDF desde el objeto window*/
    const doc = new jsPDF(); /*crea pdf en blanco*/

    const div = document.querySelector('select[id="division"]').value; 
    const zona = document.querySelector('select[id="zona"]').value;
    const centro = document.querySelector('select[id="centro_trabajo"]').value;
    const folio = document.querySelector('input[id="folio"]').value; 
    const fecha = document.querySelector('input[id="fecha"]').value;
    const usuario = document.querySelector('input[id="usuario"]').value;
    const tipo_equipo = document.querySelector('select[id="tipo_equipo"]').value;
    const uso = document.querySelector('input[id="uso"]').value;
    const marca = document.querySelector('input[id="marca"]').value;
    const modelo = document.querySelector('input[id="modelo"]').value;
    const serie = document.querySelector('input[id="serie"]').value;
    const servicio = document.querySelector('select[id="servicio"]').value;
    const hora_inicio = document.querySelector('input[id="hora_inicio"]').value;
    const hora_termino = document.querySelector('input[id="hora_termino"]').value;
    

    let y = 10; /*cordenada vertical para inicial a escribir en el pdf*/
      doc.setFontSize(16); /*tamaño del texto*/
      doc.text("Resumen del Formulario", 10, y); /*texto que se escribe directamente al pdf*/
      y += 10; /*baja 10 unidades para que el texto no se sobreponga*/

    doc.setFontSize(14); /*establece el tamaño de la fuente*/
    doc.text(`Division: ${div}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Zona: ${zona}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Centro de Trabajo: ${centro}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`folio: ${folio}`, 10, y); y+= 10; /*escribe el texto en el pdf*/
    doc.text(`Fecha: ${fecha}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Usuario: ${usuario}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Tipo de Equipo: ${tipo_equipo}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Uso: ${uso}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Marca: ${marca}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Modelo: ${modelo}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Serie: ${serie}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Servicio: ${servicio}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Hora de Inicio: ${hora_inicio}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    doc.text(`Hora de Termino: ${hora_termino}`, 10, y); y += 10; /*escribe el texto en el pdf*/
    
    doc.save("formulario.pdf"); /*descarga automaticamente el pdf con el nombre que esta ahi*/
}
