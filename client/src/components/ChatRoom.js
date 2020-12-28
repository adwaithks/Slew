import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Snackbar from '@material-ui/core/Snackbar';
import SendIcon from '@material-ui/icons/Send';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import Alert from '@material-ui/lab/Alert';
import Modal from 'react-modal';
import MicIcon from '@material-ui/icons/Mic';
import './ChatRoom.css';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';


const socket = io('http://localhost:5000', {
    transports: ['websocket']
});
var temp = '';
var audioRec = false;
var mediaRecorder = null;
var chunks = [];
var online = true;



function ChatRoom() {
    const inputRef = useRef(null);
    const [users, setUsers] = useState([]);
    const [usersExp, setUsersExp] = useState(true);
    const [audioMsg, setAudioMsg] = useState('Press to start recording audio');
    const [roomName, setRoomName] = useState('');
    const [msgOrAudio, setMsgOrAudio] = useState('audio');
    const [audioModal, setAudioModal] = useState(false);
    const [datetime, setDateTime] = useState('');
    const [color, setColor] = useState('');
    const [name, setName] = useState('');
    const [test, setTest] = useState('');
    const [allMsg, setAllMsg] = useState([]);
    const [snackMsg, setSnackMsg] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [snackOpen, setSnackOpen] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        requestNotifPerm();
        window.localStorage.removeItem('user');
        if (!window.localStorage.getItem('user')) {
            setModalIsOpen(true);
            inputRef.current.focus();
        }
        else {
            var roomName = window.location.href.split('/')[4];
            var user = window.localStorage.getItem('user');
            setRoomName(roomName);

            socket.emit('join-room', {
                user: user,
                roomName: roomName
            });

            socket.on('connected-clients', (data) => {
                setUsers(data);
            });

            socket.on('welcome-message', (data) => {
                setSnackMsg(data.user + ' has hopped in!');
                setSnackOpen(true);
                const temp = {
                    newComer: true,
                    message: data.user + ' has joined ' + data.roomName + ' 🥳🥳🥳'
                }
                setAllMsg((allMsg) => [...allMsg, temp]);
            });

            socket.on('welcome-self-message', data => {
                setColor(data.color);
            });

            socket.on('user-exit', (data) => {
                setSnackMsg(data.user + ' has left!');
                setSnackOpen(true);
                const exitmsg = {
                    exitmsg: true,
                    message: data.user + ' has left!'
                }
                setAllMsg((allMsg) => [...allMsg, exitmsg]);

            });

            socket.on('message-from-server', (msg) => {
                setAllMsg((allMsg) => [...allMsg, {
                    message: msg.message,
                    user: msg.user,
                    time: msg.time
                }]);
                displayNotification(msg);
            });

            return () => {
                socket.disconnect();
            }
        }
    }, []);

    function displayNotification(msg) {
        if (Notification.permission == 'granted' && online == false) {
            navigator.serviceWorker.getRegistration().then(function (reg) {
                var options = {
                    body: msg.message,
                    vibrate: [100, 50, 100],
                    data: {
                        dateOfArrival: msg.time,
                        primaryKey: 1,
                        roomName: roomName
                    }
                };
                reg.showNotification(msg.user, options);
            });
        }
    }

    const requestNotifPerm = () => {
        Notification.requestPermission(function (status) {
            console.log('notif perm: ' + status);
        });
    }


    const connectClient = () => {
        inputRef.current.focus();
        document.addEventListener("visibilitychange", event => {
            if (document.visibilityState == "visible") {
                console.log('online');
                online = true;
            } else {
                console.log('offline');
                online = false;
            }
        })
        var roomName = window.location.href.split('/')[4];
        setRoomName(roomName);
        var user = window.localStorage.getItem('user');

        socket.emit('join-room', {
            user: user,
            roomName: roomName
        });

        socket.on('welcome-self-message', data => {
            setColor(data.color);
        });

        socket.on('welcome-message', (data) => {
            setSnackMsg(data.user + ' has hopped in!');
            setSnackOpen(true);
            const temp = {
                newComer: true,
                message: data.user + ' has joined ' + data.roomName + ' 🥳🥳🥳'
            }
            setAllMsg((allMsg) => [...allMsg, temp]);
        });

        socket.on('user-exit', (data) => {
            setSnackMsg(data.user + ' has left!');
            setSnackOpen(true);
            const exitmsg = {
                exitmsg: true,
                message: data.user + ' has left!'
            }
            setAllMsg((allMsg) => [...allMsg, exitmsg]);

        });

        socket.on('connected-clients', (connectedClients) => {
            setUsers(connectedClients);
        });

        socket.on('message-from-server', (msg) => {
            setAllMsg((allMsg) => [...allMsg, {
                message: msg.message,
                user: msg.user,
                time: msg.time,
                color: msg.color
            }]);
            displayNotification(msg);
        })
    }



    const messageHandler = (e) => {
        setMessage(e.target.value);
        temp = e.target.value;
        if (temp.length == 0) {
            setMsgOrAudio('audio');
        } else {
            setMsgOrAudio('msg');
        }
    }

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.length !== 0) {
            var currentdate = new Date();
            var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
            setDateTime(datetime);
            var user = window.localStorage.getItem('user');
            setAllMsg((allMsg) => [...allMsg, {
                message: message,
                user: user,
                time: datetime,
            }]);
            socket.emit('message-to-server', {
                message: message,
                user: user,
                time: datetime,
                color: color
            });
            setMessage("");
            setMsgOrAudio('audio');
        }
    }

    const nameHandler = (e) => {
        e.preventDefault();
        if (name.length !== 0) {
            window.localStorage.setItem('user', name);
            connectClient();
            setModalIsOpen(false);
        }

    }

    const copyShareHandler = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setSnackMsg('Link Copied');
            setSnackOpen(true);
            console.log('copied');
        }, () => {
            console.log('could not copy');
        })
    }

    const recordAudioModelPop = () => {
        console.log('popping modal');
        setAudioModal(true);
    }

    const recordAudio = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(
                {
                    audio: true
                }).then(function (stream) {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();

                    console.log('started recording inside recordAudio()....');
                    mediaRecorder.ondataavailable = function (e) {
                        console.log('collection audio...');
                        chunks.push(e.data);
                        console.log('chunks: ' + chunks);
                    }
                }).catch(function (err) {
                    console.log('The following getUserMedia error occurred: ' + err);
                }
                );
        } else {
            console.log('getUserMedia not supported on your browser!');
        }
    }


    return (
        <div className="Chatroom">
            <Snackbar className="snackbar" open={snackOpen} onClose={() => { setSnackOpen(false) }} autoHideDuration={3000}>
                <Alert severity="success">
                    {snackMsg}
                </Alert>
            </Snackbar>
            <div className="headWindow">
                <div className="userToggle">
                    {
                        usersExp ? <ChevronLeftIcon className="chevron-icon" onClick={() => { setUsersExp(false) }} /> : <ChevronRightIcon className="chevron-icon" onClick={() => { setUsersExp(true) }} />
                    }
                </div>
                <div>
                </div>
            </div>
            <div className="main-window">
                <div className={usersExp ? "users" : "nodisplay"}>
                    {
                        users.map(each => (
                            <div className="user">
                                <h4>{each}</h4>
                                <div className="online">
                                </div>
                            </div>
                        ))
                    }
                </div>
                <div className="chat-window">
                    <div className="chats">
                        {
                            (allMsg.length == 0) ? (
                                <div className="group-intro">
                                    <h1>Welcome to {roomName} 🎉🎉🎉</h1>
                                    <h4>What's holding you back..!? Why Don't you invite more of your friends ?!!!</h4>
                                    <div className="group-intro-copylink" onClick={copyShareHandler}>
                                        <FileCopyIcon className="copy-icon" />
                                        <h4>{window.location.href}</h4>
                                    </div>
                                </div>
                            ) :
                                (allMsg.map((each, index) => (
                                    (each.newComer) ? (
                                        <div className="newComer">
                                            <h3>{each.message}</h3>
                                        </div>
                                    ) : (each.exitmsg) ? (
                                        <div className="exitmsg">
                                            <h3>{each.message}</h3>
                                        </div>
                                    ) : (each.audioMsg) ? (
                                        <div className="audio-message">
                                            <div className="senderinfo">
                                                <h4 style={{ color: each.color || color }}>{each.user}</h4>
                                                <h5>{each.time}</h5>
                                            </div>
                                            <audio src={window.URL.createObjectURL(each.blob)} controls></audio>
                                        </div>
                                    ) : (
                                                    <div key={index} className="message">
                                                        <div className="senderinfo">
                                                            <h4 style={{ color: each.color || color }}>{each.user}</h4>
                                                            <h5>{each.time}</h5>
                                                        </div>
                                                        <h5>{each.message || 'Not yet reached'}</h5>
                                                    </div>
                                                )
                                )))
                        }
                    </div>


                    <Modal
                        isOpen={audioModal}
                        className="audio-modal"
                        onRequestClose={() => {
                            setAudioModal(false);
                            try {
                                mediaRecorder.stop();
                            } catch (err) {

                            }
                        }}
                        contentLabel="Example Modal"
                    >
                        <h3>{audioMsg}</h3>
                        <div className="audio-icon-container">
                            <MicIcon className="mic-icon" onClick={() => {
                                audioRec = !audioRec;
                                if (audioRec) {
                                    console.log('recording');
                                    recordAudio();
                                } else {
                                    try {
                                        mediaRecorder.stop();
                                        console.log('rec stopped');
                                        var currentdate = new Date();
                                        var date_time = currentdate.getDate() + "/"
                                            + (currentdate.getMonth() + 1) + "/"
                                            + currentdate.getFullYear() + " "
                                            + currentdate.getHours() + ":"
                                            + currentdate.getMinutes() + ":"
                                            + currentdate.getSeconds();
                                        mediaRecorder.onstop = function (e) {
                                            const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                                            chunks = [];
                                            const audioURL = window.URL.createObjectURL(blob);
                                            setAllMsg(() => [...allMsg, {
                                                blob: blob,
                                                user: name,
                                                audioMsg: true,
                                                time: date_time
                                            }])
                                            socket.emit('message-to-server', {
                                                blob: blob,
                                                user: name,
                                                audioMsg: true,
                                                color: color,
                                                time: date_time
                                            });
                                            setAudioModal(false);
                                        }
                                    } catch (error) {
                                        console.log('no media recoder');
                                    }
                                }
                            }} />
                        </div>
                    </Modal>

                    <Modal
                        isOpen={modalIsOpen}
                        className="modal"
                        contentLabel="Example Modal"
                    >
                        <form className="nameForm" onSubmit={nameHandler}>
                            <h4>Enter your name for others to identify</h4>
                            <input ref={inputRef} type="text" value={name} onChange={(e) => { setName(e.target.value) }} />
                            <button type="submit">Save</button>
                        </form>
                    </Modal>
                    <div className="send-message">
                        <form onSubmit={sendMessage} className="messageInputContainer">
                            <input ref={inputRef} type="text" onChange={messageHandler} value={message} placeholder="Message..." />
                            {
                                (msgOrAudio == 'audio') ? (
                                    <MicIcon onClick={recordAudioModelPop} className="send-icon" />
                                ) : (
                                        <SendIcon onClick={sendMessage} type="submit" className="send-icon" />
                                    )
                            }
                        </form>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default ChatRoom;
