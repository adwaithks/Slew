import React, { useState } from 'react';
import Modal from 'react-modal';
import './Landing.css';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '../socket';

function Landing() {

    const [isOpen, setIsOpen] = useState(false);
    const [privacy, setPrivacy] = useState(false);
    const [joinIsOpen, setJoinIsOpen] = useState(false);
    const [pass, setPass] = useState('');
    const [slewName, setSlewName] = useState('');

    const submitHandler = (e) => {
        e.preventDefault();
        if (privacy == false) {
            var id = uuidv4();
            window.location.href = '/room/' + id;
        } else {
            socket.emit('create-private-room', {
                slewName: slewName,
                pass: pass
            });
            window.location.href = '/room/' + slewName;
        }
    }

    const joinHandler = (e) => {
        e.preventDefault();
        window.location.href = '/room/' + slewName
    }


    return (
        <div className="Landing">
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

export default Landing;
