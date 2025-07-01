

class PDFNamingManager {
    constructor() {
        this.modalElement = null;
        this.currentSerieNumber = '';
        this.currentEquipmentType = '';
        this.onConfirmCallback = null;
        this.init();
    }


    init() {
        this.createNamingModal();
        this.attachModalEvents();
    }


    createNamingModal() {
        // Textos en español definidos como variables
        const textos = {
            titulo: 'Nombrar archivo PDF',
            etiquetaNombre: 'Nombre del archivo (sin extensión):',
            placeholder: 'Ingrese el nombre del archivo',
            ayuda: 'El archivo se guardará como:',
            extension: '.pdf',
            botonCancelar: 'Cancelar',
            botonGenerar: 'Generar PDF'
        };

        const modalHTML = `
            <div id="pdf-naming-modal" class="pdf-naming-modal" style="display: none;">
                <div class="pdf-naming-modal__contenido">
                    <h3 class="pdf-naming-modal__titulo">${textos.titulo}</h3>
                    <div class="pdf-naming-modal__form">
                        <div class="campo">
                            <label class="campo__etiqueta" for="pdf-filename-input">
                                ${textos.etiquetaNombre}
                            </label>
                            <input 
                                type="text" 
                                id="pdf-filename-input" 
                                class="campo__control" 
                                placeholder="${textos.placeholder}"
                                maxlength="100"
                            />
                            <small class="pdf-naming-modal__help-text">
                                ${textos.ayuda} <span id="preview-filename"></span>${textos.extension}
                            </small>
                        </div>
                    </div>
                    <div class="pdf-naming-modal__botones">
                        <button type="button" class="boton boton--secundario" id="btn-cancel-naming">
                            ${textos.botonCancelar}
                        </button>
                        <button type="button" class="boton boton--primario" id="btn-confirm-naming">
                            ${textos.botonGenerar}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Agregar el modal al body si no existe
        if (!document.getElementById('pdf-naming-modal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.modalElement = document.getElementById('pdf-naming-modal');
    }

    
    attachModalEvents() {
        // Obtener elementos del DOM
        const botonCancelar = document.getElementById('btn-cancel-naming');
        const botonConfirmar = document.getElementById('btn-confirm-naming');
        const campoNombre = document.getElementById('pdf-filename-input');
        const elementoVistaPrevia = document.getElementById('preview-filename');

        // Mensajes y constantes
        const mensajes = {
            archivoSinNombre: 'archivo_sin_nombre',
            teclaEnter: 'Enter'
        };

        // Evento para cancelar
        botonCancelar.addEventListener('click', () => {
            this.ocultarModal();
        });

        // Evento para confirmar
        botonConfirmar.addEventListener('click', () => {
            this.confirmarNombrado();
        });

        // Evento para actualizar vista previa en tiempo real
        campoNombre.addEventListener('input', (evento) => {
            const valorLimpio = this.sanitizeFilename(evento.target.value);
            evento.target.value = valorLimpio;
            elementoVistaPrevia.textContent = valorLimpio || mensajes.archivoSinNombre;
        });

        // Cerrar modal al hacer clic fuera
        this.modalElement.addEventListener('click', (evento) => {
            if (evento.target === this.modalElement) {
                this.ocultarModal();
            }
        });

        // Confirmar con Enter
        campoNombre.addEventListener('keypress', (evento) => {
            if (evento.key === mensajes.teclaEnter) {
                this.confirmarNombrado();
            }
        });
    }

    /**
     * Sanitiza el nombre del archivo removiendo caracteres no válidos
     * @param {string} nombreArchivo - Nombre del archivo a sanitizar
     * @returns {string} - Nombre sanitizado
     */
    sanitizeFilename(nombreArchivo) {
        // Configuración de sanitización
        const configuracion = {
            caracteresProhibidos: /[<>:"/\\|?*]/g, 
            espacios: /\s+/g, 
            caracteresPermitidos: /[^\w\-_\.]/g, 
            longitudMaxima: 100,
            reemplazoEspacio: '_' 
        };

        // Remover caracteres no válidos para nombres de archivo
        return nombreArchivo
            .replace(configuracion.caracteresProhibidos, '') 
            .replace(configuracion.espacios, configuracion.reemplazoEspacio) // Reemplazar espacios con guión bajo
            .replace(configuracion.caracteresPermitidos, '') // Solo permitir caracteres válidos
            .substring(0, configuracion.longitudMaxima); 
    }

    /**
     * Genera nombre automático basado en el número de serie
     * @param {string} numeroSerie - Número de serie del equipo
     * @param {string} tipoEquipo - Tipo de equipo (opcional)
     * @returns {string} - Nombre generado automáticamente
     */
    generateAutoFilename(numeroSerie, tipoEquipo = '') {
        // Configuración de nombres automáticos
        const configuracion = {
            prefijoPorDefecto: 'MANTENIMIENTO',
            separador: '_'
        };

        let nombreArchivo = '';
        
        if (numeroSerie && numeroSerie.trim() !== '') {
            // Si hay número de serie, usarlo como nombre principal
            nombreArchivo = numeroSerie.trim().toUpperCase();
        } else {
            // Si no hay número de serie, usar tipo de equipo y fecha
            const fecha = new Date();
            const fechaFormateada = fecha.toISOString().slice(0, 10).replace(/-/g, '');
            const tipoEquipoLimpio = tipoEquipo || configuracion.prefijoPorDefecto;
            nombreArchivo = `${tipoEquipoLimpio}${configuracion.separador}${fechaFormateada}`;
        }

        return this.sanitizeFilename(nombreArchivo);
    }

    /**
     * Muestra el modal para nombrar el archivo
     * @param {string} numeroSerie - Número de serie del equipo
     * @param {string} tipoEquipo - Tipo de equipo
     * @param {Function} alConfirmar - Callback que se ejecuta al confirmar el nombre
     */
    showNamingModal(numeroSerie, tipoEquipo, alConfirmar) {
        // Almacenar datos actuales
        this.currentSerieNumber = numeroSerie || '';
        this.currentEquipmentType = tipoEquipo || '';
        this.onConfirmCallback = alConfirmar;

        // Obtener elementos del DOM
        const campoEntrada = document.getElementById('pdf-filename-input');
        const elementoVistaPrevia = document.getElementById('preview-filename');

        // Generar nombre automático
        const nombreAutomatico = this.generateAutoFilename(numeroSerie, tipoEquipo);
        
        // Establecer el nombre automático en el input
        campoEntrada.value = nombreAutomatico;
        elementoVistaPrevia.textContent = nombreAutomatico;

        // Mostrar modal
        this.modalElement.style.display = 'flex';
        
        const tiempoEspera = 100; // milisegundos
        setTimeout(() => {
            campoEntrada.focus();
            campoEntrada.select();
        }, tiempoEspera);
    }

    /**
     * Oculta el modal
     */
    ocultarModal() {
        this.modalElement.style.display = 'none';
        this.onConfirmCallback = null;
    }

    /**
     * Confirma el nombrado y ejecuta el callback
     */
    confirmarNombrado() {
        // Obtener elemento del DOM
        const campoEntrada = document.getElementById('pdf-filename-input');
        let nombreArchivo = campoEntrada.value.trim();

        // Configuración
        const configuracion = {
            extension: '.pdf'
        };

        // Si no hay nombre, usar uno por defecto
        if (nombreArchivo === '') {
            nombreArchivo = this.generateAutoFilename(this.currentSerieNumber, this.currentEquipmentType);
        }

        // Sanitizar el nombre final
        nombreArchivo = this.sanitizeFilename(nombreArchivo);

        // Agregar extensión PDF
        const nombreFinal = `${nombreArchivo}${configuracion.extension}`;

        // Ejecutar callback si existe
        if (this.onConfirmCallback && typeof this.onConfirmCallback === 'function') {
            this.onConfirmCallback(nombreFinal);
        }

        // Ocultar modal
        this.ocultarModal();
    }

    /**
     * Obtiene el número de serie desde el formulario HTML
     * @returns {string} - Número de serie encontrado
     */
    getSerieNumberFromForm() {
        // Selectores posibles para buscar el campo de número de serie
        const selectoresSerie = [
            'input[id="serie"]',
            'input[id="numero_serie"]',
            'input[id="serie_numero"]',
            'input[name="serie"]',
            'input[name="numero_serie"]'
        ];

        // Buscar en cada selector posible
        for (const selector of selectoresSerie) {
            const elemento = document.querySelector(selector);
            if (elemento && elemento.value.trim() !== '') {
                return elemento.value.trim();
            }
        }

        // Si no se encuentra, retornar cadena vacía
        return '';
    }

    /**
     * Obtiene el tipo de equipo desde el formulario HTML
     * @returns {string} - Tipo de equipo encontrado
     */
    getEquipmentTypeFromForm() {
        // Selectores posibles para buscar el tipo de equipo
        const selectoresTipo = [
            'select[id="tipo_equipo"]',
            'input[id="tipo_equipo"]',
            'select[name="tipo_equipo"]',
            'input[name="tipo_equipo"]'
        ];

        // Buscar en cada selector posible
        for (const selector of selectoresTipo) {
            const elemento = document.querySelector(selector);
            if (elemento && elemento.value.trim() !== '') {
                return elemento.value.trim();
            }
        }

        // Tipos de equipo por palabras clave en el título
        const tiposEquipo = {
            computadoras: ['comput'],
            impresoras: ['impres'],
            tabletas: ['tablet'],
            tps: ['tps'],
            telecomunicaciones: ['telecom']
        };

        // Si no encuentra tipo específico, intentar detectar desde el título de la página
        const titulo = document.title || document.querySelector('h1')?.textContent || '';
        const tituloMinusculas = titulo.toLowerCase();

        // Verificar cada tipo de equipo
        if (tiposEquipo.computadoras.some(palabra => tituloMinusculas.includes(palabra))) {
            return 'COMPUTADORA';
        }
        if (tiposEquipo.impresoras.some(palabra => tituloMinusculas.includes(palabra))) {
            return 'IMPRESORA';
        }
        if (tiposEquipo.tabletas.some(palabra => tituloMinusculas.includes(palabra))) {
            return 'TABLETA';
        }
        if (tiposEquipo.tps.some(palabra => tituloMinusculas.includes(palabra))) {
            return 'TPS';
        }
        if (tiposEquipo.telecomunicaciones.some(palabra => tituloMinusculas.includes(palabra))) {
            return 'TELECOMUNICACIONES';
        }

        // Valor por defecto
        return 'EQUIPO';
    }

    /**
     * Método principal para solicitar nombre de archivo PDF
     * @param {Function} alConfirmar - Callback que recibe el nombre final del archivo
     * @param {string} numeroSeriePersonalizado - Número de serie personalizado (opcional)
     * @param {string} tipoEquipoPersonalizado - Tipo de equipo personalizado (opcional)
     */
    requestFilename(alConfirmar, numeroSeriePersonalizado = null, tipoEquipoPersonalizado = null) {
        // Obtener datos del formulario o usar los proporcionados
        const numeroSerie = numeroSeriePersonalizado || this.getSerieNumberFromForm();
        const tipoEquipo = tipoEquipoPersonalizado || this.getEquipmentTypeFromForm();

        // Mostrar modal de nombrado
        this.showNamingModal(numeroSerie, tipoEquipo, alConfirmar);
    }
}

// Crear instancia global del administrador de nombres PDF
window.PDFNamingManager = new PDFNamingManager();

// Función de utilidad global para facilitar el uso
window.requestPDFFilename = function(alConfirmar, numeroSeriePersonalizado = null, tipoEquipoPersonalizado = null) {
    return window.PDFNamingManager.requestFilename(alConfirmar, numeroSeriePersonalizado, tipoEquipoPersonalizado);
};
