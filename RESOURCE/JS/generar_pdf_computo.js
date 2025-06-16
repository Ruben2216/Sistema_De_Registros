var elementosGlobales = {
    divisionInput: null,
    marcaInput: null,
    divisionElemento: null,
    marcaElemento: null,
    btnImprimir: null,
    modeloInput: null,
    modeloElemento: null,
    fechaInput: null,
    fechaElemento: null,
    centroTrabajoInput: null,
    centroTrabajoElemento: null,
    tipoUsoInput: null,
    tipoUsoElemento: null,
    usuarioInput: null,
    usuarioElemento: null,
    numeroSerieInput: null,
    numeroSerieElemento: null,
    tipoEquipoInput: null,
    tipoEquipoElemento: null,
    ServicioInput: null,
    ServicioElemento: null,
    realizoServicioInput: null,
    realizoServicioElemento: null,
    responsableInput: null,
    responsableElemento: null,
    vistoBuenoInput: null,
    vistoBuenoElemento: null,
};
function obtenerFecha(){
    fecha= new Date();
    var dia = fecha.getDate();
    var mes = fecha.getMonth() + 1; 
    var anio = fecha.getFullYear();
    fechaHoy = dia + '/' + mes + '/' + anio;
    return fechaHoy;
}

function inicializarElementosGlobales() {
    elementosGlobales.divisionInput = document.getElementById('division');
    elementosGlobales.marcaInput = document.getElementById('marca');
    elementosGlobales.divisionElemento = document.getElementById('division1');
    elementosGlobales.marcaElemento = document.getElementById('marca1');
    elementosGlobales.btnImprimir = document.getElementById('btn_imprimir_formato');
    elementosGlobales.modeloInput = document.getElementById('modelo');
    elementosGlobales.modeloElemento = document.getElementById('modelo1');
    elementosGlobales.fechaInput = document.getElementById('fecha');
    elementosGlobales.fechaElemento = document.getElementById('fecha1');
    elementosGlobales.centroTrabajoInput = document.getElementById('centro_trabajo');
    elementosGlobales.centroTrabajoElemento = document.getElementById('centro_trabajo1');
    elementosGlobales.tipoUsoInput = document.getElementById('tipo_uso');
    elementosGlobales.tipoUsoElemento = document.getElementById('tipo_uso1');
    elementosGlobales.usuarioInput = document.getElementById('usuario');
    elementosGlobales.usuarioElemento = document.getElementById('usuario1');
    elementosGlobales.numeroSerieInput = document.getElementById('numero_serie');
    elementosGlobales.numeroSerieElemento = document.getElementById('numero_serie1');
    elementosGlobales.tipoEquipoInput = document.getElementById('tipo_equipo');
    elementosGlobales.tipoEquipoElemento = document.getElementById('tipo_equipo1');
    elementosGlobales.ServicioInput = document.getElementById('servicio');
    elementosGlobales.ServicioElemento = document.getElementById('servicio1');
    elementosGlobales.realizoServicioInput = document.getElementById('realizo_servicio');
    elementosGlobales.realizoServicioElemento = document.getElementById('realizo_servicio1');
    elementosGlobales.responsableInput = document.getElementById('responsable');
    elementosGlobales.responsableElemento = document.getElementById('responsable1');
    elementosGlobales.vistoBuenoInput = document.getElementById('visto_bueno');
    elementosGlobales.vistoBuenoElemento = document.getElementById('visto_bueno1');

    //------------------------
    
}

