const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
//const morgan = require('morgan');
const {OAuth2Client} = require('google-auth-library');
const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/userModel');

var privateRooms = [];

app.use(cors());
//app.use(morgan('dev'));

mongoose.connect(
    "mongodb+srv://ruby:ruby@cluster0.pfsz5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
);

app.use(express.static(path.join(__dirname, 'client', 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

app.get('/auth', async (req, res) => {
    const tokenId = req.query.tokenId;
    const GOOGLE_CLIENT_ID = "72427653180-11kkrqe0k389kvkr598gcu27fo4b70vg.apps.googleusercontent.com";
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: GOOGLE_CLIENT_ID,

      });
    const payload = ticket.payload;

    const isUser = await User.findOne({
        email: payload.email,
    });
    if (!isUser) {
        const user = new User({
            name: payload.name,
            email: payload.email,
            imageUrl: payload.picture
        });
        await user.save().then().catch();
    }

    const jwtToken = jwt.sign({
        name: payload.name,
        email: payload.email,
        imageUrl: payload.picture
    }, 'secretcode', {expiresIn: '2 days'});

    if (jwtToken) {   
        res.status(200).json({
            name: payload.name,
            email: payload.email,
            imageUrl: payload.picture,
            accessToken: jwtToken
        });
    } else {
        res.status(500).json('Internal Server Error');
    } 
});

app.get('/verify', async (req, res) => {
    const jwtToken = req.query.token;
    
    try {
        const decoded = jwt.verify(jwtToken, 'secretcode');
        const email = decoded.email;
        const user = await User.findOne({
            email: email
        });
        if (!user) return res.status(403).json('Forbidden');

        return res.status(200).json({
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl
        });
    } catch (error) {
        return res.status(403).json('Forbidden');
    }
    
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

    socket.on('videocall-reject', data => {
        var clients = io.sockets.sockets;
        clients.forEach(each => {
		if (data == each.peerId) {
			io.to(each.id).emit('videocall-rejected', socket.user);
		}
	});
    });

    socket.on('videocall-peer', data => {
        var clients = io.sockets.sockets;
        clients.forEach(each => {
		if (data == each.peerId) {
			io.to(each.id).emit('incoming-videocall', socket.user);
		}
	});
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
                        color: socket.color,
                        peerId: socket.peerId
                    });
            
                    io.in(socket.roomName).emit('connected-clients', connectedClients);
                    socket.broadcast.to(socket.roomName).emit('welcome-message', {
                        user: socket.user,
                        roomName: socket.roomName
                    });
                    //console.log(socket.user + ' joined room: ' + socket.roomName + ' with color: ' + socket.color);                   
                    break;
                }
            }
        }
    });

    socket.on('join-room', (data) => {
        console.log('data: ')
        console.log(data);
        var private = false;
        var connectedClients = [];
        var colors = ['red', 'green', 'violet', 'pink', 'orange', 'yellow']
        var color = colors[Math.floor(Math.random() * colors.length)];
        var peerId = uuidv4();
        socket.peerId = peerId;
        socket.roomName = data.roomName;
        socket.user = data.user;
        socket.color = color;
        socket.email = data.email;
        socket.imageUrl = data.imageUrl;
        var test = {
            peerId: socket.peerId,
            room: socket.roomName,
            username: socket.user,
            color: socket.color
        }
        //console.log(test);
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
                        peerId: element.peerId,
                        imageUrl: element.imageUrl,
                        email: element.email
                    });
                }
            });
    
            socket.emit('welcome-self-message', {
                user: socket.user,
                roomName: socket.roomName,
                color: socket.color,
                peerId: socket.peerId,
                imageUrl: socket.imageUrl,
                email: socket.email
            });
    
            io.in(socket.roomName).emit('connected-clients', connectedClients);
            socket.broadcast.to(socket.roomName).emit('welcome-message', {
                user: socket.user,
                roomName: socket.roomName,
                imageUrl: socket.imageUrl,
                email: socket.email
            });
           // console.log(socket.user + 'with email: ' + socket.email + 'joined room: ' + socket.roomName + ' with color: ' + socket.color);
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
