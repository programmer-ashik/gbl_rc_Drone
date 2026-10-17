import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { config } from './config/env.js';
import { requestId, errorHandler } from './core/http/middleware.js';
import { setupRoutes } from './loaders/routes.loader.js';
export const createApp = () => {
    const app = express();
    const allowedOrigins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
    app.use(requestId);
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
        credentials: true,
    }));
    app.use(express.json());
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    setupRoutes(app);
    app.use(errorHandler);
    return app;
};
