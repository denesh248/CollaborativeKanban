// client/src/services/socket.js
// Clean, simple Socket.IO client connection manager with token tracking

import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

export const getSocket = () => socket;

export const connectSocket = (token) => {
  // If already connected with the same token, reuse existing socket
  if (socket && socket.connected && currentToken === token) {
    return socket;
  }

  // If token changed or socket disconnected, reset
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
    'http://localhost:5000';

  socket = io(socketUrl, {
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