// Función para obtener valores de los inputs de computo.html y enviarlos a formato.html y poder imprimirlos
function transferirValoresComputoAFormato() {
    var divisionValue = '';
    if (elementosGlobales.divisionInput) {
        divisionValue = elementosGlobales.divisionInput.value;
    }
    var marcaValue = '';
    if (elementosGlobales.marcaInput) {
        marcaValue = elementosGlobales.marcaInput.value;
    }
    modeloValue = '';
    if (elementosGlobales.modeloInput) {
        modeloValue = elementosGlobales.modeloInput.value;
    }
    fechaValue = '';
    if (elementosGlobales.fechaInput) {
        fechaValue = elementosGlobales.fechaInput.value || obtenerFecha();
    }
    centroTrabajoValue = '';
    if (elementosGlobales.centroTrabajoInput) {
        centroTrabajoValue = elementosGlobales.centroTrabajoInput.value;
    }
    tipoUsoValue = '';
    if (elementosGlobales.tipoUsoInput) {
        tipoUsoValue = elementosGlobales.tipoUsoInput.value;
    }
    usuarioValue = '';
    if (elementosGlobales.usuarioInput) {
        usuarioValue = elementosGlobales.usuarioInput.value;
    }
    numeroSerieValue= '';
    if (elementosGlobales.numeroSerieInput) {
        numeroSerieValue = elementosGlobales.numeroSerieInput.value;
    }
    tipoEquipoValue = '';
    if (elementosGlobales.tipoEquipoInput) {
        tipoEquipoValue = elementosGlobales.tipoEquipoInput.value;
    }
    servicioValue = '';
    if (elementosGlobales.ServicioInput) {
        servicioValue = elementosGlobales.ServicioInput.value;
    }
    realizoServicioValue = '';
    if (elementosGlobales.realizoServicioInput) {
        realizoServicioValue = elementosGlobales.realizoServicioInput.value;
    }
    responsableValue = '';
    if (elementosGlobales.responsableInput) {
        responsableValue = elementosGlobales.responsableInput.value;
    }
    vistoBuenoValue = '';
    if (elementosGlobales.vistoBuenoInput) {
        vistoBuenoValue = elementosGlobales.vistoBuenoInput.value;
    }

    // Guardar el valor en localStorage para que formato.html lo pueda leer
    localStorage.setItem('division1', divisionValue);
    localStorage.setItem('marca1', marcaValue);
    localStorage.setItem('modelo1', modeloValue);
    localStorage.setItem('fecha1', fechaValue);
    localStorage.setItem('centro_trabajo1', centroTrabajoValue);
    localStorage.setItem('tipo_uso1', tipoUsoValue);
    localStorage.setItem('usuario1', usuarioValue);
    localStorage.setItem('numero_serie1', numeroSerieValue);
    localStorage.setItem('tipo_equipo1', tipoEquipoValue);
    localStorage.setItem('servicio1', servicioValue);
    localStorage.setItem('realizo_servicio1', realizoServicioValue);
    localStorage.setItem('responsable1', responsableValue);
    localStorage.setItem('visto_bueno1', vistoBuenoValue);
}

