// client/src/services/socket.js
// Clean, simple Socket.IO client connection manager with token tracking

import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

export const getSocket = () => socket;

export const connectSocket = (token) => {
  if (socket && socket.connected && currentToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || window.location.origin;


  socket = io(SOCKET_URL, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};
