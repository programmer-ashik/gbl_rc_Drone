import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../http/errors.js';
import { verifyAccessToken } from './jwt.js';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedError('No token provided');
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Invalid token'));
  }
};

export const requireRole =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new UnauthorizedError('Insufficient role'));
      return;
    }
    next();
  };
