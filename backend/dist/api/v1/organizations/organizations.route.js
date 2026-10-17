import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth, requireRole } from '../../../core/auth/middleware.js';
import { assertOrgAccess, withOrgScope } from '../../../core/auth/org-access.js';
import { NotFoundError } from '../../../core/http/errors.js';
import { OrganizationModel } from './organization.model.js';
const listQuerySchema = z.object({
    organizationId: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});
export const organizationsRouter = Router();
organizationsRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
    if (!req.auth?.organizationId) {
        envelope.ok(res, null);
        return;
    }
    const org = await OrganizationModel.findById(req.auth.organizationId);
    if (!org)
        throw new NotFoundError();
    envelope.ok(res, {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        status: org.status,
        subscription: org.subscription,
        branding: org.branding,
    });
}));
organizationsRouter.get('/', requireAuth, requireRole('platform_super_admin', 'platform_admin', 'platform_support'), zodValidate(listQuerySchema, 'query'), asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const filter = withOrgScope(req, {});
    const [items, total] = await Promise.all([
        OrganizationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        OrganizationModel.countDocuments(filter),
    ]);
    envelope.ok(res, {
        items: items.map((o) => ({
            id: o._id.toString(),
            name: o.name,
            slug: o.slug,
            status: o.status,
            subscription: o.subscription,
        })),
        page,
        limit,
        total,
    });
}));
organizationsRouter.get('/:organizationId', requireAuth, asyncHandler(async (req, res) => {
    assertOrgAccess(req, req.params.organizationId, { notFound: true });
    const org = await OrganizationModel.findById(req.params.organizationId);
    if (!org)
        throw new NotFoundError();
    envelope.ok(res, {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        status: org.status,
        subscription: org.subscription,
        branding: org.branding,
    });
}));
//# sourceMappingURL=organizations.route.js.map