function insertarValoresEnFormato() {
    // Leer el valor guardado en localStorage del usuario haya ingresaado en computo.html   
    var divisionValue = localStorage.getItem('division1');
    var marcaValue = localStorage.getItem('marca1');
    var modeloValue = localStorage.getItem('modelo1');
    var fechaValue = localStorage.getItem('fecha1') || obtenerFecha();
    var centroTrabajoValue = localStorage.getItem('centro_trabajo1');
    var tipoUsoValue = localStorage.getItem('tipo_uso1');
    var usuarioValue = localStorage.getItem('usuario1');
    var numeroSerieValue = localStorage.getItem('numero_serie1');
    var tipoEquipoValue = localStorage.getItem('tipo_equipo1');
    var servicioValue = localStorage.getItem('servicio1');
    var realizoServicioValue = localStorage.getItem('realizo_servicio1');
    var responsableValue = localStorage.getItem('responsable1');
    var vistoBuenoValue = localStorage.getItem('visto_bueno1');


    // Asignar los valores a los elementos correspondientes de forma independiente
    if (elementosGlobales.marcaElemento) {
        elementosGlobales.marcaElemento.innerHTML = marcaValue;
    }
    if (elementosGlobales.divisionElemento) {
        elementosGlobales.divisionElemento.innerHTML = divisionValue;
    }
    if (elementosGlobales.modeloElemento) {
        elementosGlobales.modeloElemento.innerHTML = modeloValue;
    }
    if (elementosGlobales.fechaElemento) {
        elementosGlobales.fechaElemento.innerHTML = fechaValue;
    }
    if (elementosGlobales.centroTrabajoElemento) {
        elementosGlobales.centroTrabajoElemento.innerHTML = centroTrabajoValue;
    }
    if (elementosGlobales.tipoUsoElemento) {
        elementosGlobales.tipoUsoElemento.innerHTML = tipoUsoValue;
    }
    if (elementosGlobales.usuarioElemento) {
        elementosGlobales.usuarioElemento.innerHTML = usuarioValue;
    }
    if (elementosGlobales.numeroSerieElemento) {
        elementosGlobales.numeroSerieElemento.innerHTML = numeroSerieValue;
    }
    if (elementosGlobales.tipoEquipoElemento) {
        elementosGlobales.tipoEquipoElemento.innerHTML = tipoEquipoValue;
    }
    if (elementosGlobales.ServicioElemento) {
        elementosGlobales.ServicioElemento.innerHTML = servicioValue;
    }
    if (elementosGlobales.realizoServicioElemento) {
        elementosGlobales.realizoServicioElemento.innerHTML = realizoServicioValue;
    }
    if (elementosGlobales.responsableElemento) {
        elementosGlobales.responsableElemento.innerHTML = responsableValue;
    }
    if (elementosGlobales.vistoBuenoElemento) {
        elementosGlobales.vistoBuenoElemento.innerHTML = vistoBuenoValue;
    }

}

function guardarLocalStorage() {
    if (elementosGlobales.marcaInput) {
        localStorage.setItem('valor_marca', elementosGlobales.marcaInput.value);
    }
    if (elementosGlobales.divisionInput) {
        localStorage.setItem('valor_division', elementosGlobales.divisionInput.value);
    }
    if (elementosGlobales.modeloInput) {
        localStorage.setItem('valor_modelo', elementosGlobales.modeloInput.value);
    }
    if (elementosGlobales.fechaInput) {
        localStorage.setItem('valor_fecha', elementosGlobales.fechaInput.value || obtenerFecha());
    }
    if (elementosGlobales.centroTrabajoInput) {
        localStorage.setItem('valor_centro_trabajo', elementosGlobales.centroTrabajoInput.value);
    }
    if (elementosGlobales.tipoUsoInput) {
        localStorage.setItem('valor_tipo_uso', elementosGlobales.tipoUsoInput.value);
    }
    if (elementosGlobales.usuarioInput) {
        localStorage.setItem('valor_usuario', elementosGlobales.usuarioInput.value);
    }
    if (elementosGlobales.numeroSerieInput) {
        localStorage.setItem('valor_numero_serie', elementosGlobales.numeroSerieInput.value);
    }
    if (elementosGlobales.tipoEquipoInput) {
        localStorage.setItem('valor_tipo_equipo', elementosGlobales.tipoEquipoInput.value);
    }
    if (elementosGlobales.ServicioInput) {
        localStorage.setItem('valor_servicio', elementosGlobales.ServicioInput.value);
    }
    if (elementosGlobales.realizoServicioInput) {
        localStorage.setItem('valor_realizo_servicio', elementosGlobales.realizoServicioInput.value);
    }
    if (elementosGlobales.responsableInput) {
        localStorage.setItem('valor_responsable', elementosGlobales.responsableInput.value);
    }
    if (elementosGlobales.vistoBuenoInput) {
        localStorage.setItem('valor_visto_bueno', elementosGlobales.vistoBuenoInput.value);
    }

}

// Función para imprimir el formato cargando formato.html y pasando el valor de división
function imprimirFormatoPDF() {
    guardarLocalStorage();
    fetch('/RESOURCE/formato.html')
        .then(function(response) { return response.text(); })
        .then(function(html) {
            var printWindow = window.open('', '_blank');
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.onload = function() {
                printWindow.focus();
                printWindow.print();
            };
        })
        .catch(function(error) {
            alert('No funcia el imprimir: ' + error);
        });
}

