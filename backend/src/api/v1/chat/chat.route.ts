import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth, requireRole } from '../../../core/auth/middleware.js';
import { verifyAccessToken } from '../../../core/auth/jwt.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../core/http/errors.js';
import { ChatThreadModel } from './chat.model.js';
import { getRealtime } from '../../../core/realtime/hub.js';

const startSchema = z.object({
  guestId: z.string().min(1).optional(),
  guestName: z.string().trim().max(80).optional(),
  guestEmail: z.string().email().or(z.literal('')).optional(),
  message: z.string().trim().min(1).max(2000),
});

const messageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  guestId: z.string().optional(),
});

const emitChat = (threadId: string, payload: Record<string, unknown>) => {
  const io = getRealtime();
  if (!io) return;
  io.to(`chat:${threadId}`).emit('chat:message', payload);
  io.to('chat:admin').emit('chat:thread', { threadId, ...payload });
};

export const chatRouter = Router();

chatRouter.use((req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.auth = verifyAccessToken(token);
    } catch {
      /* guest ok */
    }
  }
  next();
});

chatRouter.post(
  '/start',
  zodValidate(startSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof startSchema>;
    const isAdmin = req.auth && ['store_admin', 'platform_admin', 'platform_super_admin'].includes(req.auth.role);
    const message = {
      senderId: req.auth?.sub || null,
      senderRole: isAdmin ? 'admin' : req.auth ? 'customer' : 'guest',
      senderName: payload.guestName || (req.auth ? 'Customer' : 'Guest'),
      body: payload.message,
      createdAt: new Date(),
    };

    let thread;
    if (req.auth?.sub && !isAdmin) {
      thread = await ChatThreadModel.findOne({ userId: req.auth.sub, status: 'open' });
    } else if (payload.guestId) {
      thread = await ChatThreadModel.findOne({ guestId: payload.guestId, status: 'open' });
    }

    if (!thread) {
      thread = await ChatThreadModel.create({
        userId: req.auth?.sub && !isAdmin ? req.auth.sub : null,
        guestId: payload.guestId || null,
        guestName: payload.guestName || 'Guest',
        guestEmail: payload.guestEmail || '',
        status: 'open',
        messages: [message],
        lastMessageAt: new Date(),
      });
    } else {
      thread.messages.push(message);
      thread.lastMessageAt = new Date();
      await thread.save();
    }

    emitChat(thread._id.toString(), { threadId: thread._id.toString(), message });
    envelope.ok(res, thread);
  }),
);

chatRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const guestId = String(req.query.guestId || '');
    let thread = null;
    if (req.auth?.sub) {
      thread = await ChatThreadModel.findOne({ userId: req.auth.sub, status: 'open' }).lean();
    } else if (guestId) {
      thread = await ChatThreadModel.findOne({ guestId, status: 'open' }).lean();
    }
    envelope.ok(res, thread);
  }),
);

chatRouter.post(
  '/:id/messages',
  zodValidate(messageSchema),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid thread id');
    const thread = await ChatThreadModel.findById(id);
    if (!thread || thread.status !== 'open') throw new NotFoundError('Chat not found');

    const isAdmin = req.auth && ['store_admin', 'platform_admin', 'platform_super_admin'].includes(req.auth.role);
    const payload = req.body as z.infer<typeof messageSchema>;
    const owns =
      isAdmin ||
      (req.auth?.sub && thread.userId?.toString() === req.auth.sub) ||
      (payload.guestId && thread.guestId === payload.guestId);
    if (!owns) throw new ForbiddenError('Chat access denied');

    const message = {
      senderId: req.auth?.sub || null,
      senderRole: isAdmin ? 'admin' : req.auth ? 'customer' : 'guest',
      senderName: isAdmin ? 'Support' : thread.guestName || 'Customer',
      body: payload.body,
      createdAt: new Date(),
    };
    thread.messages.push(message);
    thread.lastMessageAt = new Date();
    await thread.save();
    emitChat(id, { threadId: id, message });
    envelope.ok(res, thread);
  }),
);

chatRouter.get(
  '/admin/threads',
  requireAuth,
  requireRole('store_admin', 'platform_admin', 'platform_super_admin'),
  asyncHandler(async (_req, res) => {
    const items = await ChatThreadModel.find()
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .select('guestName guestEmail userId status lastMessageAt messages')
      .lean();
    envelope.ok(
      res,
      items.map((thread: any) => ({
        ...thread,
        preview: thread.messages?.[thread.messages.length - 1]?.body || '',
        messageCount: thread.messages?.length || 0,
      })),
    );
  }),
);

chatRouter.get(
  '/admin/threads/:id',
  requireAuth,
  requireRole('store_admin', 'platform_admin', 'platform_super_admin'),
  asyncHandler(async (req, res) => {
    const thread = await ChatThreadModel.findById(req.params.id).lean();
    if (!thread) throw new NotFoundError('Chat not found');
    envelope.ok(res, thread);
  }),
);

chatRouter.post(
  '/admin/threads/:id/close',
  requireAuth,
  requireRole('store_admin', 'platform_admin', 'platform_super_admin'),
  asyncHandler(async (req, res) => {
    const thread = await ChatThreadModel.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    if (!thread) throw new NotFoundError('Chat not found');
    envelope.ok(res, thread);
  }),
);
