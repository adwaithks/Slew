import React, { useState, useContext, useEffect } from 'react';
import Modal from 'react-modal';
import {withRouter} from 'react-router-dom'
import './Landing.css';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '../socket';
import Avatar from '@material-ui/core/Avatar';
import { UserContext } from '../context/UserContext';
import { GoogleLogin } from 'react-google-login';


function Landing(props) {


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

            if (response.status != 200) {
                props.history.push('/');
            } else {
                const res = await response.json();
                setGPayload(res);
            }
        }
        main();
    }, []);

    const {Gpayload, setGPayload, Guser, setGUser} = useContext(UserContext);

    const [isOpen, setIsOpen] = useState(false);
    const [privacy, setPrivacy] = useState(false);
    const [joinIsOpen, setJoinIsOpen] = useState(false);
    const [pass, setPass] = useState('');
    const [slewName, setSlewName] = useState('');

    socket.on('private-room-creation-complete', (data) => {
        window.location.href = '/room/' + slewName;
    });

    const submitHandler = (e) => {
        const roomName = slewName.trim().replace(/\s/g, "");
        setSlewName(roomName);
        console.log({
            slewName: roomName,
            pass: pass,
            user: window.localStorage.getItem('email')
        });
        e.preventDefault();
        if (privacy === false) {
            var id = uuidv4();
            window.location.href = '/room/' + id;
        } else {
            socket.emit('create-private-room', {
                slewName: roomName,
                pass: pass,
                user: window.localStorage.getItem('email')
            });
        }
    }

    const joinHandler = (e) => {
        e.preventDefault();
        if (slewName.length !== 0) {
            window.location.href = '/room/' + slewName;
        }

    }


    return (
        <div className="Landing">
            <div className="userTab">
                <div></div>
                <div className="avatarContainer-landing">
                <GoogleLogin
                    clientId="72427653180-11kkrqe0k389kvkr598gcu27fo4b70vg.apps.googleusercontent.com"
                    render={renderProps => (
                    <Avatar onClick={renderProps.onClick} disabled={renderProps.disabled} alt={Gpayload.name ? Gpayload.name : null } src={Gpayload.imageUrl ? Gpayload.imageUrl : ''} />
                    )}
                    buttonText="Login"
                    onSuccess={async (res) => {
                        setGUser(res);
                        const response = await fetch(`http://localhost:5000/auth`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                tokenId: res.tokenId
                            })
                        });
    
                        if (response.status == 200) {
                            try {
                                const res = await response.json();
                                setGPayload({
                                    name: res.name,
                                    email: res.email,
                                    imageUrl: res.imageUrl
                                });
                                console.log({
                                    name: res.name,
                                    email: res.email,
                                    imageUrl: res.imageUrl
                                })
                                window.localStorage.setItem('user', res.name);
                                window.localStorage.setItem('imageUrl', res.imageUrl);
                                window.localStorage.setItem('email', res.email);
                                const accessToken = res.accessToken;
                                window.localStorage.setItem('AccessToken', accessToken);
                                props.history.push('/create');
                            } catch (error) {
                                console.log('errorrrrr');
                                console.log(error);
                            }
                            
                            
                        }
                    }}
                    onFailure={(res) => {
                        console.log('failed');
                        console.log(res);
                        }}
                    cookiePolicy={'single_host_origin'}
                />
                </div>
            </div>
            <Modal
                isOpen={isOpen}
                style={{
                    overlay: { backgroundColor: 'rgb(27, 27, 27)', opacity: '0.98' }
                }}
                className="create-join-modal"
                onRequestClose={() => {
                    setIsOpen(false);
                }}
                contentLabel="Example Modal"
            >
                <form className="create-join-form" onSubmit={submitHandler}>
                <div className="slew-privacy">
                        <div onClick={() => { setPrivacy(true) }} className={privacy ? "private-highlight" : "private"}>Private</div>
                        <div onClick={() => { setPrivacy(false) }} className={!privacy ? "public-highlight" : "public"}>Public</div>
                    </div>
                    {
                        privacy ? (
                    <div className="slew-name">
                        <label htmlFor="slew-name">Slew Name</label>
                        <input placeholder="Slew Name" onChange={(e) => { setSlewName(e.target.value) }} value={slewName} type="text" />
                    </div>
                        ) : (
                            null
                        )
                    }
                    
                    
                    {
                        (privacy) ? (
                            <div className="slew-pass">
                                <label htmlFor="slew-pass">Setup a password:</label>
                                <input placeholder="Password" onChange={(e) => { setPass(e.target.value) }} value={pass} type="password" />
                            </div>
                        ) : null
                    }
                    <button type="submit">Create</button>
                </form>
            </Modal>
            <Modal
                isOpen={joinIsOpen}
                style={{
                    overlay: { backgroundColor: 'rgb(27, 27, 27)', opacity: '0.98' }
                }}
                className="create-join-modal"
                onRequestClose={() => {
                    setJoinIsOpen(false);
                }}
                contentLabel="Example Modal">

                <form className="join-form" onSubmit={joinHandler}>
                    <div className="slew-name">
                        <label htmlFor="slew-name">Slew Name</label>
                        <input placeholder="Slew Name" onChange={(e) => { setSlewName(e.target.value) }} value={slewName} type="text" />
                    </div>
                    <button type="submit">Join</button>
                </form>
            </Modal>
            <div className="button-group">
                <button className="create-btn" onClick={() => {
                    setIsOpen(true);
                }}>Create Slew</button>
                <button onClick={() => {
                    setJoinIsOpen(true);
                }} className="join-btn">Join Slew</button>
            </div>
        </div>
    )
}

export default withRouter(Landing);