// Hacer las funciones accesibles globalmente por estar en multiples html
window.guardarLocalStorage = guardarLocalStorage;
window.imprimirFormatoPDF = imprimirFormatoPDF;

// funcionamiento del boton, evento listen click
document.addEventListener('DOMContentLoaded', function() {
    inicializarElementosGlobales();
    if (elementosGlobales.btnImprimir) {
        elementosGlobales.btnImprimir.addEventListener('click', function() {
            if (typeof window.imprimirFormatoPDF === 'function') {
                window.imprimirFormatoPDF();
            }
        });
    }
    var valorDivision = localStorage.getItem('valor_division');
    var valorMarca = localStorage.getItem('valor_marca');
    var valorModelo = localStorage.getItem('valor_modelo');
    var valorFecha = localStorage.getItem('valor_fecha') || obtenerFecha();
    var valorCentroTrabajo = localStorage.getItem('valor_centro_trabajo');
    var valorTipoUso = localStorage.getItem('valor_tipo_uso');
    var valorUsuario = localStorage.getItem('valor_usuario');
    var valorNumeroSerie = localStorage.getItem('valor_numero_serie');
    var valorTipoEquipo = localStorage.getItem('valor_tipo_equipo');
    var valorServicio = localStorage.getItem('valor_servicio');
    var valorRealizoServicio = localStorage.getItem('valor_realizo_servicio');
    var valorResponsable = localStorage.getItem('valor_responsable');
    var valorVistoBueno = localStorage.getItem('valor_visto_bueno');

    // Si hay valores en localStorage
    if (valorMarca) {
        if (elementosGlobales.marcaElemento) {
            elementosGlobales.marcaElemento.innerHTML = valorMarca;
        }
    }
    if (valorDivision) {
        if (elementosGlobales.divisionElemento) {
            elementosGlobales.divisionElemento.innerHTML = valorDivision;
        }
    }
    if (valorModelo) {
        if (elementosGlobales.modeloElemento) {
            elementosGlobales.modeloElemento.innerHTML = valorModelo;
        }
    }
    if (elementosGlobales.fechaElemento) {
        elementosGlobales.fechaElemento.innerHTML = obtenerFecha();
    }
    if (valorCentroTrabajo) {
        if (elementosGlobales.centroTrabajoElemento) {
            elementosGlobales.centroTrabajoElemento.innerHTML = valorCentroTrabajo;
        }
    }
    if (valorTipoUso) {
        if (elementosGlobales.tipoUsoElemento) {
            elementosGlobales.tipoUsoElemento.innerHTML = valorTipoUso;
        }
    }
    if (valorUsuario) {
        if (elementosGlobales.usuarioElemento) {
            elementosGlobales.usuarioElemento.innerHTML = valorUsuario;
        }
    }
    if (valorNumeroSerie) {
        if (elementosGlobales.numeroSerieElemento) {
            elementosGlobales.numeroSerieElemento.innerHTML = valorNumeroSerie;
        }
    }
    if (valorTipoEquipo) {
        if (elementosGlobales.tipoEquipoElemento) {
            elementosGlobales.tipoEquipoElemento.innerHTML = valorTipoEquipo;
        }
    }
    if (valorServicio) {
        if (elementosGlobales.ServicioElemento) {
            elementosGlobales.ServicioElemento.innerHTML = valorServicio;
        }
    }
    if (valorRealizoServicio) {
        if (elementosGlobales.realizoServicioElemento) {
            elementosGlobales.realizoServicioElemento.innerHTML = valorRealizoServicio;
        }
    }
    if (valorResponsable) {
        if (elementosGlobales.responsableElemento) {
            elementosGlobales.responsableElemento.innerHTML = valorResponsable;
        }
    }
    if (valorVistoBueno) {
        if (elementosGlobales.vistoBuenoElemento) {
            elementosGlobales.vistoBuenoElemento.innerHTML = valorVistoBueno;
        }
    }
});

