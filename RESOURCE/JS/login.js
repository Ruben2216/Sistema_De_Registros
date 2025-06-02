
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('link-registro').onclick = function(evento) {
        evento.preventDefault();
        document.getElementById('formulario-registro').classList.remove('login__formulario--oculto');
        document.getElementById('formulario-login').classList.add('login__formulario--oculto');
    };
});
