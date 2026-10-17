import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { requestId, errorHandler } from './core/http/middleware.js';
import { setupRoutes } from './loaders/routes.loader.js';
export const createApp = () => {
    const app = express();
    app.use(requestId);
    app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
    app.use(express.json());
    setupRoutes(app);
    app.use(errorHandler);
    return app;
};
//# sourceMappingURL=app.js.map