// Monitorear los radios y el input de limpieza externa cada 2 segundos y guardar en localStorage
setInterval(function() {
    var rdSiLimpiezaExternaEquipo = document.querySelector('input[name="limpieza_externa"][value="si"]');
    var rdNoLimpiezaExternaEquipo = document.querySelector('input[name="limpieza_externa"][value="no"]');
    var inputTexto = document.getElementById('input_limpieza_externa');

    var rbSiLimpiezaPantalla = document.querySelector('input[name="pantalla"][value="si"]');
    var rbNoLimpiezaPantalla = document.querySelector('input[name="pantalla"][value="no"]');
    var inputTextoPantalla = document.getElementById('input_pantalla');

    var rbSiteclado = document.querySelector('input[name="teclado"][value="si"]');
    var rbNoTeclado = document.querySelector('input[name="teclado"][value="no"]');
    var inputTextoTeclado = document.getElementById('input_teclado'); 

    var rbSiConeciones= document.querySelector('input[name="conexiones"][value="si"]');
    var rbNoConeciones = document.querySelector('input[name="conexiones"][value="no"]');
    var inputTextoConexiones = document.getElementById('input_conexiones');

    var rbSiDespuesServicio = document.querySelector('input[name="despues_servicio"][value="si"]');
    var rbNoDespuesServicio = document.querySelector('input[name="despues_servicio"][value="no"]');
    var inputTextoDespuesServicio = document.getElementById('input_despues_servicio');

    var rbSiAntivirus = document.querySelector('input[name="antivirus"][value="si"]');
    var rbNoAntivirus = document.querySelector('input[name="antivirus"][value="no"]');
    var inputTextoAntivirus = document.getElementById('input_antivirus');

    var rbSiEjecucionDefrag= document.querySelector('input[name="defrag"][value="si"]');
    var rbNoEjecucionDefrag = document.querySelector('input[name="defrag"][value="no"]');
    var inputTextoDefrag = document.getElementById('input_defrag');

    var rbSiDentroDominio= document.querySelector('input[name="dominio"][value="si"]');
    var rbNoDentroDominio = document.querySelector('input[name="dominio"][value="no"]');
    var inputTextoDominio = document.getElementById('input_dominio');

    var rbSiWindowsActualizado = document.querySelector('input[name="Windows_update"][value="si"]');
    var rbNoWindowsActualizado = document.querySelector('input[name="Windows_update"][value="no"]');
    var inputTextoWindows = document.getElementById('input_Windows_update');




    if ( rdSiLimpiezaExternaEquipo.checked) {
        localStorage.setItem('limpieza-externa-equipo--si', '✔');
        localStorage.setItem('limpieza-externa-equipo--no', '');
    }
    if (rdNoLimpiezaExternaEquipo.checked) {
        localStorage.setItem('limpieza-externa-equipo--si', '');
        localStorage.setItem('limpieza-externa-equipo--no', '✘');
    }

    // Guardar el texto del input si está visible
    if (inputTexto.style.display !== 'none') {
        localStorage.setItem('limpieza-externa-equipo--texto', inputTexto.value);
    }

    if (rbSiLimpiezaPantalla.checked) {
        localStorage.setItem('limpieza-externa-pantalla--si', '✔');
        localStorage.setItem('limpieza-externa-pantalla--no', '');
    }
    if (rbNoLimpiezaPantalla.checked) {
        localStorage.setItem('limpieza-externa-pantalla--si', '');
        localStorage.setItem('limpieza-externa-pantalla--no', '✘');
    }
    if (inputTextoPantalla.style.display !== 'none') {
        localStorage.setItem('limpieza-externa-pantalla--texto', inputTextoPantalla.value);
    }
    if (rbSiteclado.checked) {
        localStorage.setItem('limpieza-teclado--si', '✔');
        localStorage.setItem('limpieza-teclado--no', '');
    }
    if (rbNoTeclado.checked) {
        localStorage.setItem('limpieza-teclado--si', '');
        localStorage.setItem('limpieza-teclado--no', '✘');
    }
    if (inputTextoTeclado.style.display !== 'none') {
        localStorage.setItem('limpieza-teclado--texto', inputTextoTeclado.value);
    }
    if (rbSiConeciones.checked) {
        localStorage.setItem('verificar-conexiones--si', '✔');
        localStorage.setItem('verificar-conexiones--no', '');
    }
    if (rbNoConeciones.checked) {
        localStorage.setItem('verificar-conexiones--si', '');
        localStorage.setItem('verificar-conexiones--si', '✘');
    }
    if (inputTextoConexiones.style.display !== 'none') {
        localStorage.setItem('verificar-conexiones--texto', inputTextoConexiones.value);
    }
    if (rbSiDespuesServicio.checked) {
        localStorage.setItem('funciona-despues--si', '✔');
        localStorage.setItem('funciona-despues--no', '');
    }
    if (rbNoDespuesServicio.checked) {
        localStorage.setItem('funciona-despues--si', '');
        localStorage.setItem('funciona-despues--no', '✘');
    }
    if (inputTextoDespuesServicio.style.display !== 'none') {
        localStorage.setItem('funciona-despues--texto', inputTextoDespuesServicio.value);
    }
    if (rbSiAntivirus.checked) {
        localStorage.setItem('antivirus-funciona-si', '✔');
        localStorage.setItem('antivirus-funciona-no', '');
    }
    if (rbNoAntivirus.checked) {
        localStorage.setItem('antivirus-funciona-si', '');
        localStorage.setItem('antivirus-funciona-no', '✘');
    }
    if (inputTextoAntivirus.style.display !== 'none') {
        localStorage.setItem('antivirus-funciona-texto', inputTextoAntivirus.value);
    }
    if (rbSiEjecucionDefrag.checked) {
        localStorage.setItem('ejecucion-defrag--si', '✔');
        localStorage.setItem('ejecucion-defrag--no', '');
    }
    if (rbNoEjecucionDefrag.checked) {
        localStorage.setItem('ejecucion-defrag--si', '');
        localStorage.setItem('ejecucion-defrag--no', '✘');
    }
    if (inputTextoDefrag.style.display !== 'none') {
        localStorage.setItem('ejecucion-defrag--texto', inputTextoDefrag.value);
    }
    if (rbSiDentroDominio.checked) {
        localStorage.setItem('dentro-dominio--si', '✔');
        localStorage.setItem('dentro-dominio--no', '');
    }
    if (rbNoDentroDominio.checked) {
        localStorage.setItem('dentro-dominio--si', '');
        localStorage.setItem('dentro-dominio--no', '✘');
    }
    if (inputTextoDominio.style.display !== 'none') {
        localStorage.setItem('dentro-dominio--texto', inputTextoDominio.value);
    }
    if (rbSiWindowsActualizado.checked) {
        localStorage.setItem('windows-actualizado--si', '✔');
        localStorage.setItem('windows-actualizado--no', '');
    }
    if (rbNoWindowsActualizado.checked) {
        localStorage.setItem('windows-actualizado--si', '');
        localStorage.setItem('windows-actualizado--no', '✘');
    }
    if (inputTextoWindows.style.display !== 'none') {
        localStorage.setItem('windows-actualizado--texto', inputTextoWindows.value);
    }

}, 2000); // 2 segundos

