import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError } from './errors.js';

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.headers['x-request-id']?.toString() || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
};

export const envelope = {
  ok<T>(res: Response, data: T, status = 200) {
    return res.status(status).json({ success: true, data });
  },
  created<T>(res: Response, data: T) {
    return res.status(201).json({ success: true, data });
  },
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
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
