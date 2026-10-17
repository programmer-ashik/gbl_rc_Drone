import crypto from 'node:crypto';
import { ZodError } from 'zod';
import { HttpError } from './errors.js';
export const requestId = (req, res, next) => {
    const id = req.headers['x-request-id']?.toString() || crypto.randomUUID();
    req.requestId = id;
    res.setHeader('x-request-id', id);
    next();
};
export const envelope = {
    ok(res, data, status = 200) {
        return res.status(status).json({ success: true, data });
    },
    created(res, data) {
        return res.status(201).json({ success: true, data });
    },
};
export const errorHandler = (err, req, res, _next) => {
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            requestId: req.requestId,
            details: err.flatten(),
        });
        return;
    }
    if (err instanceof HttpError) {
        res.status(err.statusCode).json({
            success: false,
            code: err.code,
            message: err.message,
            requestId: req.requestId,
            ...(err.details ? { details: err.details } : {}),
        });
        return;
    }
    console.error(err);
    res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        requestId: req.requestId,
    });
};
//# sourceMappingURL=middleware.js.map