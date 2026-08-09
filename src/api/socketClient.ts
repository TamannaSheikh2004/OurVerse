import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './config';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket) {
    const targetUrl = API_BASE_URL || window.location.origin;
    socket = io(targetUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  } else if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
