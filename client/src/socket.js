import io from "socket.io-client";

export const socket = io('wss://slew.herokuapp.com', {
    transports: ['websocket']
});

// wss://slew.herokuapp.com
//wss://slewstaging2.herokuapp.com
//http://localhost:5000