const express = require('express');
const app = express();
const server = require('http').createServer(app);
//const path = require('path');
const morgan = require('morgan');
const {OAuth2Client} = require('google-auth-library');
const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/userModel');
const PublicGroup = require('./models/publicGroupModel')
const PrivateGroup = require('./models/privateGroupModel');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

mongoose.connect(
    'mongodb+srv://ruby:ruby@cluster0.pfsz5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
);



/*app.use(express.static(path.join(__dirname, 'client', 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});*/

app.post('/auth', async (req, res) => {
    const tokenId = req.body.tokenId;
    const GOOGLE_CLIENT_ID = process.env.CLIENT_ID;
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
    }, 'secret', {expiresIn: '2 days'});

    res.status(200).json({
        name: payload.name,
        email: payload.email,
        imageUrl: payload.picture,
        accessToken: jwtToken
    });
});

app.post('/chats', async (req, res) => {
    const jwtTokenInc = req.headers['access-token'];
    console.log(req.body.roomName)
    const decoded = jwt.verify(jwtTokenInc, 'secret');
    console.log('decoded: ' + decoded)
        const email = decoded.email;
        const user = await User.findOne({
            email: email
        });
        if (!user) return res.status(403).json('Forbidden');

        const group = await PrivateGroup.findOne({
            groupName: req.body.roomName
        });
        console.log('grpieeee');
        console.log(group);
        
        if (!group || !group.participants.includes(email)) {
            return
        }
        res.status(200).json(group.chats);
})

app.post('/verify', async (req, res) => {
    const jwtToken = req.body.token;
    
    try {
        const decoded = jwt.verify(jwtToken, 'secret');
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
    socket.on('create-private-room', async (data) => {
        /*var uuid = uuidv4();
        const obj = {
            id: uuid,
            slewName: data.slewName,
            password: data.pass
        }*/
        const isGroup = await PrivateGroup.findOne({
            groupName: socket.roomName
        });
        if (isGroup) return;
        const group = new PrivateGroup({
            groupName: data.slewName,
            pass: data.pass,
            participants: [data.user],
            admin: data.user
        });
        console.log(group);
        await group.save().then().catch();
        const user = await User.findOne({
            email: data.user
        });
        if (user) {
            user.groups.push(group._id);
        }
        await user.save().then().catch();
        console.log('private room creation finished')
        socket.emit('private-room-creation-complete', true);
        //privateRooms.push(obj);
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

    socket.on('passcode', async (pass) => {
        
         const group = await PrivateGroup.findOne({
             groupName: socket.roomName
         });
         if (group) {
             if (group.pass === pass) {
                var connectedClients = [];
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
                        pass: true
                    });
                    console.log('connectedClients: ' + connectedClients)
                    io.in(socket.roomName).emit('connected-clients', connectedClients);
                    socket.broadcast.to(socket.roomName).emit('welcome-message', {
                        user: socket.user,
                        roomName: socket.roomName
                    });
                    const user = await User.findOne({
                        email: socket.email
                    });
                    if (!user.groups.includes(group._id)) {
                        user.groups.push(group._id);
                    }
                    await user.save().then().catch();
                    if (!group.participants.includes(socket.email)) {
                        group.participants.push(socket.email);
                    }
                    await group.save().then().catch();
             }
         }
         
         
         
        /**for(var i=0; i < privateRooms.length; i++) {
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
                    break;
                }
            }*/
        }
    );

    socket.on('create-public-room', async (data) => {
        console.log('creating public group');
        const isGroup = await PublicGroup.findOne({
            roomName: data.slewName
        });
        if (!isGroup) {
            const newPublicGroup = new PublicGroup({
                groupName: data.slewName,
                admin: data.email,
                participants: [data.email]
            });
            await newPublicGroup.save().then().catch();

            const user = await User.findOne({
                email: data.email
            });
            user.publicGroups.push(newPublicGroup._id);
            await user.save().then().catch();

            socket.emit('public-room-creation-complete', data.slewName);
        }
    })

    socket.on('join-room', async (data) => {
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
        
         const group = await PrivateGroup.findOne({
             groupName: data.roomName 
         });
         
         if (group) private = true;
         
         console.log('private: ' + private);
        /*for(var i=0; i < privateRooms.length; i++) {
            if (privateRooms[i].slewName == socket.roomName) {
                private = true;
                break;
            }
        }
        if (private == true) {
            socket.emit('pass-required', 'Enter Password');
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
            });*/

            if (private == false) {
                const group = await PublicGroup.findOne({
                    groupName: data.roomName
                });
                
                if (group && !group.participants.includes(data.email)) {
                    group.participants.push(data.email);
                    await group.save().then().catch();
                    const user = await User.findOne({
                        email: data.email
                    });
                    user.publicGroups.push(group._id);
                    await user.save().then().catch();
                }
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
               console.log('connectedClients');
               console.log(connectedClients);
       
               io.in(socket.roomName).emit('connected-clients', connectedClients);
               socket.broadcast.to(socket.roomName).emit('welcome-message', {
                   user: socket.user,
                   roomName: socket.roomName,
                   imageUrl: socket.imageUrl,
                   email: socket.email
               });
               return;
            }

            
             if (group.admin === data.email && private === true) {
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
             }else {
                socket.emit('pass-required', 'Enter Password');
             }

             
            
    
            /*socket.emit('welcome-self-message', {
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
            });*/
        
        
    });

    /** */

    socket.on('message-to-server', async (msg) => {
        console.log('message:::::');
        console.log(msg);
        const group = await PrivateGroup.findOne({
            groupName: socket.roomName
        });
        if (group) {
            group.chats.push({
                user: msg.user,
                email: socket.email,
                imageUrl: msg.imageUrl,
                time: msg.time,
                message: msg.message,
                newComer: msg.newComer ? true : false,
                exitMsg: msg.exitMsg ? true: false,
                audioMsg: msg.audioMsg ? true : false,
                chunks: msg.chunks ? msg.chunks : null,
            });
            console.log('chat ::::::')
            console.log({
                user: msg.user,
                email: socket.email,
                imageUrl: msg.imageUrl,
                time: msg.time,
                message: msg.message
            })
            await group.save().then().catch();
        }
        socket.broadcast.to(socket.roomName).emit('message-from-server', msg);
    });

    socket.on('disconnect', () => {
        var connectedClients = [];
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
        io.in(socket.roomName).emit('connected-clients', connectedClients);
        socket.broadcast.to(socket.roomName).emit('user-exit', {
            user: socket.user
        });
        /*if (connectedClients.length == 0) {
            for (var i = privateRooms.length - 1; i >= 0; --i) {
                if (privateRooms[i].slewName == socket.roomName) {
                    privateRooms.splice(i,1);
                }
            }
        }*/
        console.log('user disconnected !');
    });
});


var port = process.env.PORT || 5000;

server.listen(port, () => {
    console.log('Server up and running!');
});
