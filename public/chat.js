
const socket = io.connect('http://18.219.90.103:3000');
const mensajeSonido = new Audio('mensaje.mp3');
const mensajeSonido1 = new Audio('menrecib.mp3');


function mostrarRegistro() {
    document.getElementById('panel-bienvenida').style.display = 'none';
    document.getElementById('panel-registro').style.display = 'block';
}


function mostrarLogin() {
    document.getElementById('panel-registro').style.display = 'none';
    document.getElementById('panel-bienvenida').style.display = 'block';
}


function registrar() {
    const usuario = document.getElementById('nuevo-usuario').value;
    const contrasena = document.getElementById('nueva-contrasena').value;

    if (usuario && contrasena) {
        socket.emit('registro_usuario', { username: usuario, password: contrasena });
        mostrarLogin();
    }
}


function iniciarSesion() {
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;

    if (usuario && contrasena) {
        socket.emit('iniciar_sesion', { username: usuario, password: contrasena });
    }
}


socket.on('inicio_exitoso', (username) => {
    document.getElementById('panel-bienvenida').style.display = 'none';
    document.getElementById('app-chat').style.display = 'block';
    document.getElementById('usuario').value = username;
});


socket.on('inicio_fallido', () => {
    alert('Usuario o contraseña incorrectos');
});


function enviarMensaje() {
    const mensaje = document.getElementById('mensaje').value;
    const username = document.getElementById('usuario').value;

    if (mensaje.trim()) {
        socket.emit('enviar_mensaje', { username, message: mensaje });
        mensajeSonido.play();
        document.getElementById('mensaje').value = '';
      
        socket.emit('dejar_de_escribir', { username });
    }
}


socket.on('usuarios_actualizados', (usuarios) => {
    const listaUsuariosDiv = document.getElementById('lista-usuarios');
    listaUsuariosDiv.innerHTML = '';
    usuarios.forEach(usuario => {
        const usuarioDiv = document.createElement('div');
        usuarioDiv.textContent = usuario;
        listaUsuariosDiv.appendChild(usuarioDiv);
    });
});


socket.on('nuevo_mensaje', (data) => {
    const output = document.getElementById('output');
    const mensajeDiv = document.createElement('div');
    mensajeDiv.textContent = `${data.username}: ${data.message}`;
    output.appendChild(mensajeDiv);
    output.scrollTop = output.scrollHeight;
    mensajeSonido1.play();
});


socket.on('cargar_mensajes', (historialMensajes) => {
    const output = document.getElementById('output');
    output.innerHTML = ''; 
    historialMensajes.forEach(msg => {
        const mensajeDiv = document.createElement('div');
        mensajeDiv.textContent = `${msg.username}: ${msg.message}`;
        output.appendChild(mensajeDiv);
    });
    output.scrollTop = output.scrollHeight; 
});


socket.on('usuario_escribiendo', (username) => {
    const escribiendoDiv = document.getElementById('escribiendo-mensaje');
    escribiendoDiv.textContent = `${username} está escribiendo...`;
    
    
    setTimeout(() => {
        escribiendoDiv.textContent = '';
    }, 2000);
});


document.getElementById('mensaje').addEventListener('input', () => {
    const username = document.getElementById('usuario').value;
    socket.emit('escribiendo', { username });
});
 

document.getElementById('mensaje').addEventListener('blur', () => {
    const username = document.getElementById('usuario').value;
    socket.emit('dejar_de_escribir', { username });
});

function salir() {
    socket.emit('salir_usuario'); 
    mostrarLogin(); 
    document.getElementById('mensaje').value = '';
    document.getElementById('output').innerHTML = '';
    document.getElementById('escribiendo-mensaje').textContent = ''; 
}
