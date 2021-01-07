import React, { useState, useEffect, useRef } from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import SendIcon from '@material-ui/icons/Send';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import Alert from '@material-ui/lab/Alert';
import Modal from 'react-modal';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import './ChatRoom.css';
import CallEndIcon from '@material-ui/icons/CallEnd';
import VideocamIcon from '@material-ui/icons/Videocam';
import { socket } from '../socket';
import Peer from 'peerjs';

var temp = '';
var mediaRecorder = null;
var chunks = [];
var online = true;
var peer;
var peerId;
var call;
var otherPeer;
var incomingVideocallUsername;


function ChatRoom() {
    const inputRef = useRef(null);
    const videoEl = useRef(null);
    const peerVideoEl = useRef(null);
    const [isAudioRec, setIsAudioRec] = useState(false);
    const [users, setUsers] = useState([]);
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [usersExp, setUsersExp] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [acceptVideoCallModal, setAcceptVideoCallModal] = useState(false);
    const [micState, setMicState] = useState(false);
    const [videoState, setVideoState] = useState(false);
    const [streamState, setStream] = useState();
    const [pass, setPass] = useState('');
    const [passModalIsOpen, setPassModalIsOpen] = useState(false);
    const [msgOrAudio, setMsgOrAudio] = useState('audio');
    const [audioModal, setAudioModal] = useState(false);
    const [datetime, setDateTime] = useState('');
    const [color, setColor] = useState('');
    const [name, setName] = useState('');
    const [allMsg, setAllMsg] = useState([]);
    const [snackMsg, setSnackMsg] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [snackOpen, setSnackOpen] = useState(false);
    const [message, setMessage] = useState('');



    useEffect(() => {
        requestNotifPerm();
        //window.localStorage.removeItem('user');
        if (!window.localStorage.getItem('user')) {
            setModalIsOpen(true);
            //inputRef.current.focus();
        }
        else {
            var roomName = window.location.href.split('/')[4];
            setRoomName(roomName);
            var user = window.localStorage.getItem('user');

            // join room
            socket.emit('join-room', {
                user: user,
                roomName: roomName
            });

            // password required - protected room
            socket.on('pass-required', data => {
                setPassModalIsOpen(true);
            });

            socket.on('incoming-videocall', data => {
                incomingVideocallUsername = data;
            })

            // alert self you have joined room
            socket.on('welcome-self-message', data => {
                setModalIsOpen(false);
                setPassModalIsOpen(false);
                setColor(data.color);
                peerId = data.peerId;
                peer = new Peer(peerId);
                peer.on('call', (call) => {
                    call = call;
                    otherPeer = call.peer;
                    console.log(call);
                    setVideoModalOpen(true);
                    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
                        peerVideoEl.current.srcObject = stream;
                        setStream(stream);
                        window.focus();
                        var a = window.prompt(`Incoming VideoCall from ${incomingVideocallUsername} | Click OK to accept | Click Cancel to Reject ?`);
                        console.log('value of a:  ' + a);
                        if (a === null) {
                            socket.emit('videocall-reject', call.peer);
                            stream.getTracks().forEach(track => {
                                track.stop();
                                setVideoModalOpen(false);
                            });
                        } else if (a === "" || a.toLowerCase() == 'accept') {
                            setVideoState(!videoState);
                            setMicState(!micState);
                            call.answer(stream);
                            videoEl.current.srcObject = stream;
                            call.on('stream', (remoteStream) => {
                                peerVideoEl.current.srcObject = remoteStream;
                            });
                        }
                        socket.on('videocall-rejected', (data) => {
                            closeVideo(stream, data);
                        });
                    }).catch(err => {
                        console.error('Failed to get local stream', err);
                    });

                });
            });


            socket.on('welcome-message', (data) => {
                const temp = {
                    newComer: true,
                    message: data.user + ' has joined ' + data.roomName + ' 🥳🥳🥳'
                }
                setAllMsg((allMsg) => [...allMsg, temp]);
            });


            socket.on('user-exit', (data) => {
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
                setAllMsg((allMsg) => [...allMsg, msg]);
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
        //inputRef.current.focus();
        document.addEventListener("visibilitychange", event => {
            if (document.visibilityState == "visible") {
                console.log('online');
                online = true;
            } else {
                console.log('offline');
                online = false;
            }
        });

        var roomName = window.location.href.split('/')[4];
        setRoomName(roomName);
        var user = window.localStorage.getItem('user');

        // join room
        socket.emit('join-room', {
            user: user,
            roomName: roomName
        });

        // password required - protected room
        socket.on('pass-required', data => {
            setPassModalIsOpen(true);
        });

        socket.on('incoming-videocall', data => {
            incomingVideocallUsername = data;
        })

        // alert self you have joined room
        socket.on('welcome-self-message', data => {
            setModalIsOpen(false);
            setPassModalIsOpen(false);
            setColor(data.color);
            peerId = data.peerId;
            peer = new Peer(peerId);
            peer.on('call', (call) => {
                call = call;
                otherPeer = call.peer;
                console.log(call);
                setVideoModalOpen(true);
                navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
                    peerVideoEl.current.srcObject = stream;
                    setStream(stream);
                    window.focus();
                    var a = window.prompt(`Incoming VideoCall from ${incomingVideocallUsername} | Click OK to accept | Click Cancel to Reject ?`);
                    console.log('value of a:  ' + a);
                    if (a === null) {
                        socket.emit('videocall-reject', call.peer);
                        stream.getTracks().forEach(track => {
                            track.stop();
                            setVideoModalOpen(false);
                        });
                    } else if (a === "" || a.toLowerCase() == 'accept') {
                        setVideoState(!videoState);
                        setMicState(!micState);
                        call.answer(stream);
                        videoEl.current.srcObject = stream;
                        call.on('stream', (remoteStream) => {
                            peerVideoEl.current.srcObject = remoteStream;
                        });
                    }
                    socket.on('videocall-rejected', (data) => {
                        closeVideo(stream, data);
                    });
                }).catch(err => {
                    console.error('Failed to get local stream', err);
                });

            });
        });


        socket.on('welcome-message', (data) => {
            const temp = {
                newComer: true,
                message: data.user + ' has joined ' + data.roomName + ' 🥳🥳🥳'
            }
            setAllMsg((allMsg) => [...allMsg, temp]);
        });


        socket.on('user-exit', (data) => {
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
            setAllMsg((allMsg) => [...allMsg, msg]);
            displayNotification(msg);
        });
    }



    const videoCall = (id) => {
        socket.emit('videocall-peer', id);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            setStream(stream);
            console.log('callingggg ' + id + ' ........');
            call = peer.call(id, stream);
            otherPeer = id;
            peerVideoEl.current.srcObject = stream;
            call.on('stream', (remoteStream) => {
                peerVideoEl.current.srcObject = remoteStream;
                videoEl.current.srcObject = stream;
            });
            socket.on('videocall-rejected', (data) => {
                closeVideo(stream, data);
            });
        }).catch(err => {
            console.log('Failed to get local stream', err);
        });
    }

    const closeVideo = (st, data) => {
        st.getTracks().forEach(track => {
            track.stop();
        });
        setVideoModalOpen(false);
        alert(data + ' ended the call!');
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
            setSnackMsg('Link Copied to clipboard');
            setSnackOpen(true);
            console.log('copied');
        }, () => {
            console.log('could not copy');
        })
    }

    const recordAudioModelPop = () => {
        setAudioModal(true);
        setIsAudioRec(true);
        console.log('Starting to record...');
        recordAudio();
    }

    const recordAudio = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(
                {
                    audio: true
                }).then(function (stream) {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    mediaRecorder.ondataavailable = function (e) {
                        console.log('Data available | Collection audio chunks...');
                        chunks.push(e.data);
                    }
                }).catch(function (err) {
                    console.log('The following getUserMedia error occurred: ' + err);
                    //if (err === 'Permission denied') {recordAudio();}
                }
                );
        } else {
            console.log('getUserMedia not supported on your browser!');
        }
    }

    const passHandler = (e) => {
        e.preventDefault();
        socket.emit('passcode', pass);
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
                        usersExp ? <PeopleAltIcon className="chevron-icon" onClick={() => { setUsersExp(false) }} /> : <PeopleAltIcon className="chevron-icon" onClick={() => { setUsersExp(true) }} />
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
                                <h4>{each.user}</h4>
                                {
                                    each.peerId != peerId ? (
                                        <VideocamIcon className="videocam-icon" onClick={() => {
                                            videoCall(each.peerId);
                                            setVideoModalOpen(true);
                                            setVideoState(true);
                                            setMicState(true);
                                        }} />
                                    ) : null
                                }

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
                                            <audio src={window.URL.createObjectURL(new Blob(each.chunks, { 'type': 'audio/ogg; codecs=opus' }))} controls></audio>
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
                        style={{
                            overlay: { backgroundColor: 'rgb(27, 27, 27)', opacity: '0.98' }
                        }}
                        className="audio-modal"
                        onRequestClose={() => {
                            setAudioModal(false);
                            setIsAudioRec(false);
                            try {
                                mediaRecorder.stop();
                                mediaRecorder.stream.getTracks().forEach(track => track.stop()); // stop each of them
                            } catch (err) {

                            }
                        }}
                        contentLabel="Example Modal"
                    >
                        <h3>Listening...</h3>
                        <div className="audio-icon-container">
                            <MicIcon className="recording-mic-icon" onClick={() => {
                                setIsAudioRec(false);
                                try {
                                    setIsAudioRec(false);
                                    mediaRecorder.stop();
                                    console.log('recording stopped');
                                    var currentdate = new Date();
                                    var date_time = currentdate.getDate() + "/"
                                        + (currentdate.getMonth() + 1) + "/"
                                        + currentdate.getFullYear() + " "
                                        + currentdate.getHours() + ":"
                                        + currentdate.getMinutes() + ":"
                                        + currentdate.getSeconds();
                                    mediaRecorder.onstop = function (e) {
                                        socket.emit('message-to-server', {
                                            chunks: chunks,
                                            user: name,
                                            audioMsg: true,
                                            color: color,
                                            time: date_time
                                        });
                                        setAllMsg(() => [...allMsg, {
                                            chunks: chunks,
                                            user: name,
                                            audioMsg: true,
                                            time: date_time
                                        }])
                                        chunks = [];
                                        mediaRecorder.stream.getTracks().forEach(track => track.stop()); // stop each of them
                                        setAudioModal(false);
                                    }
                                } catch (error) {
                                    console.log('Some Error happened | No mediaRecorder found.');
                                }

                            }} />
                        </div>
                    </Modal>
                    <Modal
                        isOpen={passModalIsOpen}
                        style={{
                            overlay: { backgroundColor: 'rgb(27, 27, 27)', opacity: '0.98' }
                        }}
                        className="modal"
                        contentLabel="Example Modal"
                    >
                        <form className="nameForm" onSubmit={passHandler}>
                            <h4>Enter Password</h4>
                            <input ref={inputRef} type="password" value={pass} onChange={(e) => {
                                e.preventDefault();
                                setPass(e.target.value);
                            }} />
                            <button type="submit">Join</button>
                        </form>
                    </Modal>

                    <Modal
                        isOpen={acceptVideoCallModal}
                        style={{
                            overlay: { backgroundColor: 'rgb(27, 27, 27)', opacity: '0.98' }
                        }}
                        className="incoming-call-modal"
                        contentLabel="Example Modal"
                    >
                        <h2 onClick={() => {
                            setAcceptVideoCallModal(false);
                            setVideoState(false);
                            setMicState(false);
                        }}>Accept</h2>
                        <h2 onClick={() => {
                            setAcceptVideoCallModal(false);
                            const tracks = streamState.getTracks();

                            tracks.forEach(function (track) {
                                track.stop();
                            });
                        }}>Reject</h2>
                    </Modal>


                    <Modal
                        isOpen={videoModalOpen}
                        onRequestClose={() => { setVideoModalOpen(false) }}
                        style={{
                            overlay: {
                                backgroundColor: 'rgb(27, 27, 27)'
                            }
                        }}
                        className="video-modal"
                        contentLabel="Example Modal"
                    >
                        <div className="videoCallContainer">
                            <video className="peer-video" muted playsInline ref={peerVideoEl} autoPlay></video>
                        </div>
                        <div className="video-call-controls">
                            <div className="test"></div>
                            <div className="icon-container">
                                <div className="iconContainer">
                                    {
                                        micState ? (
                                            <MicIcon onClick={() => {
                                                const tracks = streamState.getTracks();

                                                tracks.forEach(function (track) {
                                                    if (track.kind == 'audio')
                                                        track.enabled = false;
                                                });
                                                setMicState(!micState)
                                            }} />

                                        ) : (
                                                <MicOffIcon onClick={() => {
                                                    const tracks = streamState.getTracks();

                                                    tracks.forEach(function (track) {
                                                        if (track.kind == 'audio')
                                                            track.enabled = true;
                                                    });
                                                    setMicState(!micState)
                                                }} />
                                            )
                                    }
                                </div>
                                <div className="callend-iconContainer">
                                    <CallEndIcon onClick={() => {
                                        const tracks = streamState.getTracks();
                                        socket.emit('videocall-reject', otherPeer);
                                        tracks.forEach(function (track) {
                                            track.stop();
                                        });
                                        setVideoModalOpen(false);
                                    }} />
                                </div>
                                <div className="iconContainer">
                                    {
                                        videoState ? (
                                            <VideocamIcon onClick={() => {
                                                const tracks = streamState.getTracks();

                                                tracks.forEach(function (track) {
                                                    track.enabled = false;
                                                });
                                                setVideoState(!videoState)
                                            }} />
                                        ) : (
                                                <VideocamOffIcon onClick={() => {
                                                    const tracks = streamState.getTracks();

                                                    tracks.forEach(function (track) {
                                                        track.enabled = true;
                                                    });
                                                    setVideoState(!videoState)
                                                }} />
                                            )
                                    }
                                </div>
                            </div>
                            <div className="user-video-container">
                                <video className="user-video" muted playsInline ref={videoEl} autoPlay></video>
                            </div>
                        </div>
                    </Modal>

                    <Modal
                        isOpen={modalIsOpen}
                        style={{
                            overlay: { backgroundColor: 'rgb(27, 27, 27)', opacity: '0.98' }
                        }}
                        className="modal"
                        contentLabel="Example Modal"
                    >
                        <form className="nameForm" onSubmit={nameHandler}>
                            <h4>Enter your name for others to identify</h4>
                            <input ref={inputRef} type="text" value={name} onChange={(e) => {
                                e.preventDefault();
                                setName(e.target.value);
                            }} />
                            <button type="submit">Save</button>
                        </form>
                    </Modal>
                    <div className="send-message">
                        <form onSubmit={sendMessage} className="messageInputContainer">
                            <input ref={inputRef} type="text" onChange={(e) => {
                                e.preventDefault();
                                messageHandler(e);
                            }} value={message} placeholder="Message" />

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
