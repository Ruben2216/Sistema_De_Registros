async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); /*crea pdf vacio*/

    x = 8;
    y = 7;
    doc.rect(x, y, 201.5 - x, 289.5 - y); 

    const division = document.querySelector('select[id="division"]').value;

    doc.setFontSize(10);
    doc.text(`division: ${division}`, 170, 30);

    

    doc.save("mantenimiento_preventivo_tableta.pdf");
}
