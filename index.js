const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

var privateRooms = [];

app.use(cors());
app.use(express.static(path.join(__dirname, 'client', 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

io.on('connection', socket => {
    socket.on('create-private-room', data => {
        var uuid = uuidv4();
        const obj = {
            id: uuid,
            slewName: data.slewName,
            password: data.pass
        }
        privateRooms.push(obj);
    });

    socket.on('passcode', (pass) => {
        for(var i=0; i < privateRooms.length; i++) {
            if (privateRooms[i].slewName == socket.roomName) {
                if (privateRooms[i].password == pass) {
                    var connectedClients = [];
                    socket.join(socket.roomName);
                    var clients = io.sockets.sockets;
                    clients.forEach(element => {
                        if (element.roomName == socket.roomName) {
                            connectedClients.push({
                                user: element.user,
                                peerId: element.peerId
                            });
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
                    break;
                }
            }
        }
    });

    socket.on('join-room', (data) => {
        var private = false;
        var connectedClients = [];
        var colors = ['red', 'green', 'violet', 'pink', 'orange', 'yellow']
        var color = colors[Math.floor(Math.random() * colors.length)];
        console.log('hi');
        var peerId = uuidv4();
        socket.peerId = peerId;
        socket.roomName = data.roomName;
        socket.user = data.user;
        socket.color = color;
        var test = {
            peerId: socket.peerId,
            room: socket.roomName,
            username: socket.user,
            color: socket.color
        }
        console.log(test);
        for(var i=0; i < privateRooms.length; i++) {
            if (privateRooms[i].slewName == socket.roomName) {
                private = true;
                break;
            }
        }
        if (private == true) {
            socket.emit('pass-required', 'Enter Password')
        } else {
            socket.join(socket.roomName);
            var clients = io.sockets.sockets;
            clients.forEach(element => {
                if (element.roomName == socket.roomName) {
                    connectedClients.push({
                        user: element.user,
                        peerId: element.peerId
                    });
                }
            });
    
            socket.emit('welcome-self-message', {
                user: socket.user,
                roomName: socket.roomName,
                color: socket.color,
                peerId: socket.peerId
            });
    
            io.in(socket.roomName).emit('connected-clients', connectedClients);
            socket.broadcast.to(socket.roomName).emit('welcome-message', {
                user: socket.user,
                roomName: socket.roomName
            });
            console.log(socket.user + ' joined room: ' + socket.roomName + ' with color: ' + socket.color);
        }
        
    });

    socket.on('message-to-server', (msg) => {
        socket.broadcast.to(socket.roomName).emit('message-from-server', msg);
    });




    socket.on('disconnect', () => {
        var connectedClients = [];
        var clients = io.sockets.sockets;
        clients.forEach(element => {
            if (element.roomName == socket.roomName) {
                connectedClients.push({
                    user: element.user,
                    peerId: element.peerId
                });
            }
        });
        io.in(socket.roomName).emit('connected-clients', connectedClients);
        socket.broadcast.to(socket.roomName).emit('user-exit', {
            user: socket.user
        });
        if (connectedClients.length == 0) {
            for (var i = privateRooms.length - 1; i >= 0; --i) {
                if (privateRooms[i].slewName == socket.roomName) {
                    privateRooms.splice(i,1);
                }
            }
        }
        console.log('user disconnected !');
    });
});



var port = process.env.PORT || 5000;

server.listen(port, () => {
    console.log('Server up and running!');
});