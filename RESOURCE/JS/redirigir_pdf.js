

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
    let dateInput;
    
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
        dateInput = document.getElementById('date-input-rij');
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
        // Si ya estamos renderizando, cancelar la operación pendiente y poner en cola
        if (pageRendering) {
            pageNumPending = num;
            return;
        }
        
        pageRendering = true;
        
        pdfDoc.getPage(num).then(function(page) {
            // Obtener dimensiones naturales de la página
            const viewport = page.getViewport({ scale: 1.0 });
            
            // Asegurar que el canvas tenga el tamaño correcto
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // Limpiar completamente el canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            // Cancelar cualquier renderizado anterior si existe
            if (window.currentRenderTask) {
                window.currentRenderTask.cancel();
            }

            // Crear nueva tarea de renderizado
            window.currentRenderTask = page.render(renderContext);

            window.currentRenderTask.promise.then(function() {
                pageRendering = false;
                window.currentRenderTask = null;
                
                // Actualizar UI
                pageNumDisplay.textContent = num;
                updateButtons();
                
                // Procesar operación pendiente si existe
                if (pageNumPending !== null) {
                    const pendingNum = pageNumPending;
                    pageNumPending = null;
                    renderPage(pendingNum);
                }
            }).catch(function(error) {
                pageRendering = false;
                window.currentRenderTask = null;
                
                // Solo mostrar error si no fue cancelación
                if (error.name !== 'RenderingCancelledException') {
                    console.error('Error al renderizar página:', error);
                }
                
                // Procesar operación pendiente si existe
                if (pageNumPending !== null) {
                    const pendingNum = pageNumPending;
                    pageNumPending = null;
                    renderPage(pendingNum);
                }
            }).finally(function() {
                ctx.restore();
            });
        }).catch(function(error) {
            console.error('Error al obtener página:', error);
            pageRendering = false;
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
            
            // Usar clases CSS en lugar de estilos inline
            if (prevButton.disabled) {
                prevButton.classList.add('visor-pdf__boton--deshabilitado');
            } else {
                prevButton.classList.remove('visor-pdf__boton--deshabilitado');
            }
            
            if (nextButton.disabled) {
                nextButton.classList.add('visor-pdf__boton--deshabilitado');
            } else {
                nextButton.classList.remove('visor-pdf__boton--deshabilitado');
            }
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
            // Cancelar cualquier renderizado en progreso
            if (window.currentRenderTask) {
                window.currentRenderTask.cancel();
                window.currentRenderTask = null;
            }
            
            // Resetear estado de renderizado
            pageRendering = false;
            pageNumPending = null;
            
            modal.style.display = 'none';
        }
    }
    
    /**
     * Abre el visor PDF y navega a la página correspondiente a la fecha actual
     */
    function abrirVisorPDF() {
        if (!modal) {
            console.error('Modal del visor PDF no encontrado');
            return;
        }
        
        modal.style.display = 'block';
        
        if (!pdfDoc) {
            // Cargar el PDF por primera vez
            pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc_) {
                pdfDoc = pdfDoc_;
                pageCountDisplay.textContent = pdfDoc.numPages;
                
                // Determinar página inicial basada en la fecha actual
                const fechaActual = obtenerFechaActual();
                const paginaFecha = indiceFechasPaginas[fechaActual];
                
                let paginaInicial = 1;
                if (paginaFecha) {
                    paginaInicial = paginaFecha;
                }
                
                currentPageNum = paginaInicial;
                
                // Renderizar directamente sin setTimeout para evitar problemas
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
        } else {
            // Si el PDF ya está cargado, renderizar la página actual sin setTimeout
            renderPage(currentPageNum);
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
        
        // Búsqueda dinámica por fecha
        if (dateInput) {
            dateInput.addEventListener('change', function() {
                const fechaSeleccionada = dateInput.value;
                if (fechaSeleccionada) {
                    goToDate(fechaSeleccionada);
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
     * Asegura que todos los modales estén en su estado inicial correcto
     */
    function verificarEstadoInicial() {
        // Ocultar modal del visor PDF si está visible
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Asegurar que campos con display:none estén ocultos
        const camposOcultos = document.querySelectorAll('.campo__control--oculto');
        camposOcultos.forEach(function(campo) {
            campo.style.display = 'none';
        });
    }
    
    /**
     * Inicialización principal
     */
    function inicializar() {
        initializeElements();
        
        // Verificar estado inicial de modales y campos
        verificarEstadoInicial();
        
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
