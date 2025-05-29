// Lógica para la fecha y el reloj
// ------------------------------
// Este archivo contiene la lógica para mostrar la fecha actual y el reloj en tiempo real.

const fecha = new Date();
const fechaActual = document.getElementById("fecha_p");
const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const diaActual = dias[fecha.getDay()];
const mesActual = meses[fecha.getMonth()];

fechaActual.textContent = diaActual + ", " + fecha.getDate() + " de " + mesActual + " de " + fecha.getFullYear();

function myFunc() {
    var now = new Date();
    var time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    var aviso =  " Se enviara con retraso";
    document.getElementById('reloj').innerHTML = time;
    if (now.getHours() >=8 && now.getMinutes() >= 20) {
        document.getElementById('reloj').style.color = "red";
        document.getElementById('reloj').style.fontWeight = "bold";
        document.getElementById('aviso').style.color = "red";
        document.getElementById('aviso').innerHTML = aviso;
    } else {
        document.getElementById('reloj').style.color = "green";
        document.getElementById('reloj').style.fontWeight = "bold";
    }
}
setInterval(myFunc, 1000);
