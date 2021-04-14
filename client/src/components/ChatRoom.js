import React, { useState, useEffect, useRef, useContext } from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import SendIcon from '@material-ui/icons/Send';
import {withRouter} from 'react-router-dom';
import Avatar from '@material-ui/core/Avatar';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import Alert from '@material-ui/lab/Alert';
import Modal from 'react-modal';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import AvatarGroup from '@material-ui/lab/AvatarGroup';
import PhoneIcon from '@material-ui/icons/Phone';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import './ChatRoom.css';
import CallEndIcon from '@material-ui/icons/CallEnd';
import VideocamIcon from '@material-ui/icons/Videocam';
import { socket } from '../socket';
import Peer from 'peerjs';
import { UserContext } from '../context/UserContext';


var temp = '';
var mediaRecorder = null;
var chunks = [];
var online = true;
var peer;
var peerId;
var call;
var otherPeer;
var incomingVideocallUsername;


function ChatRoom(props) {


    useEffect(() => {
        const main = async () => {
            const token = window.localStorage.getItem('AccessToken');
            if (!token) {
                props.history.push('/');
            }
            const response = await fetch(`http://localhost:5000/verify`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    token: token
                })
            });

            if (response.status !== 200) {
                props.history.push('/');
            } else {
                const res = await response.json();
                setGPayload(res);
            }
        }

        main();
        if (Guser.profileObj) {
            window.localStorage.setItem('user', Guser.profileObj.name)
            window.localStorage.setItem('imageUrl', Guser.profileObj.imageUrl)
            window.localStorage.setItem('email', Guser.profileObj.email);
            console.log('Guser: ')
            console.log(Guser);
        }
            
            const roomName = window.location.href.split('/')[4];
            window.localStorage.setItem('roomName', roomName);
            requestNotifPerm();
            setRoomName(roomName);


            socket.emit('join-room', {
                user: Guser.profileObj ? Guser.profileObj.name : window.localStorage.getItem('user'),
                roomName: (roomName) ? roomName : window.localStorage.getItem('roomName'),
                imageUrl: Guser.profileObj ? Guser.profileObj.imageUrl : window.localStorage.getItem('imageUrl'),
                email: Guser.profileObj ? Guser.profileObj.email : window.localStorage.getItem('email')
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
                    setCallState(call);
                    otherPeer = call.peer;
                    //console.log(call);
                    setVideoCalling('incoming');
                    setVideoModalOpen(true);
                    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
                        setStream(stream);
                        peerVideoEl.current.srcObject = stream;
                        socket.on('videocall-rejected', (data) => {
                            setConnecting(false);
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
                console.log('connectedClients');
                console.log(connectedClients);

            });

            socket.on('message-from-server', (msg) => {
                setAllMsg((allMsg) => [...allMsg, msg]);
                displayNotification(msg);
            });

            return () => {
                socket.disconnect();
            }
        
    }, []);



    const {Guser, setGUser, Gpayload, setGPayload} = useContext(UserContext);
    const videoEl = useRef(null);
    const chatWindowRef = useRef(null);
    const peerVideoEl = useRef(null);
    const [isAudioRec, setIsAudioRec] = useState(false);
    const [videoCalling, setVideoCalling] = useState('');
    const [callState, setCallState] = useState({})
    const [users, setUsers] = useState([]);
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [usersExp, setUsersExp] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [micState, setMicState] = useState(false);
    const [videoState, setVideoState] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [streamState, setStream] = useState({});
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



    

    function displayNotification(msg) {
        if (Notification.permission === 'granted' && online === false) {
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



    const videoCall = (id) => {
        socket.emit('videocall-peer', id);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            setStream(stream);
            setConnecting(true);
            console.log('callingggg ' + id + ' ........');
            call = peer.call(id, stream);
            otherPeer = id;
            peerVideoEl.current.srcObject = stream;
            call.on('stream', (remoteStream) => {
                setConnecting(false);
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
        if (temp.length === 0) {
            setMsgOrAudio('audio');
        } else {
            setMsgOrAudio('msg');
        }
    }

    const sendMessage = (e) => {
        e.preventDefault();
        console.log(chatWindowRef.current.scrollHeight)
        if (message.length !== 0) {
            var currentdate = new Date();
            var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
            const user = Gpayload.name;
            const imageUrl = Gpayload.imageUrl;
            setAllMsg((allMsg) => [...allMsg, {
                message: message,
                user: user,
                time: datetime,
                imageUrl: imageUrl,
                color: color
            }]);
            socket.emit('message-to-server', {
                message: message,
                user: user,
                time: datetime,
                color: color,
                imageUrl: imageUrl
            });
            setMessage("");
            setMsgOrAudio('audio');
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
                <div className="participantsContainer">
                <AvatarGroup max={5}>
                    {
                        users.map((each, index) => (
                            <Avatar title={each.name} className="participantsAvatar" alt={each.name} src={each.imageUrl} />
                        ))
                    }
                </AvatarGroup>  
                </div>
            </div>
            <div className="main-window">
                <div className={usersExp ? "users" : "nodisplay"}>
                    {
                        users.map((each, index) => (
                            <div className="user" key={index}>
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
                <div ref={chatWindowRef} className="chat-window">
                    <div className="chats">
                        {
                            (allMsg.length === 0) ? (
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
                                        <div key={index} className="newComer">
                                            <h3>{each.message}</h3>
                                        </div>
                                    ) : (each.exitmsg) ? (
                                        <div key={index} className="exitmsg">
                                            <h3>{each.message}</h3>
                                        </div>
                                    ) : (each.audioMsg) ? (
                                        <div key={index} className="audio-message">
                                            {
                                                            index > 0 ? (
                                                                (allMsg[index - 1].user !== Gpayload.name) ? (
                                                                    <div className="senderinfo">
                                                                        <Avatar className="avatar-icon" alt={each.name} src={each.imageUrl} />
                                                                        <h4 style={{ color: each.color || color }}>{each.user}</h4> 
                                                                        <h5>{each.time}</h5>                                                           
                                                                    </div>
                                                                ) : null
                                                            ) : (
                                                                <div className="senderinfo">
                                                                        <Avatar className="avatar-icon" alt={each.name} src={each.imageUrl} />
                                                                        <h4 style={{ color: each.color || color }}>{each.user}</h4> 
                                                                        <h5>{each.time}</h5>                                                           
                                                                    </div>
                                                            )
                                                            
                                                        }
                                            <audio src={window.URL.createObjectURL(new Blob(each.chunks, { 'type': 'audio/ogg; codecs=opus' }))} controls></audio>
                                        </div>

                                    ) : (
                                                    <div key={index} className="message">
                                                        {
                                                            index > 0 ? (
                                                                (allMsg[index - 1].user !== Gpayload.name) ? (
                                                                    <div className="senderinfo">
                                                                        <Avatar className="avatar-icon" alt={each.name} src={each.imageUrl} />
                                                                        <h4 style={{ color: each.color || color }}>{each.user}</h4> 
                                                                        <h5>{each.time}</h5>                                                           
                                                                    </div>
                                                                ) : null
                                                            ) : (
                                                                <div className="senderinfo">
                                                                        <Avatar className="avatar-icon" alt={each.name} src={each.imageUrl} />
                                                                        <h4 style={{ color: each.color || color }}>{each.user}</h4> 
                                                                        <h5>{each.time}</h5>                                                           
                                                                    </div>
                                                            )
                                                            
                                                        }
                                                        
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
                                            user: Gpayload.name,
                                            audioMsg: true,
                                            imageUrl: Gpayload.imageUrl,
                                            color: color,
                                            time: date_time
                                        });
                                        setAllMsg(() => [...allMsg, {
                                            chunks: chunks,
                                            user: Gpayload.name,
                                            imageUrl: Gpayload.imageUrl,
                                            color: color,
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
                            <input type="password" value={pass} onChange={(e) => {
                                e.preventDefault();
                                setPass(e.target.value);
                            }} />
                            <button type="submit">Join</button>
                        </form>
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
                        {
                            videoCalling === 'incoming' ? (
                                <>
                                    <div className="videoCallContainer">
                                        <video className="peer-video" muted playsInline ref={peerVideoEl} autoPlay></video>
                                    </div>
                                    <h2 className="incoming-videocall-text">Incoming Video call from {incomingVideocallUsername}</h2>
                                    <div className="video-callincoming-controls">
                                        <div className="callaccept-iconContainer" onClick={(e) => {
                                            e.preventDefault();
                                            setVideoCalling('');
                                            setConnecting(false);
                                            setVideoState(true);
                                            setMicState(true);       
                                            console.log('streamState: ');
                                            console.log(streamState);
                                            callState.answer(streamState);
                                            callState.on('stream', (remoteStream) => {
                                                videoEl.current.srcObject = streamState;
                                                peerVideoEl.current.srcObject = remoteStream;
                                            });
                                        }} >
                                            <PhoneIcon />
                                        </div>
                                        <div className="callendincoming-iconContainer" onClick={() => {
                                            const tracks = streamState.getTracks();
                                            setConnecting(false);
                                            setVideoState(false);
                                            socket.emit('videocall-reject', otherPeer);
                                            tracks.forEach(function (track) {
                                                track.stop();
                                            });
                                            setVideoModalOpen(false);
                                            setVideoCalling('');
                                        }}>
                                            <CallEndIcon />
                                        </div>

                                    </div></>
                            ) : (
                                    <>
                                        <div className="videoCallContainer">
                                            <video className="peer-video" muted playsInline ref={peerVideoEl} autoPlay></video>
                                        </div>
                                        {
                                            connecting ? (
                                                <h3 className="connecting-text">Connecting ...</h3>
                                            ) : null
                                        }
                                        <div className="video-call-controls">
                                            <div className="test"></div>
                                            <div className="icon-container">
                                                <div className="iconContainer">
                                                    {
                                                        micState ? (
                                                            <MicIcon onClick={() => {
                                                                const tracks = streamState.getTracks();
                                                                tracks.forEach(function (track) {
                                                                    if (track.kind === 'audio')
                                                                        track.enabled = false;
                                                                });
                                                                setMicState(!micState)
                                                            }} />

                                                        ) : (
                                                                <MicOffIcon onClick={() => {
                                                                    const tracks = streamState.getTracks();
                                                                    tracks.forEach(function (track) {
                                                                        if (track.kind === 'audio')
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
                                    </>
                                )
                        }

                    </Modal>
                    <div className="send-message">
                        <div className="messageInputContainer">
                            <input type="text" onChange={(e) => {
                                messageHandler(e);
                            }} value={message} placeholder="Message" />

                            {
                                (msgOrAudio === 'audio') ? (
                                    <MicIcon onClick={recordAudioModelPop} className="send-icon" />
                                ) : (
                                    <SendIcon onClick={sendMessage} className="send-icon" />
                                    )
                            }
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default withRouter(ChatRoom);
