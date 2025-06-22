// Script para redirigir al usuario a una página específica del PDF según la fecha actual
// Este script se ejecuta cuando el usuario hace clic en el enlace del PDF

document.addEventListener('DOMContentLoaded', function() {
    var enlacePDF = document.getElementById('enlacePDF');
    if (enlacePDF) {
        enlacePDF.addEventListener('click', function(event) {
            event.preventDefault(); // Prevenir la navegación por defecto

            // Obtener la fecha actual en formato dd/mm/yyyy
            var fecha = new Date();
            var dia = fecha.getDate().toString().padStart(2, '0');
            var mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
            var anio = fecha.getFullYear();
            var fechaClave = dia + '/' + mes + '/' + anio;

            // Cargar el índice de fechas a páginas
            fetch('/RESOURCE/JS/indice_fechas_paginas.json')
                .then(function(response) {
                    return response.json();
                })
                .then(function(indice) {
                    var pagina = indice[fechaClave];
                    if (pagina) {
                        var urlPDF = enlacePDF.getAttribute('href') + '#page=' + pagina;
                        window.location.href = urlPDF;
                    } else{
                        var urlPDF = enlacePDF.getAttribute('href')
                        window.location.href = urlPDF;
                    }
                })
                .catch(function(error) {
                    alert('Error al cargar el índice de fechas: ' + error);
                });
        });
    }
});
