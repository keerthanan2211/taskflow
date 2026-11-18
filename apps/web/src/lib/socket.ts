import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;
let socketToken: string | null = null;

/** One shared connection per signed-in user; reconnects with the new token if the user changes. */
export function getSocket(token: string): Socket {
  if (socket && socketToken === token) return socket;
  socket?.disconnect();
  socket = io(`${API_URL}/realtime`, { auth: { token }, transports: ['websocket'] });
  socketToken = token;
  return socket;
}

export function closeSocket(): void {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
