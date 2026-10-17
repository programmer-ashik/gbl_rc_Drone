import { io } from 'socket.io-client';
import { API_CONFIG } from '../constants/api';

let socket;

export const getRealtimeSocket = () => {
  if (socket) return socket;
  socket = io(API_CONFIG.BASE_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  socket.on('connect', () => {
    socket.emit('subscribe:storefront');
  });
  return socket;
};

export const disconnectRealtime = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};
