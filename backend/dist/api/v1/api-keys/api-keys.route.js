import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { hashToken } from '../../../utils/strings.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth } from '../../../core/auth/middleware.js';
import { assertOrgAccess, assertOrgWriteAccess } from '../../../core/auth/org-access.js';
import { ApiKeyModel } from './api-key.model.js';
import { auditLog } from '../../../core/logging/audit.js';
const createSchema = z.object({
    name: z.string().min(1),
    permissions: z.array(z.string()).default([]),
});
export const apiKeysRouter = Router({ mergeParams: true });
apiKeysRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
    const organizationId = assertOrgAccess(req, req.params.organizationId);
    const keys = await ApiKeyModel.find({ organizationId, status: 'ACTIVE' }).select('-keyHash');
    envelope.ok(res, keys.map((k) => ({
        id: k._id.toString(),
        name: k.name,
        prefix: k.prefix,
        permissions: k.permissions,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
    })));
}));
apiKeysRouter.post('/', requireAuth, zodValidate(createSchema), asyncHandler(async (req, res) => {
    const organizationId = assertOrgWriteAccess(req, req.params.organizationId);
    const { name, permissions } = req.body;
    const secret = `scaffold_${crypto.randomBytes(24).toString('hex')}`;
    const prefix = secret.slice(0, 12);
    const doc = await ApiKeyModel.create({
        organizationId,
        name,
        prefix,
        keyHash: hashToken(secret),
        permissions,
        createdBy: req.auth.sub,
    });
    auditLog(req, {
        action: 'apiKey.create',
        targetType: 'ApiKey',
        targetId: doc._id.toString(),
        organizationId,
    });
    envelope.created(res, {
        id: doc._id.toString(),
        name: doc.name,
        prefix: doc.prefix,
        secret,
        permissions: doc.permissions,
    });
}));
//# sourceMappingURL=api-keys.route.js.map