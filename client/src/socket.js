import io from "socket.io-client";

export const socket = io('wss://slew.herokuapp.com', {
    transports: ['websocket']
});