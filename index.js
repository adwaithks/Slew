const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(server);
//const morgan = require('morgan');
const cors = require('cors');

var rooms = [];

//app.use(morgan('dev'));
app.use(cors());

app.use(express.static(path.join(__dirname, 'client', 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build'))
})

io.on('connection', socket => {
    socket.on('join-room', (data) => {
        var connectedClients = [];
        var colors = ['red', 'green', 'violet', 'pink', 'orange', 'yellow']
        var color = colors[Math.floor(Math.random() * colors.length)];

        socket.roomName = data.roomName;
        socket.user = data.user;
        socket.color = color;
        socket.join(socket.roomName);
        var clients = io.sockets.sockets;
        clients.forEach(element => {
            if (element.roomName == socket.roomName) {
                connectedClients.push(element.user)
            }
        });

        socket.emit('welcome-self-message', {
            user: socket.user,
            roomName: socket.roomName,
            color: socket.color
        });

        io.in(socket.roomName).emit('connected-clients', connectedClients);
        socket.broadcast.to(socket.roomName).emit('welcome-message', {
            user: socket.user,
            roomName: socket.roomName
        });
        console.log(socket.user + ' joined room: ' + socket.roomName + ' with color: ' + socket.color);
    });

    socket.on('message-to-server', (msg) => {
        console.log(msg);
        socket.broadcast.to(socket.roomName).emit('message-from-server', msg);
    });


    socket.on('disconnect', () => {
        var connectedClients = [];
        var clients = io.sockets.sockets;
        clients.forEach(element => {
            if (element.roomName == socket.roomName) {
                connectedClients.push(element.user)
            }
        });
        io.in(socket.roomName).emit('connected-clients', connectedClients);
        socket.broadcast.to(socket.roomName).emit('user-exit', {
            user: socket.user
        });
        console.log('user disconnected !');
    });
});

server.listen(5000, () => {
    console.log('Server up and running!');
});