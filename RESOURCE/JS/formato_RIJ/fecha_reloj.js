// Lógica para la fecha y el reloj
const fecha = new Date();
const fechaActual = document.getElementById("fecha_p");
const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const diaActual = dias[fecha.getDay()];
const mesActual = meses[fecha.getMonth()];

fechaActual.textContent = diaActual + ", " + fecha.getDate() + " de " + mesActual + " de " + fecha.getFullYear();

function myFunc() {
    var now = new Date();
    var hora;
    if (now.getHours < 10){
        hora= "0" + now.getHours();
    } else {
        hora = now.getHours();

    }
    var minutos;
    if ( now.getMinutes() < 10){
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
