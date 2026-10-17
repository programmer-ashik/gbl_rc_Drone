import { Server } from 'socket.io';
import { config } from '../../config/env.js';
let io = null;
export const initRealtime = (httpServer) => {
    const origins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
    io = new Server(httpServer, {
        path: '/socket.io',
        cors: {
            origin: origins.includes('*') ? true : origins,
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        socket.emit('realtime:ready', { ok: true, at: new Date().toISOString() });
        socket.on('subscribe:admin', () => {
            socket.join('admin');
        });
        socket.on('subscribe:storefront', () => {
            socket.join('storefront');
        });
    });
    console.log('Realtime WebSocket ready at /socket.io');
    return io;
};
export const emitRealtime = (event, payload = {}, rooms = ['all']) => {
    if (!io)
        return;
    const body = { ...payload, at: new Date().toISOString(), event };
    if (rooms.includes('all')) {
        io.emit(event, body);
        return;
    }
    if (rooms.includes('storefront'))
        io.to('storefront').emit(event, body);
    if (rooms.includes('admin'))
        io.to('admin').emit(event, body);
};
export const getRealtime = () => io;
