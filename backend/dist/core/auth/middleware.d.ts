import type { Request, Response, NextFunction } from 'express';
export declare const requireAuth: (req: Request, _res: Response, next: NextFunction) => void;
export declare const requireRole: (...roles: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
