import type { Request, Response, NextFunction } from 'express';
export declare const requestId: (req: Request, res: Response, next: NextFunction) => void;
export declare const envelope: {
    ok<T>(res: Response, data: T, status?: number): Response<any, Record<string, any>>;
    created<T>(res: Response, data: T): Response<any, Record<string, any>>;
};
export declare const errorHandler: (err: unknown, req: Request, res: Response, _next: NextFunction) => void;
