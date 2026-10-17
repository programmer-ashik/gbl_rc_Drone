import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth, requireRole } from '../../../core/auth/middleware.js';
import { withOrgScope } from '../../../core/auth/org-access.js';
import { AuditLogModel } from './audit-log.model.js';

const listQuerySchema = z.object({
  organizationId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const auditLogsRouter = Router();

auditLogsRouter.get(
  '/',
  requireAuth,
  requireRole('platform_super_admin', 'platform_admin', 'platform_support', 'org_owner', 'org_admin'),
  zodValidate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const filter = withOrgScope(req, {});
    const [items, total] = await Promise.all([
      AuditLogModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      AuditLogModel.countDocuments(filter),
    ]);
    envelope.ok(res, { items, page, limit, total });
  }),
);
