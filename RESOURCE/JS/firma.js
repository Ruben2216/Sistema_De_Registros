// Lógica para la firma digital

var modalFirma = document.getElementById('modal-firma');
var canvasFirma = document.getElementById('canvas-firma');
var ctxFirma = canvasFirma.getContext('2d');
var btnLimpiarFirma = document.getElementById('btn-limpiar-firma');
var btnGuardarFirma = document.getElementById('btn-guardar-firma');
var btnCerrarFirma = document.getElementById('btn-cerrar-firma');
var firmaActual = null;
var dibujando = false;
var ultimaPos = {x:0, y:0};

function mostrarModalFirma(numeroArea) {
    firmaActual = numeroArea;
    modalFirma.classList.add('firma-modal--visible');
    ajustarTamanioCanvas();
    limpiarCanvasFirma();
}

function ocultarModalFirma() {
    modalFirma.classList.remove('firma-modal--visible');
}

function ajustarTamanioCanvas() {
    var rect = canvasFirma.getBoundingClientRect();
    canvasFirma.width = rect.width;
    canvasFirma.height = rect.height;
    ctxFirma.clearRect(0, 0, canvasFirma.width, canvasFirma.height);
}

function limpiarCanvasFirma() {
    ctxFirma.clearRect(0, 0, canvasFirma.width, canvasFirma.height);
}

function guardarFirma() {
    var dataURL = canvasFirma.toDataURL('image/png');
    if (firmaActual === 1) {
        document.getElementById('firma-input-1').value = dataURL;
        var img1 = document.getElementById('firma-imagen-1');
        img1.src = dataURL;
        img1.style.display = 'block';
        document.getElementById('firma-area-1').style.display = 'none';
    } else if (firmaActual === 2) {
        document.getElementById('firma-input-2').value = dataURL;
        var img2 = document.getElementById('firma-imagen-2');
        img2.src = dataURL;
        img2.style.display = 'block';
        document.getElementById('firma-area-2').style.display = 'none';
    }
    ocultarModalFirma();
}

function obtenerPosicion(e) {
    var rect = canvasFirma.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvasFirma.width / rect.width),
        y: (e.clientY - rect.top) * (canvasFirma.height / rect.height)
    };
}

function obtenerPosicionTouch(e) {
    var rect = canvasFirma.getBoundingClientRect();
    var touch = e.touches[0];
    return {
        x: (touch.clientX - rect.left) * (canvasFirma.width / rect.width),
        y: (touch.clientY - rect.top) * (canvasFirma.height / rect.height)
    };
}

canvasFirma.addEventListener('mousedown', function(e) {
    dibujando = true;
    ultimaPos = obtenerPosicion(e);
});
canvasFirma.addEventListener('mousemove', function(e) {
    if (dibujando) {
        var pos = obtenerPosicion(e);
        ctxFirma.beginPath();
        ctxFirma.moveTo(ultimaPos.x, ultimaPos.y);
        ctxFirma.lineTo(pos.x, pos.y);
        ctxFirma.strokeStyle = '#222';
        ctxFirma.lineWidth = 2;
        ctxFirma.lineCap = 'round';
        ctxFirma.stroke();
        ultimaPos = pos;
    }
});
canvasFirma.addEventListener('mouseup', function(e) {
    dibujando = false;
});
canvasFirma.addEventListener('mouseleave', function(e) {
    dibujando = false;
});
canvasFirma.addEventListener('touchstart', function(e) {
    dibujando = true;
    ultimaPos = obtenerPosicionTouch(e);
});
canvasFirma.addEventListener('touchmove', function(e) {
    if (dibujando) {
        var pos = obtenerPosicionTouch(e);
        ctxFirma.beginPath();
        ctxFirma.moveTo(ultimaPos.x, ultimaPos.y);
        ctxFirma.lineTo(pos.x, pos.y);
        ctxFirma.strokeStyle = '#222';
        ctxFirma.lineWidth = 2; 
        ctxFirma.lineCap = 'round';
        ctxFirma.stroke();
        ultimaPos = pos;
    }
    e.preventDefault();
}, {passive:false});
canvasFirma.addEventListener('touchend', function(e) {
    dibujando = false;
});

btnLimpiarFirma.addEventListener('click', function() {
    limpiarCanvasFirma();
});
btnGuardarFirma.addEventListener('click', function() {
    guardarFirma();
});
btnCerrarFirma.addEventListener('click', function() {
    ocultarModalFirma();
});

var areaFirma1 = document.getElementById('firma-area-1');
var areaFirma2 = document.getElementById('firma-area-2');
areaFirma1.addEventListener('click', function() {
    mostrarModalFirma(1);
});
areaFirma2.addEventListener('click', function() {
    mostrarModalFirma(2);
});

var imgFirma1 = document.getElementById('firma-imagen-1');
var imgFirma2 = document.getElementById('firma-imagen-2');
imgFirma1.addEventListener('click', function() {
    document.getElementById('firma-area-1').style.display = 'flex';
    imgFirma1.style.display = 'none';
    mostrarModalFirma(1);
});
imgFirma2.addEventListener('click', function() {
    document.getElementById('firma-area-2').style.display = 'flex';
    imgFirma2.style.display = 'none';
    mostrarModalFirma(2);
});
