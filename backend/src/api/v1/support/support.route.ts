import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth, requireRole } from '../../../core/auth/middleware.js';
import { verifyAccessToken } from '../../../core/auth/jwt.js';
import { BadRequestError, NotFoundError } from '../../../core/http/errors.js';
import { auditLog } from '../../../core/logging/audit.js';
import { SupportTicketModel } from './support-ticket.model.js';

const ticketSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().default(''),
  subject: z.string().trim().min(3).max(160),
  category: z.enum(['order', 'product', 'payment', 'account', 'technical', 'other']).default('other'),
  message: z.string().trim().min(10).max(5000),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  adminNote: z.string().trim().max(5000).optional(),
}).refine((payload) => payload.status !== undefined || payload.adminNote !== undefined, { message: 'No changes provided' });

const makeTicketNumber = () => `SUP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

export const supportRouter = Router();

supportRouter.use((req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try { req.auth = verifyAccessToken(token); } catch { /* Public submission stays available. */ }
  }
  next();
});

supportRouter.post('/', zodValidate(ticketSchema), asyncHandler(async (req, res) => {
  const ticket = await SupportTicketModel.create({
    ...(req.body as z.infer<typeof ticketSchema>),
    ticketNumber: makeTicketNumber(),
    userId: req.auth?.sub ?? null,
  });
  if (req.auth) auditLog(req, { action: 'support.create', targetType: 'SupportTicket', targetId: ticket._id.toString() });
  envelope.created(res, { ticketNumber: ticket.ticketNumber, status: ticket.status, createdAt: ticket.createdAt });
}));

supportRouter.get('/', requireAuth, requireRole('store_admin', 'platform_admin', 'platform_super_admin'), asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status;
  const tickets = await SupportTicketModel.find(filter).sort({ createdAt: -1 }).lean();
  envelope.ok(res, tickets);
}));

supportRouter.put('/:id', requireAuth, requireRole('store_admin', 'platform_admin', 'platform_super_admin'), zodValidate(updateTicketSchema), asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new BadRequestError('Invalid support ticket id');
  const ticket = await SupportTicketModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ticket) throw new NotFoundError('Support ticket not found');
  auditLog(req, { action: 'support.update', targetType: 'SupportTicket', targetId: ticket._id.toString() });
  envelope.ok(res, ticket);
}));
