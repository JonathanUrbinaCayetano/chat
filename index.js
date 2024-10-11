const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const app = express();
const server = http.createServer(app);
const io = socketIo(server);


mongoose.connect('mongodb+srv://marycarmen:mary.1502.2001@proyecto.rxfkb.mongodb.net/')
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));


const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const messageSchema = new mongoose.Schema({
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});


const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);


app.use(express.static('public'));


const connectedUsers = {};


io.on('connection', async (socket) => {
    console.log('Nuevo usuario conectado:', socket.id);


    const historialMensajes = await Message.find().sort({ timestamp: 1 });
    socket.emit('cargar_mensajes', historialMensajes);

    
    socket.on('registro_usuario', async (data) => {
        const { username, password } = data;
        const hashedPassword = await bcrypt.hash(password, 10);
        const nuevoUsuario = new User({ username, password: hashedPassword });
        await nuevoUsuario.save();
        console.log('Usuario registrado:', username);
    });

 
    socket.on('iniciar_sesion', async (data) => {
        const { username, password } = data;
        const usuario = await User.findOne({ username });

        if (usuario && await bcrypt.compare(password, usuario.password)) {
            connectedUsers[socket.id] = username;
            socket.emit('inicio_exitoso', username);
            io.emit('usuarios_actualizados', Object.values(connectedUsers));


            const mensajesActualizados = await Message.find().sort({ timestamp: 1 });
            socket.emit('cargar_mensajes', mensajesActualizados);
        } else {
            socket.emit('inicio_fallido');
        }
    });

    socket.on('enviar_mensaje', async (data) => {
        const newMessage = new Message({ username: data.username, message: data.message });
        await newMessage.save();
        io.emit('nuevo_mensaje', data);
    });


    socket.on('escribiendo', (data) => {
        socket.broadcast.emit('usuario_escribiendo', data.username);
    });

    
    socket.on('dejar_de_escribir', (data) => {
        socket.broadcast.emit('usuario_dejo_de_escribir', data.username);
    });

    
    socket.on('salir_usuario', () => {
        delete connectedUsers[socket.id];
        io.emit('usuarios_actualizados', Object.values(connectedUsers));
    });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.id];
        io.emit('usuarios_actualizados', Object.values(connectedUsers));
    });
});


server.listen(3000, '192.168.100.24', () => {
    console.log('Servidor corriendo en http://192.168.100.24:3000');
});
