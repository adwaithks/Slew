import io from "socket.io-client";

export const socket = io('http://localhost:5000', {
    transports: ['websocket']
});

// wss://slew.herokuapp.com
//wss://slewstaging.herokuapp.com
//http://localhost:5000