// Al cargar formato.html, insertar los valores en los ids correspondientes
if (document.getElementById('limpieza-externa-equipo--si') || document.getElementById('limpieza-externa-equipo--no') || document.getElementById('limpieza-externa-equipo--texto') ||
    document.getElementById('limpieza-externa-pantalla--si') || document.getElementById('limpieza-externa-pantalla--no') || document.getElementById('limpieza-externa-pantalla--texto') ||
    document.getElementById('limpieza-teclado--si') || document.getElementById('limpieza-teclado--no') || document.getElementById('limpieza-teclado--texto') ||
    document.getElementById('verificar-conexiones--si') || document.getElementById('verificar-conexiones--no') || document.getElementById('verificar-conexiones--texto') ||
    document.getElementById('funciona-despues--si') || document.getElementById('funciona-despues--no') || document.getElementById('funciona-despues--texto') ||
    document.getElementById('antivirus-funciona-si') || document.getElementById('antivirus-funciona-no') || document.getElementById('antivirus-funciona-texto') ||
    document.getElementById('ejecucion-defrag--si') || document.getElementById('ejecucion-defrag--no') || document.getElementById('ejecucion-defrag--texto') ||
    document.getElementById('dentro-dominio--si') || document.getElementById('dentro-dominio--no') || document.getElementById('dentro-dominio--texto') ||
    document.getElementById('windows-actualizado--si') || document.getElementById('windows-actualizado--no') || document.getElementById('windows-actualizado--texto')) {
    document.addEventListener('DOMContentLoaded', function() {
        var siLimpiezaExterna = localStorage.getItem('limpieza-externa-equipo--si') || '';
        var noLimpiezaExterna = localStorage.getItem('limpieza-externa-equipo--no') || '';
        var textoLimpiezaExterna = localStorage.getItem('limpieza-externa-equipo--texto') || '';
        var siLimpiezaPantalla = localStorage.getItem('limpieza-externa-pantalla--si') || '';
        var noLimpiezaPantalla = localStorage.getItem('limpieza-externa-pantalla--no') || '';
        var textoLimpiezaPantalla = localStorage.getItem('limpieza-externa-pantalla--texto') || '';
        var siLimpiezaTeclado = localStorage.getItem('limpieza-teclado--si') || '';
        var noLimpiezaTeclado = localStorage.getItem('limpieza-teclado--no') || '';
        var textoLimpiezaTeclado = localStorage.getItem('limpieza-teclado--texto') || '';

        var siVerificarConexiones = localStorage.getItem('verificar-conexiones--si') || '';
        var noVerificarConexiones = localStorage.getItem('verificar-conexiones--no') || '';
        var textoVerificarConexiones = localStorage.getItem('verificar-conexiones--texto') || '';

        var siDespuesServicio = localStorage.getItem('funciona-despues--si') || '';
        var noDespuesServicio = localStorage.getItem('funciona-despues--no') || '';
        var textoDespuesServicio = localStorage.getItem('funciona-despues--texto') || '';

        var siAntivirus = localStorage.getItem('antivirus-funciona-si') || '';
        var noAntivirus = localStorage.getItem('antivirus-funciona-no') || '';
        var textoAntivirus = localStorage.getItem('antivirus-funciona-texto') || '';

        var siEjecucionDefrag = localStorage.getItem('ejecucion-defrag--si') || '';
        var noEjecucionDefrag = localStorage.getItem('ejecucion-defrag--no') || '';
        var textoDefrag = localStorage.getItem('ejecucion-defrag--texto') || '';

        var siDentroDominio = localStorage.getItem('dentro-dominio--si') || '';
        var noDentroDominio = localStorage.getItem('dentro-dominio--no') || '';
        var textoDominio = localStorage.getItem('dentro-dominio--texto') || '';

        var siWindowsActualizado = localStorage.getItem('windows-actualizado--si') || '';
        var noWindowsActualizado = localStorage.getItem('windows-actualizado--no') || '';
        var textoWindows = localStorage.getItem('windows-actualizado--texto') || '';

        if (document.getElementById('limpieza-externa-equipo--si')) {
            document.getElementById('limpieza-externa-equipo--si').textContent = siLimpiezaExterna;
        }
        if (document.getElementById('limpieza-externa-equipo--no')) {
            document.getElementById('limpieza-externa-equipo--no').textContent = noLimpiezaExterna;
        }
        if (document.getElementById('limpieza-externa-equipo--texto')) {
            document.getElementById('limpieza-externa-equipo--texto').textContent = textoLimpiezaExterna;
        }
        if (document.getElementById('limpieza-externa-pantalla--si')) {
            document.getElementById('limpieza-externa-pantalla--si').textContent = siLimpiezaPantalla;
        }
        if (document.getElementById('limpieza-externa-pantalla--no')) {
            document.getElementById('limpieza-externa-pantalla--no').textContent = noLimpiezaPantalla;
        }
        if (document.getElementById('limpieza-externa-pantalla--texto')) {
            document.getElementById('limpieza-externa-pantalla--texto').textContent = textoLimpiezaPantalla;
        }
        if (document.getElementById('limpieza-teclado--si')) {
            document.getElementById('limpieza-teclado--si').textContent = siLimpiezaTeclado;
        }
        if (document.getElementById('limpieza-teclado--no')) {
            document.getElementById('limpieza-teclado--no').textContent = noLimpiezaTeclado;
        }
        if (document.getElementById('limpieza-teclado--texto')) {
            document.getElementById('limpieza-teclado--texto').textContent = textoLimpiezaTeclado;
        }
        if (document.getElementById('verificar-conexiones--si')) {
            document.getElementById('verificar-conexiones--si').textContent = siVerificarConexiones;
        }
        if (document.getElementById('verificar-conexiones--no')) {
            document.getElementById('verificar-conexiones--no').textContent = noVerificarConexiones;
        }
        if (document.getElementById('verificar-conexiones--texto')) {
            document.getElementById('verificar-conexiones--texto').textContent = textoVerificarConexiones;
        }
        if (document.getElementById('funciona-despues--si')) {
            document.getElementById('funciona-despues--si').textContent = siDespuesServicio;
        }
        if (document.getElementById('funciona-despues--no')) {
            document.getElementById('funciona-despues--no').textContent = noDespuesServicio;
        }
        if (document.getElementById('funciona-despues--texto')) {
            document.getElementById('funciona-despues--texto').textContent = textoDespuesServicio;
        }
        if (document.getElementById('antivirus-funciona-si')) {
            document.getElementById('antivirus-funciona-si').textContent = siAntivirus;
        }
        if (document.getElementById('antivirus-funciona-no')) {
            document.getElementById('antivirus-funciona-no').textContent = noAntivirus;
        }
        if (document.getElementById('antivirus-funciona-texto')) {
            document.getElementById('antivirus-funciona-texto').textContent = textoAntivirus;
        }
        if (document.getElementById('ejecucion-defrag--si')) {
            document.getElementById('ejecucion-defrag--si').textContent = siEjecucionDefrag;
        }
        if (document.getElementById('ejecucion-defrag--no')) {
            document.getElementById('ejecucion-defrag--no').textContent = noEjecucionDefrag;
        }
        if (document.getElementById('ejecucion-defrag--texto')) {
            document.getElementById('ejecucion-defrag--texto').textContent = textoDefrag;
        }

        if (document.getElementById('dentro-dominio--si')) {
            document.getElementById('dentro-dominio--si').textContent = siDentroDominio;
        }
        if (document.getElementById('dentro-dominio--no')) {
            document.getElementById('dentro-dominio--no').textContent = noDentroDominio;
        }
        if (document.getElementById('dentro-dominio--texto')) {
            document.getElementById('dentro-dominio--texto').textContent = textoDominio;
        }
        if (document.getElementById('windows-actualizado--si')) {
            document.getElementById('windows-actualizado--si').textContent = siWindowsActualizado;
        }
        if (document.getElementById('windows-actualizado--no')) {
            document.getElementById('windows-actualizado--no').textContent = noWindowsActualizado;
        }
        if (document.getElementById('windows-actualizado--texto')) {
            document.getElementById('windows-actualizado--texto').textContent = textoWindows;
        }



    });
}
