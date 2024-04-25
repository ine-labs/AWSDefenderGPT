import { io } from "socket.io-client";

const createSocketConnection = () => {
  const API_URL = process.env.REACT_APP_HOST || "127.0.0.1:5000/" ;
  const socket = io(API_URL, {
    transports: ["websocket"],
    cors: {
      origin: "*",
    },
  });

  return socket;
};

export default createSocketConnection;
