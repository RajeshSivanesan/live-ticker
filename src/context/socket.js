import socketio from "socket.io-client";
const SOCKET_URL = import.meta.env.SOCKET_URL;

export const socket = socketio.connect(SOCKET_URL);
export const SocketContext = React.createContext();