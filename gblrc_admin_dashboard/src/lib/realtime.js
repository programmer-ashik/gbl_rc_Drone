import { io } from 'socket.io-client';
import { API_CONFIG } from '../constants/api';

let socket;

export const getAdminRealtimeSocket = () => {
  if (socket) return socket;
  socket = io(API_CONFIG.BASE_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  socket.on('connect', () => {
    socket.emit('subscribe:admin');
  });
  return socket;
};
