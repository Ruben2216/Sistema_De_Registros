// Visor PDF integrado con navegación por fechas para formato_RIJ.html
// Reemplaza la lógica anterior de redirección simple con un visor modal completo

(function() {
    'use strict';
    
    // --- CONFIGURACIÓN ---
    const pdfUrl = '/RESOURCE/RIJ ENE A DIC 2025.pdf';
    let indiceFechasPaginas = {}; // Índice de fechas a páginas cargado desde JSON
    
    // --- VARIABLES GLOBALES DEL VISOR PDF ---
    let pdfDoc = null;
    let currentPageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    
    // --- ELEMENTOS DEL DOM ---
    let modal, canvas, ctx, pageNumDisplay, pageCountDisplay, prevButton, nextButton;
    let pageInput, goToPageButton, dateInput, goToDateButton;
    
    /**
     * Inicializa las referencias a elementos del DOM
     */
    function initializeElements() {
        modal = document.getElementById('modal-pdf-viewer');
        canvas = document.getElementById('pdf-canvas-rij');
        ctx = canvas ? canvas.getContext('2d') : null;
        pageNumDisplay = document.getElementById('page-num-rij');
        pageCountDisplay = document.getElementById('page-count-rij');
        prevButton = document.getElementById('prev-page-rij');
        nextButton = document.getElementById('next-page-rij');
        pageInput = document.getElementById('page-input-rij');
        goToPageButton = document.getElementById('go-to-page-rij');
        dateInput = document.getElementById('date-input-rij');
        goToDateButton = document.getElementById('go-to-date-rij');
    }
    
    /**
     * Carga el índice de fechas a páginas desde el archivo JSON
     */
    function cargarIndiceFechas() {
        return fetch('/RESOURCE/JS/indice_fechas_paginas.json')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Error al cargar índice de fechas: ' + response.status + ' ' + response.statusText);
                }
                return response.json();
            })
            .then(function(datos) {
                indiceFechasPaginas = datos;
                return indiceFechasPaginas;
            })
            .catch(function(error) {
                console.error('Error al cargar índice de fechas:', error);
                return {};
            });
    }
    
    /**
     * Obtiene la fecha actual en formato dd/mm/yyyy
     */
    function obtenerFechaActual() {
        const fecha = new Date();
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        return dia + '/' + mes + '/' + anio;
    }
    
    /**
     * Convierte una fecha del input date (yyyy-mm-dd) al formato del índice (dd/mm/yyyy)
     */
    function formatearFechaParaIndice(fechaInput) {
        if (!fechaInput) return null;
        const partes = fechaInput.split('-');
        if (partes.length !== 3) return null;
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }
    
    /**
     * Actualiza la URL con el número de página actual
     */
    function updateUrlHash(pageNumber) {
        try {
            const newHash = `#page=${pageNumber}`;
            
            if (history.replaceState) {
                history.replaceState(null, null, newHash);
            } else {
                window.location.hash = newHash;
            }
        } catch (error) {
            window.location.hash = `#page=${pageNumber}`;
        }
    }
    
    /**
     * Renderiza una página específica del PDF en el canvas
     */
    function renderPage(num) {
        pageRendering = true;
        
        pdfDoc.getPage(num).then(function(page) {
            const viewport = page.getViewport({ scale: 1.2 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            const renderTask = page.render(renderContext);

            renderTask.promise.then(function() {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
                pageNumDisplay.textContent = num;
                pageInput.value = num;
                updateButtons();
            });
        });
    }
    
    /**
     * Pone en cola el renderizado de una página
     */
    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }
    
    /**
     * Actualiza el estado de los botones de navegación
     */
    function updateButtons() {
        if (prevButton && nextButton && pdfDoc) {
            prevButton.disabled = (currentPageNum <= 1);
            nextButton.disabled = (currentPageNum >= pdfDoc.numPages);
            
            // Actualizar estilos de botones deshabilitados
            prevButton.style.opacity = prevButton.disabled ? '0.5' : '1';
            nextButton.style.opacity = nextButton.disabled ? '0.5' : '1';
            prevButton.style.cursor = prevButton.disabled ? 'not-allowed' : 'pointer';
            nextButton.style.cursor = nextButton.disabled ? 'not-allowed' : 'pointer';
        }
    }
    
    /**
     * Navega directamente a una página específica
     */
    function goToPage(pageNumber) {
        if (pdfDoc && pageNumber > 0 && pageNumber <= pdfDoc.numPages) {
            currentPageNum = pageNumber;
            updateUrlHash(currentPageNum);
            queueRenderPage(currentPageNum);
        } else {
            alert(`Página ${pageNumber} no válida. El documento tiene ${pdfDoc ? pdfDoc.numPages : 0} páginas.`);
        }
    }
    
    /**
     * Busca la página correspondiente a una fecha
     */
    function goToDate(fechaStr) {
        const fechaFormateada = formatearFechaParaIndice(fechaStr);
        if (!fechaFormateada) {
            alert('Formato de fecha no válido');
            return;
        }
        
        const pagina = indiceFechasPaginas[fechaFormateada];
        if (pagina) {
            goToPage(pagina);
        } else {
            alert(`No se encontró información para la fecha ${fechaFormateada}`);
        }
    }
    
    /**
     * Navega a la página anterior
     */
    function onPrevPage() {
        if (currentPageNum <= 1) return;
        currentPageNum--;
        updateUrlHash(currentPageNum);
        queueRenderPage(currentPageNum);
    }
    
    /**
     * Navega a la página siguiente
     */
    function onNextPage() {
        if (currentPageNum >= pdfDoc.numPages) return;
        currentPageNum++;
        updateUrlHash(currentPageNum);
        queueRenderPage(currentPageNum);
    }
    
    /**
     * Cierra el modal del visor PDF
     */
    function cerrarVisorPDF() {
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Abre el visor PDF y navega a la página correspondiente a la fecha actual
     */
    function abrirVisorPDF() {
        if (!modal) {
            return;
        }
        
        modal.style.display = 'block';
        
        if (!pdfDoc) {
            // Cargar el PDF por primera vez
            pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc_) {
                pdfDoc = pdfDoc_;
                pageCountDisplay.textContent = pdfDoc.numPages;
                pageInput.max = pdfDoc.numPages;
                
                // Determinar página inicial basada en la fecha actual
                const fechaActual = obtenerFechaActual();
                const paginaFecha = indiceFechasPaginas[fechaActual];
                
                let paginaInicial = 1;
                if (paginaFecha) {
                    paginaInicial = paginaFecha;
                }
                
                currentPageNum = paginaInicial;
                renderPage(currentPageNum);
                updateUrlHash(currentPageNum);
                
                // Establecer fecha actual en el input de fecha
                const hoy = new Date();
                const fechaInput = hoy.getFullYear() + '-' + 
                                 (hoy.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                                 hoy.getDate().toString().padStart(2, '0');
                dateInput.value = fechaInput;
                
            }).catch(function(err) {
                console.error("Error al cargar el PDF:", err);
                const viewer = document.getElementById('pdf-viewer-rij');
                if (viewer) {
                    viewer.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">
                        <h3>Error al cargar el PDF</h3>
                        <p>No se pudo cargar el archivo: <code>${pdfUrl}</code></p>
                        <p>Error: ${err.message}</p>
                        <p>Verifica que el archivo exista y sea accesible.</p>
                    </div>`;
                }
                alert("Error al cargar el PDF. Verifica que el archivo esté disponible.");
            });
        }
    }
    
    /**
     * Inicializa todos los event listeners
     */
    function initializeEventListeners() {
        // Botón para abrir el visor PDF
        const enlacePDF = document.getElementById('enlacePDF');
        if (enlacePDF) {
            enlacePDF.addEventListener('click', function(e) {
                e.preventDefault();
                abrirVisorPDF();
            });
        }
        
        // Botón para cerrar el visor
        const cerrarBtn = document.getElementById('cerrar-pdf-viewer');
        if (cerrarBtn) {
            cerrarBtn.addEventListener('click', cerrarVisorPDF);
        }
        
        // Cerrar modal al hacer clic fuera del contenido
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    cerrarVisorPDF();
                }
            });
        }
        
        // Controles de navegación
        if (prevButton) prevButton.addEventListener('click', onPrevPage);
        if (nextButton) nextButton.addEventListener('click', onNextPage);
        
        // Ir a página específica
        if (goToPageButton) {
            goToPageButton.addEventListener('click', function() {
                const pageNumber = parseInt(pageInput.value, 10);
                goToPage(pageNumber);
            });
        }
        
        // Enter en input de página
        if (pageInput) {
            pageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const pageNumber = parseInt(pageInput.value, 10);
                    goToPage(pageNumber);
                }
            });
        }
        
        // Ir a fecha específica
        if (goToDateButton) {
            goToDateButton.addEventListener('click', function() {
                const fechaSeleccionada = dateInput.value;
                if (fechaSeleccionada) {
                    goToDate(fechaSeleccionada);
                } else {
                    alert('Por favor selecciona una fecha');
                }
            });
        }
        
        // Enter en input de fecha
        if (dateInput) {
            dateInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const fechaSeleccionada = dateInput.value;
                    if (fechaSeleccionada) {
                        goToDate(fechaSeleccionada);
                    }
                }
            });
        }
        
        // Tecla Escape para cerrar modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal && modal.style.display === 'block') {
                cerrarVisorPDF();
            }
        });
    }
    
    /**
     * Inicialización principal
     */
    function inicializar() {
        initializeElements();
        
        // Cargar índice de fechas
        cargarIndiceFechas().then(function() {
            initializeEventListeners();
        });
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
    
})();
