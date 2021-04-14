import io from "socket.io-client";

export const socket = io('wss://slewstaging.herokuapp.com', {
    transports: ['websocket']
});

// wss://slew.herokuapp.com
//http://localhost:5000