// Lógica para la fecha y el reloj
//FECHA ACTUAL
const fecha = new Date();
const fechaActual = document.getElementById("fecha_p");
const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const diaActual = dias[fecha.getDay()];
const mesActual = meses[fecha.getMonth()];

fechaActual.textContent = diaActual + ", " + fecha.getDate() + " de " + mesActual + " de " + fecha.getFullYear();

//RELOJ DIGITAL
function myFunc() {
    var now = new Date();
    var hora;
    if (now.getHours() < 10){
        hora= "0" + now.getHours();
    } else {
        hora = now.getHours();

    }
    var minutos;
    if (now.getMinutes() < 10){
        minutos = "0" + now.getMinutes();
    } else {
        minutos = now.getMinutes();
    }
    var segundos;
    if (now.getSeconds() < 10){
        segundos = "0" + now.getSeconds();
    } else {
        segundos = now.getSeconds()
    }

    var time = hora + ":" + minutos + ":" + segundos;
    var aviso = " Estas fuera de horario establecido";

    var relojElem = document.getElementById('reloj');
    var avisoElem = document.getElementById('aviso');


    relojElem.innerHTML = time;

    // La única condición es que la hora sea eaxctamente 8, los minutos deben ser 20 o menos 
    if (now.getHours() === 8 && now.getMinutes() <= 20) {
        relojElem.style.color = "green";
        relojElem.style.fontWeight = "bold";
        avisoElem.innerHTML = ""; // se oculta el aviso
    } else {
        //antes de las 8, o después de las 8:20
        relojElem.style.color = "red";
        relojElem.style.fontWeight = "bold";
        avisoElem.style.color = "red";
        avisoElem.innerHTML = aviso;
    }
}
setInterval(myFunc, 1000);