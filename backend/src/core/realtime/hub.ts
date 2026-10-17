import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { config } from '../../config/env.js';

export type RealtimeEvent =
  | 'catalog:categories'
  | 'catalog:products'
  | 'admin:stock'
  | 'admin:order'
  | 'admin:low-stock'
  | 'admin:stats';

type RealtimePayload = Record<string, unknown>;

let io: Server | null = null;

export const initRealtime = (httpServer: HttpServer): Server => {
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
      socket.join('chat:admin');
    });
    socket.on('subscribe:storefront', () => {
      socket.join('storefront');
    });
    socket.on('chat:join', (threadId: string) => {
      if (threadId) socket.join(`chat:${String(threadId)}`);
    });
  });

  console.log('Realtime WebSocket ready at /socket.io');
  return io;
};

export const emitRealtime = (
  event: RealtimeEvent,
  payload: RealtimePayload = {},
  rooms: Array<'admin' | 'storefront' | 'all'> = ['all'],
): void => {
  if (!io) return;
  const body = { ...payload, at: new Date().toISOString(), event };
  if (rooms.includes('all')) {
    io.emit(event, body);
    return;
  }
  if (rooms.includes('storefront')) io.to('storefront').emit(event, body);
  if (rooms.includes('admin')) io.to('admin').emit(event, body);
};

export const getRealtime = () => io;
