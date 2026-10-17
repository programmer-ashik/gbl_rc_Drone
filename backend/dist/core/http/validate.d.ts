import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
type Source = 'body' | 'query' | 'params';
export declare const zodValidate: <T>(schema: ZodSchema<T>, source?: Source) => (req: Request, _res: Response, next: NextFunction) => void;
export {};
