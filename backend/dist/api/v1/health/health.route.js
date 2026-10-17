import { Router } from 'express';
import { envelope } from '../../../core/http/middleware.js';
export const healthRouter = Router();
healthRouter.get('/', (_req, res) => {
    envelope.ok(res, { status: 'ok', service: 'scaffold-backend' });
});
//# sourceMappingURL=health.route.js.map