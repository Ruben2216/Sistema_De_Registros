document.addEventListener('DOMContentLoaded', function() {
    // Cargar las firmas desde localStorage y mostrarlas en formato.html, en firma.js ya se definio que la base64 se envia al localStorage
    var firma1 = localStorage.getItem('firmaComputo1');
    var firma2 = localStorage.getItem('firmaComputo2');
    var firma3 = localStorage.getItem('firmaComputo3');

    if (firma1) {
        var imgFirma1 = document.getElementById('firma1');
        if (imgFirma1) {
            imgFirma1.src = firma1;
            imgFirma1.style.display = 'block'; //es para que se muestre la firma visualmente
        }
    }

    if (firma2) {
        var imgFirma2 = document.getElementById('firma2');
        if (imgFirma2) {
            imgFirma2.src = firma2;
            imgFirma2.style.display = 'block';
        }
    }

    if (firma3) {
        var imgFirma3 = document.getElementById('firma3');
        if (imgFirma3) {
            imgFirma3.src = firma3;
            imgFirma3.style.display = 'block';
        }
    }
});
