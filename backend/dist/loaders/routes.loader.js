import { Router } from 'express';
import { authRouter } from '../api/v1/auth/auth.route.js';
import { organizationsRouter } from '../api/v1/organizations/organizations.route.js';
import { apiKeysRouter } from '../api/v1/api-keys/api-keys.route.js';
import { auditLogsRouter } from '../api/v1/audit-logs/audit-logs.route.js';
import { healthRouter } from '../api/v1/health/health.route.js';
import { requireAuth } from '../core/auth/middleware.js';
export const setupRoutes = (app) => {
    const api = Router();
    app.use('/api/v1', api);
    api.use('/health', healthRouter);
    api.use('/auth', authRouter);
    api.use('/organizations', organizationsRouter);
    api.use('/organizations/:organizationId/api-keys', requireAuth, apiKeysRouter);
    api.use('/audit-logs', auditLogsRouter);
};
//# sourceMappingURL=routes.loader.js.map